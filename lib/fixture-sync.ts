import { createAdminClient } from "@/lib/supabase/admin";
import type { ParsedFixture } from "@/lib/football-api";
import { isFixtureFullTime } from "@/lib/fixture-status";

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

interface ExistingFixtureRow {
    id: number;
    api_match_id: number | null;
    gameweek_id: number;
    home_short: string;
    away_short: string;
    status: string;
    home_score: number | null;
    away_score: number | null;
}

interface FixtureUpsertRow {
    id?: number;
    api_match_id: number;
    gameweek_id: number;
    home_team: string;
    away_team: string;
    home_short: string;
    away_short: string;
    home_logo: string | null;
    away_logo: string | null;
    kickoff_time: string;
    status: ParsedFixture["status"];
    home_score: number | null;
    away_score: number | null;
}

export interface FixtureSyncResult {
    currentGameweek: number;
    gameweeks: number;
    fixtures: {
        inserted: number;
        overwritten: number;
        bootstrapped: number;
    };
    completedGameweeks: number[];
    reopenedGameweeks: number[];
}

function buildLegacyKey(homeShort: string, awayShort: string): string {
    return `${homeShort}::${awayShort}`;
}

function computeCurrentGameweek(fixtures: ParsedFixture[]): number {
    const matchdays = new Map<number, ParsedFixture[]>();

    for (const fixture of fixtures) {
        if (!matchdays.has(fixture.matchday)) {
            matchdays.set(fixture.matchday, []);
        }
        matchdays.get(fixture.matchday)?.push(fixture);
    }

    const sortedMatchdays = [...matchdays.keys()].sort((a, b) => a - b);
    const now = Date.now();

    for (const matchday of sortedMatchdays) {
        const hasUpcomingFixture = matchdays.get(matchday)?.some((fixture) => {
            const kickoff = new Date(fixture.kickoff_time).getTime();
            return kickoff > now && kickoff <= now + FOURTEEN_DAYS_MS;
        });

        if (hasUpcomingFixture) {
            return matchday;
        }
    }

    for (const matchday of [...sortedMatchdays].reverse()) {
        const hasFullTimeFixture = matchdays.get(matchday)?.some((fixture) =>
            isFixtureFullTime(fixture.status)
        );

        if (hasFullTimeFixture) {
            return matchday;
        }
    }

    return sortedMatchdays[0] ?? 1;
}

function buildGameweekRows(fixtures: ParsedFixture[], currentGameweek: number) {
    const matchdays = new Map<number, ParsedFixture[]>();

    for (const fixture of fixtures) {
        if (!matchdays.has(fixture.matchday)) {
            matchdays.set(fixture.matchday, []);
        }
        matchdays.get(fixture.matchday)?.push(fixture);
    }

    return [...matchdays.entries()].map(([matchday, matchdayFixtures]) => {
        const kickoffs = matchdayFixtures.map((fixture) => new Date(fixture.kickoff_time).getTime());
        const earliestKickoff = new Date(Math.min(...kickoffs));
        const latestKickoff = new Date(Math.max(...kickoffs));
        const endDate = new Date(latestKickoff.getTime() + 3 * 60 * 60 * 1000);

        return {
            id: matchday,
            name: `Gameweek ${matchday}`,
            start_date: earliestKickoff.toISOString(),
            end_date: endDate.toISOString(),
            is_current: matchday === currentGameweek,
        };
    });
}

