import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // IMPORTANT: Do NOT add logic between createServerClient and getUser().
    // A simple mistake here could make sessions very hard to debug.
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    // ── Public routes: landing page, auth callback, static assets ──
    const publicRoutes = ["/", "/auth", "/auth/callback", "/auth/recovery", "/rules"];
    const isPublicRoute =
        publicRoutes.includes(pathname) ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api") ||
        pathname.includes(".");

    if (isPublicRoute) {
        return supabaseResponse;
    }

    // ── Not logged in → redirect to landing ──
    if (!user) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
    }

    // ── Nickname gate: check session metadata (zero DB queries) ──
    if (pathname !== "/set-nickname" && pathname !== "/update-password") {
        const nickname = user.user_metadata?.nickname;

        if (!nickname) {
            const url = request.nextUrl.clone();
            url.pathname = "/set-nickname";
            return NextResponse.redirect(url);
        }
    }

    return supabaseResponse;
}
