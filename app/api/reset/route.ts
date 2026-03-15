import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAllMatches } from "@/lib/football-api";
import { syncFixturesAbsoluteOverwrite } from "@/lib/fixture-sync";

/**
 * GET /api/reset?key=SYNC_SECRET
 *
 * Temporary reset endpoint.
 * 1. Wipes predictions, fixtures, and gameweeks
 * 2. Rebuilds fixture state from the live API feed
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
        const supabase = createAdminClient();

        console.log("[reset] Wiping predictions...");
        const { error: predErr } = await supabase.from("predictions").delete().gt("id", 0);
        if (predErr) console.error("[reset] predictions error:", predErr);

        console.log("[reset] Wiping fixtures...");
        const { error: fixErr } = await supabase.from("fixtures").delete().gt("id", 0);
        if (fixErr) console.error("[reset] fixtures error:", fixErr);

        console.log("[reset] Wiping gameweeks...");
        const { error: gwErr } = await supabase.from("gameweeks").delete().gt("id", 0);
        if (gwErr) console.error("[reset] gameweeks error:", gwErr);

        console.log("[reset] Database wiped. Starting fresh sync...");

        const fixtures = await fetchAllMatches();
        console.log(`[reset] Fetched ${fixtures.length} matches from football-data.org`);

        const result = await syncFixturesAbsoluteOverwrite(fixtures);

        return NextResponse.json({
            success: true,
            wiped: ["predictions", "fixtures", "gameweeks"],
            synced: result,
        });
    } catch (err) {
        console.error("[reset] Fatal error:", err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Unknown error" },
            { status: 500 },
        );
    }
}
