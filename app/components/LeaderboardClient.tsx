"use client";

import { useState, useTransition } from "react";
import DashboardHeader from "@/app/components/DashboardHeader";
import GameweekNav from "@/app/components/GameweekNav";
import Footer from "@/app/components/Footer";
import {
    type LeaderboardEntry,
    type GameweekData,
    getLeaderboard,
    getUserLeaderboardEntry,
} from "@/lib/actions";

const PAGE_SIZE = 10;

// ── Trend Arrow ──
function TrendArrow({ current, previous }: { current: number; previous: number | null }) {
    if (previous === null) return <span className="text-[9px] text-white/20">—</span>;
    if (current < previous) {
        return (
            <div className="flex items-center gap-0.5 text-emerald-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
                <span className="text-[9px] font-bold">{previous - current}</span>
            </div>
        );
    }
    if (current > previous) {
        return (
            <div className="flex items-center gap-0.5 text-red-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                <span className="text-[9px] font-bold">{current - previous}</span>
            </div>
        );
    }
    return <span className="text-[9px] text-white/20">—</span>;
}

// ── Rank Badge ──
function RankBadge({ rank }: { rank: number }) {
    if (rank === 1) return <span className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-500/20 text-xs font-black text-yellow-400">1</span>;
    if (rank === 2) return <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-300/15 text-xs font-black text-gray-300">2</span>;
    if (rank === 3) return <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-700/20 text-xs font-black text-amber-500">3</span>;
    return <span className="flex h-7 w-7 items-center justify-center text-xs font-bold text-white/50">{rank}</span>;
}

// ── Player Row ──
function PlayerRow({ player, currentUserId }: { player: LeaderboardEntry; currentUserId: string }) {
    const isCurrentUser = player.user_id === currentUserId;
    return (
        <div className={`glass-card flex items-center rounded-lg px-3 py-3 md:px-4 md:py-3.5 ${isCurrentUser ? "card-active" : "border border-white/5"}`}>
            <div className="flex w-12 shrink-0 items-center gap-1 md:w-16">
                <RankBadge rank={player.current_rank} />
                <TrendArrow current={player.current_rank} previous={player.previous_rank} />
            </div>
            <div className="flex flex-1 items-center gap-2.5 min-w-0">
                <div className={`flex h-7 w-7 md:h-8 md:w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${isCurrentUser ? "bg-mint text-navy" : "bg-white/10 text-white/60"}`}>
                    {player.nickname.charAt(0).toUpperCase()}
                </div>
                <span className={`text-xs md:text-sm font-semibold truncate ${isCurrentUser ? "text-mint" : "text-white/80"}`}>
                    {player.nickname}
                    {isCurrentUser && <span className="ml-1.5 text-[9px] font-normal text-mint/60">(You)</span>}
                </span>
            </div>
            <div className="hidden w-16 text-center text-xs font-medium text-white/50 md:block">{player.exact_scores}</div>
            <div className="hidden w-16 text-center text-xs font-medium text-white/50 md:block">
                {/* Correct outcomes = (total_points - exact_scores*50) / 20 + exact_scores — but we show total_points / 20 as approx */}
                {/* For now, show total_distance as a proxy since the RPC doesn't return correct_outcomes separately */}
                {Math.floor((player.total_points - player.exact_scores * 30) / 20)}
            </div>
            <div className={`w-16 text-right text-sm font-black md:w-20 md:text-base ${isCurrentUser ? "text-mint" : "text-white"}`}>{player.total_points}</div>
        </div>
    );
}

