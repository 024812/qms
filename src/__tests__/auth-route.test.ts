import { beforeEach, describe, expect, it, vi } from 'vitest';

const { delegatedPost } = vi.hoisted(() => ({
  delegatedPost: vi.fn(async () => new Response(null, { status: 204 })),
}));

vi.mock('@/auth', () => ({
  betterAuthInstance: {},
}));

vi.mock('better-auth/next-js', () => ({
  toNextJsHandler: () => ({
    GET: vi.fn(),
    POST: delegatedPost,
    PATCH: vi.fn(),
    PUT: vi.fn(),
    DELETE: vi.fn(),
  }),
}));

import { POST } from '@/app/api/auth/[...all]/route';

describe('Better Auth route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('blocks the email sign-up endpoint without invoking Better Auth', async () => {
    const response = await POST(
      new Request('http://localhost:3000/api/auth/sign-up/email', { method: 'POST' })
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: {
        code: 'FORBIDDEN',
      },
    });
    expect(delegatedPost).not.toHaveBeenCalled();
  });

  it('delegates non-sign-up authentication requests to Better Auth', async () => {
    const request = new Request('http://localhost:3000/api/auth/sign-in/email', {
      method: 'POST',
    });

    const response = await POST(request);

    expect(response.status).toBe(204);
    expect(delegatedPost).toHaveBeenCalledWith(request);
  });
});
