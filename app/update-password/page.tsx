"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function UpdatePasswordPage() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }

        const { error: updateError } = await supabase.auth.updateUser({
            password: password,
        });

        if (updateError) {
            setError(updateError.message);
            setLoading(false);
            return;
        }

        setMessage("Password updated successfully!");
        setLoading(false);

        // Optionally redirect after a short delay
        setTimeout(() => {
            router.push("/dashboard");
        }, 2000);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-md border-4 border-navy p-8">
                {/* Header */}
                <h1 className="mb-2 text-center text-3xl font-extrabold text-navy">
                    Update Password
                </h1>
                <p className="mb-8 text-center text-sm text-navy/60">
                    Enter your new password below.
                </p>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        placeholder="New Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mb-4 w-full rounded-md border-2 border-navy/30 bg-white px-4 py-3 text-sm text-navy placeholder-navy/40 outline-none focus:border-navy"
                        required
                    />

                    <input
                        type="password"
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="mb-4 w-full rounded-md border-2 border-navy/30 bg-white px-4 py-3 text-sm text-navy placeholder-navy/40 outline-none focus:border-navy"
                        required
                    />

                    {error && (
                        <p className="mb-3 text-center text-xs font-medium text-red-500">
                            {error}
                        </p>
                    )}

                    {message && (
                        <p className="mb-3 text-center text-xs font-medium text-green-600">
                            {message}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-interactive w-full rounded-md bg-mint px-4 py-3 text-sm font-bold text-navy shadow-none disabled:opacity-50"
                    >
                        {loading ? "Updating..." : "Update Password"}
                    </button>
                </form>
            </div>
        </div>
    );
}
