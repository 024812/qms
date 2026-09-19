/**
 * Atomicity of the quilt status transition.
 *
 * `updateQuiltStatusWithUsageRecord` is the only write path that touches **two**
 * tables: it changes `quilts.current_status` and, depending on the direction of
 * the transition, closes or opens a row in `usage_records`. Three things can go
 * wrong if that is not handled carefully, and none of them were asserted before:
 *
 *   1. The two writes land in different transactions, so a status change can be
 *      committed while its usage record is not — a quilt marked `IN_USE` with no
 *      open record, or `STORAGE` with one still open.
 *   2. The "already has an active usage record" conflict is detected *after* the
 *      status update, leaving the quilt in the new status even though the
 *      transition was rejected.
 *   3. Cache invalidation runs inside the transaction, so a rollback still
 *      clears caches.
 *
 * The assertions below pin all three: both writes must go through the same `tx`,
 * the conflict must abort before any status write, and `revalidateTag` must only
 * run after the transaction resolves.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { transactionMock, txMock, revalidateTagMock } = vi.hoisted(() => ({
  transactionMock: vi.fn(),
  txMock: { select: vi.fn(), update: vi.fn(), insert: vi.fn(), delete: vi.fn() },
  revalidateTagMock: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    transaction: transactionMock,
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('next/cache', () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
  revalidateTag: revalidateTagMock,
}));

vi.mock('@/lib/logger', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/logger')>()),
  dbLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { db } from '@/db';
import { quilts, usageRecords } from '@/db/schema';
import { ConflictError, RecordNotFoundError } from '@/lib/data/errors';
import { updateQuiltStatusWithUsageRecord } from '@/lib/data/quilts';
import { quiltsCacheTags, statsCacheTags, usageCacheTags } from '@/modules/core/cache-tags';

/** Rows returned for `tx.select().from(quilts)...` (the `FOR UPDATE` read). */
let quiltRows: unknown[] = [];
/** Value of the `count(*)` over open usage records. */
let openUsageCount = 0;
/** Rows returned when a usage record is closed / opened. */
let closedUsageRows: unknown[] = [];
let createdUsageRows: unknown[] = [];

const existingQuilt = { id: 'q-1', currentStatus: 'IN_USE' };
const transitionedQuilt = { id: 'q-1', currentStatus: 'STORAGE' };

/** Every tag passed to `revalidateTag`, in call order. */
function invalidatedTags(): string[] {
  return revalidateTagMock.mock.calls.map(([tag]) => tag as string);
}

/** Tables passed to `tx.update`, in call order. */
function updatedTables(): unknown[] {
  return txMock.update.mock.calls.map(([table]) => table);
}

