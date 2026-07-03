# Initialize Database Data

QMS schema changes are managed by Drizzle migrations against Neon Postgres. Do not rely on the setup endpoint to create tables.

## 1. Apply Schema Migrations

Make sure `DATABASE_URL` points to the intended Neon database or branch, then run:

```bash
npm run db:migrate
```

The project does not use a local `localhost:5432` database as its migration target.

## 2. Seed Starter Data

If the deployment needs starter quilts, call the setup endpoint after migrations have completed.

Using curl:

```bash
curl -X POST https://your-app-domain.vercel.app/api/setup
```

Using PowerShell:

```powershell
Invoke-WebRequest -Uri "https://your-app-domain.vercel.app/api/setup" -Method POST
```

The endpoint is intended for starter data only. It should not be treated as the canonical schema migration mechanism.

## 3. Verify It Worked

After initialization, visit:

- `https://your-app-domain.vercel.app/quilts`

You should see starter quilt records instead of an empty state.

## Troubleshooting

### "Database already has data"

The database is already initialized. No action is needed.

### "Database connection failed"

Check that the `DATABASE_URL` environment variable is set correctly in Vercel and points to Neon:

1. Go to `Vercel Dashboard -> Your Project -> Settings -> Environment Variables`.
2. Verify `DATABASE_URL` is set for the correct environment.
3. Run `npm run db:migrate` against the same Neon target.

### Still showing "No quilts yet"

1. Hard refresh the page.
2. Check Vercel runtime logs for database or auth errors.
3. Confirm the setup endpoint was called after migrations completed.

## Next Steps

After initializing data:

1. Add or edit quilts from the app UI.
2. Test the usage tracking flow.
3. Explore analytics and reports.
