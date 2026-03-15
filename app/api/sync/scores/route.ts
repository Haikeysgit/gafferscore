import { NextResponse } from "next/server";
import crypto from "crypto";
import { fetchRollingWindowMatches } from "@/lib/football-api";
import { syncFixturesAbsoluteOverwrite } from "@/lib/fixture-sync";

/**
 * GET /api/sync/scores?key=SYNC_SECRET
 *
 * High-frequency sync with a rolling Yesterday/Today/Tomorrow lookback.
 * This catches late score corrections and next-day postponement updates
 * without pulling the full-season feed on every fast sync.
 */
export async function GET(request: Request) {
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
        const fixtures = await fetchRollingWindowMatches();
        console.log(`[scores] Fetched ${fixtures.length} matches in rolling lookback window`);

        const result = await syncFixturesAbsoluteOverwrite(fixtures);

        return NextResponse.json({
            success: true,
            ...result,
        });
    } catch (err) {
        console.error("[scores] Fatal error:", err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Unknown error" },
            { status: 500 },
        );
    }
}
