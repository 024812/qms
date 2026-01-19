/**
 * Next.js Middleware with Auth.js v5
 * 
 * This middleware handles:
 * - Authentication checks for protected routes
 * - Redirect logic for authenticated/unauthenticated users
 * - Dashboard routing based on user's active modules
 * 
 * Requirements: 8.1, 8.3 (Route protection and authentication)
 */

import { auth } from '@/auth';
import { NextResponse } from 'next/server';

/**
 * Middleware function
 * 
 * Best practices:
 * - Use auth() as middleware wrapper
 * - Access req.auth for authentication state
 * - Use matcher to exclude static resources
 * - Implement module-based redirect logic
 */
export default auth((req) => {
  const { auth } = req;
  const { pathname } = req.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/register'];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Static assets and API routes (handled separately)
  const isStaticAsset = pathname.startsWith('/_next') || pathname.startsWith('/api');
  if (isStaticAsset) {
    return NextResponse.next();
  }

  // Unauthenticated user trying to access protected route
  if (!auth && !isPublicPath) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user trying to access login/register page
  if (auth && isPublicPath) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Dashboard redirect logic for authenticated users
  if (auth && pathname === '/') {
    const activeModules = (auth.user?.activeModules as string[]) || [];

    // Single module user: redirect directly to module page
    if (activeModules.length === 1) {
      return NextResponse.redirect(new URL(`/${activeModules[0]}`, req.url));
    }

    // Multiple modules or no modules: show module selector (stay on /)
    // This will be handled by the page component
  }

  return NextResponse.next();
});

/**
 * Matcher configuration
 * Excludes static assets, API routes, and Next.js internals
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, icons, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
