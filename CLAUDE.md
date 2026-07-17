# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Next.js dev server (Turbopack available via dev:turbo)
npm run build            # Production build (validates env vars first)
npm run lint             # ESLint with --fix
npm run lint:check       # ESLint without fixing (use for CI / release checks)
npm run type-check       # tsc --noEmit
npm test                 # vitest run (all tests, single pass)
npm run format           # Prettier write

# Run a single test file
npx vitest run path/to/file.test.ts
# Watch mode / interactive UI
npx vitest            # watch
npx vitest --ui       # browser UI

# Database (Drizzle + Neon Postgres — no local Postgres)
npm run db:generate      # Generate migration from schema changes
npm run db:migrate       # Apply migrations to Neon (use this, not db:push)
npm run db:studio        # Drizzle Studio
```

Release verification runs, in order: `lint:check`, `type-check`, `test`, `build`.

## Critical constraints

- **Database is Neon Postgres only.** `DATABASE_URL` must point at Neon in `.env.local`. Do not use a local `localhost:5432` database. Use `db:migrate` for schema changes; `db:push` is for deliberate dev experiments only, never production.
- **Env vars are validated at build/start** via `src/lib/env.ts` (imported by `next.config.ts`). A missing/invalid required var fails the build. Required: `DATABASE_URL`, `BETTER_AUTH_SECRET` (min 32 chars). `src/lib/env.ts` also exports a `features` map that gates optional integrations (Redis, Azure OpenAI, eBay, Perplexity, RapidAPI).
- **Data is intentionally NOT isolated per user.** This is a family-shared system by design — the data layer does not filter by `userId`, and shared inventories (quilts, cards) are visible to all authenticated users. Do not add per-user row filtering unless explicitly asked.
- **Locale message files** (`messages/en.json`, `messages/zh.json`) are statically imported by `src/i18n/request.ts`. They must stay tracked and present — deleting/unstaging them breaks the build.

## Architecture

Next.js 16 App Router (React 19, TypeScript). The codebase follows a strict **module blueprint** documented in `docs/architecture/MODULE_BLUEPRINT_V2.md`. `quilts` and `cards` are the canonical template modules; new modules copy their structure rather than inventing new patterns.

### The five fixed rules (from the blueprint)

1. One authoritative data layer per module: `src/lib/data/<module>.ts`
2. One authoritative mutation/read entry per module: `src/app/actions/<module>.ts`
3. Pages are always `Server Page + private Client Shell` (`_components/<Module>PageClient.tsx`)
4. Route Handlers (`src/app/api/**`) are NOT the internal read/write path — they exist only as external HTTP / compatibility surfaces
5. Caching is driven by Next.js cache tags; React Query is a supplementary layer only (infinite scroll, virtualized lists, polling)

### Layer responsibilities

- **`src/lib/data/<module>.ts`** — the only place that touches the DB for a module. Holds all CRUD, transactions, server-side filtering/sorting/pagination, and cache directives (`'use cache'`, `cacheTag`, `revalidateTag`). Do NOT wrap it in a repository or duplicate its filter logic elsewhere. (Note: `src/lib/repositories/*` still exists for stats/reports but the module pattern has moved away from repositories.)
- **`src/app/actions/<module>.ts`** — `'use server'` entry for in-app mutations/reads. Handles auth, input validation (Zod), error mapping, then calls the data layer. Must not call its own module's `/api/<module>` route.
- **`src/app/[locale]/<module>/page.tsx`** — server shell: awaits `params`/`searchParams`, fetches first-paint data, passes serializable props to the client shell.
- **`_components/<Module>PageClient.tsx`** — client interaction only (toolbar state, dialogs, selection, `startTransition`). Never touches the DB or reimplements server-side filtering.
- **`src/modules/<module>/`** — module config, Zod schema, types, reusable UI, `blueprint.ts`. No DB access, no cache invalidation.

### Caching model

Uses Next.js `cacheComponents: true` (in `next.config.ts`) with the `'use cache'` directive. Cache tags follow a convention (see `src/modules/core/cache-tags.ts`): a root tag, list tag, item tag (`...item:<id>`), and slice tags (`...<dimension>:<value>`). Writes invalidate root + list; updates/deletes also invalidate the item; status changes additionally invalidate old and new status slices. `revalidateTag` is called with the `'max'` profile.

### Auth

Better Auth (`src/auth.ts`) with a Drizzle adapter over Neon. `auth()` returns the app session (`AppSession`) including `role` (`admin`/`member`) and `activeModules`, both derived from `users.preferences`. Public self-registration is disabled at the Better Auth, Route Handler, Server Action, page, and proxy layers; administrators create accounts from the user-management page. Route protection lives in `src/proxy.ts` (Next.js 16 proxy/middleware convention) — it redirects unauthenticated users to `/login`, redirects authenticated users away from the public login path, and auto-routes to a single active module when there's only one. `/api/**` and `/AGENT_API.md` bypass the proxy, so API authorization must remain explicit.

### Agent API

External AI agents use a narrow surface instead of general DB access:

- `POST /api/agent/tools` — single endpoint dispatching a fixed set of typed tools (`quilts.*`, `usage.*`, `cards.*`, `settings.read`).
- `GET /api/agent/openapi.json` — the OpenAPI spec; public guide at `/AGENT_API.md`.

Auth is via `Authorization: Bearer <key>` (`src/lib/agent/auth.ts`). Keys are user-owned (`Settings → Agent API Keys`) and **inherit the creating user's module access** — scopes are derived from `activeModules` (admins get `*`); there is no independent per-key scope narrowing. Write tools require `confirm=true` and an `idempotencyKey`; successful writes are recorded in `agent_idempotency_keys` (durable idempotency with stable input hashing and replay detection). All calls are audited via `src/lib/agent/audit.ts`.

### API response conventions

Route handlers return a uniform `ApiResponse<T>` envelope via helpers in `src/lib/api/response.ts` (`createSuccessResponse`, `createValidationErrorResponse`, `createUnauthorizedResponse`, etc.). API session checks use `requireApiSession` from `src/lib/api/route-auth.ts`. All external input is validated with Zod (v4).

## i18n

next-intl with locales `en`/`zh` under the `[locale]` segment. Messages are a static map in `src/i18n/request.ts` (imported directly, not dynamically loaded — required for Turbopack builds). Routing config is in `src/i18n/routing.ts`.

## Security notes

Security headers (CSP, HSTS, COOP/COEP/CORP, `X-Frame-Options: DENY`) are set in `next.config.ts`; `/api/**` responses are `no-store`. CSV report exports neutralize formula injection in `src/app/api/reports/route.ts` (`escapeCsvCell`). When adding network-exposed routes, follow the existing `requireApiSession` / `requireAgent` auth pattern.
