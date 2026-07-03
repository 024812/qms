import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Enhanced rules for TypeScript files
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // TypeScript-specific rules (without type information requirements)
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      // Note: Removed rules requiring type information for now
    },
  },

  // Enhanced rules for all files (focused on critical issues)
  {
    rules: {
      // Security-focused rules (critical)
      'react/no-danger-with-children': 'error',
      'react/jsx-no-script-url': 'error',
      'react/jsx-no-target-blank': 'error',
      'react/no-danger': 'warn',

      // Performance-focused rules (disabled for now)
      'react/jsx-no-bind': 'off', // Too many false positives
      'react/jsx-no-leaked-render': 'off', // Too many false positives
      'react/no-array-index-key': 'warn',

      // Accessibility rules (essential only)
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-has-content': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
      'jsx-a11y/img-redundant-alt': 'error',
      'jsx-a11y/no-redundant-roles': 'error',
      'jsx-a11y/click-events-have-key-events': 'warn', // Important for keyboard accessibility
      'jsx-a11y/no-static-element-interactions': 'warn', // Important for semantic HTML
      'jsx-a11y/heading-has-content': 'error',
      'jsx-a11y/html-has-lang': 'error',
      'jsx-a11y/label-has-associated-control': 'warn',
      'jsx-a11y/no-noninteractive-element-interactions': 'warn',
      'jsx-a11y/tabindex-no-positive': 'error',

      // Code quality rules (essential)
      'prefer-const': 'error',
      'no-var': 'error',
      'no-unused-vars': 'off', // Handled by TypeScript
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // Prevent critical mistakes
      'no-debugger': 'error',
      'no-alert': 'warn',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',

      // React Hooks rules (essential)
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Disable problematic React Compiler rules for now
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/incompatible-library': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/static-components': 'off',

      // Import/Export rules (relaxed for now)
      'import/no-duplicates': 'error',
      'import/no-unresolved': 'off', // Handled by TypeScript
      'import/order': 'off', // Too many warnings, can be enabled later
    },
  },

  // Override default ignores of eslint-config-next
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Additional ignores
    'node_modules/**',
    '.git/**',
    'coverage/**',
    '*.config.js',
    '*.config.mjs',
    'public/**/*.js', // Ignore service worker and other public JS files
    'scripts/**',
  ]),
]);

export default eslintConfig;
