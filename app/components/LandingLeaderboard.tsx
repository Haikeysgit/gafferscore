"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { LeaderboardEntry } from "@/lib/actions";

interface LandingLeaderboardProps {
    entries: LeaderboardEntry[];
}

function RankBadge({ rank }: { rank: number }) {
    if (rank === 1)
        return (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-500/20 text-xs font-black text-yellow-400">
                1
            </span>
        );
    if (rank === 2)
        return (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-300/15 text-xs font-black text-gray-300">
                2
            </span>
        );
    if (rank === 3)
        return (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-700/20 text-xs font-black text-amber-500">
                3
            </span>
        );
    return (
        <span className="flex h-7 w-7 items-center justify-center text-xs font-bold text-white/35">
            {rank}
        </span>
    );
}

export default function LandingLeaderboard({ entries }: LandingLeaderboardProps) {
    return (
        <section className="relative z-10 border-t border-white/10 bg-navy px-6 py-24 md:px-12">
            <div className="mx-auto max-w-2xl">
                {/* Header */}
                <div className="mb-12 text-center">
                    <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                        Global Leaderboard
                    </h2>
                    <p className="mt-4 text-sm text-white/45">
                        The top managers right now. Where will you finish?
                    </p>
                </div>

                {/* Column headers */}
                <div className="mb-3 flex items-center px-4 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/20">
                    <div className="w-12 shrink-0">#</div>
                    <div className="flex-1">Player</div>
                    <div className="w-20 text-right">Points</div>
                </div>

                {/* Rows */}
                <motion.div
                    className="flex flex-col gap-2"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    variants={{
                        hidden: { opacity: 0 },
                        visible: {
                            opacity: 1,
                            transition: { staggerChildren: 0.07 },
                        },
                    }}
                >
                    {entries.map((entry) => (
                        <motion.div
                            key={entry.user_id}
                            variants={{
                                hidden: { opacity: 0, y: 14 },
                                visible: {
                                    opacity: 1,
                                    y: 0,
                                    transition: { type: "spring", damping: 22, stiffness: 90 },
                                },
                            }}
                            className="glass-card flex items-center rounded-xl px-4 py-3.5"
                            style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                        >
                            <div className="flex w-12 shrink-0 items-center">
                                <RankBadge rank={entry.current_rank} />
                            </div>
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/8 text-[11px] font-bold text-white/55">
                                    {entry.nickname.charAt(0).toUpperCase()}
                                </div>
                                <span className="block truncate text-sm font-semibold text-white/80">
                                    {entry.nickname}
                                </span>
                            </div>
                            <div className="w-20 text-right">
                                <span className="text-base font-black text-white">
                                    {entry.total_points}
                                </span>
                                <span className="ml-1 text-[9px] font-medium text-white/25">pts</span>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* CTA */}
                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                    <Link
                        href="/auth?mode=login"
                        className="btn-interactive flex min-h-[44px] items-center justify-center rounded-lg px-6 py-3 text-xs font-bold uppercase tracking-wider text-white/50 transition-all hover:text-white"
                        style={{ border: "1px solid rgba(255,255,255,0.12)" }}
                    >
                        View Full Leaderboard
                    </Link>
                    <Link
                        href="/auth?mode=signup"
                        className="btn-interactive btn-glow flex min-h-[44px] items-center justify-center rounded-lg bg-mint px-6 py-3 text-xs font-bold uppercase tracking-wider text-navy transition-transform active:scale-95"
                    >
                        Sign Up to Compete
                    </Link>
                </div>
            </div>
        </section>
    );
}
