"use server";

import { createClient } from "@/lib/supabase/server";
import type { FixtureStatus } from "@/lib/fixture-status";

// ── Rate Limiter ──
// Simple in-memory rate limiter to prevent spamming server actions.
// Note: In serverless environments (Vercel), this may reset across different edge chunks, 
// but it is still highly effective at dropping rapid-fire brute force loops from a single connection.
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_WINDOW_MS = 10000; // 10 seconds

// ── Types ──
export interface GameweekData {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
}

export interface FixtureData {
    id: number;
    gameweek_id: number;
    home_team: string;
    away_team: string;
    home_short: string;
    away_short: string;
    home_logo: string | null;
    away_logo: string | null;
    kickoff_time: string;
    status: FixtureStatus;
    home_score: number | null;
    away_score: number | null;
}

export interface PredictionData {
    id: number;
    fixture_id: number;
    predicted_home_score: number;
    predicted_away_score: number;
    points_earned: number;
}

export interface LeaderboardEntry {
    user_id: string;
    nickname: string;
    total_points: number;
    exact_scores: number;
    total_distance: number;
    current_rank: number;
    previous_rank: number | null;
}

export interface ManagerProfileSummary {
    userId: string;
    nickname: string;
    favoriteClub: string | null;
    totalPoints: number;
    globalRank: number | null;
    hitRate: number;
}

export interface ManagerHistoryMatch {
    fixtureId: number;
    kickoffTime: string;
    homeTeam: string;
    awayTeam: string;
    homeShort: string;
    awayShort: string;
    homeLogo: string | null;
    awayLogo: string | null;
    actualHomeScore: number | null;
    actualAwayScore: number | null;
    predictedHomeScore: number | null;
    predictedAwayScore: number | null;
    pointsEarned: number;
    hasPrediction: boolean;
}

export interface ManagerHistoryGroup {
    gameweekId: number;
    gameweekName: string;
    weekPoints: number;
    matches: ManagerHistoryMatch[];
}

export interface ManagerHistoryPage {
    groups: ManagerHistoryGroup[];
    nextPage: number | null;
    hasMore: boolean;
}

const FULL_TIME_STATUSES = ["FINISHED", "AWARDED"] as const;

type ManagerLookup = {
    id: string;
    nickname: string;
    favorite_club: string | null;
};

type FixturePredictionRow = {
    id: number;
    gameweek_id: number;
    home_team: string;
    away_team: string;
    home_short: string;
    away_short: string;
    home_logo: string | null;
    away_logo: string | null;
    kickoff_time: string;
    status: FixtureStatus;
    home_score: number | null;
    away_score: number | null;
    gameweek:
        | {
            id: number;
            name: string;
            start_date: string;
        }
        | Array<{
            id: number;
            name: string;
            start_date: string;
        }>
        | null;
    predictions:
        | Array<{
            predicted_home_score: number;
            predicted_away_score: number;
            points_earned: number;
        }>
        | null;
};

async function fetchLeaderboardEntries(
    type: "global" | "weekly",
    gameweekId: number | null
): Promise<LeaderboardEntry[]> {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_leaderboard", {
        p_type: type,
        p_gameweek_id: gameweekId,
    });

    if (error) throw new Error(error.message);
    return data ?? [];
}

async function getManagerByNickname(nickname: string): Promise<ManagerLookup | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("users")
        .select("id, nickname, favorite_club")
        .eq("nickname", nickname)
        .maybeSingle();

    if (error) throw new Error(error.message);
    return data ?? null;
}

