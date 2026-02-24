import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAllMatches, type ParsedFixture } from "@/lib/football-api";

/**
 * GET /api/reset?key=SYNC_SECRET
 *
 * ⚠️  TEMPORARY ENDPOINT — delete after first use.
 *
 * 1. Wipes all predictions, fixtures, and gameweeks
 * 2. Re-syncs fresh data from football-data.org
 * 3. Sets is_current using the 14-day rule
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    if (key !== process.env.SYNC_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const supabase = createAdminClient();

        // ── Step 1: Wipe all data (order matters — FK constraints) ──
        console.log("[reset] Wiping predictions...");
        const { error: predErr } = await supabase
            .from("predictions")
            .delete()
            .gt("id", 0); // Delete all rows

        if (predErr) console.error("[reset] predictions error:", predErr);

        console.log("[reset] Wiping fixtures...");
        const { error: fixErr } = await supabase
            .from("fixtures")
            .delete()
            .gt("id", 0);

        if (fixErr) console.error("[reset] fixtures error:", fixErr);

        console.log("[reset] Wiping gameweeks...");
        const { error: gwErr } = await supabase
            .from("gameweeks")
            .delete()
            .gt("id", 0);

        if (gwErr) console.error("[reset] gameweeks error:", gwErr);

        console.log("[reset] Database wiped. Starting fresh sync...");

        // ── Step 2: Fetch all season fixtures from API ──
        const fixtures = await fetchAllMatches();
        console.log(`[reset] Fetched ${fixtures.length} matches from football-data.org`);

        // ── Step 3: Group by matchday ──
        const matchdays = new Map<number, ParsedFixture[]>();
        for (const f of fixtures) {
            if (!matchdays.has(f.matchday)) matchdays.set(f.matchday, []);
            matchdays.get(f.matchday)!.push(f);
        }

        // ── Step 4: Compute current gameweek (14-day rule) ──
        const now = Date.now();
        const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
        let computedCurrentGw: number | null = null;

        const sortedMatchdays = Array.from(matchdays.keys()).sort((a, b) => a - b);

        for (const md of sortedMatchdays) {
            const mdFixtures = matchdays.get(md)!;
            const hasMatchIn14Days = mdFixtures.some((f) => {
                const kickoff = new Date(f.kickoff_time).getTime();
                return kickoff > now && kickoff <= now + fourteenDaysMs;
            });
            if (hasMatchIn14Days) {
                computedCurrentGw = md;
                break;
            }
        }

        // Fallback: most recently completed gameweek
        if (computedCurrentGw === null) {
            for (const md of [...sortedMatchdays].reverse()) {
                const mdFixtures = matchdays.get(md)!;
                if (mdFixtures.some((f) => f.status === "finished")) {
                    computedCurrentGw = md;
                    break;
                }
            }
        }

        if (computedCurrentGw === null) computedCurrentGw = sortedMatchdays[0] || 1;

        console.log(`[reset] Computed current gameweek: ${computedCurrentGw} (14-day rule)`);

        // ── Step 5: Insert gameweeks ──
        const gameweekRows = Array.from(matchdays.entries()).map(([md, mdFixtures]) => {
            const kickoffs = mdFixtures.map((f) => new Date(f.kickoff_time).getTime());
            const earliestKickoff = new Date(Math.min(...kickoffs));
            const latestKickoff = new Date(Math.max(...kickoffs));
            const endDate = new Date(latestKickoff.getTime() + 3 * 60 * 60 * 1000);

            return {
                id: md,
                name: `Gameweek ${md}`,
                start_date: earliestKickoff.toISOString(),
                end_date: endDate.toISOString(),
                is_current: md === computedCurrentGw,
            };
        });

        const { error: gwInsertErr } = await supabase
            .from("gameweeks")
            .upsert(gameweekRows);

        if (gwInsertErr) {
            console.error("[reset] Gameweek insert error:", gwInsertErr);
            return NextResponse.json({ error: gwInsertErr.message }, { status: 500 });
        }

        // ── Step 6: Insert fixtures ──
        const fixtureRows = fixtures.map((f) => ({
            gameweek_id: f.matchday,
            home_team: f.home_team,
            away_team: f.away_team,
            home_short: f.home_short,
            away_short: f.away_short,
            home_logo: f.home_logo || null,
            away_logo: f.away_logo || null,
            kickoff_time: f.kickoff_time,
            status: f.status,
            home_score: f.home_score,
            away_score: f.away_score,
        }));

        const { error: fixInsertErr } = await supabase
            .from("fixtures")
            .upsert(fixtureRows);

        if (fixInsertErr) {
            console.error("[reset] Fixture insert error:", fixInsertErr);
            return NextResponse.json({ error: fixInsertErr.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            wiped: ["predictions", "fixtures", "gameweeks"],
            synced: {
                gameweeks: gameweekRows.length,
                fixtures: fixtureRows.length,
                currentGameweek: computedCurrentGw,
            },
        });
    } catch (err) {
        console.error("[reset] Fatal error:", err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Unknown error" },
            { status: 500 }
        );
    }
}
