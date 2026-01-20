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
  // Check BEFORE auth() call for better performance
  const isStaticAsset = pathname.startsWith('/_next') || pathname.startsWith('/api');
  if (isStaticAsset) {
    return NextResponse.next();
  }

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/register'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // Get authentication state (only for application routes)
  const session = await auth();

  // Unauthenticated user trying to access protected route
  if (!session && !isPublicPath) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user trying to access login/register page
  if (session && isPublicPath) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Dashboard redirect logic for authenticated users
  if (session && pathname === '/') {
    const activeModules = (session.user?.activeModules as string[]) || [];

    // Single module user: redirect directly to module page
    if (activeModules.length === 1) {
      return NextResponse.redirect(new URL(`/${activeModules[0]}`, req.url));
    }

    // Multiple modules or no modules: show module selector (stay on /)
    // This will be handled by the page component
  }

  return NextResponse.next();
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
