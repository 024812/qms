# QMS

QMS is a modular family item management system built with Next.js 16, React 19, Better Auth, Neon Serverless PostgreSQL, Drizzle ORM, and Vercel.

Current release: `2026.9.11`

## What Is Standardized

- `quilts` and `cards` are the first copyable module blueprints.
- Each module keeps one canonical data layer in `src/lib/data/<module>.ts`.
- Each module keeps one canonical server action surface in `src/app/actions/<module>.ts`.
- Each module exposes both a versioned API surface and a `Server Page -> private client shell` Web UI under `src/app/[locale]/<module>`.
- API and Web UI share the same schema, authorization, DAL, transactions, cache tags, and response contract.
- Route Handlers are the formal external API surface for module data; they do not contain a second data-access implementation.
- Route protection follows the Next.js 16 `src/proxy.ts` convention, with explicit authorization in every Page, Action, API, and Agent entry.
- External AI agents can use the restricted Agent OpenAPI surface instead of general-purpose database access.

For the module blueprint rules, see `docs/architecture/MODULE_BLUEPRINT_V3.md`.

## Current Modules

### Quilts

- Household quilt and bedding inventory management.
- Transactional status changes with usage record synchronization.
- Server-side filtering, pagination, and cache-tag invalidation.

### Cards

- Trading card collection management with list, detail, overview, sold, and settings flows.
- AI-assisted workflows with Azure OpenAI-compatible providers and external market/search services.
- Standardized around the same module pattern used by quilts.

### Paddles

- Table tennis paddle, blade, and rubber configuration management.
- Detailed physical characteristics (weight, handle type, speed/control ratings), rubber sponge thickness, and valuation tracking.
- Complete Web UI CRUD, REST API, and Agent API tool support.

### Antiques

- Antique and cultural collectibles management across jade, woodwork, ceramics, metal, stone, and paper.
- Dimensions, dynasty/era attribution, appraisal records, certification, and value appreciation tracking.
- Complete Web UI CRUD, REST API, and Agent API tool support.

### Maps

- Historical and modern map collection management.
- Map classification (topographic, road, city, historical, thematic), materials, publishers, cartographers, dimensions, and preservation status.
- Complete Web UI CRUD, REST API, and Agent API tool support.

### Spirits

- Fine spirits, vintage wine, and alcohol collection management.
- Categorization (whisky, cognac, baijiu, wine, etc.), region, vintage, age, ABV, cask types, bottle seal status, and tasting notes.
- Complete Web UI CRUD, REST API, and Agent API tool support.

### Shared Areas

- Settings, dashboard, users, admin, analytics, reports, and authentication all live inside the same App Router shell and reuse the same server-first principles where possible.

## REST API

All modules provide a uniform external REST API with standard `ApiResponse<T>` envelopes, Zod validation, and error contracts. See [docs/API_REFERENCE.md](docs/API_REFERENCE.md) for full documentation and curl examples.

- `GET /api/<module>` — List records with filtering, search, sorting, and pagination
- `POST /api/<module>` — Create a record
- `GET /api/<module>/:id` — Get a single record
- `PATCH /api/<module>/:id` — Partial update (send `null` to clear fields)
- `DELETE /api/<module>/:id` — Delete a record

Supported modules: `quilts`, `cards`, `paddles`, `antiques`, `maps`, `spirits`.

## Tech Stack

- Next.js `16.2.10`
- React `19.2.7`
- TypeScript `6.0.3`
- next-intl `4.13.2`
- Better Auth `1.6.23`
- Neon Serverless PostgreSQL
- Drizzle ORM `0.45.2`
- Zod `4.4.3`
- Tailwind CSS `4.3.2`
- TanStack React Query `5.101.2`
- Vercel deployment

## Repository Layout

```text
src/
  proxy.ts
  app/
    [locale]/
      quilts/
      cards/
      paddles/
      antiques/
      maps/
      spirits/
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
    paddles/
    antiques/
    maps/
    spirits/
  types/
docs/
```

## Environment Variables

Copy `.env.example` to `.env.local` and keep only the values your deployment actually uses.

### Required

```env
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
NEXT_PUBLIC_BETTER_AUTH_URL=
```

`BETTER_AUTH_URL` is required for deployed environments and recommended locally.

### Optional Platform And Infrastructure

```env
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
REDIS_URL=
VERCEL_URL=
WEBHOOK_ERROR_URL=
NODE_ENV=development
```

### Optional Card AI And Data Providers

```env
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_DEPLOYMENT=gpt-5-mini
PERPLEXITY_API_KEY=
RAPID_API_KEY=
EBAY_APP_ID=
EBAY_CERT_ID=
EBAY_DEV_ID=
EBAY_ENVIRONMENT=production
```

Some card-provider settings can also be managed from the application settings UI and stored in the database. Environment variables remain useful for bootstrap and server-only fallback cases.

### Agent API

Users create their own Agent API keys from **Settings -> Agent API Keys**. Keys inherit the same subsystem access as the user who created them, so an AI agent can only operate on modules that user can access.

QMS uses a household-shared business data model: module records are shared by authenticated household members rather than isolated per login. A record or Agent `userId` is retained for provenance and audit attribution. See `docs/PROJECT_SUMMARY.md` for the review decision and security boundaries.

The public agent guide is available at `/AGENT_API.md`. The Agent API exposes a narrow OpenAPI surface at `/api/agent/openapi.json` and a single tool endpoint at `/api/agent/tools`. Write tools require `confirm=true` and an `idempotencyKey`; successful writes are recorded in `agent_idempotency_keys` so repeated requests can be safely replayed.

## Local Development

```powershell
npm install
Copy-Item .env.example .env.local
npm run db:migrate
npm run dev
```

Open `http://localhost:3000`.

If you are on macOS or Linux, replace `Copy-Item` with `cp`.

Database migrations target Neon Postgres. Keep the real Neon `DATABASE_URL` in `.env.local` or your deployment environment, and do not use a local `localhost:5432` database for this project.

## Useful Scripts

```bash
# development
npm run dev
npm run dev:turbo

# quality
npm run lint
npm run lint:check
npm run format
npm run format:check
npm run type-check
npm test
npm run build

# database
npm run db:generate
npm run db:migrate
npm run db:studio
npm run db:drop
```

Use `npm run db:migrate` for Neon schema changes. `npm run db:push` remains available for deliberate development experiments only and should not be used against production.

`npm run db:setup` and `npm run health:check` are convenience commands for a running local server.

## Recommended Release Verification

Before cutting a release, run:

```bash
npm run lint:check
npm run type-check
npm test
npm run build
```

## Documentation

- English docs index: `docs/README.md`
- Legacy module standard: `docs/archive/MODULE_STANDARD.md`
- Active module blueprint: `docs/architecture/MODULE_BLUEPRINT_V3.md`
- Authentication summary: `docs/architecture/AUTH_IMPLEMENTATION_SUMMARY.md`
- Deployment env guide: `docs/guides/VERCEL-ENV-SETUP.md`
- Database migrations: `docs/guides/DATABASE_MIGRATIONS.md`
- Changelog: `CHANGELOG.md`

## License

MIT. See `LICENSE`.
