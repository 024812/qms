# Security Audit Summary

Audit date: `2026-07-17`

## Current Status

- `npm audit`: `0` vulnerabilities
- `npm run lint:check`: passed
- `npm run type-check`: passed
- `npm test`: passed
- `npm run build`: passed
- `npm run db:migrate`: passed against Neon

## Household Shared-Data Security Model

QMS is deployed for one household and intentionally treats module records as a shared household dataset. `quilts`, `cards`, `usage`, analytics, and reports are not tenant-scoped by login user. The presence of a creator or actor `userId` is for provenance and auditing, not row-level access control. Reviews must not report the absence of per-user filters in these modules as a vulnerability unless the product is explicitly changed to support multiple households or untrusted tenants.

Account-private records remain user-scoped: sessions, credentials, and personal Agent API keys. Authentication, admin-only operations, module scopes, external API boundaries, write confirmation, idempotency, and auditing remain mandatory.

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
- Disabled public sign-up in Better Auth and explicitly rejected `/api/auth/sign-up/*`; administrators are the only account creators.
- Revoked active sessions when administrators change account email, password, or role, and after user password changes.

### Agent API

- Added a restricted Agent OpenAPI surface at `/api/agent/openapi.json`.
- Added a single scoped tool endpoint at `/api/agent/tools`.
- Agent access is controlled by user-created bearer tokens stored as database hashes; keys inherit the owning user permissions.
- Write tools require `confirm=true` and an `idempotencyKey` unless `dryRun=true` is used.
- User API keys now inherit scopes from the owning user's role and active modules.
- Agent audit rows store the API key owner's `userId`, and audit metadata includes `actorUserId` for direct attribution.
- Successful write operations are recorded in `agent_idempotency_keys`, so retried write requests can safely replay the original response.

### API Route Hardening

- Dashboard, analytics, reports, usage, NBA stats, weather, import, and settings route handlers now enforce session or administrator authorization as appropriate.
- AI Server Actions require authentication and cards-module access, use per-user limits, and return sanitized errors.
- Report CSV export now escapes values and blocks spreadsheet formula injection.
- SVG image optimization responses are configured as attachments.
- Stored images, attachments, import files, and Agent request bodies have explicit size and type limits.

### Database Integrity

- Migration `0007_gifted_morlocks` is applied to Neon.
- A partial unique index prevents more than one active usage record per Quilt.
- Quilt status and usage transitions are synchronized transactionally.

### Dependency Upgrades

The project was upgraded to current working versions across the stack, including:

- Next.js `16.2.10`
- React `19.2.7`
- TypeScript `6.0.3`
- next-intl `4.13.2`
- Better Auth `1.6.23`
- Drizzle ORM `0.45.2`
- Drizzle Kit `0.31.10`
- Tailwind CSS `4.3.2`
- TanStack React Query `5.101.2`
- Zod `4.4.3`
- Vitest `4.1.10`

## Remaining Operational Risks

- Keep Drizzle migrations pointed at Neon and verify `npm run db:migrate` before production deploys.
- Rotate or generate a fresh `BETTER_AUTH_SECRET` for production; do not reuse old development secrets.
- Agent access is controlled by user-created bearer tokens stored as database hashes; keys inherit the owning user permissions.
- Treat `/api/agent/tools` as an external integration endpoint and monitor audit logs for unexpected tool usage.
- ESLint 10 is not adopted yet because the current Next ESLint plugin stack still fails under it; keep ESLint 9 until the integration is compatible.

## Recommended Release Gate

Run these commands before future production releases:

```bash
npm audit
npm run lint:check
npm run type-check
npm test
npm run build
npm audit --omit=optional
npm run db:migrate
```
