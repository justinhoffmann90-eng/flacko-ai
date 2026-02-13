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
  const publicRoutes = ["/", "/login", "/signup", "/forgot-password", "/reset-password", "/pricing", "/welcome", "/founder", "/learn", "/terms", "/privacy", "/subscribe", "/accuracy"];
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

  // Orb API endpoints (cron-triggered, use Bearer token auth)
  if (request.nextUrl.pathname.startsWith("/api/orb")) {
    return supabaseResponse;
  }

  // Report upload with admin secret (used by Clawd automation)
  if (request.nextUrl.pathname === "/api/reports" && request.method === "POST") {
    const authHeader = request.headers.get("authorization");
    if (authHeader === `Bearer ${process.env.ADMIN_SECRET}`) {
      return supabaseResponse;
    }
  }

  // Bot API endpoints (internal use for indexing/query)
  if (request.nextUrl.pathname.startsWith("/api/bot")) {
    return supabaseResponse;
  }

  // Command center API should be accessible (data is not sensitive)
  if (request.nextUrl.pathname.startsWith("/api/command-center")) {
    return supabaseResponse;
  }

  // Signup checkout endpoints (no auth needed - public checkout)
  if (request.nextUrl.pathname === "/api/signup-checkout" ||
      request.nextUrl.pathname === "/api/create-checkout") {
    return supabaseResponse;
  }

  // Check user endpoint (for login page to detect existing vs new users)
  if (request.nextUrl.pathname === "/api/check-user") {
    return supabaseResponse;
  }

  // Cards API (used by Content Hub for image generation)
  if (request.nextUrl.pathname.startsWith("/api/cards")) {
    return supabaseResponse;
  }

  // Content preview/download (used by Content Hub)
  if (request.nextUrl.pathname.startsWith("/api/content")) {
    return supabaseResponse;
  }

  // Reports latest endpoint (used by Content Hub for data injection)
  if (request.nextUrl.pathname === "/api/reports/latest") {
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
