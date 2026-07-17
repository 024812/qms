import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const dataMocks = vi.hoisted(() => ({
  createUsageRecord: vi.fn(),
  deleteUsageRecord: vi.fn(),
  getUsageRecordById: vi.fn(),
  getUsageRecordsWithQuilts: vi.fn(),
  updateUsageRecord: vi.fn(),
}));

vi.mock('@/lib/api/route-auth', () => ({
  requireApiSession: vi.fn(async () => ({
    ok: true,
    session: { user: { id: 'user-1' } },
  })),
}));

vi.mock('@/lib/data/usage', () => dataMocks);

import { POST as createUsage } from '@/app/api/usage/route';
import { PUT as updateUsage } from '@/app/api/usage/[id]/route';

function jsonRequest(url: string, body: unknown) {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('usage compatibility API validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects invalid dates before calling the data layer', async () => {
    const response = await createUsage(
      jsonRequest('http://localhost/api/usage', {
        quiltId: 'quilt-1',
        startDate: 'not-a-date',
      })
    );

    expect(response.status).toBe(400);
    expect(dataMocks.createUsageRecord).not.toHaveBeenCalled();
  });

  it('rejects a create request whose end date precedes its start date', async () => {
    const response = await createUsage(
      jsonRequest('http://localhost/api/usage', {
        quiltId: 'quilt-1',
        startDate: '2026-07-17T00:00:00.000Z',
        endDate: '2026-07-16T00:00:00.000Z',
      })
    );

    expect(response.status).toBe(400);
    expect(dataMocks.createUsageRecord).not.toHaveBeenCalled();
  });

  it('validates partial updates against the stored dates', async () => {
    dataMocks.getUsageRecordById.mockResolvedValue({
      id: 'usage-1',
      quiltId: 'quilt-1',
      startDate: new Date('2026-07-17T00:00:00.000Z'),
      endDate: null,
    });

    const request = jsonRequest('http://localhost/api/usage/usage-1', {
      endDate: '2026-07-16T00:00:00.000Z',
    });
    const response = await updateUsage(request, {
      params: Promise.resolve({ id: 'usage-1' }),
    });

    expect(response.status).toBe(400);
    expect(dataMocks.updateUsageRecord).not.toHaveBeenCalled();
  });
});
