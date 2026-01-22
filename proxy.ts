/**
 * Next.js 16 Proxy API
 *
 * This proxy handles:
 * - Authentication checks for protected routes
 * - Redirect logic for authenticated/unauthenticated users
 * - Dashboard routing based on user's active modules
 *
 * Migration from middleware.ts to proxy.ts (Next.js 16 best practice)
 * Requirements: 1.1, 1.2, 1.3, 1.4 (Proxy API migration)
 */

import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

// Create next-intl middleware
const handleI18nRouting = createMiddleware(routing);

/**
 * Proxy function (Next.js 16 pattern)
 *
 * Best practices:
 * - Export named function 'proxy' instead of default export
 * - Use auth() to get authentication state
 * - Use NextResponse for redirects
 * - Implement module-based redirect logic
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Static assets and API routes (handled separately)
  // Check BEFORE any processing for performance
  const isStaticAsset = pathname.startsWith('/_next') || pathname.startsWith('/api');
  if (isStaticAsset) {
    return NextResponse.next();
  }

  // 1. Run i18n middleware first to handle locale detection and routing
  const res = handleI18nRouting(req);

  // If i18n middleware returns a redirect (e.g. adding locale prefix), return it immediately
  if (res.headers.get('Location')) {
    return res;
  }

  // 2. Authentication Logic
  const publicPaths = ['/login', '/register'];
  // Check if current path (after locale potential stripping by i18n logic, but usually we check raw pathname)
  // We need to account for locale prefix in pathname checking.
  // Standard pattern: Check if path contains public segment or matches public route regardless of locale.
  // Simple check: does the path end with /login or /register? Or contains it properly.
  const isPublicPath = publicPaths.some(path =>
    pathname.endsWith(path) || pathname.includes(`${path}/`)
  );

  // Get authentication state
  const session = await auth();

  // Unauthenticated user trying to access protected route
  if (!session && !isPublicPath) {
    // Redirect to login, preserving locale if present, or defaulting to it via handleI18nRouting if we just redirect to /login
    // Easiest is to redirect to relative /login and let i18n middleware handle the locale addition on next pass if missing
    // But since we are inside proxy, we construct a URL.
    // Ideally, we want to maintain the current locale if present.
    // next-intl doesn't expose ease way to "get current locale" inside middleware without parsing.
    // But since `res` is already generated, we can assume standard routing.

    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user trying to access login/register page
  if (session && isPublicPath) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Dashboard redirect logic for authenticated users
  // Note: pathname here includes locale (e.g. /en or /zh/dashboard)
  // We should rely on standard routing. If user is at root (e.g. /en), check modules.
  // Root path check might need adjustment for locale presence.
  // e.g. /en or /zh is effectively "/" for the app.

  // Simple heuristic: if pathname ends with the locale or is just "/"
  const isRootPath = pathname === '/' || routing.locales.some(l => pathname === `/${l}`);

  if (session && isRootPath) {
    const activeModules = (session.user?.activeModules as string[]) || [];

    // Single module user: redirect directly to module page
    if (activeModules.length === 1) {
      return NextResponse.redirect(new URL(`/${activeModules[0]}`, req.url));
    }
  }

  return res;
}

/**
 * Matcher configuration (Next.js 16 best practices)
 *
 * Excludes:
 * - API routes (/api/*)
 * - Next.js internals (_next/static, _next/image, _next/data)
 * - Static assets (favicon.ico, manifest.json)
 * - Public files with extensions (images, icons, etc.)
 *
 * Pattern explanation:
 * - Uses negative lookahead (?!...) to exclude paths
 * - Matches all paths except those starting with excluded prefixes
 * - Excludes files with common static asset extensions
 *
 * Reference: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/* (all API routes including auth)
     * - _next/static/* (static files)
     * - _next/image/* (image optimization)
     * - _next/data/* (data fetching routes)
     * - favicon.ico (favicon)
     * - manifest.json (PWA manifest)
     * - *.svg, *.png, *.jpg, *.jpeg, *.gif, *.webp (image files)
     * - *.ico (icon files)
     * - *.json (JSON files in public directory)
     * - *.html (HTML files in public directory)
     */
    '/((?!api/|_next/static|_next/image|_next/data|favicon\\.ico|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|html)$).*)',
  ],
};
