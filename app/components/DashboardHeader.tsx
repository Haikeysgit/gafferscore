"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface DashboardHeaderProps {
    nickname?: string;
}

export default function DashboardHeader({ nickname }: DashboardHeaderProps) {
    const pathname = usePathname();
    const router = useRouter();
    const isMatches = pathname === "/dashboard";
    const isLeaderboard = pathname === "/leaderboard";

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/");
    };

    return (
        <header className="glass-nav sticky top-0 z-50">
            {/* ── Row 1: Logo + Profile ── */}
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 md:px-6">
                <Link href="/dashboard" className="text-lg font-bold tracking-wide text-white">
                    GafferScore
                </Link>

                <div className="flex items-center gap-4">
                    <div className="hidden items-center gap-5 md:flex">
                        <a href="#" className="nav-link text-white/40 hover:text-white/70 transition-colors">Rules</a>
                        <a href="#" className="nav-link text-white/40 hover:text-white/70 transition-colors">Contact</a>
                    </div>

                    {nickname && (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen((prev) => !prev)}
                                className="flex items-center gap-2 rounded-full transition-colors hover:bg-white/10"
                            >
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-mint text-xs font-bold text-navy">
                                    {nickname.charAt(0).toUpperCase()}
                                </div>
                                <span className="hidden text-xs font-medium text-white/70 md:inline">{nickname}</span>
                            </button>

                            {dropdownOpen && (
                                <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-lg border border-white/10 bg-navy-light shadow-xl shadow-black/30">
                                    <a href="#" className="flex items-center gap-3 px-4 py-3 text-xs font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
                                        Settings
                                    </a>
                                    <div className="border-t border-white/5" />
                                    <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-3 text-xs font-medium text-red-400/80 transition-colors hover:bg-red-500/10 hover:text-red-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Row 2: Navigation Tabs ── */}
            <div className="flex justify-center border-t border-white/5 px-4 py-1.5">
                <div className="flex items-center rounded-full border border-white/10 bg-white/5 p-1">
                    <Link
                        href="/dashboard"
                        className={`rounded-full px-6 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] transition-all duration-200 ${isMatches ? "bg-mint text-navy" : "text-white/50 hover:text-white"
                            }`}
                    >
                        Matches
                    </Link>
                    <Link
                        href="/leaderboard"
                        className={`rounded-full px-6 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] transition-all duration-200 ${isLeaderboard ? "bg-mint text-navy" : "text-white/50 hover:text-white"
                            }`}
                    >
                        Leaderboard
                    </Link>
                </div>
            </div>
        </header>
    );
}
