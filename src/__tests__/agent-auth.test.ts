import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const findUserByApiKey = vi.fn();

vi.mock('@/lib/data/user-api-keys', () => ({
  findUserByApiKey,
}));

function createRequest(token?: string) {
  return new NextRequest('http://localhost/api/agent/tools', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

describe('agent auth', () => {
  it('inherits quilt and usage scopes from the owning user modules', async () => {
    findUserByApiKey.mockResolvedValue({
      apiKeyId: 'key-1',
      userId: 'user-1',
      name: 'Member',
      email: 'member@example.com',
      role: 'member',
      activeModules: ['quilts'],
    });
    const { requireAgent } = await import('@/lib/agent/auth');

    const result = await requireAgent(createRequest('user-key'), 'write:usage');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.agent.userId).toBe('user-1');
      expect(result.agent.scopes).toEqual([
        'read:quilts',
        'write:quilts',
        'read:usage',
        'write:usage',
      ]);
    }
  });

  it('rejects tools outside the owning user modules', async () => {
    findUserByApiKey.mockResolvedValue({
      apiKeyId: 'key-1',
      userId: 'user-1',
      name: 'Member',
      email: 'member@example.com',
      role: 'member',
      activeModules: ['quilts'],
    });
    const { requireAgent } = await import('@/lib/agent/auth');

    const result = await requireAgent(createRequest('user-key'), 'read:cards');

    expect(result.ok).toBe(false);
  });

  it('allows admin user API keys to access all tools', async () => {
    findUserByApiKey.mockResolvedValue({
      apiKeyId: 'key-2',
      userId: 'admin-1',
      name: 'Admin',
      email: 'admin@example.com',
      role: 'admin',
      activeModules: [],
    });
    const { requireAgent } = await import('@/lib/agent/auth');

    const result = await requireAgent(createRequest('admin-key'), 'write:cards');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.agent.scopes).toEqual(['*']);
    }
  });

  it('rejects missing and invalid bearer tokens', async () => {
    findUserByApiKey.mockResolvedValue(null);
    const { requireAgent } = await import('@/lib/agent/auth');

    expect((await requireAgent(createRequest(), 'read:quilts')).ok).toBe(false);
    expect((await requireAgent(createRequest('wrong-key'), 'read:quilts')).ok).toBe(false);
  });
});
