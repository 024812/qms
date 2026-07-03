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

## 2026-07-03 Migration Baseline

The existing Neon database already had tables but did not have Drizzle migration records. The migration history was baselined by recording migrations `0000` through `0005`, then migration `0006_agent_idempotency_keys` was applied.

Verified state:

- `drizzle.__drizzle_migrations` contains records for `0000` through `0006`.
- `public.agent_idempotency_keys` exists.
- A follow-up `npm run db:migrate` reports `migrations applied successfully`.

## Notes

- `0005_create_user_api_keys.sql` is now recorded in `drizzle/meta/_journal.json`.
- `0006_agent_idempotency_keys.sql` creates durable replay protection for Agent write tools.
- Keep migration files and `drizzle/meta/_journal.json` in sync.
