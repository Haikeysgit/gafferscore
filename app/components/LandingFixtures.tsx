"use client";

import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import TeamCrest from "@/app/components/TeamCrest";
import { isFixtureLive, isFixtureFullTime, getFixtureStatusLabel } from "@/lib/fixture-status";
import type { FixtureData } from "@/lib/actions";

interface LandingFixturesProps {
    fixtures: FixtureData[];
    gameweekName: string;
    label: string; // "Live" | "Upcoming" | "Full Time"
}

function formatKickoffShort(kickoffTime: string): string {
    const date = new Date(kickoffTime);
    const day = date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
    const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    return `${day} · ${time}`;
}

function getCardBorder(status: string): CSSProperties {
    if (isFixtureLive(status)) {
        return { border: "1px solid rgba(57,255,20,0.45)", boxShadow: "0 0 20px rgba(57,255,20,0.08)" };
    }
    return { border: "1px solid rgba(255,255,255,0.08)" };
}

const ABNORMAL = ["POSTPONED", "SUSPENDED", "CANCELLED"] as const;
type AbnormalStatus = (typeof ABNORMAL)[number];

function FixtureCard({ fixture }: { fixture: FixtureData }) {
    const live = isFixtureLive(fixture.status);
    const finished = isFixtureFullTime(fixture.status);
    const abnormal = ABNORMAL.includes(fixture.status as AbnormalStatus);
    const hasScore = (live || finished) && fixture.home_score != null && fixture.away_score != null;

    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 24 },
                visible: {
                    opacity: 1,
                    y: 0,
                    transition: { type: "spring", damping: 22, stiffness: 90 },
                },
            }}
            className="glass-card overflow-hidden rounded-2xl"
            style={getCardBorder(fixture.status)}
        >
            {/* Status banner */}
            {(live || finished || abnormal) && (
                <div
                    className={`flex items-center justify-center gap-1.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] ${
                        live
                            ? "bg-mint/10 text-mint"
                            : finished
                            ? "bg-white/4 text-white/40"
                            : "bg-amber-500/12 text-amber-300"
                    }`}
                >
                    {live && (
                        <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-mint" />
                    )}
                    {live ? "Live" : getFixtureStatusLabel(fixture.status)}
                </div>
            )}

            {/* Card body */}
            <div className="flex items-center justify-between px-4 py-5">
                {/* Home team */}
                <div className="flex w-16 flex-col items-center gap-2 md:w-24">
                    <TeamCrest
                        short={fixture.home_short}
                        logo={fixture.home_logo}
                        sizeClassName="h-11 w-11"
                        imageClassName="h-7 w-7 object-contain"
                        fallbackTextClassName="text-[9px] font-bold text-white/80"
                    />
                    <span className="text-center text-[9px] font-semibold uppercase leading-tight tracking-wide text-white/55 md:hidden">
                        {fixture.home_short}
                    </span>
                    <span className="hidden max-w-[88px] truncate text-center text-[10px] font-semibold leading-tight text-white/70 md:block">
                        {fixture.home_team}
                    </span>
                </div>

                {/* Centre: score or kickoff */}
                <div className="flex min-w-0 flex-1 flex-col items-center gap-1 px-2">
                    <span className="text-[8px] font-semibold uppercase tracking-[0.15em] text-white/25">
                        {finished ? "Full Time" : live ? "Score" : "Kick Off"}
                    </span>

                    {hasScore ? (
                        <span className="text-2xl font-black text-white">
                            {fixture.home_score}&thinsp;–&thinsp;{fixture.away_score}
                        </span>
                    ) : abnormal ? (
                        <span className="text-center text-[10px] font-semibold text-amber-300/65">
                            {getFixtureStatusLabel(fixture.status)}
                        </span>
                    ) : (
                        <span className="text-center text-[10px] font-medium leading-snug text-white/45">
                            {formatKickoffShort(fixture.kickoff_time)}
                        </span>
                    )}
                </div>

                {/* Away team */}
                <div className="flex w-16 flex-col items-center gap-2 md:w-24">
                    <TeamCrest
                        short={fixture.away_short}
                        logo={fixture.away_logo}
                        sizeClassName="h-11 w-11"
                        imageClassName="h-7 w-7 object-contain"
                        fallbackTextClassName="text-[9px] font-bold text-white/80"
                    />
                    <span className="text-center text-[9px] font-semibold uppercase leading-tight tracking-wide text-white/55 md:hidden">
                        {fixture.away_short}
                    </span>
                    <span className="hidden max-w-[88px] truncate text-center text-[10px] font-semibold leading-tight text-white/70 md:block">
                        {fixture.away_team}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}

export default function LandingFixtures({ fixtures, gameweekName, label }: LandingFixturesProps) {
    const isLive = label === "Live";

    return (
        <section className="relative z-10 border-t border-white/10 bg-navy-light px-6 py-24 md:px-12">
            <div className="mx-auto max-w-6xl">
                {/* Header */}
                <div className="mb-12 flex flex-col items-center gap-3 text-center">
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                            {gameweekName}
                        </h2>
                        <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] ${
                                isLive ? "bg-mint/10 text-mint" : "bg-white/5 text-white/35"
                            }`}
                        >
                            {isLive && (
                                <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-mint" />
                            )}
                            {label}
                        </span>
                    </div>
                    <p className="text-sm text-white/45">
                        {isLive
                            ? "Matches in progress — sign up to predict the next ones"
                            : "Sign up to submit your predictions before kickoff"}
                    </p>
                </div>

                {/* Grid */}
                <motion.div
                    className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-4"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }}
                    variants={{
                        hidden: { opacity: 0 },
                        visible: {
                            opacity: 1,
                            transition: { staggerChildren: 0.05 },
                        },
                    }}
                >
                    {fixtures.map((fixture) => (
                        <FixtureCard key={fixture.id} fixture={fixture} />
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
