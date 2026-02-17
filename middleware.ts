import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets (images, json, etc.)
     * - api/price-cache (public price endpoint for Taylor)
     * - api/cron (cron endpoints authenticated via CRON_SECRET)
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|api/price-cache|api/cron|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|html)$).*)",
  ],
};
