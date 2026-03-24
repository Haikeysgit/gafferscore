export const dynamic = 'force-dynamic';
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";
import GafferClient from "./GafferClient";

export default async function GafferPage() {
    const user = await getCurrentUser();
    if (!user || !user.nickname) redirect("/");

    const supabase = await createClient();

    const { data: predictions } = await supabase
        .from("gaffer_predictions")
        .select("*")
        .order("kickoff_time", { ascending: true });

    const { data: performance } = await supabase
        .from("gaffer_performance")
        .select("*")
        .order("created_at", { ascending: false });

    const now = new Date();
    const upcoming = (predictions ?? []).filter(p => new Date(p.kickoff_time) > now);
    const recent = (predictions ?? []).filter(p => new Date(p.kickoff_time) <= now).slice(-5).reverse();


return (
    <GafferClient

            user={user}
            upcomingPredictions={upcoming}
            recentPredictions={recent}
            performance={performance ?? []}
        />
    );
}