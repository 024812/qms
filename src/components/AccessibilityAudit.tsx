'use client';

import { useEffect } from 'react';

/**
 * AccessibilityAudit component
 * Runs axe-core accessibility checks in development mode
 * Results are logged to the browser console
 *
 * Usage: Add <AccessibilityAudit /> to your layout in development
 *
 * @see https://github.com/dequelabs/axe-core-npm/tree/develop/packages/react
 */
export function AccessibilityAudit() {
  useEffect(() => {
    // Only run in development and in browser
    if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') {
      return;
    }

    const runAxe = async () => {
      try {
        const React = await import('react');
        const ReactDOM = await import('react-dom');
        const axe = await import('@axe-core/react');

        // Run axe-core with configuration
        axe.default(React, ReactDOM, 1000, {
          // Configure axe-core rules
          rules: [
            // Enable all WCAG 2.1 AA rules
            { id: 'color-contrast', enabled: true },
            { id: 'label', enabled: true },
            { id: 'button-name', enabled: true },
            { id: 'image-alt', enabled: true },
            { id: 'link-name', enabled: true },
            { id: 'aria-roles', enabled: true },
            { id: 'aria-valid-attr', enabled: true },
            { id: 'aria-valid-attr-value', enabled: true },
            { id: 'aria-required-attr', enabled: true },
            { id: 'aria-required-children', enabled: true },
            { id: 'aria-required-parent', enabled: true },
            { id: 'focus-order-semantics', enabled: true },
            { id: 'landmark-one-main', enabled: true },
            { id: 'page-has-heading-one', enabled: true },
            { id: 'region', enabled: true },
          ],
        });

        console.warn(
          '%c[Accessibility Audit] axe-core is running. Check console for violations.',
          'color: #2563EB; font-weight: bold;'
        );
      } catch (error) {
        console.error('[Accessibility Audit] Failed to initialize axe-core:', error);
      }
    };

    runAxe();
  }, []);

  // This component doesn't render anything
  return null;
}

export default AccessibilityAudit;
