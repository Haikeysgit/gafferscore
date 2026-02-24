import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchLiveAndRecentMatches } from "@/lib/football-api";
import crypto from "crypto";

/**
 * GET /api/sync/scores?key=SYNC_SECRET
 *
 * Lightweight score-only refresh. Designed to be called frequently
 * (every 2-5 minutes during match days) to update live scores.
 *
 * Only fetches today's + yesterday's matches, then updates status/scores
 * for any that have changed. Triggers point calculation when a match
 * transitions to 'finished'.
 */
export async function GET(request: Request) {
    // ── Auth check ──
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key") || "";
    const secret = process.env.SYNC_SECRET || "";

    if (!secret || !key || key.length !== secret.length) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAuthentic = crypto.timingSafeEqual(Buffer.from(key), Buffer.from(secret));
    if (!isAuthentic) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const supabase = createAdminClient();
        const matches = await fetchLiveAndRecentMatches();

        if (matches.length === 0) {
            return NextResponse.json({ success: true, message: "No matches today", updated: 0 });
        }

        console.log(`[scores] Fetched ${matches.length} recent matches`);

        let updatedCount = 0;
        const newlyFinished: number[] = [];

        for (const m of matches) {
            // Find existing fixture by gameweek + teams
            const { data: existing } = await supabase
                .from("fixtures")
                .select("id, status, home_score, away_score")
                .eq("gameweek_id", m.matchday)
                .eq("home_short", m.home_short)
                .eq("away_short", m.away_short)
                .maybeSingle();

            if (!existing) continue; // Skip if fixture not in DB yet

            // Check if anything changed
            const statusChanged = existing.status !== m.status;
            const scoreChanged =
                existing.home_score !== m.home_score ||
                existing.away_score !== m.away_score;

            if (!statusChanged && !scoreChanged) continue;

            const { error } = await supabase
                .from("fixtures")
                .update({
                    status: m.status,
                    home_score: m.home_score,
                    away_score: m.away_score,
                })
                .eq("id", existing.id);

            if (error) {
                console.error(`[scores] Update error for fixture ${existing.id}:`, error);
            } else {
                updatedCount++;
                if (m.status === "finished" && existing.status !== "finished") {
                    newlyFinished.push(m.matchday);
                    console.log(`[scores] Match ${m.home_short} vs ${m.away_short} just finished: ${m.home_score}-${m.away_score}`);
                }
            }
        }

        // Snapshot standings for newly completed gameweeks
        const uniqueFinishedGws = [...new Set(newlyFinished)];
        for (const gwId of uniqueFinishedGws) {
            const { data: gwFixtures } = await supabase
                .from("fixtures")
                .select("status")
                .eq("gameweek_id", gwId);

            const allFinished = gwFixtures?.every((f) => f.status === "finished");
            if (allFinished) {
                console.log(`[scores] GW${gwId} fully complete — snapshotting standings`);
                await supabase.rpc("snapshot_gameweek_standings", { p_gameweek_id: gwId });
            }
        }

        return NextResponse.json({
            success: true,
            matchesChecked: matches.length,
            updated: updatedCount,
            newlyFinished: newlyFinished.length,
        });
    } catch (err) {
        console.error("[scores] Fatal error:", err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Unknown error" },
            { status: 500 }
        );
    }
}
