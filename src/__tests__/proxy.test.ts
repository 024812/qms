import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { proxy } from '../../proxy';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/i18n/routing', () => ({
  routing: {
    locales: ['zh', 'en'],
    defaultLocale: 'zh',
  },
}));

vi.mock('next-intl/middleware', async () => {
  const { NextResponse } = await import('next/server');

  return {
    default: () => {
      return (request: NextRequest) => {
        const { pathname, search } = request.nextUrl;
        const hasLocalePrefix =
          pathname === '/zh' ||
          pathname === '/en' ||
          pathname.startsWith('/zh/') ||
          pathname.startsWith('/en/');

        if (!hasLocalePrefix) {
          return NextResponse.redirect(new URL(`/zh${pathname}${search}`, request.url));
        }

        return NextResponse.next();
      };
    },
  };
});

describe('proxy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects unauthenticated localized protected routes to localized login', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const response = await proxy(new NextRequest('http://localhost:3000/zh/quilts'));

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/zh/login');
    expect(response.headers.get('location')).toContain('callbackUrl=%2Fzh%2Fquilts');
  });

  it('preserves locale and query string in callbackUrl', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const response = await proxy(
      new NextRequest('http://localhost:3000/zh/quilts?status=active&season=winter')
    );

    expect(response.headers.get('location')).toContain('/zh/login');
    expect(response.headers.get('location')).toContain(
      'callbackUrl=%2Fzh%2Fquilts%3Fstatus%3Dactive%26season%3Dwinter'
    );
  });

  it('redirects authenticated users away from localized public routes', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'admin',
        activeModules: ['quilts'],
      },
      expires: new Date(Date.now() + 3600_000).toISOString(),
    });

    const response = await proxy(new NextRequest('http://localhost:3000/zh/login'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/zh');
  });

  it('redirects single-module users from localized root to the same locale module path', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'member@example.com',
        name: 'Member',
        role: 'member',
        activeModules: ['quilts'],
      },
      expires: new Date(Date.now() + 3600_000).toISOString(),
    });

    const response = await proxy(new NextRequest('http://localhost:3000/zh'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/zh/quilts');
  });

  it('lets multi-module users stay on the localized root', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'member@example.com',
        name: 'Member',
        role: 'member',
        activeModules: ['quilts', 'cards'],
      },
      expires: new Date(Date.now() + 3600_000).toISOString(),
    });

    const response = await proxy(new NextRequest('http://localhost:3000/zh'));

    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('returns the i18n redirect before auth for bare application paths', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const response = await proxy(new NextRequest('http://localhost:3000/quilts'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/zh/quilts');
    expect(auth).not.toHaveBeenCalled();
  });

  it('skips auth for static assets', async () => {
    const response = await proxy(
      new NextRequest('http://localhost:3000/_next/static/chunks/main.js')
    );

    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(auth).not.toHaveBeenCalled();
  });

  it('skips auth for api routes', async () => {
    const response = await proxy(new NextRequest('http://localhost:3000/api/users'));

    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(auth).not.toHaveBeenCalled();
  });

  it('surfaces auth failures instead of swallowing them', async () => {
    vi.mocked(auth).mockRejectedValue(new Error('Auth unavailable'));

    await expect(proxy(new NextRequest('http://localhost:3000/zh/quilts'))).rejects.toThrow(
      'Auth unavailable'
    );
  });
});
