import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Dev mode bypass - skip all auth checks
  if (process.env.DEV_BYPASS_AUTH === "true") {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          // Extend cookie maxAge to 30 days for better session persistence
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              maxAge: 60 * 60 * 24 * 30, // 30 days
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
            })
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Define public routes that don't require authentication
  const publicRoutes = ["/", "/login", "/signup", "/forgot-password", "/reset-password", "/pricing", "/landing-v2", "/landing-new", "/welcome", "/founder", "/learn", "/terms", "/privacy", "/v3"];
  const isPublicRoute = publicRoutes.some(
    (route) => request.nextUrl.pathname === route || 
               request.nextUrl.pathname.startsWith(route + "/") ||
               request.nextUrl.pathname.startsWith("/api/webhooks")
  );

  // Auth callback route should always be accessible
  if (request.nextUrl.pathname.startsWith("/api/auth")) {
    return supabaseResponse;
  }

  // Cron jobs have their own auth (Bearer token)
  if (request.nextUrl.pathname.startsWith("/api/cron")) {
    return supabaseResponse;
  }

  // Bot API endpoints (internal use for indexing/query)
  if (request.nextUrl.pathname.startsWith("/api/bot")) {
    return supabaseResponse;
  }

  // Alert debug endpoint (uses Bearer token auth like cron)
  if (request.nextUrl.pathname.startsWith("/api/alerts/debug")) {
    return supabaseResponse;
  }

  // Command center API should be accessible (data is not sensitive)
  if (request.nextUrl.pathname.startsWith("/api/command-center")) {
    return supabaseResponse;
  }

  // Signup checkout endpoint (creates user + checkout, no auth needed)
  if (request.nextUrl.pathname === "/api/signup-checkout") {
    return supabaseResponse;
  }

  // Stripe test endpoint (temporary debug)
  if (request.nextUrl.pathname === "/api/stripe-test") {
    return supabaseResponse;
  }

  // Email test endpoint (temporary)
  if (request.nextUrl.pathname === "/api/test-email") {
    return supabaseResponse;
  }

  // Admin send password email (temporary one-time use)
  if (request.nextUrl.pathname === "/api/admin/send-password-email") {
    return supabaseResponse;
  }

  // Redirect unauthenticated users to login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Don't redirect authenticated users away from auth pages
  // They might have stale sessions or need to re-authenticate
  // The pages themselves can redirect if appropriate

  return supabaseResponse;
}
