/**
 * Regression tests for Server Page module authorization.
 *
 * Guards the P1-1 fix. `/analytics` and `/reports` used to read module data with no
 * server-side module check at all: `src/proxy.ts` only verifies that a user is signed
 * in, and neither the locale layout nor `ConditionalLayout` checks module subscriptions.
 * An authenticated member without the `quilts` module could therefore read quilt
 * statistics by typing the URL, even though `/api/analytics` enforced
 * `requireApiModule('quilts')`.
 *
 * The load-bearing assertion is that a denied request never reaches the DAL — the guard
 * must run before any data access, not merely hide the result afterwards.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { authMock, dalMocks } = vi.hoisted(() => ({
  authMock: vi.fn(),
  dalMocks: {
    getAnalyticsData: vi.fn(),
    countQuilts: vi.fn(),
    getQuilts: vi.fn(),
    getUsageRecords: vi.fn(),
  },
}));

vi.mock('@/auth', () => ({ auth: authMock }));

vi.mock('@/lib/data/stats', () => ({ getAnalyticsData: dalMocks.getAnalyticsData }));
vi.mock('@/lib/data/quilts', () => ({
  countQuilts: dalMocks.countQuilts,
  getQuilts: dalMocks.getQuilts,
}));
vi.mock('@/lib/data/usage', () => ({ getUsageRecords: dalMocks.getUsageRecords }));

vi.mock('next/server', () => ({ connection: vi.fn().mockResolvedValue(undefined) }));

// The client shells are not under test here; render them as identifiable stubs.
vi.mock('@/app/[locale]/analytics/_components/AnalyticsPageClient', () => ({
  AnalyticsPageClient: (props: Record<string, unknown>) => ({ type: 'AnalyticsClient', props }),
}));
vi.mock('@/app/[locale]/reports/_components/ReportsPageClient', () => ({
  ReportsPageClient: (props: Record<string, unknown>) => ({ type: 'ReportsClient', props }),
}));

import AnalyticsPage from '@/app/[locale]/analytics/page';
import ImportExportPage from '@/app/[locale]/reports/page';

const analyticsData = {
  overview: { totalQuilts: 0, totalUsageRecords: 0 },
  statusDistribution: { inUse: 0, storage: 0, maintenance: 0 },
  seasonDistribution: { WINTER: 0, SPRING_AUTUMN: 0, SUMMER: 0 },
  usageBySeason: {},
  mostUsedQuilts: [],
  usageByYear: [],
  usageByMonth: [],
};

function sessionFor(role: 'admin' | 'member', activeModules: string[]) {
  return {
    user: {
      id: 'user-1',
      name: 'Test',
      email: 'test@example.com',
      role,
      activeModules,
    },
    expires: new Date(Date.now() + 60_000).toISOString(),
  };
}

/**
 * Await a page render that is expected to be refused, and return the thrown value.
 *
 * `requirePageModuleAccess` signals denial with Next's `notFound()`, which throws an
 * error carrying `digest: 'NEXT_HTTP_ERROR_FALLBACK;404'`. Asserting on the digest keeps
 * the test tied to "the page refused to render" rather than to an incidental message.
 */
async function captureRefusal(render: Promise<unknown>): Promise<unknown> {
  try {
    await render;
  } catch (error) {
    return error;
  }

  throw new Error('Expected the page to refuse rendering, but it resolved');
}

function refusalDigest(error: unknown): string {
  return String((error as { digest?: unknown } | null)?.digest ?? '');
}

async function expectRefused(render: Promise<unknown>): Promise<void> {
  const error = await captureRefusal(render);

  expect(refusalDigest(error)).toContain('404');
}

describe('Server Page module authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    dalMocks.getAnalyticsData.mockResolvedValue(analyticsData);
    dalMocks.countQuilts.mockResolvedValue(0);
    dalMocks.getQuilts.mockResolvedValue([]);
    dalMocks.getUsageRecords.mockResolvedValue([]);
  });

  describe('/analytics', () => {
    it('denies a member who does not have the quilts module', async () => {
      authMock.mockResolvedValue(sessionFor('member', ['cards']));

      await expectRefused(AnalyticsPage());
    });

    it('reads no data when access is denied', async () => {
      authMock.mockResolvedValue(sessionFor('member', []));

      await expectRefused(AnalyticsPage());

      expect(dalMocks.getAnalyticsData).not.toHaveBeenCalled();
      expect(dalMocks.countQuilts).not.toHaveBeenCalled();
      expect(dalMocks.getUsageRecords).not.toHaveBeenCalled();
    });

    it('denies an unauthenticated request', async () => {
      authMock.mockResolvedValue(null);

      await expectRefused(AnalyticsPage());
      expect(dalMocks.getAnalyticsData).not.toHaveBeenCalled();
    });

    it('allows a member who has the quilts module', async () => {
      authMock.mockResolvedValue(sessionFor('member', ['quilts']));

      await expect(AnalyticsPage()).resolves.toBeDefined();
      expect(dalMocks.getAnalyticsData).toHaveBeenCalledTimes(1);
    });

    it('allows an administrator regardless of active modules', async () => {
      authMock.mockResolvedValue(sessionFor('admin', []));

      await expect(AnalyticsPage()).resolves.toBeDefined();
      expect(dalMocks.getAnalyticsData).toHaveBeenCalledTimes(1);
    });
  });

  describe('/reports', () => {
    it('denies a member who does not have the quilts module', async () => {
      authMock.mockResolvedValue(sessionFor('member', ['paddles']));

      await expectRefused(ImportExportPage());
    });

    it('allows a member who has the quilts module and passes isAdmin=false', async () => {
      authMock.mockResolvedValue(sessionFor('member', ['quilts']));

      const element = (await ImportExportPage()) as { props: { isAdmin: boolean } };

      expect(element.props.isAdmin).toBe(false);
    });

    it('passes isAdmin=true for an administrator', async () => {
      authMock.mockResolvedValue(sessionFor('admin', ['quilts']));

      const element = (await ImportExportPage()) as { props: { isAdmin: boolean } };

      expect(element.props.isAdmin).toBe(true);
    });
  });
});
