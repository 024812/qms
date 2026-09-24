import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'admin', role: 'admin' } })) }));
vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }));
vi.mock('@/lib/auth/password', () => ({ hashPassword: vi.fn(async () => 'hashed') }));
vi.mock('@/lib/data/users', () => ({
  createUser: vi.fn(),
  deleteUser: vi.fn(),
  listUsers: vi.fn(),
  isUserEmailTaken: vi.fn(async () => false),
  updateUser: vi.fn(async () => ({ id: 'member' })),
}));

import { updateUserAction } from '@/app/actions/users';
import { updateUser } from '@/lib/data/users';
import { revalidateTag } from 'next/cache';

describe('administrator password updates', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects short replacement passwords before writing', async () => {
    const result = await updateUserAction({ id: 'member', password: '12345678' });
    expect(result.success).toBe(false);
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('allows an empty password when updating only profile fields', async () => {
    const result = await updateUserAction({ id: 'member', name: 'New name', password: '' });
    expect(result.success).toBe(true);
    expect(updateUser).toHaveBeenCalledWith(
      expect.not.objectContaining({ hashedPassword: expect.anything() })
    );
    // This invalidation also works when the entry is called by a REST handler.
    expect(revalidateTag).toHaveBeenCalledWith('users', { expire: 0 });
  });

  it('hashes an accepted replacement password', async () => {
    expect((await updateUserAction({ id: 'member', password: '123456789012' })).success).toBe(true);
    expect(updateUser).toHaveBeenCalledWith(expect.objectContaining({ hashedPassword: 'hashed' }));
  });
});
