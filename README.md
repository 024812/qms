# QMS

QMS is a modular family item management system built with the Next.js App Router, Auth.js v5, Neon Serverless Postgres, Drizzle ORM, and Vercel. The current production architecture is server-first: each module has a canonical data layer, canonical server actions, and a server page shell that hands interaction state to a private client shell.

Current release: `2026.4.2`

## Release 2026.4.2

- Standardized `quilts` and `cards` as the first copyable module blueprints.
- Locked module architecture around:
  - `src/lib/data/<module>.ts` as the canonical data layer
  - `src/app/actions/<module>.ts` as the canonical server action surface
  - `src/app/[locale]/<module>/page.tsx` as the server page shell
  - `src/app/[locale]/<module>/_components/*` as the client shell and interactive UI
- Moved internal reads and writes away from legacy repository-first or REST-first paths.
- Stabilized settings and dashboard data flow.
- Refreshed documentation so the README now matches the real stack and release state.

See [CHANGELOG.md](CHANGELOG.md) for the full release history.

## Modules

### Quilts

- Inventory management for household quilts and bedding.
- Transactional status changes with usage record synchronization.
- Server-side filtering, sorting, pagination, and cache tagging.
- Module blueprint: `src/modules/quilts/blueprint.ts`

### Cards

- Trading card collection management with detail, overview, sold, and settings flows.
- AI-assisted analysis pipeline with configurable Azure OpenAI-compatible deployment and search/data providers.
- Shared module pattern aligned to quilts.
- Module blueprint: `src/modules/cards/blueprint.ts`

### Shared Areas

- Settings, dashboard, users, admin, analytics, reports, and authentication are organized under the same App Router shell and follow the same server-first conventions where possible.

## Current Architecture

### 1. Server-first pages

- App pages live under `src/app/[locale]`.
- Pages fetch initial data on the server.
- Interactive state is delegated to client shells under `_components`.
- Dynamic routes that require live database/auth state explicitly opt into runtime rendering with `connection()` where needed.

### 2. Canonical module data layer

- Module reads and writes are centralized in `src/lib/data/quilts.ts`, `src/lib/data/cards.ts`, `src/lib/data/usage.ts`, `src/lib/data/stats.ts`, and `src/lib/data/settings.ts`.
- Internal application flows do not treat route handlers as the primary source of truth.
- Legacy route handlers remain mainly for compatibility or external HTTP access.

### 3. Canonical server actions

- Internal UI mutations and internal reads are exposed through `src/app/actions/*.ts`.
- Actions handle auth checks, validation, error mapping, and cache invalidation.
- Internal pages prefer server actions over calling `/api/**` endpoints.

### 4. Cache strategy

- Shared server data uses Next.js 16 caching primitives such as `'use cache'`, `cacheLife`, `cacheTag`, and `revalidateTag`.
- Cache invalidation is tag-based at the module and slice level.
- React Query is retained as a client wrapper for interactive screens, not as the primary truth layer.

### 5. Module blueprint pattern

- Each standardized module defines:
  - module identity and route segment
  - authoritative data/action files
  - page shell boundaries
  - cache tag and query-key conventions
  - migration rules and legacy boundaries
- Reference files:
  - `src/modules/core/blueprint.ts`
  - `src/modules/quilts/blueprint.ts`
  - `src/modules/cards/blueprint.ts`

## Tech Stack

### Application

- Next.js `16.2.2`
- React `19.2.4`
- TypeScript `5.9.3`
- next-intl `4.8.4`

### Data and auth

- Auth.js / NextAuth.js v5 (`next-auth@5.0.0-beta.30`)
- Neon Serverless PostgreSQL
- Drizzle ORM `0.45.2`
- Zod `4.3.6`
- bcryptjs `3.0.2`

### Frontend state and UI

- Tailwind CSS `4.2.2`
- Radix UI
- TanStack React Query `5.96.0`
- Zustand `5.0.12`
- Framer Motion `12.24.7`
- Sonner `2.0.7`
- Recharts `3.7.0`

### AI and integrations

- OpenAI SDK `6.33.0`
- Azure OpenAI-compatible deployment support
- Perplexity, Tavily, eBay, and RapidAPI integrations for card workflows

### Tooling and deployment

- ESLint `9.39.4`
- Prettier `3.8.1`
- Vitest `4.1.2`
- Vercel deployment

## Repository Layout

```text
src/
  app/
    [locale]/
      quilts/
      cards/
      settings/
      users/
      admin/
      analytics/
      reports/
    actions/
    api/
  components/
  db/
  hooks/
  lib/
    data/
    repositories/
  modules/
    core/
    quilts/
    cards/
  types/
docs/
scripts/
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values you actually use.

### Required

```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

### Optional compatibility / infrastructure

```env
QMS_JWT_SECRET=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
REDIS_URL=
VERCEL_URL=
NODE_ENV=development
```

### Optional card AI and data providers

```env
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_DEPLOYMENT=gpt-5-mini
PERPLEXITY_API_KEY=
RAPID_API_KEY=
```

Some card-provider settings can also be managed from the application settings UI and stored in the database.

## Local Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Useful Scripts

```bash
# quality
npm run lint:check
npm run type-check
npm run build

# local development
npm run dev
npm run dev:turbo

# database
npm run db:generate
npm run db:push
npm run db:studio

# project utilities
npm run audit-translations
npm run init-system-settings
npm run diagnose-auth
```

## Release Workflow

This project uses npm-compatible date-based versions in `YYYY.M.D` form.

For each release:

1. bump `package.json` and `package-lock.json`
2. update `README.md`, `README_zh.md`, and `CHANGELOG.md`
3. run lint, type-check, and build
4. commit, tag, and push
5. verify the Vercel deployment is healthy

## Verification Baseline For 2026.4.2

The release baseline was verified with:

- `npm run lint:check`
- `npm run type-check`
- `npm run build`

## License

MIT. See [LICENSE](LICENSE).