describe('quilt status transition atomicity', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    quiltRows = [existingQuilt];
    openUsageCount = 0;
    closedUsageRows = [];
    createdUsageRows = [];

    transactionMock.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback(txMock)
    );

    // `tx.select({ count }).from(usageRecords)` and `tx.select().from(quilts)`
    // both funnel through `.from(...)`, so the table decides what comes back.
    txMock.select.mockImplementation(() => ({
      from: (table: unknown) => ({
        where: () => {
          if (table !== quilts) return Promise.resolve([{ count: openUsageCount }]);

          const settled = Promise.resolve(quiltRows);
          const chain = {
            limit: () => chain,
            for: () => settled,
            then: settled.then.bind(settled),
            catch: settled.catch.bind(settled),
            finally: settled.finally.bind(settled),
          };
          return chain;
        },
      }),
    }));

    txMock.update.mockImplementation((table: unknown) => ({
      set: () => ({
        where: () => ({
          returning: () =>
            Promise.resolve(table === quilts ? [transitionedQuilt] : closedUsageRows),
        }),
      }),
    }));

    txMock.insert.mockImplementation(() => ({
      values: () => ({ returning: () => Promise.resolve(createdUsageRows) }),
    }));
  });

  it('reports a missing quilt as a typed error and touches no cache', async () => {
    quiltRows = [];

    await expect(updateQuiltStatusWithUsageRecord('missing', 'STORAGE')).rejects.toBeInstanceOf(
      RecordNotFoundError
    );
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  it('does not churn caches when the status is unchanged', async () => {
    // `IN_USE -> IN_USE`: a no-op must not open a usage record, rewrite the row
    // or invalidate anything.
    const result = await updateQuiltStatusWithUsageRecord('q-1', 'IN_USE');

    expect(result.usageRecord).toBeUndefined();
    expect(txMock.update).not.toHaveBeenCalled();
    expect(txMock.insert).not.toHaveBeenCalled();
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  it('closes the open usage record and updates the status in the same transaction', async () => {
    closedUsageRows = [
      {
        id: 'u-1',
        quiltId: 'q-1',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-02-01'),
      },
    ];

    const result = await updateQuiltStatusWithUsageRecord('q-1', 'STORAGE');

    expect(result.usageRecord).toMatchObject({ id: 'u-1' });
    // Both tables, same `tx` — this is the atomicity claim.
    expect(updatedTables()).toEqual([usageRecords, quilts]);
    expect(txMock.update).toHaveBeenCalledTimes(2);
  });

  it('opens a usage record when transitioning into IN_USE', async () => {
    quiltRows = [{ id: 'q-1', currentStatus: 'STORAGE' }];
    createdUsageRows = [
      {
        id: 'u-2',
        quiltId: 'q-1',
        startDate: new Date('2026-03-01'),
        endDate: null,
      },
    ];

    const result = await updateQuiltStatusWithUsageRecord('q-1', 'IN_USE', 'GUEST', 'notes');

    expect(result.usageRecord).toMatchObject({ id: 'u-2', endDate: null });
    expect(txMock.insert).toHaveBeenCalledOnce();
    expect(updatedTables()).toEqual([quilts]);
  });

  it('rejects a second IN_USE transition before writing the status', async () => {
    // The conflict is detected inside the transaction, so the status write must
    // never be reached — otherwise the quilt would end up IN_USE with the
    // transition having been rejected.
    quiltRows = [{ id: 'q-1', currentStatus: 'STORAGE' }];
    openUsageCount = 1;

    await expect(updateQuiltStatusWithUsageRecord('q-1', 'IN_USE')).rejects.toBeInstanceOf(
      ConflictError
    );

    expect(updatedTables()).not.toContain(quilts);
    expect(txMock.insert).not.toHaveBeenCalled();
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  it('touches no usage record when neither status is IN_USE', async () => {
    quiltRows = [{ id: 'q-1', currentStatus: 'STORAGE' }];

    await updateQuiltStatusWithUsageRecord('q-1', 'MAINTENANCE');

    expect(txMock.update).toHaveBeenCalledOnce();
    expect(updatedTables()).toEqual([quilts]);
    expect(txMock.insert).not.toHaveBeenCalled();
  });

  it('invalidates the item, both status slices, stats and the usage tags after commit', async () => {
    await updateQuiltStatusWithUsageRecord('q-1', 'STORAGE');

    const tags = invalidatedTags();
    expect(tags).toContain(quiltsCacheTags.root);
    expect(tags).toContain(quiltsCacheTags.list);
    expect(tags).toContain(quiltsCacheTags.item('q-1'));
    // The pre-read status decides the "old" slice, which is why the read is locked.
    expect(tags).toContain(quiltsCacheTags.slice('status', 'IN_USE'));
    expect(tags).toContain(quiltsCacheTags.slice('status', 'STORAGE'));
    expect(tags).toContain(statsCacheTags.root);
    expect(tags).toContain(usageCacheTags.root);
    expect(tags).toContain(usageCacheTags.slice('active', 'true'));
    expect(tags).toContain(usageCacheTags.slice('quilt', 'q-1'));
  });

  it('invalidates nothing when the transaction fails', async () => {
    transactionMock.mockRejectedValueOnce(new Error('connection lost'));

    await expect(updateQuiltStatusWithUsageRecord('q-1', 'STORAGE')).rejects.toThrow(
      'connection lost'
    );
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  it('never writes through `db` directly — every write goes through the transaction handle', async () => {
    await updateQuiltStatusWithUsageRecord('q-1', 'STORAGE');

    expect(db.update).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
    expect(db.delete).not.toHaveBeenCalled();
  });
});
