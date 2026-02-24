import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAllMatches, type ParsedFixture } from "@/lib/football-api";

/**
 * GET /api/sync?key=SYNC_SECRET
 *
 * Full fixture sync: fetches all PL matches for the current season,
 * upserts gameweeks + fixtures, and snapshots completed gameweek standings.
 *
 * Uses the Competition endpoint as the API anchor for currentMatchday
 * to avoid being misled by rescheduled matches.
 *
 * Protected by SYNC_SECRET query parameter.
 */
export async function GET(request: Request) {
    // ── Auth check ──
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    if (key !== process.env.SYNC_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const supabase = createAdminClient();

        // ── Fetch all season fixtures ──
        const fixtures = await fetchAllMatches();

        console.log(`[sync] Fetched ${fixtures.length} matches`);

        // ── Step 1: Group fixtures by matchday → upsert gameweeks ──
        const matchdays = new Map<number, ParsedFixture[]>();
        for (const f of fixtures) {
            if (!matchdays.has(f.matchday)) matchdays.set(f.matchday, []);
            matchdays.get(f.matchday)!.push(f);
        }

        // ── Compute current gameweek using 14-day rule ──
        // Primary: Lowest numbered GW with at least one match within 14 days
        // Fallback: Most recently completed GW (for off-season / international breaks)
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

        // Last resort: first gameweek
        if (computedCurrentGw === null) computedCurrentGw = sortedMatchdays[0] || 1;

        console.log(`[sync] Computed current gameweek: ${computedCurrentGw} (14-day rule)`);

        const gameweekRows = Array.from(matchdays.entries()).map(([md, mdFixtures]) => {
            const kickoffs = mdFixtures.map((f) => new Date(f.kickoff_time).getTime());
            const earliestKickoff = new Date(Math.min(...kickoffs));
            const latestKickoff = new Date(Math.max(...kickoffs));

            // End date = latest kickoff + 3 hours (match duration buffer)
            const endDate = new Date(latestKickoff.getTime() + 3 * 60 * 60 * 1000);

            return {
                id: md,
                name: `Gameweek ${md}`,
                start_date: earliestKickoff.toISOString(),
                end_date: endDate.toISOString(),
                is_current: md === computedCurrentGw,
            };
        });

        const { error: gwError } = await supabase
            .from("gameweeks")
            .upsert(gameweekRows, { onConflict: "id" });

        if (gwError) {
            console.error("[sync] Gameweek upsert error:", gwError);
            return NextResponse.json({ error: gwError.message }, { status: 500 });
        }

        console.log(`[sync] Upserted ${gameweekRows.length} gameweeks`);

        // ── Step 2: Upsert fixtures ──
        // We need to check which fixtures already exist to avoid overwriting
        // predictions data. We'll use the api_match_id concept by storing
        // the external ID. But our schema uses a SERIAL id, so we need to
        // look up existing fixtures by (gameweek_id, home_short, away_short).
        // For each fixture, check if it exists; if so, UPDATE status/scores only.

        let insertedCount = 0;
        let updatedCount = 0;
        const completedGameweeks = new Set<number>();

        for (const f of fixtures) {
            // Look up existing fixture by gameweek + teams
            const { data: existing } = await supabase
                .from("fixtures")
                .select("id, status")
                .eq("gameweek_id", f.matchday)
                .eq("home_short", f.home_short)
                .eq("away_short", f.away_short)
                .maybeSingle();

            if (existing) {
                // Update status and scores (only if changed)
                const updates: Record<string, unknown> = {};
                if (existing.status !== f.status) updates.status = f.status;
                if (f.status === "finished" || f.status === "live") {
                    updates.home_score = f.home_score;
                    updates.away_score = f.away_score;
                }

                if (Object.keys(updates).length > 0) {
                    // If transitioning to 'finished', this triggers
                    // the calculate_user_points DB trigger
                    const { error: updateErr } = await supabase
                        .from("fixtures")
                        .update(updates)
                        .eq("id", existing.id);

                    if (updateErr) {
                        console.error(`[sync] Update fixture ${existing.id} error:`, updateErr);
                    } else {
                        updatedCount++;
                        if (f.status === "finished" && existing.status !== "finished") {
                            completedGameweeks.add(f.matchday);
                        }
                    }
                }
            } else {
                // Insert new fixture
                const { error: insertErr } = await supabase.from("fixtures").insert({
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
                });

                if (insertErr) {
                    console.error(`[sync] Insert fixture error:`, insertErr);
                } else {
                    insertedCount++;
                }
            }
        }

        console.log(`[sync] Fixtures: ${insertedCount} inserted, ${updatedCount} updated`);

        // ── Step 3: Snapshot standings for newly completed gameweeks ──
        for (const gwId of completedGameweeks) {
            // Check if ALL fixtures in this gameweek are finished
            const { data: gwFixtures } = await supabase
                .from("fixtures")
                .select("status")
                .eq("gameweek_id", gwId);

            const allFinished = gwFixtures?.every((f) => f.status === "finished");

            if (allFinished) {
                console.log(`[sync] All matches in GW${gwId} finished — snapshotting standings`);
                const { error: snapErr } = await supabase.rpc(
                    "snapshot_gameweek_standings",
                    { p_gameweek_id: gwId }
                );
                if (snapErr) {
                    console.error(`[sync] Snapshot GW${gwId} error:`, snapErr);
                }
            }
        }

        return NextResponse.json({
            success: true,
            currentGameweek: computedCurrentGw,
            gameweeks: gameweekRows.length,
            fixtures: { inserted: insertedCount, updated: updatedCount },
            completedGameweeks: Array.from(completedGameweeks),
        });
    } catch (err) {
        console.error("[sync] Fatal error:", err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Unknown error" },
            { status: 500 }
        );
    }
}
