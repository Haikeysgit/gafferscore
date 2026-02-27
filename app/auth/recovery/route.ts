import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");

    // Dedicated recovery route directly targets the update password page
    const next = "/update-password";

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            const forwardedHost = request.headers.get("x-forwarded-host");
            const isLocalEnv = process.env.NODE_ENV === "development";

            let redirectBase = requestUrl.origin;
            if (!isLocalEnv && forwardedHost) {
                redirectBase = `https://${forwardedHost}`;
            }

            return NextResponse.redirect(`${redirectBase}${next}`);
        }
    }

    // If there's an error from Supabase or no code, redirect to the auth page with the error details
    const authError = requestUrl.searchParams.get("error");
    const errorDescription = requestUrl.searchParams.get("error_description");

    // Fallback to a generic error if none was provided in the query string
    const errorMessage = errorDescription
        ? encodeURIComponent(errorDescription)
        : authError
            ? encodeURIComponent(authError)
            : "invalid_auth_code";

    const forwardedHost = request.headers.get("x-forwarded-host");
    const isLocalEnv = process.env.NODE_ENV === "development";

    let redirectBase = requestUrl.origin;
    if (!isLocalEnv && forwardedHost) {
        redirectBase = `https://${forwardedHost}`;
    }

    return NextResponse.redirect(`${redirectBase}/auth?error=${errorMessage}`);
}