// ── Truncated Pagination ──
function Pagination({
    currentPage,
    totalPages,
    onPageChange,
}: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}) {
    const getPageNumbers = (): (number | "...")[] => {
        if (totalPages <= 5) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const pages: (number | "...")[] = [];
        pages.push(1);

        if (currentPage > 3) {
            pages.push("...");
        }

        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (currentPage < totalPages - 2) {
            pages.push("...");
        }

        pages.push(totalPages);

        return pages;
    };

    const pages = getPageNumbers();

    return (
        <div className="mt-6 flex items-center justify-center gap-1.5 md:gap-2">
            {/* Previous */}
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${currentPage === 1
                    ? "text-white/10 cursor-not-allowed"
                    : "text-white/50 hover:bg-white/5 hover:text-white"
                    }`}
                aria-label="Previous page"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>

            {/* Page Numbers */}
            {pages.map((page, idx) =>
                page === "..." ? (
                    <span key={`ellipsis-${idx}`} className="flex h-8 w-6 items-center justify-center text-[10px] text-white/20">
                        …
                    </span>
                ) : (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-semibold transition-all ${page === currentPage
                            ? "bg-mint text-navy"
                            : "text-white/40 hover:bg-white/5 hover:text-white"
                            }`}
                    >
                        {page}
                    </button>
                )
            )}

            {/* Next */}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${currentPage === totalPages
                    ? "text-white/10 cursor-not-allowed"
                    : "text-white/50 hover:bg-white/5 hover:text-white"
                    }`}
                aria-label="Next page"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
        </div>
    );
}


// ── Main Leaderboard Client ──
interface LeaderboardClientProps {
    currentUserId: string;
    nickname: string;
    gameweeks: GameweekData[];
    initialGameweekId: number;
    initialEntries: LeaderboardEntry[];
    initialTotalCount: number;
    initialUserEntry: LeaderboardEntry | null;
}

export default function LeaderboardClient({
    currentUserId,
    nickname,
    gameweeks,
    initialGameweekId,
    initialEntries,
    initialTotalCount,
    initialUserEntry,
}: LeaderboardClientProps) {
    const [view, setView] = useState<"global" | "weekly">("global");
    const [weeklyGameweekId, setWeeklyGameweekId] = useState(initialGameweekId);
    const [currentPage, setCurrentPage] = useState(1);
    const [entries, setEntries] = useState(initialEntries);
    const [totalCount, setTotalCount] = useState(initialTotalCount);
    const [userEntry, setUserEntry] = useState(initialUserEntry);
    const [isPending, startTransition] = useTransition();

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    // Is the current user visible on this page?
    const userOnPage = entries.some((e) => e.user_id === currentUserId);

    // Gameweek nav helpers
    const gwIndex = gameweeks.findIndex((g) => g.id === weeklyGameweekId);
    const currentGw = gameweeks[gwIndex];
    const totalGameweeks = gameweeks.length;

    const fetchData = (type: "global" | "weekly", gameweekId: number | null, page: number) => {
        startTransition(async () => {
            const [result, userResult] = await Promise.all([
                getLeaderboard(type, gameweekId, page, PAGE_SIZE),
                getUserLeaderboardEntry(type, gameweekId),
            ]);
            setEntries(result.entries);
            setTotalCount(result.totalCount);
            setUserEntry(userResult);
        });
    };

    const switchView = (v: "global" | "weekly") => {
        setView(v);
        setCurrentPage(1);
        const gwId = v === "weekly" ? weeklyGameweekId : null;
        fetchData(v, gwId, 1);
    };

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            const gwId = view === "weekly" ? weeklyGameweekId : null;
            fetchData(view, gwId, page);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const switchWeeklyGameweek = (direction: "prev" | "next") => {
        const newIndex = direction === "prev"
            ? Math.max(0, gwIndex - 1)
            : Math.min(gameweeks.length - 1, gwIndex + 1);
        const newGw = gameweeks[newIndex];
        if (newGw.id === weeklyGameweekId) return;

        setWeeklyGameweekId(newGw.id);
        setCurrentPage(1);
        fetchData("weekly", newGw.id, 1);
    };

    return (
        <div className="flex min-h-screen flex-col bg-navy">
            {/* Atmospheric background */}
            <div
                className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[500px] bg-contain bg-top bg-no-repeat"
                style={{
                    backgroundImage: "url('/4 players header.png')",
                    backgroundPosition: "center 80px",
                    maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 100%)",
                    WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 100%)",
                }}
                aria-hidden="true"
            />

            <DashboardHeader nickname={nickname} />

            <main className="relative z-10 flex-1">
                {/* ── Global / Gameweek Toggle ── */}
                <div className="flex justify-center pt-6 pb-2">
                    <div className="flex items-center rounded-full border border-white/10 bg-white/5 p-1">
                        <button
                            onClick={() => switchView("global")}
                            className={`rounded-full px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] transition-all duration-200 md:px-8 ${view === "global" ? "bg-mint text-navy" : "text-white/50 hover:text-white"
                                }`}
                        >
                            Global Rank
                        </button>
                        <button
                            onClick={() => switchView("weekly")}
                            className={`rounded-full px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] transition-all duration-200 md:px-8 ${view === "weekly" ? "bg-mint text-navy" : "text-white/50 hover:text-white"
                                }`}
                        >
                            Gameweek Rank
                        </button>
                    </div>
                </div>

                {/* ── Gameweek Nav — only on Weekly tab ── */}
                {view === "weekly" && currentGw && (
                    <GameweekNav
                        currentGameweek={parseInt(currentGw.name.replace(/\D/g, "")) || (gwIndex + 1)}
                        totalGameweeks={totalGameweeks > 0 ? gameweeks[gameweeks.length - 1]?.id || totalGameweeks : 38}
                        onPrev={() => switchWeeklyGameweek("prev")}
                        onNext={() => switchWeeklyGameweek("next")}
                    />
                )}

                {/* ── Leaderboard ── */}
                <div className={`mx-auto max-w-3xl px-3 pb-12 md:px-6 ${view === "global" ? "pt-4" : "pt-2"}`}>
                    {/* Column Headers */}
                    <div className="mb-2 flex items-center px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.15em] text-white/25 md:px-4">
                        <div className="w-12 md:w-16 shrink-0">#</div>
                        <div className="flex-1">Player</div>
                        <div className="hidden w-16 text-center md:block">Exact</div>
                        <div className="hidden w-16 text-center md:block">Correct</div>
                        <div className="w-16 text-right md:w-20">Points</div>
                    </div>

                    {/* Loading state */}
                    {isPending && (
                        <div className="flex justify-center py-8">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/30">
                                Loading...
                            </div>
                        </div>
                    )}

                    {/* Player Rows for Current Page */}
                    {!isPending && entries.length === 0 && (
                        <div className="flex justify-center py-12">
                            <p className="text-xs text-white/30">No standings data yet for this gameweek.</p>
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        {entries.map((player) => (
                            <PlayerRow key={player.user_id} player={player} currentUserId={currentUserId} />
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} />
                    )}

                </div>
            </main>

            {/* ── Sticky pinned user row — anchored to bottom of viewport ── */}
            {!userOnPage && userEntry && (
                <div className="pinned-row px-3 py-2.5 md:px-6">
                    <div className="mx-auto max-w-3xl">
                        <PlayerRow player={userEntry} currentUserId={currentUserId} />
                    </div>
                </div>
            )}

            <div className="relative z-10">
                <Footer />
            </div>
        </div>
    );
}
