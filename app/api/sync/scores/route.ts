import { NextResponse } from "next/server";
import crypto from "crypto";
import { fetchAllMatches } from "@/lib/football-api";
import { syncFixturesAbsoluteOverwrite } from "@/lib/fixture-sync";

/**
 * GET /api/sync/scores?key=SYNC_SECRET
 *
 * High-frequency sync alias. This now performs the same authoritative
 * full-season overwrite as /api/sync so live VAR changes and postponed
 * reschedules cannot drift from the API.
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
        const fixtures = await fetchAllMatches();
        console.log(`[scores] Fetched ${fixtures.length} matches for authoritative overwrite`);

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
