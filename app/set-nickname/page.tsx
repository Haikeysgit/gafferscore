"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SetNicknamePage() {
    const [nickname, setNickname] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const trimmed = nickname.trim();

        // Basic validation
        if (trimmed.length < 3) {
            setError("Nickname must be at least 3 characters.");
            setLoading(false);
            return;
        }

        if (trimmed.length > 20) {
            setError("Nickname must be 20 characters or less.");
            setLoading(false);
            return;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
            setError("Only letters, numbers, and underscores allowed.");
            setLoading(false);
            return;
        }

        // Get the current user
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            setError("Session expired. Please log in again.");
            setLoading(false);
            return;
        }

        // Try to insert the profile row with the nickname
        const { error: insertError } = await supabase.from("users").upsert(
            {
                id: user.id,
                nickname: trimmed,
            },
            { onConflict: "id" }
        );

        if (insertError) {
            // Unique constraint violation → nickname already taken
            if (insertError.code === "23505") {
                setError("That nickname is already taken. Try another one.");
            } else {
                setError(insertError.message);
            }
            setLoading(false);
            return;
        }

        // Inject nickname into session metadata so middleware can
        // check it without ever querying the database.
        const { error: metaError } = await supabase.auth.updateUser({
            data: { nickname: trimmed },
        });

        if (metaError) {
            setError(metaError.message);
            setLoading(false);
            return;
        }

        // Success → redirect to dashboard
        router.push("/dashboard");
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-md border-4 border-navy p-8">
                {/* Header */}
                <h1 className="mb-2 text-center text-3xl font-extrabold text-navy">
                    Choose Your Nickname
                </h1>
                <p className="mb-8 text-center text-sm text-navy/60">
                    This will be your public name on the leaderboard. No emails are ever
                    shown.
                </p>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="e.g. GoalKing99"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        maxLength={20}
                        className="mb-4 w-full rounded-md border-2 border-navy/30 bg-white px-4 py-3 text-sm text-navy placeholder-navy/40 outline-none focus:border-navy"
                    />

                    {error && (
                        <p className="mb-3 text-center text-xs font-medium text-red-500">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-interactive w-full rounded-md bg-mint px-4 py-3 text-sm font-bold text-navy shadow-none disabled:opacity-50"
                    >
                        {loading ? "Saving..." : "Save & Continue"}
                    </button>
                </form>

                {/* Rules hint */}
                <p className="mt-6 text-center text-xs text-navy/40">
                    Nicknames must be 3–20 characters. Letters, numbers, and underscores
                    only.
                </p>
            </div>
        </div>
    );
}
