/**
 * Regression tests for the typed-error → result mapping in Server Actions.
 *
 * The collection Actions used to decide between "not found" and "internal
 * error" by comparing `error.message` to a hard-coded string. That had two
 * failure modes:
 *
 *   1. Rewording a DAL message silently turned every 404 into a 500, with
 *      nothing failing at compile time.
 *   2. A genuine fault whose message happened to match was reported to the user
 *      as "not found", hiding a real bug.
 *
 * The Actions now branch on `error instanceof RecordNotFoundError` /
 * `ConflictError`. These tests pin both directions: the typed errors map to
 * their specific codes, and a plain `Error` does *not*.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { authMock, deleteAntiqueMock, updateAntiqueMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  deleteAntiqueMock: vi.fn(),
  updateAntiqueMock: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: authMock }));

vi.mock('@/lib/data/antiques', () => ({
  countAntiques: vi.fn(),
  createAntique: vi.fn(),
  deleteAntique: deleteAntiqueMock,
  getAntiqueById: vi.fn(),
  getAntiques: vi.fn(),
  updateAntique: updateAntiqueMock,
}));

import { deleteAntiqueAction, updateAntiqueAction } from '@/app/actions/antiques';
import { ConflictError, RecordNotFoundError } from '@/lib/data/errors';

const signedInMember = { user: { id: 'user-1', role: 'member', activeModules: ['antiques'] } };

describe('Server Action error mapping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue(signedInMember);
  });

  describe('deleteAntiqueAction', () => {
    it('reports a removed row as success', async () => {
      deleteAntiqueMock.mockResolvedValue(true);

      await expect(deleteAntiqueAction('a-1')).resolves.toEqual({
        success: true,
        data: { id: 'a-1' },
      });
    });

    it('maps a false delete result to NOT_FOUND', async () => {
      deleteAntiqueMock.mockResolvedValue(false);

      const result = await deleteAntiqueAction('missing');

      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.code).toBe('NOT_FOUND');
    });

    it('maps a thrown RecordNotFoundError to NOT_FOUND', async () => {
      deleteAntiqueMock.mockRejectedValue(new RecordNotFoundError('Antique', 'a-1'));

      const result = await deleteAntiqueAction('a-1');

      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.code).toBe('NOT_FOUND');
    });

    it('does not treat a plain Error as a missing record', async () => {
      // The old message-matching implementation returned NOT_FOUND here, which
      // reported a genuine database fault to the user as "文玩不存在".
      deleteAntiqueMock.mockRejectedValue(new Error('Antique a-1 not found'));

      const result = await deleteAntiqueAction('a-1');

      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('updateAntiqueAction', () => {
    // `updateAntiqueSchema` requires a UUID, so the input must clear validation
    // before the DAL mock is reached.
    const antiqueId = '11111111-1111-4111-8111-111111111111';

    it('maps RecordNotFoundError to NOT_FOUND', async () => {
      updateAntiqueMock.mockRejectedValue(new RecordNotFoundError('Antique', antiqueId));

      const result = await updateAntiqueAction({ id: antiqueId, name: 'Renamed' });

      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.code).toBe('NOT_FOUND');
    });

    it('does not mistake a ConflictError for a missing record', async () => {
      updateAntiqueMock.mockRejectedValue(new ConflictError('Antique', 'stale write'));

      const result = await updateAntiqueAction({ id: antiqueId, name: 'Renamed' });

      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.code).toBe('INTERNAL_ERROR');
    });
  });

  it('rejects an unauthenticated caller before touching the DAL', async () => {
    authMock.mockResolvedValue(null);

    const result = await deleteAntiqueAction('a-1');

    expect(result.success).toBe(false);
    expect(deleteAntiqueMock).not.toHaveBeenCalled();
  });
});
