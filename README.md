# QMS

QMS is a modular family item management system built with Next.js 16, React 19, Auth.js v5, Neon Serverless PostgreSQL, Drizzle ORM, and Vercel.

Current release: `2026.4.2`

## What Is Standardized

- `quilts` and `cards` are the first copyable module blueprints.
- Each module keeps one canonical data layer in `src/lib/data/<module>.ts`.
- Each module keeps one canonical server action surface in `src/app/actions/<module>.ts`.
- Each module page follows a `Server Page -> private client shell` split under `src/app/[locale]/<module>`.
- Route Handlers remain compatibility or external HTTP surfaces, not the internal source of truth.
- Route protection follows the Next.js 16 `proxy.ts` convention at the project root.

For the module blueprint rules, see `docs/MODULE_BLUEPRINT_V2.md`.

## Current Modules

### Quilts

- Household quilt and bedding inventory management.
- Transactional status changes with usage record synchronization.
- Server-side filtering, pagination, and cache-tag invalidation.

### Cards

- Trading card collection management with list, detail, overview, sold, and settings flows.
- AI-assisted workflows with Azure OpenAI-compatible providers and external market/search services.
- Standardized around the same module pattern used by quilts.

### Shared Areas

- Settings, dashboard, users, admin, analytics, reports, and authentication all live inside the same App Router shell and reuse the same server-first principles where possible.

## Tech Stack

- Next.js `16.2.2`
- React `19.2.4`
- TypeScript `5.9.3`
- next-intl `4.8.4`
- Auth.js / NextAuth.js v5 (`next-auth@5.0.0-beta.30`)
- Neon Serverless PostgreSQL
- Drizzle ORM `0.45.2`
- Zod `4.3.6`
- Tailwind CSS `4.2.2`
- TanStack React Query `5.96.0`
- Zustand `5.0.12`
- Vercel deployment

## Repository Layout

```text
proxy.ts
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
```

## Environment Variables

Copy `.env.example` to `.env.local` and keep only the values your deployment actually uses.

### Required

```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

`NEXTAUTH_URL` is required for deployed environments and recommended locally.

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

## Local Development

```powershell
npm install
Copy-Item .env.example .env.local
npm run db:push
npm run dev
```

Open `http://localhost:3000`.

If you are on macOS or Linux, replace `Copy-Item` with `cp`.

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
npm run db:push
npm run db:studio
npm run db:drop
```

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
- Module standard: `docs/MODULE_STANDARD.md`
- Active module blueprint: `docs/MODULE_BLUEPRINT_V2.md`
- Changelog: `CHANGELOG.md`

## License

MIT. See `LICENSE`.
