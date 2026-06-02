# Security Audit Summary

Audit date: `2026-06-02`

## Current Status

- `npm audit`: `0` vulnerabilities
- `npm run lint:check`: passed
- `npm run type-check`: passed
- `npm test`: passed
- `npm run build`: passed

## Major Security-Relevant Changes

### Authentication

- Replaced Auth.js/NextAuth with Better Auth.
- Added dedicated Better Auth tables through Drizzle:
  - `auth_user`
  - `auth_session`
  - `auth_account`
  - `auth_verification`
- Kept application authorization data in `users.preferences`.
- Updated environment variables to `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and `NEXT_PUBLIC_BETTER_AUTH_URL`.
- Kept `AUTH_SECRET` only as a fallback alias. `NEXTAUTH_SECRET` is legacy-only and should not be used for new deployments.

### Agent API

- Added a restricted Agent OpenAPI surface at `/api/agent/openapi.json`.
- Added a single scoped tool endpoint at `/api/agent/tools`.
- Agent access is controlled by bearer tokens from `AGENT_API_KEYS`.
- Write tools require `confirm=true` and an `idempotencyKey` unless `dryRun=true` is used.
- Fixed scope parsing for scoped keys such as `read:quilts` and `write:cards`.

### Dependency Upgrades

The project was upgraded to current working versions across the stack, including:

- Next.js `16.2.7`
- React `19.2.7`
- TypeScript `6.0.3`
- Better Auth `1.6.13`
- Drizzle ORM `0.45.2`
- Drizzle Kit `0.31.10`
- Tailwind CSS `4.3.0`
- TanStack React Query `5.100.14`
- Zod `4.4.3`
- Vitest `4.1.8`

## Remaining Operational Risks

- Apply the Better Auth database migration before deploying this release.
- Rotate or generate a fresh `BETTER_AUTH_SECRET` for production; do not reuse old development secrets.
- Keep `AGENT_API_KEYS` scoped narrowly. Prefer read-only keys for OpenClaw or similar agents until write workflows are validated.
- Treat `/api/agent/tools` as an external integration endpoint and monitor audit logs for unexpected tool usage.

## Recommended Release Gate

Run these commands before future production releases:

```bash
npm audit
npm run lint:check
npm run type-check
npm test
npm run build
```
