import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
    _req: Request,
    { params }: { params: { fixtureId: string } }
) {
    const supabase = await createClient();
    const { data } = await supabase
        .from("gaffer_predictions")
        .select("analysis_text")
        .eq("fixture_id", params.fixtureId)
        .single();

    return NextResponse.json(data ?? {});
}