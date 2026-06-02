import { NextRequest } from 'next/server';

import { createForbiddenResponse, createUnauthorizedResponse } from '@/lib/api/response';

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
  scopes: AgentScope[];
}

type AgentAuthResult =
  | { ok: true; agent: AgentIdentity }
  | {
      ok: false;
      response: ReturnType<typeof createUnauthorizedResponse | typeof createForbiddenResponse>;
    };

function parseAgentKeys() {
  const raw = process.env.AGENT_API_KEYS || '';

  return raw
    .split(';')
    .map(entry => entry.trim())
    .filter(Boolean)
    .map(entry => {
      const separatorIndex = entry.indexOf(':');
      const key = separatorIndex === -1 ? entry : entry.slice(0, separatorIndex);
      const scopesRaw = separatorIndex === -1 ? '' : entry.slice(separatorIndex + 1);
      const scopes = scopesRaw
        .split(',')
        .map(scope => scope.trim())
        .filter(Boolean) as AgentScope[];

      const defaultScopes: AgentScope[] = ['read:quilts', 'read:usage', 'read:cards'];

      return {
        key,
        scopes: scopes.length ? scopes : defaultScopes,
      };
    })
    .filter(entry => entry.key);
}

function readBearerToken(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

export function hasAgentScope(agent: AgentIdentity, scope: AgentScope) {
  return agent.scopes.includes('*') || agent.scopes.includes(scope);
}

export function requireAgent(request: NextRequest, requiredScope: AgentScope): AgentAuthResult {
  const token = readBearerToken(request);

  if (!token) {
    return { ok: false, response: createUnauthorizedResponse('Missing agent bearer token') };
  }

  const match = parseAgentKeys().find(entry => entry.key === token);

  if (!match) {
    return { ok: false, response: createUnauthorizedResponse('Invalid agent bearer token') };
  }

  const agent: AgentIdentity = {
    id: `agent-${token.slice(0, 8)}`,
    scopes: match.scopes,
  };

  if (!hasAgentScope(agent, requiredScope)) {
    return {
      ok: false,
      response: createForbiddenResponse(`Missing agent scope: ${requiredScope}`),
    };
  }

  return { ok: true, agent };
}
