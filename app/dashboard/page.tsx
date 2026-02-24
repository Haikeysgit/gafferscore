import { redirect } from "next/navigation";
import DashboardClient from "@/app/components/DashboardClient";
import {
    getCurrentUser,
    getGameweeks,
    getFixtures,
    getUserPredictions,
} from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";

// Disable Next.js data cache — always fetch fresh fixture data
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    const user = await getCurrentUser();
    if (!user || !user.nickname) redirect("/");

    const gameweeks = await getGameweeks();

    // ── 14-day rule: find the lowest GW with a match kicking off within 14 days ──
    const supabase = await createClient();
    const now = new Date();
    const fourteenDaysFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    let currentGw = null;

    // Primary: lowest GW with an upcoming match within 14 days
    for (const gw of gameweeks) {
        const { data: upcomingFixtures } = await supabase
            .from("fixtures")
            .select("id")
            .eq("gameweek_id", gw.id)
            .gt("kickoff_time", now.toISOString())
            .lte("kickoff_time", fourteenDaysFromNow.toISOString())
            .limit(1);

        if (upcomingFixtures && upcomingFixtures.length > 0) {
            currentGw = gw;
            break;
        }
    }

    // Fallback: most recently completed gameweek
    if (!currentGw) {
        for (const gw of [...gameweeks].reverse()) {
            const { data: finishedFixtures } = await supabase
                .from("fixtures")
                .select("id")
                .eq("gameweek_id", gw.id)
                .eq("status", "finished")
                .limit(1);

            if (finishedFixtures && finishedFixtures.length > 0) {
                currentGw = gw;
                break;
            }
        }
    }

    // Last resort: is_current flag or last gameweek
    if (!currentGw) {
        currentGw = gameweeks.find((g) => g.is_current) ?? gameweeks[gameweeks.length - 1];
    }

    if (!currentGw) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-navy">
                <p className="text-sm text-white/50">No gameweeks available yet.</p>
            </div>
        );
    }

    const [fixtures, predictions] = await Promise.all([
        getFixtures(currentGw.id),
        getUserPredictions(currentGw.id),
    ]);

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
