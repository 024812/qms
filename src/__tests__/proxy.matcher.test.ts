/**
 * Proxy Matcher Pattern Tests
 *
 * Tests to verify that the matcher patterns in proxy.ts correctly
 * exclude all necessary paths according to Next.js 16 best practices.
 *
 * Requirements: 1.4 (Update configuration to use proxy matcher patterns)
 */

import { describe, it, expect } from '@jest/globals';

/**
 * Helper function to test if a path matches the proxy matcher pattern
 *
 * The matcher pattern from proxy.ts:
 * '/((?!api/|_next/static|_next/image|_next/data|favicon\\.ico|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|html)$).*)'
 */
function shouldProxyRun(pathname: string): boolean {
  // Negative lookahead pattern - excludes these paths
  const excludePattern =
    /^\/(?!api\/|_next\/static|_next\/image|_next\/data|favicon\.ico|manifest\.json|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|html)$).*/;
  return excludePattern.test(pathname);
}

describe('Proxy Matcher Patterns', () => {
  describe('Should run proxy for application routes', () => {
    it('should run for root path', () => {
      expect(shouldProxyRun('/')).toBe(true);
    });

    it('should run for login page', () => {
      expect(shouldProxyRun('/login')).toBe(true);
    });

    it('should run for register page', () => {
      expect(shouldProxyRun('/register')).toBe(true);
    });

    it('should run for quilts module', () => {
      expect(shouldProxyRun('/quilts')).toBe(true);
    });

    it('should run for quilts detail page', () => {
      expect(shouldProxyRun('/quilts/123')).toBe(true);
    });

    it('should run for usage module', () => {
      expect(shouldProxyRun('/usage')).toBe(true);
    });

    it('should run for settings page', () => {
      expect(shouldProxyRun('/settings')).toBe(true);
    });

    it('should run for analytics page', () => {
      expect(shouldProxyRun('/analytics')).toBe(true);
    });

    it('should run for dashboard page', () => {
      expect(shouldProxyRun('/dashboard')).toBe(true);
    });
  });

  describe('Should NOT run proxy for API routes', () => {
    it('should not run for /api/auth/login', () => {
      expect(shouldProxyRun('/api/auth/login')).toBe(false);
    });

    it('should not run for /api/auth/logout', () => {
      expect(shouldProxyRun('/api/auth/logout')).toBe(false);
    });

    it('should not run for /api/quilts', () => {
      expect(shouldProxyRun('/api/quilts')).toBe(false);
    });

    it('should not run for /api/quilts/123', () => {
      expect(shouldProxyRun('/api/quilts/123')).toBe(false);
    });

    it('should not run for /api/usage', () => {
      expect(shouldProxyRun('/api/usage')).toBe(false);
    });

    it('should not run for /api/dashboard', () => {
      expect(shouldProxyRun('/api/dashboard')).toBe(false);
    });

    it('should not run for /api/analytics', () => {
      expect(shouldProxyRun('/api/analytics')).toBe(false);
    });

    it('should not run for /api/settings', () => {
      expect(shouldProxyRun('/api/settings')).toBe(false);
    });

    it('should not run for /api/health', () => {
      expect(shouldProxyRun('/api/health')).toBe(false);
    });

    it('should not run for /api/weather', () => {
      expect(shouldProxyRun('/api/weather')).toBe(false);
    });
  });

  describe('Should NOT run proxy for Next.js internals', () => {
    it('should not run for /_next/static files', () => {
      expect(shouldProxyRun('/_next/static/chunks/main.js')).toBe(false);
    });

    it('should not run for /_next/image optimization', () => {
      expect(shouldProxyRun('/_next/image?url=/test.png')).toBe(false);
    });

    it('should not run for /_next/data routes', () => {
      expect(shouldProxyRun('/_next/data/build-id/quilts.json')).toBe(false);
    });
  });

  describe('Should NOT run proxy for static assets', () => {
    it('should not run for favicon.ico', () => {
      expect(shouldProxyRun('/favicon.ico')).toBe(false);
    });

    it('should not run for manifest.json', () => {
      expect(shouldProxyRun('/manifest.json')).toBe(false);
    });

    it('should not run for SVG files', () => {
      expect(shouldProxyRun('/icons/icon-192x192.svg')).toBe(false);
    });

    it('should not run for PNG files', () => {
      expect(shouldProxyRun('/images/logo.png')).toBe(false);
    });

    it('should not run for JPG files', () => {
      expect(shouldProxyRun('/photos/quilt.jpg')).toBe(false);
    });

    it('should not run for JPEG files', () => {
      expect(shouldProxyRun('/photos/quilt.jpeg')).toBe(false);
    });

    it('should not run for GIF files', () => {
      expect(shouldProxyRun('/animations/loading.gif')).toBe(false);
    });

    it('should not run for WebP files', () => {
      expect(shouldProxyRun('/images/optimized.webp')).toBe(false);
    });

    it('should not run for ICO files', () => {
      expect(shouldProxyRun('/icons/shortcut.ico')).toBe(false);
    });

    it('should not run for JSON files', () => {
      expect(shouldProxyRun('/data/config.json')).toBe(false);
    });

    it('should not run for HTML files', () => {
      expect(shouldProxyRun('/clear-cache.html')).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should run for paths with query parameters', () => {
      expect(shouldProxyRun('/quilts?status=active')).toBe(true);
    });

    it('should run for paths with hash fragments', () => {
      expect(shouldProxyRun('/quilts#section')).toBe(true);
    });

    it('should not run for nested API routes', () => {
      expect(shouldProxyRun('/api/quilts/123/status')).toBe(false);
    });

    it('should not run for deeply nested static files', () => {
      expect(shouldProxyRun('/_next/static/css/app.css')).toBe(false);
    });

    it('should run for routes that contain "api" but are not API routes', () => {
      expect(shouldProxyRun('/api-docs')).toBe(true);
    });

    it('should run for routes that contain "_next" but are not Next.js internals', () => {
      expect(shouldProxyRun('/next-steps')).toBe(true);
    });
  });
});
