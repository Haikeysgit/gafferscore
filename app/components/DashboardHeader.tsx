"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";

interface DashboardHeaderProps {
    nickname?: string;
}

type HeaderTab = "matches" | "leaderboard" | "gaffer";

function getActiveTab(path: string): HeaderTab {
    if (path === "/leaderboard") return "leaderboard";
    if (path.startsWith("/gaffer")) return "gaffer";
    return "matches";
}

export default function DashboardHeader({ nickname }: DashboardHeaderProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [, startTransition] = useTransition();
    const supabase = createClient();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [confirmLogout, setConfirmLogout] = useState(false);
    const [pendingTab, setPendingTab] = useState<HeaderTab | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const activeTab = getActiveTab(pathname);
    const visibleTab = pendingTab ?? activeTab;

    useEffect(() => {
        router.prefetch("/dashboard");
        router.prefetch("/leaderboard");
        router.prefetch("/gaffer");
    }, [router]);

    useEffect(() => {
        setPendingTab(null);
    }, [pathname]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
                setConfirmLogout(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    const handleTabSwitch = (tab: HeaderTab) => {
        if (tab === activeTab) return;

        setPendingTab(tab);

        startTransition(() => {
            if (tab === "matches") router.push("/dashboard");
            else if (tab === "leaderboard") router.push("/leaderboard");
            else router.push("/gaffer");
        });
    };

    const tabIndex = visibleTab === "matches" ? 0 : visibleTab === "gaffer" ? 1 : 2;

    return (
        <header className="glass-nav sticky top-0 z-50">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 md:px-6">
                <Link href="/dashboard" className="text-lg font-bold tracking-wide text-white">
                    GafferScore
                </Link>

                <div className="flex items-center gap-4">
                    <div className="hidden items-center gap-5 md:flex">
                        <Link
                            href="/rules"
                            className="nav-link text-white/40 transition-colors hover:text-white/70"
                        >
                            Rules
                        </Link>
                        <Link
                            href="/contact"
                            className="nav-link text-white/40 transition-colors hover:text-white/70"
                        >
                            Contact
                        </Link>
                    </div>

                    {nickname && (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => {
                                    setDropdownOpen((prev) => !prev);
                                    setConfirmLogout(false);
                                }}
                                className="flex items-center gap-2 rounded-full transition-colors hover:bg-white/10"
                            >
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-mint text-xs font-bold text-navy">
                                    {nickname.charAt(0).toUpperCase()}
                                </div>
                                <span className="hidden text-xs font-medium text-white/70 md:inline">
                                    {nickname}
                                </span>
                            </button>

                            {dropdownOpen && (
                                <div className="absolute right-0 top-full z-[60] mt-2 w-56 overflow-hidden rounded-lg border border-white/10 bg-[#0d1b2a] shadow-xl shadow-black/40">
                                    {!confirmLogout ? (
                                        <>
                                            <Link
                                                href={`/manager/${encodeURIComponent(nickname)}`}
                                                onClick={() => setDropdownOpen(false)}
                                                className="flex items-center gap-3 px-4 py-3 text-xs font-medium text-white/70 transition-all duration-75 hover:bg-white/5 hover:text-white active:scale-95 active:bg-white/5"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21a8 8 0 1 0-16 0" /><circle cx="12" cy="7" r="4" /></svg>
                                                Profile
                                            </Link>
                                            <Link
                                                href="/settings"
                                                onClick={() => setDropdownOpen(false)}
                                                className="flex items-center gap-3 px-4 py-3 text-xs font-medium text-white/70 transition-all duration-75 hover:bg-white/5 hover:text-white active:scale-95 active:bg-white/5"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
                                                Settings
                                            </Link>
                                            <div className="border-t border-white/5" />
                                            <button
                                                onClick={() => setConfirmLogout(true)}
                                                className="flex w-full items-center gap-3 px-4 py-3 text-xs font-medium text-red-400/80 transition-all duration-75 hover:bg-red-500/10 hover:text-red-400 active:scale-95 active:bg-red-500/10"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                                                Logout
                                            </button>
                                        </>
                                    ) : (
                                        <div className="p-4">
                                            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-red-300/80">
                                                Confirm Logout
                                            </p>
                                            <p className="mt-2 text-xs leading-5 text-white/65">
                                                Are you sure you want to logout?
                                            </p>
                                            <div className="mt-4 flex gap-2">
                                                <button
                                                    onClick={() => setConfirmLogout(false)}
                                                    className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleLogout}
                                                    className="flex-1 rounded-lg border border-red-500/20 bg-red-500/12 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-red-300 transition-colors hover:bg-red-500/18 hover:text-red-200"
                                                >
                                                    Yes, Logout
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-center border-t border-white/5 px-4 py-1.5">
                <div
                    className="relative flex items-center rounded-full border border-white/10 bg-white/5 p-1"
                    style={{ width: "320px" }}
                >
                    <div
                        className="absolute inset-y-1 rounded-full bg-mint transition-all duration-300 ease-in-out"
                        style={{
                            width: "calc(33.333% - 2px)",
                            left:
                                tabIndex === 0
                                    ? "4px"
                                    : tabIndex === 1
                                        ? "calc(33.333%)"
                                        : "calc(66.666%)",
                        }}
                    />
                    <motion.button
                        onClick={() => handleTabSwitch("matches")}
                        whileTap={{ scale: 0.96 }}
                        className={`relative z-10 rounded-full py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] transition-colors duration-200 ${
                            visibleTab === "matches" ? "text-navy" : "text-white/50 hover:text-white"
                        }`}
                        style={{ width: "33.333%", textAlign: "center" }}
                    >
                        Matches
                    </motion.button>
                    <motion.button
                        onClick={() => handleTabSwitch("gaffer")}
                        whileTap={{ scale: 0.96 }}
                        className={`relative z-10 rounded-full py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] transition-colors duration-200 ${
                            visibleTab === "gaffer" ? "text-navy" : "text-white/50 hover:text-white"
                        }`}
                        style={{ width: "33.333%", textAlign: "center" }}
                    >
                        The Gaffer
                    </motion.button>
                    <motion.button
                        onClick={() => handleTabSwitch("leaderboard")}
                        whileTap={{ scale: 0.96 }}
                        className={`relative z-10 rounded-full py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] transition-colors duration-200 ${
                            visibleTab === "leaderboard" ? "text-navy" : "text-white/50 hover:text-white"
                        }`}
                        style={{ width: "33.333%", textAlign: "center" }}
                    >
                        Leaderboard
                    </motion.button>
                </div>
            </div>
        </header>
    );
}
