"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { Club } from "@/lib/clubs";
import Footer from "@/app/components/Footer";
import SimpleBackHeader from "@/app/components/SimpleBackHeader";
import TeamCrest from "@/app/components/TeamCrest";

interface SettingsClientProps {
    clubs: Club[];
    initialNickname: string;
    initialFavoriteClub: string | null;
}

export default function SettingsClient({
    clubs,
    initialNickname,
    initialFavoriteClub,
}: SettingsClientProps) {
    const supabase = createClient();
    const [nickname, setNickname] = useState(initialNickname);
    const [favoriteClub, setFavoriteClub] = useState<string | null>(initialFavoriteClub);
    const [clubSelectorOpen, setClubSelectorOpen] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleSaveProfile = async () => {
        setProfileLoading(true);
        setProfileMessage(null);

        const trimmed = nickname.trim();
        if (!trimmed) {
            setProfileMessage({ type: "error", text: "Name cannot be empty." });
            setProfileLoading(false);
            return;
        }

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            setProfileMessage({ type: "error", text: "Not authenticated." });
            setProfileLoading(false);
            return;
        }

        const { error } = await supabase
            .from("users")
            .update({ nickname: trimmed, favorite_club: favoriteClub })
            .eq("id", user.id);

        if (error) {
            if (error.message.includes("duplicate") || error.code === "23505") {
                setProfileMessage({ type: "error", text: "That name is already taken." });
            } else {
                setProfileMessage({ type: "error", text: error.message });
            }
        } else {
            setProfileMessage({ type: "success", text: "Profile updated!" });
        }

        setProfileLoading(false);
    };

    const handleUpdatePassword = async () => {
        setPasswordLoading(true);
        setPasswordMessage(null);

        if (newPassword.length < 6) {
            setPasswordMessage({ type: "error", text: "Password must be at least 6 characters." });
            setPasswordLoading(false);
            return;
        }

        const { error } = await supabase.auth.updateUser({ password: newPassword });

        if (error) {
            setPasswordMessage({ type: "error", text: error.message });
        } else {
            setNewPassword("");
            setPasswordMessage({ type: "success", text: "Password updated successfully!" });
        }

        setPasswordLoading(false);
    };

    const selectedClub = clubs.find((club) => club.short === favoriteClub);

    return (
        <div className="flex min-h-screen flex-col bg-navy">
            <SimpleBackHeader
                backHref="/dashboard"
                backLabel="Back to Dashboard"
                title="Settings"
            />

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

            <main className="relative z-10 flex-1">
                <div className="relative z-10 min-h-screen px-4 py-8 md:px-6">
                    <div className="mx-auto max-w-lg">
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="mb-8"
                        >
                            <h1 className="text-3xl font-extrabold tracking-tight text-white">
                                Settings
                            </h1>
                            <p className="mt-1 text-sm text-white/40">
                                Manage your profile and security.
                            </p>
                        </motion.div>

                        <motion.section
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.5 }}
                            className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm"
                        >
                            <h2 className="mb-6 text-xs font-semibold uppercase tracking-[0.15em] text-white/50">
                                Profile
                            </h2>

                            <div className="mb-5">
                                <label className="mb-1.5 block text-xs font-medium text-white/60">
                                    Manager Name
                                </label>
                                <input
                                    type="text"
                                    value={nickname}
                                    onChange={(event) => setNickname(event.target.value)}
                                    maxLength={20}
                                    className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-mint"
                                    placeholder="Enter your display name"
                                />
                            </div>

                            <div className="mb-6">
                                <label className="mb-1.5 block text-xs font-medium text-white/60">
                                    Favorite Club
                                </label>

                                <button
                                    type="button"
                                    onClick={() => setClubSelectorOpen((prev) => !prev)}
                                    className="flex w-full items-center gap-3 rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-left text-sm outline-none transition-colors hover:border-white/25 focus:border-mint"
                                >
                                    {selectedClub ? (
                                        <>
                                            <TeamCrest
                                                short={selectedClub.short}
                                                logo={selectedClub.crestUrl}
                                                sizeClassName="h-6 w-6 border-white/10"
                                                imageClassName="h-full w-full object-contain p-[2px]"
                                                fallbackTextClassName="text-[9px] font-bold text-white/75"
                                            />
                                            <span className="text-white">{selectedClub.name}</span>
                                            <span className="ml-auto text-xs text-white/30">
                                                {selectedClub.short}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-white/30">Select your club</span>
                                    )}

                                    <svg
                                        className={`ml-auto h-4 w-4 text-white/30 transition-transform ${
                                            clubSelectorOpen ? "rotate-180" : ""
                                        }`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </button>

                                {clubSelectorOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-3 grid grid-cols-4 gap-2 md:grid-cols-5"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFavoriteClub(null);
                                                setClubSelectorOpen(false);
                                            }}
                                            className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 transition-all duration-200 hover:bg-white/10 ${
                                                favoriteClub === null
                                                    ? "border-mint bg-mint/10"
                                                    : "border-white/10 bg-white/[0.02]"
                                            }`}
                                        >
                                            <span className="text-xl font-black text-white/75">-</span>
                                            <span className="text-[10px] font-semibold text-white/60">NONE</span>
                                        </button>

                                        {clubs.map((club) => (
                                            <button
                                                key={club.short}
                                                type="button"
                                                onClick={() => {
                                                    setFavoriteClub(club.short);
                                                    setClubSelectorOpen(false);
                                                }}
                                                className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all duration-200 hover:bg-white/10 ${
                                                    favoriteClub === club.short
                                                        ? "border-mint bg-mint/10"
                                                        : "border-white/10 bg-white/[0.02]"
                                                }`}
                                            >
                                                <TeamCrest
                                                    short={club.short}
                                                    logo={club.crestUrl}
                                                    sizeClassName="h-8 w-8 border-white/10"
                                                    imageClassName="h-full w-full object-contain p-[2px]"
                                                    fallbackTextClassName="text-[10px] font-bold text-white/75"
                                                />
                                                <span className="text-[10px] font-semibold text-white/60">
                                                    {club.short}
                                                </span>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </div>

                            <button
                                onClick={handleSaveProfile}
                                disabled={profileLoading}
                                className="w-full rounded-lg bg-mint px-4 py-3 text-sm font-bold uppercase tracking-wider text-navy transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                            >
                                {profileLoading ? "Saving..." : "Save Profile"}
                            </button>

                            {profileMessage && (
                                <p
                                    className={`mt-3 text-center text-xs font-medium ${
                                        profileMessage.type === "success" ? "text-mint" : "text-red-400"
                                    }`}
                                >
                                    {profileMessage.text}
                                </p>
                            )}
                        </motion.section>

                        <motion.section
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm"
                        >
                            <h2 className="mb-6 text-xs font-semibold uppercase tracking-[0.15em] text-white/50">
                                Security
                            </h2>

                            <div className="mb-6">
                                <label className="mb-1.5 block text-xs font-medium text-white/60">
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(event) => setNewPassword(event.target.value)}
                                        placeholder="Enter new password"
                                        minLength={6}
                                        className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 pr-12 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-mint"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/60"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                                <line x1="1" y1="1" x2="23" y2="23" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleUpdatePassword}
                                disabled={passwordLoading || !newPassword}
                                className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm font-bold uppercase tracking-wider text-white transition-all duration-200 hover:bg-white/10 active:scale-[0.98] disabled:opacity-50"
                            >
                                {passwordLoading ? "Updating..." : "Update Password"}
                            </button>

                            {passwordMessage && (
                                <p
                                    className={`mt-3 text-center text-xs font-medium ${
                                        passwordMessage.type === "success" ? "text-mint" : "text-red-400"
                                    }`}
                                >
                                    {passwordMessage.text}
                                </p>
                            )}
                        </motion.section>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
