import { notFound, redirect } from "next/navigation";
import ManagerProfileClient from "@/app/components/ManagerProfileClient";
import SimpleBackHeader from "@/app/components/SimpleBackHeader";
import {
    getCurrentUser,
    getManagerProfileHistory,
    getManagerProfileSummary,
} from "@/lib/actions";
import { measureServerTask } from "@/lib/performance";

export const dynamic = "force-dynamic";

interface ManagerProfilePageProps {
    params: Promise<{ nickname: string }>;
}

export default async function ManagerProfilePage({
    params,
}: ManagerProfilePageProps) {
    const [{ nickname }, viewer] = await Promise.all([params, getCurrentUser()]);

    if (!viewer || !viewer.nickname) {
        redirect("/");
    }

    const [summary, history] = await measureServerTask("manager:initialData", () =>
        Promise.all([
            getManagerProfileSummary(nickname),
            getManagerProfileHistory(nickname, 1, 100),
        ])
    );

    if (!summary) {
        notFound();
    }

    return (
        <>
            <SimpleBackHeader
                backHref="/leaderboard"
                backLabel="Back to Leaderboard"
                eyebrow="Manager Profile"
                title={summary.nickname}
            />
            <ManagerProfileClient
                summary={summary}
                isOwnProfile={viewer.id === summary.userId}
                initialGroups={history.groups}
            />
        </>
    );
}
