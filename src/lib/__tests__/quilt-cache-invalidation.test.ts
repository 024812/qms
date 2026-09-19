/**
 * Regression tests for quilt cache invalidation timing.
 *
 * Guards the P1-2 fix. `revalidateTag` used to be called from *inside* the three
 * `db.transaction` blocks in `src/lib/data/quilts.ts`. `revalidateTag` does not
 * participate in a transaction rollback, so a transaction that failed after the
 * invalidation left the cache cleared while the data was unchanged.
 *
 * The load-bearing test here is "does not invalidate when the transaction fails" — that
 * is the observable symptom of the old bug. The ordering assertions pin down the
 * contract the helper documents: invalidate only after the commit.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { transactionMock, txMock, revalidateTagMock, events } = vi.hoisted(() => ({
  transactionMock: vi.fn(),
  revalidateTagMock: vi.fn(),
  events: [] as string[],
  txMock: {
    select: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/db', () => ({
  db: {
    transaction: transactionMock,
    select: vi.fn(),
  },
}));

vi.mock('next/cache', () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
  revalidateTag: (...args: unknown[]) => {
    events.push('revalidateTag');
    return revalidateTagMock(...args);
  },
}));

import { usageRecords } from '@/db/schema';
import { deleteQuilt, saveQuilt } from '@/lib/data/quilts';

const storedQuilt = {
  id: 'q-1',
  itemNumber: 1,
  groupId: null,
  name: 'Stored Quilt',
  season: 'WINTER',
  lengthCm: 200,
  widthCm: 150,
  weightGrams: 2000,
  fillMaterial: 'Down',
  materialDetails: null,
  color: 'White',
  brand: null,
  purchaseDate: null,
  location: 'Bedroom',
  packagingInfo: null,
  currentStatus: 'STORAGE',
  notes: null,
  imageUrl: null,
  thumbnailUrl: null,
  mainImage: null,
  attachmentImages: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const updatedQuilt = {
  ...storedQuilt,
  season: 'SUMMER',
  weightGrams: 800,
  currentStatus: 'IN_USE',
};

/**
 * Minimal stand-in for a Drizzle select chain.
 *
 * The DAL terminates reads differently depending on the call site:
 * `.where(...)` alone (awaited directly) or `.where(...).limit(1).for('update')`.
 * The chain is therefore both thenable and carries `limit`/`for`, so every
 * shape resolves to `rows`.
 */
function selectChain(rows: unknown[]) {
  const settled = Promise.resolve(rows);
  const chain = {
    limit: () => chain,
    for: () => settled,
    then: settled.then.bind(settled),
    catch: settled.catch.bind(settled),
    finally: settled.finally.bind(settled),
  };

  return { from: () => ({ where: () => chain }) };
}

const invalidatedTags = () => revalidateTagMock.mock.calls.map(call => call[0] as string);

