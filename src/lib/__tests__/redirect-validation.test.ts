import { describe, expect, it } from 'vitest';

import { normalizeInternalRedirect } from '@/lib/redirect-validation';

describe('normalizeInternalRedirect', () => {
  it('keeps safe internal paths', () => {
    expect(normalizeInternalRedirect('/zh/quilts?status=active', '/')).toBe(
      '/zh/quilts?status=active'
    );
  });

  it.each([
    '//evil.example/path',
    '/%2Fevil.example/path',
    'https://evil.example',
    '/\\evil.example',
    '/safe%5C%5Cevil',
    '/safe%00path',
  ])('rejects unsafe redirect %s', value => {
    expect(normalizeInternalRedirect(value, '/fallback')).toBe('/fallback');
  });
});
