import { NextRequest, NextResponse } from "next/server";

/**
 * Subdomain routing middleware.
 * Rewrites requests from kids.localhost (or kids.<domain>) to /kids/* internally.
 *
 * How it works:
 *   - If the hostname starts with "kids." we rewrite /some/path → /kids/some/path
 *   - API routes (/api/*) are left alone so the kids site can call them normally.
 *   - Static assets are skipped entirely (see matcher below).
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const hostname = host.split(":")[0]; // strip port

  // Detect "kids" subdomain (kids.localhost, kids.example.com, etc.)
  if (hostname.startsWith("kids.")) {
    const url = request.nextUrl.clone();

    // Skip API routes — they're shared between main & kids sites
    if (url.pathname.startsWith("/api")) {
      return NextResponse.next();
    }

    // Don't double-rewrite if already on /kids path
    if (!url.pathname.startsWith("/kids")) {
      url.pathname = `/kids${url.pathname === "/" ? "" : url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Run on all paths except static assets
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
