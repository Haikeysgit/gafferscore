"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Suspense } from "react";

function AuthForm() {
    const searchParams = useSearchParams();
    const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";

    const [view, setView] = useState<"login" | "signup" | "forgot">(initialMode);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        const mode = searchParams.get("mode");
        if (mode === "signup") setView("signup");
        else if (mode === "login") setView("login");
    }, [searchParams]);

    const handleGoogleLogin = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) setMessage(error.message);
        setLoading(false);
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            setMessage(error.message);
        } else {
            window.location.href = "/dashboard";
        }
        setLoading(false);
    };

    const handleEmailSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) {
            setMessage(error.message);
        } else {
            setMessage("Check your email to confirm your account.");
        }
        setLoading(false);
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback`,
        });
        if (error) {
            setMessage(error.message);
        } else {
            setMessage("Password reset link sent to your email.");
        }
        setLoading(false);
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
            {/* Navy background */}
            <div className="absolute inset-0 bg-navy" aria-hidden="true" />

            {/* Content card */}
            <div className="relative z-10 w-full max-w-sm px-6">
                {/* Back to home */}
                <Link
                    href="/"
                    className="mb-8 inline-flex items-center gap-2 text-xs font-light uppercase tracking-[0.1em] text-white/50 hover:text-white transition-colors"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Back to GafferScore
                </Link>

                {/* Heading */}
                <h1 className="mb-2 text-3xl font-extrabold text-white">
                    {view === "login"
                        ? "Welcome Back"
                        : view === "signup"
                            ? "Create Account"
                            : "Reset Password"}
                </h1>
                <p className="mb-8 text-sm text-white/50">
                    {view === "login"
                        ? "Log in to view your predictions."
                        : view === "signup"
                            ? "Join the leaderboard. Predict and compete."
                            : "Enter your email to receive a reset link."}
                </p>

                {/* Google button */}
                {view !== "forgot" && (
                    <>
                        <button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="btn-interactive mb-5 flex w-full items-center justify-center gap-3 rounded-md border-2 border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50 hover:bg-white/10 transition-colors"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Continue with Google
                        </button>

                        {/* Divider */}
                        <div className="mb-5 flex items-center gap-3">
                            <div className="h-px flex-1 bg-white/15" />
                            <span className="text-xs font-light uppercase tracking-[0.1em] text-white/40">
                                or
                            </span>
                            <div className="h-px flex-1 bg-white/15" />
                        </div>
                    </>
                )}

                {/* Email form */}
                <form
                    onSubmit={
                        view === "login"
                            ? handleEmailLogin
                            : view === "signup"
                                ? handleEmailSignup
                                : handleForgotPassword
                    }
                >
                    <input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="mb-3 w-full rounded-md border-2 border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/35 outline-none focus:border-mint transition-colors"
                    />

                    {view !== "forgot" && (
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="mb-5 w-full rounded-md border-2 border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/35 outline-none focus:border-mint transition-colors"
                        />
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-interactive w-full rounded-md bg-mint px-4 py-3 text-sm font-bold uppercase tracking-wider text-navy disabled:opacity-50"
                    >
                        {loading
                            ? "Loading..."
                            : view === "login"
                                ? "Log In"
                                : view === "signup"
                                    ? "Sign Up"
                                    : "Send Reset Link"}
                    </button>
                </form>

                {/* Status message */}
                {message && (
                    <p className="mt-4 text-center text-xs text-mint">{message}</p>
                )}

                {/* Toggle links */}
                <div className="mt-6 flex flex-col items-center gap-2 text-xs">
                    {view === "login" && (
                        <>
                            <button
                                onClick={() => { setView("signup"); setMessage(""); }}
                                className="text-white/50 underline hover:text-white transition-colors"
                            >
                                Don&apos;t have an account? Sign up
                            </button>
                            <button
                                onClick={() => { setView("forgot"); setMessage(""); }}
                                className="text-white/50 underline hover:text-white transition-colors"
                            >
                                Forgot your password?
                            </button>
                        </>
                    )}
                    {view === "signup" && (
                        <button
                            onClick={() => { setView("login"); setMessage(""); }}
                            className="text-white/50 underline hover:text-white transition-colors"
                        >
                            Already have an account? Log in
                        </button>
                    )}
                    {view === "forgot" && (
                        <button
                            onClick={() => { setView("login"); setMessage(""); }}
                            className="text-white/50 underline hover:text-white transition-colors"
                        >
                            Back to Log in
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AuthPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center bg-navy">
                    <p className="text-white/50 text-sm">Loading...</p>
                </div>
            }
        >
            <AuthForm />
        </Suspense>
    );
}
