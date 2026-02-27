import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");

    // We try to get next from the searchParams. If not found, check the full URL string 
    // because sometimes the middleware/Vercel mapping drops it from searchParams.
    let next = requestUrl.searchParams.get("next");
    if (!next) {
        const nextMatch = request.url.match(/next=([^&]+)/);
        if (nextMatch && nextMatch[1]) {
            next = decodeURIComponent(nextMatch[1]);
        }
    }

    // SUPABASE BUG BYPASS: Sometimes Supabase email templates completely strip the redirectTo parameter.
    // However, they ALWAYS include type=recovery. We can use this to infer the user's intent.
    const type = requestUrl.searchParams.get("type");
    if (type === "recovery") {
        next = "/update-password";
    }

    // Default to dashboard
    next = next || "/dashboard";

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
