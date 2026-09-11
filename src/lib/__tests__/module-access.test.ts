import { describe, expect, it } from 'vitest';

import { ModuleAccessError, hasModuleAccess, requireModuleAccess } from '@/lib/module-access';

const memberWithoutCards = {
  user: {
    id: 'member-1',
    name: 'Member',
    email: 'member@example.com',
    role: 'member' as const,
    activeModules: ['quilts'],
  },
  expires: new Date().toISOString(),
};

describe('module access', () => {
  it('denies a member without the requested module', () => {
    expect(hasModuleAccess(memberWithoutCards, 'cards')).toBe(false);
    expect(() => requireModuleAccess(memberWithoutCards, 'cards')).toThrow(ModuleAccessError);
  });

  it('allows administrators regardless of active modules', () => {
    expect(
      hasModuleAccess(
        { ...memberWithoutCards, user: { ...memberWithoutCards.user, role: 'admin' } },
        'cards'
      )
    ).toBe(true);
  });
});
