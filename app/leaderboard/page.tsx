import { redirect } from "next/navigation";
import LeaderboardClient from "@/app/components/LeaderboardClient";
import {
    getCurrentUser,
    getGameweeks,
    getLeaderboard,
    getUserLeaderboardEntry,
} from "@/lib/actions";

export default async function LeaderboardPage() {
    const user = await getCurrentUser();
    if (!user || !user.nickname) redirect("/");

    const gameweeks = await getGameweeks();
    const currentGw = gameweeks.find((g) => g.is_current) ?? gameweeks[gameweeks.length - 1];

    // Initial load: Global leaderboard, page 1
    const [leaderboardResult, userEntry] = await Promise.all([
        getLeaderboard("global", null, 1, 10),
        getUserLeaderboardEntry("global", null),
    ]);

    return (
        <LeaderboardClient
            currentUserId={user.id}
            nickname={user.nickname}
            gameweeks={gameweeks}
            initialGameweekId={currentGw?.id ?? 0}
            initialEntries={leaderboardResult.entries}
            initialTotalCount={leaderboardResult.totalCount}
            initialUserEntry={userEntry}
        />
    );
}