async function getFinishedPredictionRows(userId: string): Promise<FixturePredictionRow[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("fixtures")
        .select(`
            id,
            gameweek_id,
            home_team,
            away_team,
            home_short,
            away_short,
            home_logo,
            away_logo,
            kickoff_time,
            status,
            home_score,
            away_score,
            gameweek:gameweeks!inner(id, name, start_date),
            predictions!inner(predicted_home_score, predicted_away_score, points_earned)
        `)
        .eq("predictions.user_id", userId)
        .in("status", [...FULL_TIME_STATUSES])
        .order("kickoff_time", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as FixturePredictionRow[];
}

function getGameweekRecord(
    gameweek: FixturePredictionRow["gameweek"]
): { id: number; name: string; start_date: string } | null {
    if (!gameweek) return null;
    return Array.isArray(gameweek) ? (gameweek[0] ?? null) : gameweek;
}

function getPredictionRecord(
    predictions: FixturePredictionRow["predictions"]
): { predicted_home_score: number; predicted_away_score: number; points_earned: number } | null {
    if (!predictions || predictions.length === 0) return null;
    return predictions[0];
}

function groupManagerHistory(
    rows: FixturePredictionRow[],
    page: number,
    gameweeksPerPage: number
): ManagerHistoryPage {
    const groupsMap = new Map<number, ManagerHistoryGroup>();

    for (const row of rows) {
        const gameweek = getGameweekRecord(row.gameweek);
        const prediction = getPredictionRecord(row.predictions);

        if (!gameweek || !prediction) continue;

        const hasPrediction =
            prediction.predicted_home_score >= 0 && prediction.predicted_away_score >= 0;

        const existing = groupsMap.get(gameweek.id);
        const match: ManagerHistoryMatch = {
            fixtureId: row.id,
            kickoffTime: row.kickoff_time,
            homeTeam: row.home_team,
            awayTeam: row.away_team,
            homeShort: row.home_short,
            awayShort: row.away_short,
            homeLogo: row.home_logo,
            awayLogo: row.away_logo,
            actualHomeScore: row.home_score,
            actualAwayScore: row.away_score,
            predictedHomeScore: hasPrediction ? prediction.predicted_home_score : null,
            predictedAwayScore: hasPrediction ? prediction.predicted_away_score : null,
            pointsEarned: prediction.points_earned,
            hasPrediction,
        };

        if (existing) {
            existing.weekPoints += prediction.points_earned;
            existing.matches.push(match);
            continue;
        }

        groupsMap.set(gameweek.id, {
            gameweekId: gameweek.id,
            gameweekName: gameweek.name,
            weekPoints: prediction.points_earned,
            matches: [match],
        });
    }

    const groups = Array.from(groupsMap.values())
        .sort((a, b) => b.gameweekId - a.gameweekId)
        .map((group) => ({
            ...group,
            matches: [...group.matches].sort(
                (a, b) => new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime()
            ),
        }));

    const start = Math.max(0, (page - 1) * gameweeksPerPage);
    const end = start + gameweeksPerPage;
    const slicedGroups = groups.slice(start, end);

    return {
        groups: slicedGroups,
        hasMore: end < groups.length,
        nextPage: end < groups.length ? page + 1 : null,
    };
}

// ── Get Current User ──
export async function getCurrentUser() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
        .from("users")
        .select("nickname, is_admin")
        .eq("id", user.id)
        .single();

    return {
        id: user.id,
        nickname: profile?.nickname ?? user.user_metadata?.nickname ?? null,
        isAdmin: profile?.is_admin ?? false,
    };
}

// ── Get All Gameweeks ──
export async function getGameweeks(): Promise<GameweekData[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("gameweeks")
        .select("*")
        .order("id", { ascending: true });

    if (error) throw new Error(error.message);
    return data ?? [];
}

// ── Get Fixtures for a Gameweek ──
export async function getFixtures(gameweekId: number): Promise<FixtureData[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("fixtures")
        .select("*")
        .eq("gameweek_id", gameweekId)
        .order("kickoff_time", { ascending: true });

    if (error) throw new Error(error.message);
    return data ?? [];
}

// ── Get User Predictions for a Gameweek ──
export async function getUserPredictions(
    gameweekId: number
): Promise<PredictionData[]> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from("predictions")
        .select("id, fixture_id, predicted_home_score, predicted_away_score, points_earned")
        .eq("user_id", user.id)
        .in(
            "fixture_id",
            // Sub-select: get fixture IDs for this gameweek
            (await supabase
                .from("fixtures")
                .select("id")
                .eq("gameweek_id", gameweekId)
            ).data?.map((f: { id: number }) => f.id) ?? []
        );

    if (error) throw new Error(error.message);
    return data ?? [];
}

