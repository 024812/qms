import { NextRequest } from 'next/server';

import { createForbiddenResponse, createUnauthorizedResponse } from '@/lib/api/response';
import { findUserByApiKey } from '@/lib/data/user-api-keys';
import { scopesForUser, type AgentScope } from '@/lib/agent/scopes';

// The scope vocabulary lives in `./scopes`, a DB-free leaf module, so that pure
// consumers such as the OpenAPI document generator can read it without pulling
// in `@/db`. It is re-exported here because this is the module that the tools
// route and the auth tests already import.
export { scopesForUser };
export type { AgentScope, ModuleAgentScope, SystemAgentScope } from '@/lib/agent/scopes';

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
