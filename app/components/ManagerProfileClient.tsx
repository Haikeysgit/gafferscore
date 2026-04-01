"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Footer from "@/app/components/Footer";
import ManagerHistoryCard from "@/app/components/ManagerHistoryCard";
import MetricTooltip from "@/app/components/MetricTooltip";
import TeamCrest from "@/app/components/TeamCrest";
import { EPL_CLUBS } from "@/lib/clubs";
import type {
    ManagerHistoryGroup,
    ManagerProfileSummary,
} from "@/lib/actions";

interface ManagerProfileClientProps {
    summary: ManagerProfileSummary;
    isOwnProfile: boolean;
    initialGroups: ManagerHistoryGroup[];
}

function formatPossessiveLabel(nickname: string) {
    return nickname.endsWith("s") ? `${nickname}' Call` : `${nickname}'s Call`;
}

export default function ManagerProfileClient({
    summary,
    isOwnProfile,
    initialGroups,
}: ManagerProfileClientProps) {
    const [visibleGroupCount, setVisibleGroupCount] = useState(1);

    const favoriteClub = useMemo(
        () => EPL_CLUBS.find((club) => club.short === summary.favoriteClub) ?? null,
        [summary.favoriteClub]
    );

    const historyGroups = useMemo(
        () =>
            initialGroups.filter(
                (group) => Array.isArray(group.matches) && group.matches.length > 0
            ),
        [initialGroups]
    );

    const visibleGroups = historyGroups.slice(0, visibleGroupCount);
    const hasMore = visibleGroupCount < historyGroups.length;

    const handleLoadMore = () => {
        setVisibleGroupCount((current) => Math.min(current + 1, historyGroups.length));
    };

    const handleHidePastGameweeks = () => {
        setVisibleGroupCount(1);
    };

    const rankLabel = summary.globalRank ? `#${summary.globalRank}` : "N/A";
    const formattedHitRate = `${summary.hitRate.toFixed(1)}%`;
    const managerLabel = formatPossessiveLabel(summary.nickname);
    const canHidePastGameweeks = !hasMore && historyGroups.length > 1 && visibleGroupCount > 1;

    return (
        <div className="flex min-h-screen flex-col bg-navy">
            <div
                className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[520px] bg-contain bg-top bg-no-repeat opacity-55"
                style={{
                    backgroundImage: "url('/4 players header.png')",
                    backgroundPosition: "center 82px",
                    maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.42) 0%, transparent 100%)",
                    WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.42) 0%, transparent 100%)",
                }}
                aria-hidden="true"
            />

            <main className="relative z-10 flex-1">
                <div className="mx-auto flex max-w-4xl flex-col gap-4 px-3 py-4 md:px-6 md:py-7">
                    <section className="glass-card rounded-[30px] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
                        <div className="border-b border-white/[0.07] bg-white/[0.03] px-4 py-4 md:px-6">
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className="flex h-[4.75rem] w-[4.75rem] shrink-0 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.05] md:h-22 md:w-22">
                                    {favoriteClub ? (
                                        <TeamCrest
                                            short={favoriteClub.short}
                                            logo={favoriteClub.crestUrl}
                                            sizeClassName="h-14 w-14 md:h-16 md:w-16 border-white/[0.08]"
                                            imageClassName="h-full w-full object-contain p-1"
                                            fallbackTextClassName="text-xl font-black text-white md:text-2xl"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center rounded-full bg-mint text-2xl font-black text-navy md:text-[1.75rem]">
                                            {summary.nickname.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                <div className="min-w-0">
                                    <p
                                        className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                                        style={{ color: "rgba(57, 255, 20, 0.72)" }}
                                    >
                                        Manager
                                    </p>
                                    <h1 className="truncate text-[2rem] font-black leading-none text-white md:text-[2.5rem]">
                                        {summary.nickname}
                                    </h1>
                                    {!favoriteClub && isOwnProfile && (
                                        <Link
                                            href="/settings"
                                            className="mt-3 inline-flex min-h-[40px] items-center rounded-full border border-mint/25 bg-mint/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-mint transition-colors hover:bg-mint/16"
                                        >
                                            Set Favorite Team
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                                alignItems: "stretch",
                            }}
                        >
                            <div
                                className="px-3 py-4 md:px-4"
                                style={{
                                    borderRight: "1px solid rgba(255,255,255,0.06)",
                                    minHeight: "120px",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    textAlign: "center",
                                }}
                            >
                                <p
                                    className="text-[9px] font-semibold uppercase tracking-[0.16em]"
                                    style={{ color: "rgba(255, 255, 255, 0.58)" }}
                                >
                                    Total Points
                                </p>
                                <p className="mt-2 text-xl font-black text-white md:text-[1.7rem]">
                                    {summary.totalPoints}
                                </p>
                            </div>

                            <div
                                className="px-3 py-4 md:px-4"
                                style={{
                                    borderRight: "1px solid rgba(255,255,255,0.06)",
                                    minHeight: "120px",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    textAlign: "center",
                                }}
                            >
                                <p
                                    className="text-[9px] font-semibold uppercase tracking-[0.16em]"
                                    style={{ color: "rgba(255, 255, 255, 0.58)" }}
                                >
                                    Global Rank
                                </p>
                                <p className="mt-2 text-xl font-black text-white md:text-[1.7rem]">
                                    {rankLabel}
                                </p>
                            </div>

                            <div
                                className="px-3 py-4 md:px-4"
                                style={{
                                    minHeight: "120px",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    textAlign: "center",
                                }}
                            >
                                <div className="flex items-center justify-center gap-1.5">
                                    <p
                                        className="text-[9px] font-semibold uppercase tracking-[0.16em]"
                                        style={{ color: "rgba(255, 255, 255, 0.58)" }}
                                    >
                                        Hit Rate
                                    </p>
                                    <MetricTooltip
                                        content="Hit rate counts finished matches where this manager got the outcome right. Exact scores and correct winners or draws count as hits. Missed predictions are excluded."
                                        align="center"
                                    />
                                </div>
                                <p className="mt-2 text-xl font-black text-white md:text-[1.7rem]">
                                    {formattedHitRate}
                                </p>
                                <p
                                    className="mt-1 text-[10px] uppercase tracking-[0.14em]"
                                    style={{ color: "rgba(255, 255, 255, 0.46)" }}
                                >
                                    Outcome accuracy
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-[30px] border border-white/10 bg-white/[0.03] px-4 py-5 shadow-[0_20px_60px_rgba(0,0,0,0.14)] md:px-6 md:py-6">
                        <div className="mb-5 flex items-end justify-between gap-3">
                            <div>
                                <p
                                    className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                                    style={{ color: "rgba(57, 255, 20, 0.72)" }}
                                >
                                    Recent Form
                                </p>
                                <h2 className="mt-1 text-[1.9rem] font-black leading-none text-white md:text-[2.25rem]">
                                    Gameweek History
                                </h2>
                            </div>
                            <p
                                className="max-w-[12rem] text-right text-xs leading-5"
                                style={{ color: "rgba(255, 255, 255, 0.7)" }}
                            >
                                Completed gameweeks only.
                            </p>
                        </div>

                        {visibleGroups.length === 0 ? (
                            <div className="glass-card rounded-[24px] border border-white/10 px-4 py-8 text-center">
                                <p className="text-sm text-white/80">No finished prediction history yet.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-5">
                                {visibleGroups.map((group) => (
                                    <section
                                        key={group.gameweekId}
                                        className="flex flex-col gap-3"
                                    >
                                        <div className="flex items-center justify-between gap-3 rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3">
                                            <div>
                                                <p
                                                    className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                                                    style={{ color: "rgba(255, 255, 255, 0.58)" }}
                                                >
                                                    {group.gameweekName}
                                                </p>
                                                <p className="mt-1 text-sm font-semibold text-white">
                                                    Completed fixtures
                                                </p>
                                            </div>
                                            <div className="rounded-full border border-mint/25 bg-mint/12 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-mint">
                                                {group.weekPoints} pts earned
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            {group.matches.map((match) => (
                                                <ManagerHistoryCard
                                                    key={match.fixtureId}
                                                    match={match}
                                                    managerLabel={managerLabel}
                                                />
                                            ))}
                                        </div>
                                    </section>
                                ))}
                            </div>
                        )}

                        {(hasMore || canHidePastGameweeks) && (
                            <div className="mt-6 flex justify-center">
                                {hasMore ? (
                                    <button
                                        onClick={handleLoadMore}
                                        className="btn-interactive btn-pill min-h-[44px] rounded-full border border-white/15 bg-white/[0.05] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors hover:bg-white/10 hover:text-white"
                                        style={{ color: "rgba(255, 255, 255, 0.86)" }}
                                    >
                                        Load More Gameweeks
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleHidePastGameweeks}
                                        className="btn-interactive btn-pill min-h-[44px] rounded-full border border-white/15 bg-white/[0.05] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors hover:bg-white/10 hover:text-white"
                                        style={{ color: "rgba(255, 255, 255, 0.86)" }}
                                    >
                                        Hide Past Gameweeks
                                    </button>
                                )}
                            </div>
                        )}
                    </section>
                </div>
            </main>

            <div className="relative z-10">
                <Footer />
            </div>
        </div>
    );
}
