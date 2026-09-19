/**
 * Write-path contracts for the four newer collection modules.
 *
 * `dal-delete-contract.test.ts` covers the *shape* of a delete's return value.
 * This file covers the transactional contract the row lock exists for, which
 * nothing asserted before:
 *
 *   1. A write invalidates caches only **after** its transaction commits.
 *      `revalidateTag` does not participate in rollback, so invalidating inside
 *      the transaction would clear caches for a write that then failed.
 *   2. An update invalidates **both the previous and the new** value of every
 *      dimension slice it touches. The pre-read row decides the "previous"
 *      value, which is exactly why the read-modify-write holds a
 *      `SELECT ... FOR UPDATE` lock — without it two concurrent writes could
 *      each observe the old value and leave a slice stale.
 *   3. A missing row on update is a typed `RecordNotFoundError` (so the Action
 *      layer maps it to 404 instead of 500), and invalidates nothing.
 *
 * The modules are driven from one table because they share the contract; the
 * per-module differences (which dimensions exist, and whether the id is passed
 * separately) are confined to the table entries.
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

/**
 * The error paths below deliberately fail a transaction, and every DAL logs the
 * failure through `dbLogger` before rethrowing. Silencing that keeps the output
 * readable without hiding anything the assertions depend on.
 */
vi.mock('@/lib/logger', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/logger')>()),
  dbLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { db } from '@/db';
import { createAntique, deleteAntique, updateAntique } from '@/lib/data/antiques';
import { RecordNotFoundError } from '@/lib/data/errors';
import { createMap, deleteMap, updateMap } from '@/lib/data/maps';
import { createPaddle, deletePaddle, updatePaddle } from '@/lib/data/paddles';
import { createSpirit, deleteSpirit, updateSpirit } from '@/lib/data/spirits';
import {
  antiquesCacheTags,
  mapsCacheTags,
  paddlesCacheTags,
  spiritsCacheTags,
} from '@/modules/core/cache-tags';

/**
 * Minimal stand-in for a Drizzle select chain. The DALs terminate reads either
 * by awaiting `.where(...)`, by chaining `.limit(1).for('update')` (the row
 * lock), or by destructuring the awaited result — so the chain is thenable and
 * carries both methods.
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

/** `.update(table).set(values).where(...).returning()` */
function updateChain(rows: unknown[]) {
  return { set: () => ({ where: () => ({ returning: () => Promise.resolve(rows) }) }) };
}

/** `.insert(table).values(data).returning()` */
function insertChain(rows: unknown[]) {
  return { values: () => ({ returning: () => Promise.resolve(rows) }) };
}

/** Every tag passed to `revalidateTag`, in call order. */
function invalidatedTags(): string[] {
  return revalidateTagMock.mock.calls.map(([tag]) => tag as string);
}

const modules = [
  {
    name: 'maps',
    tags: mapsCacheTags,
    previous: { id: 'row-1', status: 'COLLECTION', mapType: 'CITY' },
    updated: { id: 'row-1', status: 'DISPLAY', mapType: 'HISTORICAL' },
    createRow: { id: 'new-1', status: 'COLLECTION', mapType: 'CITY' },
    callUpdate: () => updateMap({ id: 'row-1' }),
    callCreate: () => createMap({ name: 'New map', mapType: 'CITY' }),
    callDelete: () => deleteMap('row-1'),
    // Both the pre-read and the post-write value of each dimension.
    changedSlices: [
      ['status', 'COLLECTION'],
      ['status', 'DISPLAY'],
      ['mapType', 'CITY'],
      ['mapType', 'HISTORICAL'],
    ],
    createdSlices: [
      ['status', 'COLLECTION'],
      ['mapType', 'CITY'],
    ],
  },
  {
    name: 'antiques',
    tags: antiquesCacheTags,
    previous: { id: 'row-1', status: 'COLLECTION', category: 'JADE' },
    updated: { id: 'row-1', status: 'APPRAISAL', category: 'CERAMIC' },
    createRow: { id: 'new-1', status: 'COLLECTION', category: 'JADE' },
    callUpdate: () => updateAntique({ id: 'row-1' }),
    callCreate: () => createAntique({ name: 'New antique', category: 'JADE' }),
    callDelete: () => deleteAntique('row-1'),
    changedSlices: [
      ['status', 'COLLECTION'],
      ['status', 'APPRAISAL'],
      ['category', 'JADE'],
      ['category', 'CERAMIC'],
    ],
    createdSlices: [
      ['status', 'COLLECTION'],
      ['category', 'JADE'],
    ],
  },
  {
    name: 'paddles',
    tags: paddlesCacheTags,
    previous: { id: 'row-1', status: 'ACTIVE' },
    updated: { id: 'row-1', status: 'RETIRED' },
    createRow: { id: 'new-1', status: 'ACTIVE' },
    callUpdate: () => updatePaddle('row-1', {}),
    callCreate: () => createPaddle({ name: 'New paddle' }),
    callDelete: () => deletePaddle('row-1'),
    changedSlices: [
      ['status', 'ACTIVE'],
      ['status', 'RETIRED'],
    ],
    createdSlices: [['status', 'ACTIVE']],
  },
  {
    name: 'spirits',
    tags: spiritsCacheTags,
    previous: { id: 'row-1', status: 'COLLECTION', spiritType: 'WHISKY', bottleStatus: 'SEALED' },
    updated: { id: 'row-1', status: 'AGING', spiritType: 'COGNAC', bottleStatus: 'OPENED' },
    createRow: { id: 'new-1', status: 'COLLECTION', spiritType: 'WHISKY', bottleStatus: 'SEALED' },
    callUpdate: () => updateSpirit('row-1', {}),
    callCreate: () => createSpirit({ name: 'New spirit', spiritType: 'WHISKY' }),
    callDelete: () => deleteSpirit('row-1'),
    changedSlices: [
      ['status', 'COLLECTION'],
      ['status', 'AGING'],
      ['spiritType', 'WHISKY'],
      ['spiritType', 'COGNAC'],
      ['bottleStatus', 'SEALED'],
      ['bottleStatus', 'OPENED'],
    ],
    createdSlices: [
      ['status', 'COLLECTION'],
      ['spiritType', 'WHISKY'],
      ['bottleStatus', 'SEALED'],
    ],
  },
];

describe('new-module DAL write contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    transactionMock.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback(txMock)
    );
  });

  for (const entry of modules) {
    describe(entry.name, () => {
      it('invalidates root, list and item after a successful update', async () => {
        txMock.select.mockReturnValue(selectChain([entry.previous]));
        txMock.update.mockReturnValue(updateChain([entry.updated]));

        await entry.callUpdate();

        expect(revalidateTagMock).toHaveBeenCalledWith(entry.tags.root, 'max');
        expect(revalidateTagMock).toHaveBeenCalledWith(entry.tags.list, 'max');
        expect(revalidateTagMock).toHaveBeenCalledWith(entry.tags.item('row-1'), 'max');
      });

      it('invalidates the previous and the new value of every changed dimension', async () => {
        txMock.select.mockReturnValue(selectChain([entry.previous]));
        txMock.update.mockReturnValue(updateChain([entry.updated]));

        await entry.callUpdate();

        const tags = invalidatedTags();
        for (const [dimension, value] of entry.changedSlices) {
          expect(tags, `${dimension}=${value}`).toContain(entry.tags.slice(dimension, value));
        }
      });

      it('reports a missing row as a typed RecordNotFoundError and invalidates nothing', async () => {
        txMock.select.mockReturnValue(selectChain([]));

        await expect(entry.callUpdate()).rejects.toBeInstanceOf(RecordNotFoundError);
        expect(revalidateTagMock).not.toHaveBeenCalled();
      });

      it('invalidates nothing when the update transaction fails', async () => {
        // The regression the post-commit helper exists for: invalidating inside
        // the transaction would clear caches for a write that never landed.
        transactionMock.mockRejectedValueOnce(new Error('connection lost'));

        await expect(entry.callUpdate()).rejects.toThrow('connection lost');
        expect(revalidateTagMock).not.toHaveBeenCalled();
      });

      it('invalidates nothing when the delete transaction fails', async () => {
        transactionMock.mockRejectedValueOnce(new Error('connection lost'));

        await expect(entry.callDelete()).rejects.toThrow('connection lost');
        expect(revalidateTagMock).not.toHaveBeenCalled();
      });

      it('invalidates root, list and the created dimension slices on create', async () => {
        (db.insert as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
          insertChain([entry.createRow])
        );

        await entry.callCreate();

        const tags = invalidatedTags();
        expect(tags).toContain(entry.tags.root);
        expect(tags).toContain(entry.tags.list);
        for (const [dimension, value] of entry.createdSlices) {
          expect(tags, `${dimension}=${value}`).toContain(entry.tags.slice(dimension, value));
        }
      });
    });
  }
});
