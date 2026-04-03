# Security Audit Summary

Audit date: `2026-04-03`

## Current status

- `npm audit --omit=dev`: `0` vulnerabilities
- `npm audit`: `4` moderate vulnerabilities
- Remaining findings are limited to the development/build toolchain and are not present in production runtime dependencies

## What was fixed

### Removed unused or redundant direct dependencies

The following packages were removed because they are no longer referenced by source code or active tooling:

- `@auth/core`
- `@auth/drizzle-adapter`
- `@radix-ui/react-avatar`
- `@radix-ui/react-dropdown-menu`
- `dotenv`
- `jsonwebtoken`
- `zustand`
- `@fast-check/vitest`
- `@tanstack/react-query-devtools`
- `@testing-library/user-event`
- `@types/glob`
- `@types/jsonwebtoken`
- `@vitest/coverage-v8`
- `axe-core`
- `eslint-plugin-jsx-a11y`
- `fast-check`
- `glob`
- `tsx`

### Added missing direct dependency

- Added `@radix-ui/react-visually-hidden` because it is imported directly in application code

### Upgraded supported dependencies

The project was upgraded to the latest supported versions for the current stack, excluding `next-auth` per project requirement:

- `@tanstack/react-query` -> `5.96.1`
- `@types/node` -> `25.5.0`
- `@vitejs/plugin-react` -> `6.0.1`
- `framer-motion` -> `12.38.0`
- `jsdom` -> `29.0.1`
- `lucide-react` -> `1.7.0`
- `next-intl` -> `4.9.0`
- `react-day-picker` -> `9.14.0`
- `recharts` -> `3.8.1`
- `tailwind-merge` -> `3.5.0`
- `typescript` -> `6.0.2`

### Compatibility fixes applied after upgrades

- Replaced the removed Lucide GitHub brand icon usage with an inline SVG in the sidebar footer
- Updated the Recharts tooltip formatter typing to match the newer `ValueType` / `NameType` signatures
- Added `"ignoreDeprecations": "6.0"` in `tsconfig.json` to acknowledge the TypeScript 6 deprecation warning for `baseUrl`
- Upgraded `eslint-import-resolver-typescript` to `4.4.4` so ESLint continues to resolve TypeScript imports correctly with TypeScript 6

## Remaining exceptions

### `next-auth`

- Kept at `5.0.0-beta.30` intentionally, per explicit project requirement

### `eslint`

- `npm outdated` reports `eslint@10.1.0` as the latest release
- The current Next.js lint stack still pulls `eslint-plugin-import`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, and `eslint-plugin-jsx-a11y` versions whose published peer ranges stop at ESLint 9
- Attempting the ESLint 10 upgrade produced real runtime lint failures in this repository
- The project therefore remains on `eslint@9.39.4`, which is the latest working version for the current Next.js lint dependency chain

## Remaining audit findings

All remaining `npm audit` findings come from the dev-only `drizzle-kit` toolchain:

- `drizzle-kit` -> `@esbuild-kit/esm-loader` -> `@esbuild-kit/core-utils` -> `esbuild`

Notes:

- `npm audit --omit=dev` is already `0`
- `drizzle-kit@0.31.10` is currently the latest stable release on npm
- The audit suggestion to install `drizzle-kit@0.18.1` is stale and would actually downgrade the package
- These findings do not affect the production deployment dependency graph

## Verification completed

The repository was re-verified after cleanup and upgrades:

- `npm run lint:check`
- `npm run type-check`
- `npm test`
- `npm run build`
- `npm audit --omit=dev`

## Recommended policy

- Keep `npm audit --omit=dev` as the production dependency gate in CI
- Continue monitoring `drizzle-kit` releases for a toolchain update that removes the `@esbuild-kit/esm-loader` advisory path
- Revisit the ESLint 10 upgrade after the Next.js lint plugin chain publishes official support
