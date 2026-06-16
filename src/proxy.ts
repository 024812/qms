import { auth } from '@/auth';
import { routing } from '@/i18n/routing';
import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';

const handleI18nRouting = createMiddleware(routing);

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/AGENT_API.md'
  ) {
    return NextResponse.next();
  }

  const response = handleI18nRouting(req);

  if (response.headers.get('Location')) {
    return response;
  }

  const publicPaths = ['/login', '/register'];
  const pathSegments = pathname.split('/').filter(Boolean);
  const locale = routing.locales.includes(pathSegments[0] as (typeof routing.locales)[number])
    ? pathSegments[0]
    : null;
  const normalizedPathname = locale ? `/${pathSegments.slice(1).join('/')}` || '/' : pathname;
  const localePrefix = locale ? `/${locale}` : '';
  const isPublicPath = publicPaths.some(
    path => normalizedPathname === path || normalizedPathname.startsWith(`${path}/`)
  );
  const session = await auth();

  if (!session && !isPublicPath) {
    const loginUrl = new URL(`${localePrefix}/login`, req.url);
    loginUrl.searchParams.set('callbackUrl', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (session && isPublicPath) {
    return NextResponse.redirect(new URL(localePrefix || '/', req.url));
  }

  if (session && normalizedPathname === '/') {
    const activeModules = session.user?.activeModules || [];

    if (activeModules.length === 1) {
      const destination = new URL(`${localePrefix}/${activeModules[0]}`, req.url);
      destination.search = search;
      return NextResponse.redirect(destination);
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api/|_next/static|_next/image|_next/data|favicon\\.ico|manifest\\.json|AGENT_API\\.md|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|html)$).*)',
  ],
};
