"use client";

import { motion } from "framer-motion";

export default function LeaderboardSkeleton() {
    const shimmer = "animate-pulse bg-white/[0.06] rounded";

    return (
        <div className="mx-auto max-w-3xl px-3 pb-12 md:px-6 pt-4">
            {/* Global / Gameweek Toggle placeholder */}
            <div className="flex justify-center pt-6 pb-6">
                <div className={`${shimmer} h-10 w-64 rounded-full`} />
            </div>

            {/* Column Headers placeholder */}
            <div className="mb-3 flex items-center px-3 py-2 md:px-4">
                <div className={`${shimmer} h-3 w-6`} />
                <div className="flex-1 px-4">
                    <div className={`${shimmer} h-3 w-16`} />
                </div>
                <div className={`${shimmer} h-3 w-12`} />
            </div>

            {/* Skeleton Rows */}
            {Array.from({ length: 8 }).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                    className="mb-2 flex items-center rounded-lg border border-white/5 bg-white/[0.02] px-3 py-3.5 md:px-4"
                >
                    {/* Rank */}
                    <div className="w-12 shrink-0 md:w-16">
                        <div className={`${shimmer} h-7 w-7 rounded-full`} />
                    </div>

                    {/* Avatar + Name */}
                    <div className="flex flex-1 items-center gap-2.5">
                        <div className={`${shimmer} h-7 w-7 md:h-8 md:w-8 rounded-full shrink-0`} />
                        <div className={`${shimmer} h-3.5 w-24 md:w-32`} />
                    </div>

                    {/* Points */}
                    <div className={`${shimmer} h-4 w-12 md:w-16`} />
                </motion.div>
            ))}
        </div>
    );
}
