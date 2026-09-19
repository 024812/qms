/**
 * Regression tests for the unified DAL delete contract.
 *
 * Before this change the collection modules disagreed: `deleteQuilt` resolved to
 * `false` for a missing row, while `deleteAntique` / `deleteMap` /
 * `deleteSpirit` / `deleteCard` threw. Callers therefore had to know which
 * convention each module used, and a caller that assumed the wrong one turned a
 * benign "already deleted" into a 500.
 *
 * The contract asserted here is: a delete resolves to `true` when a row was
 * removed and `false` when there was nothing to remove. "Not found" is never an
 * exception — only a genuine failure is.
 *
 * The `RecordNotFoundError` / `ConflictError` cases are covered in the same file
 * because they exist for the same reason: callers must be able to branch on the
 * error *type*. Matching on `error.message` was the previous approach and it
 * silently broke whenever a DAL message was reworded.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { transactionMock, txMock } = vi.hoisted(() => ({
  transactionMock: vi.fn(),
  txMock: { select: vi.fn(), update: vi.fn(), insert: vi.fn(), delete: vi.fn() },
}));

vi.mock('@/db', () => ({
  db: {
    transaction: transactionMock,
    select: vi.fn(),
    delete: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('next/cache', () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
  revalidateTag: vi.fn(),
}));

import { db } from '@/db';
import { deleteAntique } from '@/lib/data/antiques';
import { deleteCard } from '@/lib/data/cards';
import { ConflictError, RecordNotFoundError } from '@/lib/data/errors';
import { deleteMap } from '@/lib/data/maps';
import { deleteSpirit } from '@/lib/data/spirits';

/**
 * Minimal stand-in for a Drizzle select chain. The DAL terminates reads either
 * by awaiting `.where(...)` or by chaining `.limit(1).for('update')`, so the
 * chain is both thenable and carries those two methods.
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

const txDeleteWhere = vi.fn(() => Promise.resolve());

describe('DAL delete contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    transactionMock.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback(txMock)
    );
    txMock.delete.mockReturnValue({ where: txDeleteWhere });
  });

  // `antiques`, `maps` and `spirits` share one shape: lock the row inside a
  // transaction, delete it, then invalidate the slices it belonged to.
  const transactionalDeletes = [
    {
      name: 'deleteAntique',
      remove: deleteAntique,
      row: { id: 'row-1', status: 'COLLECTION', category: 'JADE' },
    },
    {
      name: 'deleteMap',
      remove: deleteMap,
      row: { id: 'row-1', status: 'COLLECTION', mapType: 'CITY' },
    },
    {
      name: 'deleteSpirit',
      remove: deleteSpirit,
      row: { id: 'row-1', status: 'COLLECTION', spiritType: 'WHISKY', bottleStatus: 'SEALED' },
    },
  ] as const;

  for (const { name, remove, row } of transactionalDeletes) {
    describe(name, () => {
      it('resolves to true and deletes the row when it exists', async () => {
        txMock.select.mockReturnValue(selectChain([row]));

        await expect(remove('row-1')).resolves.toBe(true);
        expect(txDeleteWhere).toHaveBeenCalledOnce();
      });

      it('resolves to false instead of throwing when the row is missing', async () => {
        txMock.select.mockReturnValue(selectChain([]));

        await expect(remove('missing')).resolves.toBe(false);
        expect(txDeleteWhere).not.toHaveBeenCalled();
      });
    });
  }

  describe('deleteCard', () => {
    it('resolves to true when the delete removed a row', async () => {
      // `findCardRecordById` returns null here, so the cache invalidation takes
      // the id-only branch and no full card row is required.
      (db.select as unknown as ReturnType<typeof vi.fn>).mockReturnValue(selectChain([]));
      (db.delete as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        where: () => ({ returning: () => Promise.resolve([{ id: 'card-1' }]) }),
      });

      await expect(deleteCard('card-1')).resolves.toBe(true);
    });

    it('resolves to false instead of throwing when no row was removed', async () => {
      (db.select as unknown as ReturnType<typeof vi.fn>).mockReturnValue(selectChain([]));
      (db.delete as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        where: () => ({ returning: () => Promise.resolve([]) }),
      });

      await expect(deleteCard('missing')).resolves.toBe(false);
    });
  });
});

describe('DAL error types', () => {
  it('describes a missing record with its resource and id', () => {
    const error = new RecordNotFoundError('Paddle', 'p-1');

    expect(error).toBeInstanceOf(RecordNotFoundError);
    expect(error.name).toBe('RecordNotFoundError');
    expect(error.resource).toBe('Paddle');
    expect(error.message).toBe('Paddle p-1 not found');
  });

  it('omits the id when none was supplied', () => {
    expect(new RecordNotFoundError('Paddle').message).toBe('Paddle not found');
  });

  it('carries the resource on a conflict', () => {
    const error = new ConflictError('Quilt', 'Quilt already has an active usage record');

    expect(error).toBeInstanceOf(ConflictError);
    expect(error.name).toBe('ConflictError');
    expect(error.resource).toBe('Quilt');
    expect(error.message).toBe('Quilt already has an active usage record');
  });

  it('is distinguishable from a plain Error carrying the same message', () => {
    // This is the regression the typed errors were introduced for: the old
    // `error.message === 'Paddle not found'` check could not tell a deliberate
    // not-found from an unrelated failure that happened to say the same thing.
    const plain = new Error('Paddle p-1 not found');

    expect(plain).not.toBeInstanceOf(RecordNotFoundError);
    expect(new RecordNotFoundError('Paddle', 'p-1')).not.toBeInstanceOf(ConflictError);
  });
});