describe('quilt cache invalidation timing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    events.length = 0;

    transactionMock.mockImplementation(async (callback: (tx: unknown) => unknown) => {
      events.push('tx-start');
      const result = await callback(txMock);
      events.push('tx-end');
      return result;
    });

    // `tx.select()` with no projection is the "load current row" query; with a
    // projection it is the active-usage-record count check.
    txMock.select.mockImplementation((selection?: unknown) =>
      selection ? selectChain([{ count: 0 }]) : selectChain([storedQuilt])
    );

    // Distinguish the quilt update from the usage-record update by table identity.
    txMock.update.mockImplementation((table: unknown) =>
      table === usageRecords
        ? {
            set: () => ({
              where: () => ({
                returning: () =>
                  Promise.resolve([
                    {
                      id: 'usage-1',
                      quiltId: 'q-1',
                      startDate: new Date('2026-01-01'),
                      endDate: new Date('2026-02-01'),
                    },
                  ]),
              }),
            }),
          }
        : {
            set: () => ({
              where: () => ({ returning: () => Promise.resolve([updatedQuilt]) }),
            }),
          }
    );

    txMock.insert.mockReturnValue({
      values: () => ({
        returning: () =>
          Promise.resolve([
            {
              id: 'usage-2',
              quiltId: 'q-1',
              startDate: new Date('2026-02-01'),
              endDate: null,
            },
          ]),
      }),
    });

    txMock.delete.mockReturnValue({ where: () => Promise.resolve() });
  });

  it('does not invalidate any cache when the transaction fails', async () => {
    // The quilt update itself fails, after the transaction has already begun.
    txMock.update.mockImplementation(() => ({
      set: () => ({
        where: () => ({
          returning: () => Promise.reject(new Error('update failed')),
        }),
      }),
    }));

    await expect(saveQuilt({ id: 'q-1', season: 'SUMMER', weightGrams: 800 })).rejects.toThrow(
      'update failed'
    );

    // This is the regression: the old code had already cleared these tags by now.
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  it('invalidates only after the update transaction has committed', async () => {
    await saveQuilt({ id: 'q-1', season: 'SUMMER', weightGrams: 800 });

    const commitIndex = events.indexOf('tx-end');
    expect(commitIndex).toBeGreaterThanOrEqual(0);
    expect(events.indexOf('revalidateTag')).toBeGreaterThan(commitIndex);
  });

  it('invalidates the previous and the new status and season slices', async () => {
    // STORAGE/WINTER -> IN_USE/SUMMER. Both sides must be cleared, otherwise a cached
    // list filtered by the old status or season would keep serving a stale row.
    await saveQuilt({ id: 'q-1', season: 'SUMMER', weightGrams: 800 });

    const tags = invalidatedTags();
    expect(tags).toContain('quilts:status:STORAGE');
    expect(tags).toContain('quilts:status:IN_USE');
    expect(tags).toContain('quilts:season:WINTER');
    expect(tags).toContain('quilts:season:SUMMER');
  });

  it('invalidates the module root, the list, the item and the dashboard stats', async () => {
    await saveQuilt({ id: 'q-1', season: 'SUMMER', weightGrams: 800 });

    const tags = invalidatedTags();
    expect(tags).toContain('quilts');
    expect(tags).toContain('quilts:list');
    expect(tags).toContain('quilts:item:q-1');
    expect(tags).toContain('stats');
    expect(tags).toContain('stats:dashboard:main');
  });

  it('always uses the durable "max" revalidation', async () => {
    await saveQuilt({ id: 'q-1', season: 'SUMMER', weightGrams: 800 });

    expect(revalidateTagMock.mock.calls.length).toBeGreaterThan(0);
    expect(revalidateTagMock.mock.calls.every(call => call[1] === 'max')).toBe(true);
  });

  it('invalidates after the create transaction commits', async () => {
    transactionMock.mockImplementation(async (callback: (tx: unknown) => unknown) => {
      events.push('tx-start');
      const result = await callback(txMock);
      events.push('tx-end');
      return result;
    });

    txMock.insert.mockReturnValue({
      values: () => ({ returning: () => Promise.resolve([storedQuilt]) }),
    });

    await saveQuilt({
      season: 'WINTER',
      lengthCm: 200,
      widthCm: 150,
      weightGrams: 2000,
      fillMaterial: 'Down',
      color: 'White',
      location: 'Bedroom',
    });

    expect(events.indexOf('revalidateTag')).toBeGreaterThan(events.indexOf('tx-end'));
    expect(invalidatedTags()).toContain('quilts:item:q-1');
  });

  it('invalidates after the delete transaction commits', async () => {
    // `deleteQuilt` loads the row first through the cached `getQuiltById` read, then
    // deletes in a transaction.
    const { db } = await import('@/db');
    (db.select as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      from: () => ({ where: () => Promise.resolve([storedQuilt]) }),
    });

    await deleteQuilt('q-1');

    expect(events.indexOf('revalidateTag')).toBeGreaterThan(events.indexOf('tx-end'));
    expect(invalidatedTags()).toContain('quilts:item:q-1');
  });

  it('does not invalidate when deleting a quilt that does not exist', async () => {
    const { db } = await import('@/db');
    (db.select as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      from: () => ({ where: () => Promise.resolve([]) }),
    });

    await expect(deleteQuilt('missing')).resolves.toBe(false);
    expect(revalidateTagMock).not.toHaveBeenCalled();
    expect(txMock.delete).not.toHaveBeenCalled();
  });
});
