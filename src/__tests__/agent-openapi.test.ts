import { describe, expect, it } from 'vitest';

import { GET } from '@/app/api/agent/openapi.json/route';

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
});