// ── Save Prediction (Upsert) ──
// RLS enforces: auth.uid() = user_id AND now() < kickoff_time AND kickoff_time <= now() + 7 days
export async function savePrediction(
    fixtureId: number,
    homeScore: number,
    awayScore: number
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Not authenticated" };

    // ── Rate Limiting Check ──
    const nowMs = Date.now();
    const userRequests = rateLimitMap.get(user.id) ?? [];
    const recentRequests = userRequests.filter(t => nowMs - t < RATE_LIMIT_WINDOW_MS);

    if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
        return { success: false, error: "Too many requests. Please wait a few seconds." };
    }

    recentRequests.push(nowMs);
    rateLimitMap.set(user.id, recentRequests);

    // ── 14-day window pre-check (clear error message) ──
    const { data: fixture } = await supabase
        .from("fixtures")
        .select("kickoff_time")
        .eq("id", fixtureId)
        .single();

    if (!fixture) return { success: false, error: "Fixture not found" };

    const kickoff = new Date(fixture.kickoff_time).getTime();
    const now = Date.now();
    const fourteenDaysFromNow = now + 14 * 24 * 60 * 60 * 1000;

    if (now >= kickoff) {
        return { success: false, error: "Match has kicked off. Predictions are locked." };
    }
    if (kickoff > fourteenDaysFromNow) {
        return { success: false, error: "Predictions open 14 days before kickoff." };
    }

    const { error } = await supabase.from("predictions").upsert(
        {
            user_id: user.id,
            fixture_id: fixtureId,
            predicted_home_score: homeScore,
            predicted_away_score: awayScore,
            updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,fixture_id" }
    );

    if (error) {
        // RLS denial → kickoff has passed or outside 7-day window
        if (error.code === "42501" || error.message.includes("policy")) {
            return { success: false, error: "Predictions are locked for this match." };
        }
        return { success: false, error: error.message };
    }

    return { success: true };
}

// ── Get Leaderboard ──
export async function getLeaderboard(
    type: "global" | "weekly",
    gameweekId: number | null,
    page: number = 1,
    pageSize: number = 10
): Promise<{ entries: LeaderboardEntry[]; totalCount: number }> {
    const allEntries = await fetchLeaderboardEntries(type, gameweekId);
    const totalCount = allEntries.length;

    // Client-side pagination (the RPC returns all results)
    const offset = (page - 1) * pageSize;
    const entries = allEntries.slice(offset, offset + pageSize);

    return { entries, totalCount };
}

// ── Get current user's leaderboard entry (for pinned row) ──
export async function getLeaderboardViewData(
    type: "global" | "weekly",
    gameweekId: number | null,
    page: number = 1,
    pageSize: number = 10
): Promise<{
    entries: LeaderboardEntry[];
    totalCount: number;
    userEntry: LeaderboardEntry | null;
}> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const allEntries = await fetchLeaderboardEntries(type, gameweekId);
    const totalCount = allEntries.length;
    const offset = (page - 1) * pageSize;
    const entries = allEntries.slice(offset, offset + pageSize);
    const userEntry = user
        ? allEntries.find((entry) => entry.user_id === user.id) ?? null
        : null;

    return { entries, totalCount, userEntry };
}

export async function getUserLeaderboardEntry(
    type: "global" | "weekly",
    gameweekId: number | null
): Promise<LeaderboardEntry | null> {
    const {
        data: { user },
    } = await (await createClient()).auth.getUser();

    if (!user) return null;

    const entries = await fetchLeaderboardEntries(type, gameweekId);
    const entry = entries.find(
        (e: LeaderboardEntry) => e.user_id === user.id
    );
    return entry ?? null;
}

export async function getManagerProfileSummary(
    nickname: string
): Promise<ManagerProfileSummary | null> {
    const manager = await getManagerByNickname(nickname);
    if (!manager) return null;

    const [leaderboardEntries, rows] = await Promise.all([
        fetchLeaderboardEntries("global", null),
        getFinishedPredictionRows(manager.id),
    ]);

    const leaderboardEntry = leaderboardEntries.find(
        (entry) => entry.user_id === manager.id
    );

    const hitRateStats = rows.reduce(
        (acc, row) => {
            const prediction = getPredictionRecord(row.predictions);
            if (!prediction) return acc;

            const hasPrediction =
                prediction.predicted_home_score >= 0 && prediction.predicted_away_score >= 0;
            if (!hasPrediction) return acc;

            acc.total += 1;
            if (prediction.points_earned === 20 || prediction.points_earned === 50) {
                acc.hits += 1;
            }
            return acc;
        },
        { hits: 0, total: 0 }
    );

    return {
        userId: manager.id,
        nickname: manager.nickname,
        favoriteClub: manager.favorite_club,
        totalPoints: leaderboardEntry?.total_points ?? 0,
        globalRank: leaderboardEntry?.current_rank ?? null,
        hitRate:
            hitRateStats.total > 0
                ? Number(((hitRateStats.hits / hitRateStats.total) * 100).toFixed(1))
                : 0,
    };
}

export async function getManagerProfileHistory(
    nickname: string,
    page: number = 1,
    gameweeksPerPage: number = 3
): Promise<ManagerHistoryPage> {
    const manager = await getManagerByNickname(nickname);
    if (!manager) {
        return {
            groups: [],
            hasMore: false,
            nextPage: null,
        };
    }

    const rows = await getFinishedPredictionRows(manager.id);
    return groupManagerHistory(rows, page, gameweeksPerPage);
}
