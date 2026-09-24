import { describe, expect, it, vi } from 'vitest';

const { transaction, from } = vi.hoisted(() => ({ transaction: vi.fn(), from: vi.fn() }));
vi.mock('@/db', async importOriginal => ({
  ...(await importOriginal<typeof import('@/db')>()),
  db: { transaction },
}));
vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn(), revalidateTag: vi.fn() }));

import { getExportData } from '@/lib/data/settings';

describe('settings export', () => {
  it('exports records beyond the list page size using a consistent snapshot', async () => {
    const quilts = Array.from({ length: 25 }, (_, id) => ({ id }));
    const usage = Array.from({ length: 60 }, (_, id) => ({ id }));
    from.mockResolvedValueOnce(quilts).mockResolvedValueOnce(usage);
    transaction.mockImplementation(async callback => callback({ select: () => ({ from }) }));

    const result = await getExportData();
    expect(result.quilts).toEqual(quilts);
    expect(result.usageRecords).toEqual(usage);
    expect(transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'repeatable read',
      accessMode: 'read only',
    });
  });
});
