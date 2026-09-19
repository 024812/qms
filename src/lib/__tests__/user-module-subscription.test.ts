/**
 * Regression tests for user module-subscription writes.
 *
 * Guards the P2-3 fix. The previous implementation lived in the Server Action, read
 * `preferences.activeModules`, computed the new array and wrote it back with no
 * transaction — so two concurrent toggles could both read the same starting array and
 * the later write silently discarded the earlier one (a lost subscription). It also
 * used `revalidatePath` instead of the shared cache-tag factory.
 *
 * The tests below assert the three properties that fix depends on:
 *   1. the read happens under a row lock (`SELECT ... FOR UPDATE`);
 *   2. cache invalidation runs after the transaction commits, never inside it;
 *   3. a no-op request neither writes nor invalidates.
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

// No `@/modules/registry` stub is needed: `@/lib/data/users` imports the module-ID
// vocabulary from the leaf `@/modules/module-ids`, which pulls in no UI code. The
// real `normalizeModuleIds` therefore runs here, so these tests genuinely cover the
// normalisation step rather than a stand-in for it.

import { setUserModuleSubscription } from '@/lib/data/users';

/** Configure the mocked transaction to return a user row with the given modules. */
function primeUser(activeModules: string[] | undefined, options?: { missing?: boolean }) {
  const row = options?.missing ? undefined : { preferences: { activeModules } };

  const forMock = vi.fn(() => Promise.resolve(row ? [row] : []));
  const limitMock = vi.fn(() => ({ for: forMock }));
  const whereMock = vi.fn(() => ({ limit: limitMock }));
  const fromMock = vi.fn(() => ({ where: whereMock }));

  txMock.select.mockReturnValue({ from: fromMock });
  txMock.update.mockReturnValue({ set: () => ({ where: () => Promise.resolve() }) });

  return { forMock, limitMock };
}

describe('setUserModuleSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    events.length = 0;

    transactionMock.mockImplementation(async (callback: (tx: unknown) => unknown) => {
      events.push('tx-start');
      const result = await callback(txMock);
      events.push('tx-end');
      return result;
    });
  });

  it('subscribes a module and reports the committed state', async () => {
    primeUser(['quilts']);

    const result = await setUserModuleSubscription('user-1', 'paddles', 'subscribe');

    expect(result).toEqual({
      activeModules: ['quilts', 'paddles'],
      subscribed: true,
      changed: true,
    });
    expect(txMock.update).toHaveBeenCalledTimes(1);
  });

  it('takes a row lock so concurrent toggles cannot lose an update', async () => {
    const { forMock } = primeUser([]);

    await setUserModuleSubscription('user-1', 'maps', 'toggle');

    // Without `FOR UPDATE` two transactions could read the same array and the second
    // write would discard the first.
    expect(forMock).toHaveBeenCalledWith('update');
  });

  it('invalidates caches only after the transaction commits', async () => {
    primeUser([]);

    await setUserModuleSubscription('user-1', 'spirits', 'subscribe');

    const commitIndex = events.indexOf('tx-end');
    const invalidateIndex = events.indexOf('revalidateTag');

    expect(commitIndex).toBeGreaterThanOrEqual(0);
    expect(invalidateIndex).toBeGreaterThan(commitIndex);
  });

  it('invalidates the root, list and item tags', async () => {
    primeUser([]);

    await setUserModuleSubscription('user-1', 'antiques', 'subscribe');

    const tags = revalidateTagMock.mock.calls.map(call => call[0]);
    expect(tags).toContain('users');
    expect(tags).toContain('users:list');
    expect(tags).toContain('users:item:user-1');
    // Every invalidation must be the durable 'max' variant.
    expect(revalidateTagMock.mock.calls.every(call => call[1] === 'max')).toBe(true);
  });

  it('unsubscribes a module', async () => {
    primeUser(['quilts', 'maps']);

    const result = await setUserModuleSubscription('user-1', 'quilts', 'unsubscribe');

    expect(result).toEqual({
      activeModules: ['maps'],
      subscribed: false,
      changed: true,
    });
  });

  it('toggles both directions', async () => {
    primeUser(['quilts']);
    const off = await setUserModuleSubscription('user-1', 'quilts', 'toggle');
    expect(off).toEqual({ activeModules: [], subscribed: false, changed: true });

    vi.clearAllMocks();
    events.length = 0;
    transactionMock.mockImplementation(async (callback: (tx: unknown) => unknown) => {
      events.push('tx-start');
      const result = await callback(txMock);
      events.push('tx-end');
      return result;
    });
    primeUser([]);
    const on = await setUserModuleSubscription('user-1', 'quilts', 'toggle');
    expect(on).toEqual({ activeModules: ['quilts'], subscribed: true, changed: true });
  });

  it('is a no-op when the module is already in the requested state', async () => {
    primeUser(['quilts', 'maps']);

    const result = await setUserModuleSubscription('user-1', 'maps', 'subscribe');

    expect(result).toEqual({
      activeModules: ['quilts', 'maps'],
      subscribed: true,
      changed: false,
    });
    expect(txMock.update).not.toHaveBeenCalled();
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  it('drops module ids that are no longer registered', async () => {
    // A stale value left in preferences must not be carried forward.
    primeUser(['quilts', 'not-a-real-module']);

    const result = await setUserModuleSubscription('user-1', 'paddles', 'subscribe');

    expect(result.activeModules).toEqual(['quilts', 'paddles']);
  });

  it('throws when the user does not exist', async () => {
    primeUser([], { missing: true });

    await expect(setUserModuleSubscription('ghost', 'quilts', 'toggle')).rejects.toThrow(
      'User not found'
    );
    expect(txMock.update).not.toHaveBeenCalled();
  });
});
