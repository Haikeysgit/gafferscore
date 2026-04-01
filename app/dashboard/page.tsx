import { redirect } from "next/navigation";
import DashboardClient from "@/app/components/DashboardClient";
import {
    getCurrentUser,
    getFixtures,
    getGameweeks,
    getUserPredictions,
} from "@/lib/actions";
import { measureServerTask } from "@/lib/performance";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    const user = await getCurrentUser();
    if (!user || !user.nickname) redirect("/");

    const gameweeks = await measureServerTask("dashboard:getGameweeks", () => getGameweeks());
    const supabase = await createClient();
    const now = new Date();
    const fourteenDaysFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    let currentGw =
        gameweeks.find((g) => g.is_current) ??
        gameweeks[gameweeks.length - 1] ??
        null;

    const { data: upcomingFixture, error: upcomingError } = await supabase
        .from("fixtures")
        .select("gameweek_id")
        .gt("kickoff_time", now.toISOString())
        .lte("kickoff_time", fourteenDaysFromNow.toISOString())
        .order("gameweek_id", { ascending: true })
        .order("kickoff_time", { ascending: true })
        .limit(1)
        .maybeSingle();

    if (upcomingError) {
        throw new Error(upcomingError.message);
    }

    if (upcomingFixture?.gameweek_id) {
        currentGw =
            gameweeks.find((gw) => gw.id === upcomingFixture.gameweek_id) ??
            currentGw;
    } else {
        const { data: finishedFixture, error: finishedError } = await supabase
            .from("fixtures")
            .select("gameweek_id")
            .in("status", ["FINISHED", "AWARDED"])
            .order("gameweek_id", { ascending: false })
            .order("kickoff_time", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (finishedError) {
            throw new Error(finishedError.message);
        }

        if (finishedFixture?.gameweek_id) {
            currentGw =
                gameweeks.find((gw) => gw.id === finishedFixture.gameweek_id) ??
                currentGw;
        }
    }

    if (!currentGw) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-navy">
                <p className="text-sm text-white/50">No gameweeks available yet.</p>
            </div>
        );
    }

    const [fixtures, predictions] = await measureServerTask("dashboard:initialData", () =>
        Promise.all([getFixtures(currentGw.id), getUserPredictions(currentGw.id)])
    );

    return (
        <DashboardClient
            nickname={user.nickname}
            gameweeks={gameweeks}
            initialGameweekId={currentGw.id}
            initialFixtures={fixtures}
            initialPredictions={predictions}
        />
    );
}
