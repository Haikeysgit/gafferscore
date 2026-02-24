"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export interface MatchCardProps {
    fixtureId: number;
    homeTeam: string;
    awayTeam: string;
    homeShort: string;
    awayShort: string;
    homeLogo?: string;
    awayLogo?: string;
    kickoffTime: string;
    status: "pending" | "live" | "finished";
    actualHomeScore?: number | null;
    actualAwayScore?: number | null;
    initialHomeScore?: number;
    initialAwayScore?: number;
    initialSaved?: boolean;
    pointsEarned?: number;
    onSave?: (fixtureId: number, homeScore: number, awayScore: number) => Promise<{ success: boolean; error?: string }> | void;
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
    // Clamp sentinel values (-1 for missed predictions) to 0
    const [homeScore, setHomeScore] = useState(Math.max(0, initialHomeScore));
    const [awayScore, setAwayScore] = useState(Math.max(0, initialAwayScore));
    const [saved, setSaved] = useState(initialSaved);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");

    const kickoff = new Date(kickoffTime);
    const now = new Date();
    const fourteenDaysFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const hasStarted = now >= kickoff || status === "live" || status === "finished";
    const outsideWindow = !hasStarted && kickoff > fourteenDaysFromNow;
    const isLocked = hasStarted;  // Only lock after kickoff/live/finished
    const isFinished = status === "finished";
    const isLive = status === "live";
    const canEdit = !isLocked && !outsideWindow && !saved;

    const formatKickoff = () =>
        kickoff.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) +
        " — " +
        kickoff.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

    const inc = (setter: (v: number) => void, val: number) => {
        if (canEdit) setter(Math.min(val + 1, 99));
    };
    const dec = (setter: (v: number) => void, val: number) => {
        if (canEdit) setter(Math.max(val - 1, 0));
    };

    const handleSave = async () => {
        if (isLocked) return;
        setSaveError("");
        if (saved) {
            setSaved(false);
        } else {
            setSaving(true);
            const result = await onSave?.(fixtureId, homeScore, awayScore);
            setSaving(false);
            if (result && !result.success) {
                setSaveError(result.error || "Failed to save");
                return;
            }
            setSaved(true);
        }
    };

    const Up = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
    );
    const Down = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
    );
    const LockIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
    );

    const borderClass = isLive ? "card-active" : (isLocked || outsideWindow) ? "card-locked" : "card-active";
    const arrowClass = canEdit ? "text-mint hover:bg-mint/15" : "text-white/15 cursor-not-allowed";

    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 20, stiffness: 100 } }
            }}
            className={`glass-card w-full rounded-xl overflow-hidden ${borderClass}`}
        >
            {/* ── Status Banner ── */}
            {isLocked && (
                <div className={`flex items-center justify-center gap-1.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] ${isLive ? "bg-mint/10 text-mint" : isFinished ? "bg-white/5 text-white/60" : "bg-red-500/20 text-red-400"
                    }`}>
                    {isLive ? (<><span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-mint" />Live</>) : isFinished ? (<>Full Time</>) : (<><LockIcon /> Locked</>)}
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════
          ALWAYS HORIZONTAL: Team | Score | Center | Score | Team
          ══════════════════════════════════════════════════════════ */}
            <div className="flex items-center justify-between px-3 py-3 md:px-5 md:py-4">
                {/* Home Team */}
                <div className="flex flex-col items-center gap-1 w-10 shrink-0 md:w-20">
                    <div className="flex h-9 w-9 md:h-12 md:w-12 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[8px] md:text-xs font-bold text-white/80">
                        {homeLogo ? <img src={homeLogo} alt={homeShort} className="h-6 w-6 md:h-8 md:w-8 object-contain" /> : homeShort}
                    </div>
                    {/* Short code on mobile, full name on desktop */}
                    <span className="team-label text-center text-[8px] md:text-[10px] font-semibold text-white/70 leading-tight md:hidden">{homeShort}</span>
                    <span className="team-label text-center text-[10px] font-semibold text-white/80 leading-tight hidden md:block">{homeTeam}</span>
                </div>

                {/* Home Score */}
                <div className="flex flex-col items-center gap-0.5 shrink-0">
                    <button onClick={() => inc(setHomeScore, homeScore)} disabled={!canEdit} className={`btn-interactive flex h-5 w-5 md:h-7 md:w-7 items-center justify-center rounded-full transition-all ${arrowClass}`} aria-label="Increase home score"><Up /></button>
                    <span className="flex h-9 w-9 md:h-12 md:w-12 items-center justify-center rounded-md border border-white/15 bg-white/5 text-base md:text-xl font-black text-white">{homeScore}</span>
                    <button onClick={() => dec(setHomeScore, homeScore)} disabled={!canEdit} className={`btn-interactive flex h-5 w-5 md:h-7 md:w-7 items-center justify-center rounded-full transition-all ${arrowClass}`} aria-label="Decrease home score"><Down /></button>
                </div>

                {/* Center: Kickoff / Score */}
                <div className="flex flex-col items-center gap-0.5 min-w-0 px-1">
                    <span className="text-[7px] md:text-[9px] font-medium uppercase tracking-[0.15em] text-white/30">
                        {isFinished ? "Final Score" : isLive ? "Live Score" : "Kick Off"}
                    </span>
                    {(isFinished || isLive) && actualHomeScore != null && actualAwayScore != null ? (
                        <span className="text-lg md:text-2xl font-black text-white whitespace-nowrap">{actualHomeScore} - {actualAwayScore}</span>
                    ) : (
                        <span className="text-center text-[9px] md:text-[11px] font-medium text-white/50 leading-tight">{formatKickoff()}</span>
                    )}
                    {isFinished && pointsEarned !== undefined && (
                        <span className={`rounded-full px-2 py-px text-[8px] md:text-[10px] font-bold ${pointsEarned === 50 ? "bg-mint/20 text-mint" : pointsEarned === 20 ? "bg-blue-400/20 text-blue-300" : "bg-white/5 text-white/30"
                            }`}>+{pointsEarned} pts</span>
                    )}
                </div>

                {/* Away Score */}
                <div className="flex flex-col items-center gap-0.5 shrink-0">
                    <button onClick={() => inc(setAwayScore, awayScore)} disabled={!canEdit} className={`btn-interactive flex h-5 w-5 md:h-7 md:w-7 items-center justify-center rounded-full transition-all ${arrowClass}`} aria-label="Increase away score"><Up /></button>
                    <span className="flex h-9 w-9 md:h-12 md:w-12 items-center justify-center rounded-md border border-white/15 bg-white/5 text-base md:text-xl font-black text-white">{awayScore}</span>
                    <button onClick={() => dec(setAwayScore, awayScore)} disabled={!canEdit} className={`btn-interactive flex h-5 w-5 md:h-7 md:w-7 items-center justify-center rounded-full transition-all ${arrowClass}`} aria-label="Decrease away score"><Down /></button>
                </div>

                {/* Away Team */}
                <div className="flex flex-col items-center gap-1 w-10 shrink-0 md:w-20">
                    <div className="flex h-9 w-9 md:h-12 md:w-12 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[8px] md:text-xs font-bold text-white/80">
                        {awayLogo ? <img src={awayLogo} alt={awayShort} className="h-6 w-6 md:h-8 md:w-8 object-contain" /> : awayShort}
                    </div>
                    <span className="team-label text-center text-[8px] md:text-[10px] font-semibold text-white/70 leading-tight md:hidden">{awayShort}</span>
                    <span className="team-label text-center text-[10px] font-semibold text-white/80 leading-tight hidden md:block">{awayTeam}</span>
                </div>
            </div>

            {/* ── Save / Edit / Locked ── */}
            {!isLocked && (
                <div className="border-t border-white/5 px-3 py-2.5 md:px-6 md:py-3">
                    {outsideWindow ? (
                        <button
                            disabled
                            className="btn-pill w-full py-2.5 text-[10px] md:text-xs font-bold uppercase tracking-[0.15em] bg-white/5 text-white/25 cursor-not-allowed border border-white/10"
                        >
                            Locked
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className={`btn-interactive btn-pill w-full py-2.5 text-[10px] md:text-xs font-bold uppercase tracking-[0.15em] active:scale-95 ${saved ? "border-2 border-mint/50 bg-transparent text-mint hover:bg-mint/5" : "bg-mint text-navy btn-glow"
                                    } disabled:opacity-50`}
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

            {/* ── Locked Footer (after kickoff) ── */}
            {isLocked && (
                <div className="border-t border-white/5 px-3 py-2 text-center">
                    <span className="text-[9px] md:text-[11px] text-white/25">Your prediction: {homeScore} - {awayScore}</span>
                </div>
            )}
        </motion.div>
    );
}
