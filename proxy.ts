/**
 * Next.js 16 Proxy API
 *
 * This proxy handles:
 * - Authentication checks for protected routes
 * - Redirect logic for authenticated/unauthenticated users
 * - Dashboard routing based on user's active modules
 * - Content Security Policy with nonce generation
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
 * - Generate CSP nonce for enhanced security
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Generate nonce for CSP
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const isDev = process.env.NODE_ENV === 'development';

  // Content Security Policy with nonce
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${isDev ? "'unsafe-eval'" : ''};
    style-src 'self' ${isDev ? "'unsafe-inline'" : `'nonce-${nonce}'`};
    img-src 'self' blob: data:;
    font-src 'self';
    connect-src 'self' ${isDev ? 'ws: wss:' : ''};
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `
    .replace(/\s{2,}/g, ' ')
    .trim();

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

  // Set CSP header with nonce
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set('Content-Security-Policy', cspHeader);

  return response;
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
