"use server";

import { createClient } from "@/lib/supabase/server";

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
    status: "pending" | "live" | "finished";
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

// ── Get Current User ──
export async function getCurrentUser() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
        .from("users")
        .select("nickname")
        .eq("id", user.id)
        .single();

    return {
        id: user.id,
        nickname: profile?.nickname ?? user.user_metadata?.nickname ?? null,
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
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_leaderboard", {
        p_type: type,
        p_gameweek_id: gameweekId,
    });

    if (error) throw new Error(error.message);

    const allEntries: LeaderboardEntry[] = data ?? [];
    const totalCount = allEntries.length;

    // Client-side pagination (the RPC returns all results)
    const offset = (page - 1) * pageSize;
    const entries = allEntries.slice(offset, offset + pageSize);

    return { entries, totalCount };
}

// ── Get current user's leaderboard entry (for pinned row) ──
export async function getUserLeaderboardEntry(
    type: "global" | "weekly",
    gameweekId: number | null
): Promise<LeaderboardEntry | null> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase.rpc("get_leaderboard", {
        p_type: type,
        p_gameweek_id: gameweekId,
    });

    if (error) return null;

    const entry = (data ?? []).find(
        (e: LeaderboardEntry) => e.user_id === user.id
    );
    return entry ?? null;
}
