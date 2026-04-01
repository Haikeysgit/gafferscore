"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import TeamCrest from "@/app/components/TeamCrest";
import {
    getFixtureStatusLabel,
    isFixtureFullTime,
    isFixtureLive,
    type FixtureStatus,
} from "@/lib/fixture-status";

export interface MatchCardProps {
    fixtureId: number;
    homeTeam: string;
    awayTeam: string;
    homeShort: string;
    awayShort: string;
    homeLogo?: string;
    awayLogo?: string;
    kickoffTime: string;
    status: FixtureStatus;
    actualHomeScore?: number | null;
    actualAwayScore?: number | null;
    initialHomeScore?: number;
    initialAwayScore?: number;
    initialSaved?: boolean;
    pointsEarned?: number;
    onSave?: (
        fixtureId: number,
        homeScore: number,
        awayScore: number,
    ) => Promise<{ success: boolean; error?: string }> | void;
}

export default function MatchCard({
    fixtureId,
    homeTeam,
    awayTeam,
    homeShort,
    awayShort,
    homeLogo,
    awayLogo,
    kickoffTime,
    status,
    actualHomeScore,
    actualAwayScore,
    initialHomeScore = 0,
    initialAwayScore = 0,
    initialSaved = false,
    pointsEarned,
    onSave,
}: MatchCardProps) {
    const [homeScore, setHomeScore] = useState(Math.max(0, initialHomeScore));
    const [awayScore, setAwayScore] = useState(Math.max(0, initialAwayScore));
    const [saved, setSaved] = useState(initialSaved);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");

    const kickoff = new Date(kickoffTime);
    const now = new Date();
    const fourteenDaysFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const isLive = isFixtureLive(status);
    const isFinished = isFixtureFullTime(status);
    const hasStarted = now >= kickoff || isLive || isFinished;
    const outsideWindow = !hasStarted && kickoff > fourteenDaysFromNow;
    const isLocked = hasStarted;
    const canEdit = !isLocked && !outsideWindow && !saved;
    const statusLabel = getFixtureStatusLabel(status);
    const showStatusBanner =
        isLocked ||
        status === "POSTPONED" ||
        status === "SUSPENDED" ||
        status === "CANCELLED";
    const statusClass = isLive
        ? "bg-mint/10 text-mint"
        : isFinished
            ? "bg-white/5 text-white/60"
            : status === "POSTPONED"
                ? "bg-amber-500/15 text-amber-300"
                : "bg-red-500/20 text-red-400";

    const formatKickoff = () =>
        kickoff.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) +
        " - " +
        kickoff.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

    const inc = (setter: (value: number) => void, value: number) => {
        if (canEdit) setter(Math.min(value + 1, 99));
    };

    const dec = (setter: (value: number) => void, value: number) => {
        if (canEdit) setter(Math.max(value - 1, 0));
    };

    const handleSave = async () => {
        if (isLocked) return;

        setSaveError("");
        if (saved) {
            setSaved(false);
            return;
        }

        setSaving(true);
        const result = await onSave?.(fixtureId, homeScore, awayScore);
        setSaving(false);

        if (result && !result.success) {
            setSaveError(result.error || "Failed to save");
            return;
        }

        setSaved(true);
    };

    const Up = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15" />
        </svg>
    );

    const Down = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
        </svg>
    );

    const LockIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    );

    const borderClass = isLive ? "card-active" : (isLocked || outsideWindow) ? "card-locked" : "card-active";
    const arrowClass = canEdit ? "text-mint hover:bg-mint/15" : "text-white/15 cursor-not-allowed";

    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 20, stiffness: 100 } },
            }}
            className={`glass-card w-full overflow-hidden rounded-xl ${borderClass}`}
        >
            {showStatusBanner && (
                <div className={`flex items-center justify-center gap-1.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] ${statusClass}`}>
                    {isLive ? (
                        <>
                            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-mint" />
                            {statusLabel}
                        </>
                    ) : isFinished ? (
                        <>Full Time</>
                    ) : status === "POSTPONED" ? (
                        <>Postponed</>
                    ) : status === "SUSPENDED" ? (
                        <>Suspended</>
                    ) : status === "CANCELLED" ? (
                        <>Cancelled</>
                    ) : (
                        <>
                            <LockIcon />
                            Locked
                        </>
                    )}
                </div>
            )}

            <div className="flex items-center justify-between px-3 py-3 md:px-5 md:py-4">
                <div className="flex w-10 shrink-0 flex-col items-center gap-1 md:w-20">
                    <TeamCrest
                        short={homeShort}
                        logo={homeLogo}
                        sizeClassName="h-9 w-9 md:h-12 md:w-12"
                        imageClassName="h-6 w-6 object-contain md:h-8 md:w-8"
                        fallbackTextClassName="text-[8px] font-bold text-white/80 md:text-xs"
                    />
                    <span className="team-label text-center text-[8px] font-semibold leading-tight text-white/70 md:hidden md:text-[10px]">{homeShort}</span>
                    <span className="team-label hidden text-center text-[10px] font-semibold leading-tight text-white/80 md:block">{homeTeam}</span>
                </div>

                <div className="flex shrink-0 flex-col items-center gap-0.5">
                    <button onClick={() => inc(setHomeScore, homeScore)} disabled={!canEdit} className={`btn-interactive flex h-5 w-5 items-center justify-center rounded-full transition-all md:h-7 md:w-7 ${arrowClass}`} aria-label="Increase home score"><Up /></button>
                    <span className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 bg-white/5 text-base font-black text-white md:h-12 md:w-12 md:text-xl">{homeScore}</span>
                    <button onClick={() => dec(setHomeScore, homeScore)} disabled={!canEdit} className={`btn-interactive flex h-5 w-5 items-center justify-center rounded-full transition-all md:h-7 md:w-7 ${arrowClass}`} aria-label="Decrease home score"><Down /></button>
                </div>

                <div className="flex min-w-0 flex-col items-center gap-0.5 px-1">
                    <span className="text-[7px] font-medium uppercase tracking-[0.15em] text-white/30 md:text-[9px]">
                        {isFinished ? "Final Score" : isLive ? "Live Score" : status === "POSTPONED" ? "Status" : "Kick Off"}
                    </span>
                    {(isFinished || isLive) && actualHomeScore != null && actualAwayScore != null ? (
                        <span className="whitespace-nowrap text-lg font-black text-white md:text-2xl">{actualHomeScore} - {actualAwayScore}</span>
                    ) : showStatusBanner && !isLocked ? (
                        <span className="text-center text-[9px] font-medium leading-tight text-white/50 md:text-[11px]">{statusLabel}</span>
                    ) : (
                        <span className="text-center text-[9px] font-medium leading-tight text-white/50 md:text-[11px]">{formatKickoff()}</span>
                    )}
                    {isFinished && pointsEarned !== undefined && (
                        <span className={`rounded-full px-2 py-px text-[8px] font-bold md:text-[10px] ${pointsEarned === 50 ? "bg-mint/20 text-mint" : pointsEarned === 20 ? "bg-blue-400/20 text-blue-300" : "bg-white/5 text-white/30"}`}>
                            +{pointsEarned} pts
                        </span>
                    )}
                </div>

                <div className="flex shrink-0 flex-col items-center gap-0.5">
                    <button onClick={() => inc(setAwayScore, awayScore)} disabled={!canEdit} className={`btn-interactive flex h-5 w-5 items-center justify-center rounded-full transition-all md:h-7 md:w-7 ${arrowClass}`} aria-label="Increase away score"><Up /></button>
                    <span className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 bg-white/5 text-base font-black text-white md:h-12 md:w-12 md:text-xl">{awayScore}</span>
                    <button onClick={() => dec(setAwayScore, awayScore)} disabled={!canEdit} className={`btn-interactive flex h-5 w-5 items-center justify-center rounded-full transition-all md:h-7 md:w-7 ${arrowClass}`} aria-label="Decrease away score"><Down /></button>
                </div>

                <div className="flex w-10 shrink-0 flex-col items-center gap-1 md:w-20">
                    <TeamCrest
                        short={awayShort}
                        logo={awayLogo}
                        sizeClassName="h-9 w-9 md:h-12 md:w-12"
                        imageClassName="h-6 w-6 object-contain md:h-8 md:w-8"
                        fallbackTextClassName="text-[8px] font-bold text-white/80 md:text-xs"
                    />
                    <span className="team-label text-center text-[8px] font-semibold leading-tight text-white/70 md:hidden md:text-[10px]">{awayShort}</span>
                    <span className="team-label hidden text-center text-[10px] font-semibold leading-tight text-white/80 md:block">{awayTeam}</span>
                </div>
            </div>

            {!isLocked && (
                <div className="border-t border-white/5 px-3 py-2.5 md:px-6 md:py-3">
                    {outsideWindow ? (
                        <button
                            disabled
                            className="btn-pill w-full cursor-not-allowed border border-white/10 bg-white/5 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white/25 md:text-xs"
                        >
                            Locked
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className={`btn-interactive btn-pill w-full py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] active:scale-95 md:text-xs ${saved ? "border-2 border-mint/50 bg-transparent text-mint hover:bg-mint/5" : "btn-glow bg-mint text-navy"} disabled:opacity-50`}
                            >
                                {saving ? "Saving..." : saved ? "Edit Prediction" : "Save Prediction"}
                            </button>
                            {saveError && (
                                <p className="mt-1.5 text-center text-[9px] font-medium text-red-400">{saveError}</p>
                            )}
                        </>
                    )}
                </div>
            )}

            {isLocked && (
                <div className="border-t border-white/5 px-3 py-2 text-center">
                    <span className="text-[9px] text-white/25 md:text-[11px]">Your prediction: {homeScore} - {awayScore}</span>
                </div>
            )}
        </motion.div>
    );
}
