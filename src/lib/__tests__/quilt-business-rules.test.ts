/**
 * Regression tests for quilt cross-field business rules.
 *
 * These guard the P2-2 fix. Before it, `createQuiltSchema` carried the
 * season/weight and aspect-ratio rules while `updateQuiltSchema` carried none, so a
 * record could be created legally and then PATCHed into a state that create itself
 * would have rejected.
 *
 * The fix has two halves and both are covered here:
 *   1. one shared rule function (`collectQuiltBusinessRuleIssues`) used by both schemas;
 *   2. a merged-row check in `saveQuilt`, because a request-level schema can only see
 *      the fields the caller supplied, never the stored row.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { transactionMock, txMock } = vi.hoisted(() => ({
  transactionMock: vi.fn(),
  txMock: {
    select: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
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
  revalidateTag: vi.fn(),
}));

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

import { QuiltBusinessRuleError, saveQuilt } from '@/lib/data/quilts';
import {
  collectQuiltBusinessRuleIssues,
  createQuiltSchema,
  updateQuiltSchema,
} from '@/lib/validations/quilt';

// A payload that satisfies every rule: WINTER wants 1500-5000g, and 200cm >= 150cm * 0.8.
const validCreatePayload = {
  season: 'WINTER' as const,
  lengthCm: 200,
  widthCm: 150,
  weightGrams: 2000,
  fillMaterial: 'Down',
  color: 'White',
  location: 'Bedroom',
};

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

describe('collectQuiltBusinessRuleIssues', () => {
  it('returns no issues for a fully valid record', () => {
    expect(collectQuiltBusinessRuleIssues(validCreatePayload)).toEqual([]);
  });

  it('flags a weight outside the season range', () => {
    // SUMMER allows 200-1200g.
    const issues = collectQuiltBusinessRuleIssues({ season: 'SUMMER', weightGrams: 2000 });

    expect(issues).toHaveLength(1);
    expect(issues[0].path).toEqual(['weightGrams']);
    expect(issues[0].message).toContain('200g and 1200g');
  });

  it('flags an aspect ratio that is too square', () => {
    const issues = collectQuiltBusinessRuleIssues({ lengthCm: 100, widthCm: 300 });

    expect(issues).toHaveLength(1);
    expect(issues[0].path).toEqual(['lengthCm']);
  });

  it('accepts the exact aspect-ratio boundary', () => {
    // 120 >= 150 * 0.8 === 120, so the boundary is inclusive.
    expect(collectQuiltBusinessRuleIssues({ lengthCm: 120, widthCm: 150 })).toEqual([]);
    expect(collectQuiltBusinessRuleIssues({ lengthCm: 119, widthCm: 150 })).toHaveLength(1);
  });

  it('reports both rules when both are violated', () => {
    const issues = collectQuiltBusinessRuleIssues({
      season: 'SUMMER',
      weightGrams: 4000,
      lengthCm: 100,
      widthCm: 300,
    });

    expect(issues.map(issue => issue.path[0]).sort()).toEqual(['lengthCm', 'weightGrams']);
  });

  it('stays silent when a rule cannot be evaluated from the supplied fields', () => {
    // This is what lets the same function serve a partial PATCH payload.
    expect(collectQuiltBusinessRuleIssues({ season: 'SUMMER' })).toEqual([]);
    expect(collectQuiltBusinessRuleIssues({ weightGrams: 2000 })).toEqual([]);
    expect(collectQuiltBusinessRuleIssues({ lengthCm: 100 })).toEqual([]);
    expect(collectQuiltBusinessRuleIssues({})).toEqual([]);
  });
});

describe('createQuiltSchema business rules', () => {
  it('accepts a valid record', () => {
    expect(createQuiltSchema.safeParse(validCreatePayload).success).toBe(true);
  });

  it('rejects a weight that does not match the season', () => {
    const result = createQuiltSchema.safeParse({ ...validCreatePayload, weightGrams: 200 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(issue => issue.path[0] === 'weightGrams')).toBe(true);
    }
  });

  it('rejects an unreasonable aspect ratio', () => {
    const result = createQuiltSchema.safeParse({
      ...validCreatePayload,
      lengthCm: 100,
      widthCm: 300,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(issue => issue.path[0] === 'lengthCm')).toBe(true);
    }
  });
});

describe('updateQuiltSchema business rules', () => {
  it('still accepts an id-only payload', () => {
    // Existing contract relied on by src/lib/__tests__/quilt-id-validation.test.ts.
    expect(updateQuiltSchema.safeParse({ id: 'q-1' }).success).toBe(true);
  });

  it('applies the rules to the fields the patch actually supplies', () => {
    const result = updateQuiltSchema.safeParse({
      id: 'q-1',
      season: 'SUMMER',
      weightGrams: 2000,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(issue => issue.path[0] === 'weightGrams')).toBe(true);
    }
  });

  it('accepts a patch that only changes season', () => {
    // Documented limitation, not a bug: the schema cannot see the stored weight, so it
    // cannot judge this patch. `saveQuilt` closes the gap by checking the merged row —
    // see the tests below.
    expect(updateQuiltSchema.safeParse({ id: 'q-1', season: 'SUMMER' }).success).toBe(true);
  });
});

describe('QuiltBusinessRuleError', () => {
  it('groups issues by field path and is a real Error', () => {
    const error = new QuiltBusinessRuleError([
      { path: ['weightGrams'], message: 'too heavy' },
      { path: ['weightGrams'], message: 'also too heavy' },
      { path: ['lengthCm'], message: 'too square' },
    ]);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('QuiltBusinessRuleError');
    expect(error.fieldErrors).toEqual({
      weightGrams: ['too heavy', 'also too heavy'],
      lengthCm: ['too square'],
    });
  });

  it('falls back to a root key for path-less issues', () => {
    const error = new QuiltBusinessRuleError([{ path: [], message: 'generic' }]);

    expect(error.fieldErrors).toEqual({ root: ['generic'] });
  });
});

describe('saveQuilt merged-row business rules', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    txMock.select.mockReturnValue(selectChain([storedQuilt]));
    txMock.update.mockReturnValue({
      set: () => ({
        where: () => ({ returning: () => Promise.resolve([storedQuilt]) }),
      }),
    });
    transactionMock.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback(txMock)
    );
  });

  it('rejects a patch that only changes season when the stored weight no longer fits', async () => {
    // Stored WINTER/2000g. SUMMER allows 200-1200g, so this must be refused even though
    // the request itself is a valid partial payload.
    await expect(saveQuilt({ id: 'q-1', season: 'SUMMER' })).rejects.toBeInstanceOf(
      QuiltBusinessRuleError
    );

    // Nothing may be written when the rules reject the merged row.
    expect(txMock.update).not.toHaveBeenCalled();
  });

  it('reports the offending field so the Action can return a field-level error', async () => {
    await expect(saveQuilt({ id: 'q-1', season: 'SUMMER' })).rejects.toMatchObject({
      fieldErrors: { weightGrams: [expect.stringContaining('SUMMER')] },
    });
  });

  it('allows the same season change once the weight is patched too', async () => {
    const result = await saveQuilt({ id: 'q-1', season: 'SUMMER', weightGrams: 800 });

    expect(result.quilt.id).toBe('q-1');
    expect(txMock.update).toHaveBeenCalledTimes(1);
  });

  it('rejects a merged row whose aspect ratio becomes invalid', async () => {
    // Stored width is 150cm; 100cm length fails the 0.8 ratio rule.
    await expect(saveQuilt({ id: 'q-1', lengthCm: 100 })).rejects.toBeInstanceOf(
      QuiltBusinessRuleError
    );
    expect(txMock.update).not.toHaveBeenCalled();
  });

  it('does not run the check for a create payload', async () => {
    // Sanity check that the guard is scoped to the update path.
    transactionMock.mockImplementation(async (callback: (tx: unknown) => unknown) => {
      txMock.insert.mockReturnValue({
        values: () => ({ returning: () => Promise.resolve([storedQuilt]) }),
      });
      return callback(txMock);
    });

    await expect(saveQuilt(validCreatePayload)).resolves.toBeDefined();
    expect(txMock.insert).toHaveBeenCalled();
  });
});
