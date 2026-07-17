import { beforeEach, describe, expect, it, vi } from 'vitest';

const { authMock, checkKeyMock, identifyCardMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  checkKeyMock: vi.fn(),
  identifyCardMock: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: authMock }));
vi.mock('@/lib/rate-limit', () => ({
  rateLimiters: { ai: { checkKey: checkKeyMock } },
}));
vi.mock('@/modules/cards/services/ai-card-service', () => ({
  aiCardService: {
    identifyCard: identifyCardMock,
    analyzeAuthenticity: vi.fn(),
    estimatePrice: vi.fn(),
    analyzeCardQuick: vi.fn(),
    analyzeGradingPotential: vi.fn(),
    analyzePlayerStats: vi.fn(),
  },
}));

import { identifyCardAction } from '@/app/actions/ai-card-actions';

describe('AI card action authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkKeyMock.mockResolvedValue({ allowed: true, remaining: 19, resetTime: Date.now() });
    identifyCardMock.mockResolvedValue({ playerName: 'Test Player' });
  });

  it('rejects unauthenticated requests before invoking an AI provider', async () => {
    authMock.mockResolvedValue(null);

    await expect(identifyCardAction('data:image/png;base64,AAAA')).rejects.toThrow(
      'AI scan failed'
    );
    expect(identifyCardMock).not.toHaveBeenCalled();
  });

  it('allows a cards member within quota', async () => {
    authMock.mockResolvedValue({
      user: { id: 'user-1', role: 'member', activeModules: ['cards'] },
    });

    await expect(
      identifyCardAction('data:image/png;base64,AAAA', undefined, 'en')
    ).resolves.toEqual({ playerName: 'Test Player' });
    expect(checkKeyMock).toHaveBeenCalledWith('ai:user:user-1');
    expect(identifyCardMock).toHaveBeenCalledOnce();
  });
});
