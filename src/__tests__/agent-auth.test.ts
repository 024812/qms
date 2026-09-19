import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import type { ApiKeyUserIdentity } from '@/lib/data/user-api-keys';
import { MODULE_IDS } from '@/modules/module-ids';

const findUserByApiKey = vi.fn();

vi.mock('@/lib/data/user-api-keys', () => ({
  findUserByApiKey,
}));

function createRequest(token?: string) {
  return new NextRequest('http://localhost/api/agent/tools', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

function identity(overrides: Partial<ApiKeyUserIdentity> = {}): ApiKeyUserIdentity {
  return {
    apiKeyId: 'key-1',
    userId: 'user-1',
    name: 'Member',
    email: 'member@example.com',
    role: 'member',
    activeModules: [],
    ...overrides,
  };
}

describe('agent auth', () => {
  it('inherits quilt and usage scopes from the owning user modules', async () => {
    findUserByApiKey.mockResolvedValue(identity({ activeModules: ['quilts'] }));
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
        'read:settings',
      ]);
    }
  });

  it('rejects tools outside the owning user modules', async () => {
    findUserByApiKey.mockResolvedValue(identity({ activeModules: ['quilts'] }));
    const { requireAgent } = await import('@/lib/agent/auth');

    const result = await requireAgent(createRequest('user-key'), 'read:cards');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(403);
  });

  it('inherits collection module scopes in registry order', async () => {
    findUserByApiKey.mockResolvedValue(
      identity({ activeModules: ['paddles', 'antiques', 'maps', 'spirits'] })
    );
    const { requireAgent } = await import('@/lib/agent/auth');

    const result = await requireAgent(createRequest('collector-key'), 'write:spirits');

    expect(result.ok).toBe(true);
    if (result.ok) {
      // Registry order (spirits, paddles, antiques, maps), not the stored order.
      expect(result.agent.scopes).toEqual([
        'read:spirits',
        'write:spirits',
        'read:paddles',
        'write:paddles',
        'read:antiques',
        'write:antiques',
        'read:maps',
        'write:maps',
        'read:settings',
      ]);
    }
  });

  it('allows admin user API keys to access all tools', async () => {
    findUserByApiKey.mockResolvedValue(identity({ userId: 'admin-1', role: 'admin' }));
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

describe('agent scope derivation', () => {
  it('grants read/write scopes for every registered module', async () => {
    const { scopesForUser } = await import('@/lib/agent/auth');

    const scopes = scopesForUser(identity({ activeModules: [...MODULE_IDS] }));

    for (const id of MODULE_IDS) {
      expect(scopes).toContain(`read:${id}`);
      expect(scopes).toContain(`write:${id}`);
    }
  });

  it('never grants admin scopes to a member', async () => {
    const { scopesForUser } = await import('@/lib/agent/auth');

    const scopes = scopesForUser(identity({ activeModules: [...MODULE_IDS] }));

    expect(scopes).not.toContain('*');
    expect(scopes).not.toContain('admin:settings');
  });

  it('grants usage scopes only through the quilts module', async () => {
    const { scopesForUser } = await import('@/lib/agent/auth');

    const withQuilts = scopesForUser(identity({ activeModules: ['quilts'] }));
    const withoutQuilts = scopesForUser(identity({ activeModules: ['cards'] }));

    expect(withQuilts).toContain('read:usage');
    expect(withQuilts).toContain('write:usage');
    expect(withoutQuilts).not.toContain('read:usage');
    expect(withoutQuilts).not.toContain('write:usage');
  });

  it('grants read:settings to every authenticated key', async () => {
    const { scopesForUser, hasAgentScope } = await import('@/lib/agent/auth');

    const scopes = scopesForUser(identity({ activeModules: [] }));

    expect(scopes).toEqual(['read:settings']);
    expect(hasAgentScope({ id: 'a', userId: 'u', userName: 'n', userEmail: 'e', scopes }, 'read:settings')).toBe(
      true
    );
  });

  it('ignores module IDs that are no longer registered', async () => {
    const { scopesForUser } = await import('@/lib/agent/auth');

    const scopes = scopesForUser(
      identity({ activeModules: ['quilts', 'retired-module'] as ApiKeyUserIdentity['activeModules'] })
    );

    expect(scopes).toContain('read:quilts');
    expect(scopes.some(scope => scope.includes('retired-module'))).toBe(false);
  });

  it('returns no scopes for an unknown key', async () => {
    const { scopesForUser } = await import('@/lib/agent/auth');

    expect(scopesForUser(null)).toEqual([]);
  });

  it('exposes a module scope pair for every registry module', async () => {
    const { MODULE_AGENT_SCOPES } = await import('@/lib/agent/scopes');

    expect(MODULE_AGENT_SCOPES).toEqual(MODULE_IDS.flatMap(id => [`read:${id}`, `write:${id}`]));
  });
});
