import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

function createRequest(token?: string) {
  return new NextRequest('http://localhost/api/agent/tools', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

describe('agent auth', () => {
  it('parses scoped API keys whose scopes contain colons', async () => {
    vi.stubEnv('AGENT_API_KEYS', 'openclaw-dev:read:quilts,read:usage,read:cards;openclaw-admin:*');
    const { requireAgent } = await import('@/lib/agent/auth');

    const result = requireAgent(createRequest('openclaw-dev'), 'read:quilts');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.agent.scopes).toEqual(['read:quilts', 'read:usage', 'read:cards']);
    }
  });

  it('uses default read scopes when no explicit scopes are configured', async () => {
    vi.stubEnv('AGENT_API_KEYS', 'readonly-key');
    const { requireAgent } = await import('@/lib/agent/auth');

    const result = requireAgent(createRequest('readonly-key'), 'read:cards');

    expect(result.ok).toBe(true);
  });

  it('allows wildcard scoped API keys', async () => {
    vi.stubEnv('AGENT_API_KEYS', 'admin-key:*');
    const { requireAgent } = await import('@/lib/agent/auth');

    const result = requireAgent(createRequest('admin-key'), 'write:cards');

    expect(result.ok).toBe(true);
  });

  it('rejects missing and invalid bearer tokens', async () => {
    vi.stubEnv('AGENT_API_KEYS', 'known-key:read:quilts');
    const { requireAgent } = await import('@/lib/agent/auth');

    expect(requireAgent(createRequest(), 'read:quilts').ok).toBe(false);
    expect(requireAgent(createRequest('wrong-key'), 'read:quilts').ok).toBe(false);
  });
});
