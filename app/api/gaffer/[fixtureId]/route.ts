import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ fixtureId: string }> }
) {
    const { fixtureId } = await params;
    const supabase = await createClient();
    const { data } = await supabase
        .from("gaffer_predictions")
        .select("analysis_text")
        .eq("fixture_id", fixtureId)
        .single();

    return NextResponse.json(data ?? {});
}