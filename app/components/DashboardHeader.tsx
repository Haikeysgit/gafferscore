"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";

interface DashboardHeaderProps {
    nickname?: string;
}

export default function DashboardHeader({ nickname }: DashboardHeaderProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [, startTransition] = useTransition();

    const getActiveTab = (path: string) => {
        if (path === "/leaderboard") return "leaderboard";
        if (path.startsWith("/gaffer")) return "gaffer";
        return "matches";
    };

    const [activeTab, setActiveTab] = useState<"matches" | "leaderboard" | "gaffer">(
        getActiveTab(pathname)
    );

    useEffect(() => {
        setActiveTab(getActiveTab(pathname));
    }, [pathname]);

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

    const handleTabSwitch = (tab: "matches" | "leaderboard" | "gaffer") => {
        if (tab === activeTab) return;
        setActiveTab(tab);
        startTransition(() => {
            if (tab === "matches") router.push("/dashboard");
            else if (tab === "leaderboard") router.push("/leaderboard");
            else router.push("/gaffer");
        });
    };

    const tabIndex = activeTab === "matches" ? 0 : activeTab === "gaffer" ? 1 : 2;

    return (
        <header className="glass-nav sticky top-0 z-50">
            {/* ── Row 1: Logo + Profile ── */}
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 md:px-6">
                <Link href="/dashboard" className="text-lg font-bold tracking-wide text-white">
                    GafferScore
                </Link>

                <div className="flex items-center gap-4">
                    <div className="hidden items-center gap-5 md:flex">
                        <Link href="/rules" className="nav-link text-white/40 hover:text-white/70 transition-colors">Rules</Link>
                        <Link href="/contact" className="nav-link text-white/40 hover:text-white/70 transition-colors">Contact</Link>
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
                                <div className="absolute right-0 top-full mt-2 z-[60] w-44 overflow-hidden rounded-lg border border-white/10 bg-[#0d1b2a] shadow-xl shadow-black/40">
                                    <Link href="/settings" className="flex items-center gap-3 px-4 py-3 text-xs font-medium text-white/60 transition-all duration-75 hover:bg-white/5 hover:text-white active:scale-95 active:bg-white/5">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
                                        Settings
                                    </Link>
                                    <div className="border-t border-white/5" />
                                    <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-3 text-xs font-medium text-red-400/80 transition-all duration-75 hover:bg-red-500/10 hover:text-red-400 active:scale-95 active:bg-red-500/10">
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
    <div className="relative flex items-center rounded-full border border-white/10 bg-white/5 p-1" style={{ width: "320px" }}>
        {/* Pill */}
        <div
            className="absolute inset-y-1 rounded-full bg-mint transition-all duration-300 ease-in-out"
            style={{
                width: "calc(33.333% - 2px)",
                left: tabIndex === 0 ? "4px" : tabIndex === 1 ? "calc(33.333%)" : "calc(66.666%)",
            }}
        />
        <motion.button
            onClick={() => handleTabSwitch("matches")}
            whileTap={{ scale: 0.96 }}
            className={`relative z-10 rounded-full py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] transition-colors duration-200 ${activeTab === "matches" ? "text-navy" : "text-white/50 hover:text-white"}`}
            style={{ width: "33.333%", textAlign: "center" }}
        >
            Matches
        </motion.button>
        <motion.button
            onClick={() => handleTabSwitch("gaffer")}
            whileTap={{ scale: 0.96 }}
            className={`relative z-10 rounded-full py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] transition-colors duration-200 ${activeTab === "gaffer" ? "text-navy" : "text-white/50 hover:text-white"}`}
            style={{ width: "33.333%", textAlign: "center" }}
        >
            The Gaffer
        </motion.button>
        <motion.button
            onClick={() => handleTabSwitch("leaderboard")}
            whileTap={{ scale: 0.96 }}
            className={`relative z-10 rounded-full py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] transition-colors duration-200 ${activeTab === "leaderboard" ? "text-navy" : "text-white/50 hover:text-white"}`}
            style={{ width: "33.333%", textAlign: "center" }}
        >
            Leaderboard
        </motion.button>
    </div>
</div>
        </header>
    );
}