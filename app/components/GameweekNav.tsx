"use client";

interface GameweekNavProps {
    currentGameweek: number;
    totalGameweeks: number;
    onPrev: () => void;
    onNext: () => void;
}

export default function GameweekNav({
    currentGameweek,
    totalGameweeks,
    onPrev,
    onNext,
}: GameweekNavProps) {
    return (
        <div className="flex items-center justify-center gap-6 py-8">
            {/* Left Arrow */}
            <button
                onClick={onPrev}
                disabled={currentGameweek <= 1}
                className="btn-interactive flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/60 disabled:opacity-20 hover:bg-white/10 hover:text-white transition-all"
                aria-label="Previous gameweek"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                </svg>
            </button>

            {/* Gameweek Label */}
            <span className="min-w-[180px] text-center text-sm font-bold uppercase tracking-[0.15em] text-white">
                Gameweek {currentGameweek}
            </span>

            {/* Right Arrow */}
            <button
                onClick={onNext}
                disabled={currentGameweek >= totalGameweeks}
                className="btn-interactive flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/60 disabled:opacity-20 hover:bg-white/10 hover:text-white transition-all"
                aria-label="Next gameweek"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                </svg>
            </button>
        </div>
    );
}