export async function syncFixturesAbsoluteOverwrite(
    fixtures: ParsedFixture[],
): Promise<FixtureSyncResult> {
    const supabase = createAdminClient();
    const currentGameweek = computeCurrentGameweek(fixtures);
    const gameweekRows = buildGameweekRows(fixtures, currentGameweek);

    const { error: gameweekError } = await supabase
        .from("gameweeks")
        .upsert(gameweekRows, { onConflict: "id" });

    if (gameweekError) {
        throw new Error(`Gameweek upsert failed: ${gameweekError.message}`);
    }

    const { data: existingFixtures, error: existingFixturesError } = await supabase
        .from("fixtures")
        .select("id, api_match_id, gameweek_id, home_short, away_short, status, home_score, away_score");

    if (existingFixturesError) {
        throw new Error(`Existing fixture lookup failed: ${existingFixturesError.message}`);
    }

    const existingByApiMatchId = new Map<number, ExistingFixtureRow>();
    const existingByLegacyKey = new Map<string, ExistingFixtureRow>();

    for (const fixture of (existingFixtures ?? []) as ExistingFixtureRow[]) {
        if (fixture.api_match_id !== null) {
            existingByApiMatchId.set(fixture.api_match_id, fixture);
            continue;
        }

        const legacyKey = buildLegacyKey(fixture.home_short, fixture.away_short);
        if (!existingByLegacyKey.has(legacyKey)) {
            existingByLegacyKey.set(legacyKey, fixture);
        }
    }

    const fixtureRows: FixtureUpsertRow[] = [];
    const gameweeksToReconcile = new Set<number>();
    let inserted = 0;
    let overwritten = 0;
    let bootstrapped = 0;

    for (const fixture of fixtures) {
        const byApiMatchId = existingByApiMatchId.get(fixture.api_match_id);
        const legacyKey = buildLegacyKey(fixture.home_short, fixture.away_short);
        const byLegacyKey = byApiMatchId ? undefined : existingByLegacyKey.get(legacyKey);
        const existing = byApiMatchId ?? byLegacyKey;

        if (existing) {
            overwritten += 1;
            if (existing.api_match_id === null) {
                bootstrapped += 1;
                existingByLegacyKey.delete(legacyKey);
            }
        } else {
            inserted += 1;
        }

        if (existing) {
            const gameweekChanged = existing.gameweek_id !== fixture.matchday;
            const fullTimeBoundaryChanged =
                isFixtureFullTime(existing.status) !== isFixtureFullTime(fixture.status);
            const finalScoreChanged =
                (isFixtureFullTime(existing.status) || isFixtureFullTime(fixture.status)) &&
                (
                    existing.home_score !== fixture.home_score ||
                    existing.away_score !== fixture.away_score
                );

            if (gameweekChanged || fullTimeBoundaryChanged || finalScoreChanged) {
                gameweeksToReconcile.add(existing.gameweek_id);
                gameweeksToReconcile.add(fixture.matchday);
            }
        } else if (isFixtureFullTime(fixture.status)) {
            gameweeksToReconcile.add(fixture.matchday);
        }

        const row: FixtureUpsertRow = {
            api_match_id: fixture.api_match_id,
            gameweek_id: fixture.matchday,
            home_team: fixture.home_team,
            away_team: fixture.away_team,
            home_short: fixture.home_short,
            away_short: fixture.away_short,
            home_logo: fixture.home_logo || null,
            away_logo: fixture.away_logo || null,
            kickoff_time: fixture.kickoff_time,
            status: fixture.status,
            home_score: fixture.home_score,
            away_score: fixture.away_score,
        };

        if (existing) {
            row.id = existing.id;
        }

        fixtureRows.push(row);
    }

    const { error: fixtureUpsertError } = await supabase
        .from("fixtures")
        .upsert(fixtureRows, { onConflict: "id" });

    if (fixtureUpsertError) {
        throw new Error(`Fixture overwrite failed: ${fixtureUpsertError.message}`);
    }

    const completedGameweeks: number[] = [];
    const reopenedGameweeks: number[] = [];

    for (const gameweekId of [...gameweeksToReconcile].sort((a, b) => a - b)) {
        const { data: gameweekFixtures, error: gameweekFixturesError } = await supabase
            .from("fixtures")
            .select("status")
            .eq("gameweek_id", gameweekId);

        if (gameweekFixturesError) {
            throw new Error(`Gameweek ${gameweekId} reconciliation lookup failed: ${gameweekFixturesError.message}`);
        }

        const allFullTime =
            (gameweekFixtures?.length ?? 0) > 0 &&
            (gameweekFixtures ?? []).every((fixture) => isFixtureFullTime(fixture.status));

        if (allFullTime) {
            const { error: snapshotError } = await supabase.rpc("snapshot_gameweek_standings", {
                p_gameweek_id: gameweekId,
            });

            if (snapshotError) {
                throw new Error(`Gameweek ${gameweekId} snapshot failed: ${snapshotError.message}`);
            }

            completedGameweeks.push(gameweekId);
            continue;
        }

        const { error: deleteSnapshotError } = await supabase
            .from("gameweek_standings")
            .delete()
            .eq("gameweek_id", gameweekId);

        if (deleteSnapshotError) {
            throw new Error(`Gameweek ${gameweekId} snapshot delete failed: ${deleteSnapshotError.message}`);
        }

        reopenedGameweeks.push(gameweekId);
    }

    return {
        currentGameweek,
        gameweeks: gameweekRows.length,
        fixtures: {
            inserted,
            overwritten,
            bootstrapped,
        },
        completedGameweeks,
        reopenedGameweeks,
    };
}
