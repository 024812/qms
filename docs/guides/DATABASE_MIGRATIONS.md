# Database Migrations

QMS uses Neon Postgres as the canonical database. Do not run project migrations against a local `localhost:5432` database.

## Environment

Keep the real Neon connection string in local ignored env files or deployment environment variables:

```env
DATABASE_URL="postgresql://...neon.tech/...?...sslmode=require"
```

The value must not be committed. `drizzle.config.ts` loads `.env` first and then `.env.local`, so `.env.local` can override stale local settings.

## Commands

Generate a new migration after schema changes:

```bash
npm run db:generate
```

Apply pending migrations to Neon:

```bash
npm run db:migrate
```

Open Drizzle Studio:

```bash
npm run db:studio
```

## Current Migration State

The existing Neon database originally had tables but did not have Drizzle migration records. Its history was baselined through `0005`; migrations `0006_agent_idempotency_keys` and `0007_gifted_morlocks` have since been applied normally.

Verified state:

- `drizzle.__drizzle_migrations` contains records through `0007`.
- `public.agent_idempotency_keys` exists.
- `public.usage_records_active_quilt_unique_idx` exists.
- There are no duplicate active usage records or Quilt/usage status mismatches after migration `0007`.
- A follow-up `npm run db:migrate` reports `migrations applied successfully`.

## Notes

- `0005_create_user_api_keys.sql` is now recorded in `drizzle/meta/_journal.json`.
- `0006_agent_idempotency_keys.sql` creates durable replay protection for Agent write tools.
- `0007_gifted_morlocks.sql` reconciles the Quilt item-number sequence and usage status data, then enforces one active usage record per Quilt.
- Keep migration files and `drizzle/meta/_journal.json` in sync.
