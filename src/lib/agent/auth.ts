import { NextRequest } from 'next/server';

import { createForbiddenResponse, createUnauthorizedResponse } from '@/lib/api/response';
import { findUserByApiKey } from '@/lib/data/user-api-keys';

export type AgentScope =
  | '*'
  | 'read:quilts'
  | 'write:quilts'
  | 'read:usage'
  | 'write:usage'
  | 'read:cards'
  | 'write:cards'
  | 'read:settings'
  | 'admin:settings';

export interface AgentIdentity {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  scopes: AgentScope[];
}

type AgentAuthResult =
  | { ok: true; agent: AgentIdentity }
  | {
      ok: false;
      response: ReturnType<typeof createUnauthorizedResponse | typeof createForbiddenResponse>;
    };

function readBearerToken(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

export function hasAgentScope(agent: AgentIdentity, scope: AgentScope) {
  return agent.scopes.includes('*') || agent.scopes.includes(scope);
}

function scopesForUser(user: Awaited<ReturnType<typeof findUserByApiKey>>): AgentScope[] {
  if (!user) return [];
  if (user.role === 'admin') return ['*'];

  const scopes = new Set<AgentScope>();
  if (user.activeModules.includes('quilts')) {
    scopes.add('read:quilts');
    scopes.add('write:quilts');
    scopes.add('read:usage');
    scopes.add('write:usage');
  }
  if (user.activeModules.includes('cards')) {
    scopes.add('read:cards');
    scopes.add('write:cards');
  }

  return [...scopes];
}

export async function requireAgent(
  request: NextRequest,
  requiredScope: AgentScope
): Promise<AgentAuthResult> {
  const token = readBearerToken(request);

  if (!token) {
    return { ok: false, response: createUnauthorizedResponse('Missing agent bearer token') };
  }

  const user = await findUserByApiKey(token);

  if (!user) {
    return { ok: false, response: createUnauthorizedResponse('Invalid agent bearer token') };
  }

  const agent: AgentIdentity = {
    id: `agent-key-${user.apiKeyId}`,
    userId: user.userId,
    userName: user.name,
    userEmail: user.email,
    scopes: scopesForUser(user),
  };

  if (!hasAgentScope(agent, requiredScope)) {
    return {
      ok: false,
      response: createForbiddenResponse(`Missing agent scope: ${requiredScope}`),
    };
  }

  return { ok: true, agent };
}
