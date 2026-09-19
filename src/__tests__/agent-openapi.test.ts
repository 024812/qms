import { describe, expect, it } from 'vitest';

import { GET } from '@/app/api/agent/openapi.json/route';
import { MODULE_AGENT_SCOPES } from '@/lib/agent/scopes';
import { AGENT_TOOL_NAMES } from '@/lib/agent/tool-names';
import packageJson from '../../package.json';

describe('agent OpenAPI route', () => {
  it('returns a bare OpenAPI document', async () => {
    const response = await GET();
    const body = await response.json();

    expect(body.openapi).toBe('3.1.0');
    expect(body.info.title).toBe('QMS Agent API');
    expect(body.paths['/tools'].post.operationId).toBe('callAgentTool');
    expect(body.success).toBeUndefined();
    expect(body.data).toBeUndefined();
  });

  it('reports the package version so the contract cannot drift', async () => {
    const response = await GET();
    const body = await response.json();

    expect(body.info.version).toBe(packageJson.version);
  });

  it('does not require `input`, matching the Zod default', async () => {
    const response = await GET();
    const body = await response.json();
    const schema = body.components.schemas.AgentToolRequest;

    expect(schema.required).toEqual(['tool']);
    expect(schema.properties.input.default).toEqual({});
  });

  it('documents the idempotency key length enforced by Zod', async () => {
    const response = await GET();
    const body = await response.json();
    const schema = body.components.schemas.AgentToolRequest;

    expect(schema.properties.idempotencyKey.minLength).toBe(8);
  });

  it('lists the derived scope vocabulary', async () => {
    const response = await GET();
    const body = await response.json();
    const scopes: string[] = body.components.schemas.AgentScope.enum;

    for (const scope of MODULE_AGENT_SCOPES) expect(scopes).toContain(scope);
    expect(scopes).toContain('read:usage');
    expect(scopes).toContain('write:usage');
    expect(scopes).toContain('read:settings');
    expect(scopes).toContain('admin:settings');
    expect(scopes).toContain('*');
  });

  it('advertises exactly the tools the dispatcher accepts', async () => {
    const response = await GET();
    const body = await response.json();
    const advertised: string[] = body.components.schemas.AgentToolRequest.properties.tool.enum;

    // Same source of truth as the dispatcher's Zod enum, so the published
    // contract cannot drift from what the endpoint actually routes.
    expect(advertised).toEqual([...AGENT_TOOL_NAMES]);
  });

  it('uses the LOST quilt status from the shared enum', async () => {
    const response = await GET();
    const body = await response.json();

    expect(body.components.schemas.QuiltSearchInput.properties.status.enum).toContain('LOST');
  });
});
