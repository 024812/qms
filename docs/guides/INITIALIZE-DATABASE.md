# Initialize Database Data

QMS schema changes are managed by Drizzle migrations against Neon Postgres. Do not rely on the setup endpoint to create tables.

## 1. Apply Schema Migrations

Make sure `DATABASE_URL` points to the intended Neon database or branch, then run:

```bash
npm run db:migrate
```

The project does not use a local `localhost:5432` database as its migration target.

## 2. Create the First Administrator

Migration success does not create an account. The `/api/setup` endpoint is intentionally admin-only, and the user-management actions also require an existing administrator. Before the first login, create one administrator through your controlled operations process (for example, a reviewed one-time SQL/bootstrap script against the intended Neon branch). Do not put an initial password in this document or commit it to the repository.

Verify that the account has:

- a unique email address;
- the `admin` role;
- a credential password stored using the application's password hashing flow; and
- access only to the intended database environment.

After the first administrator signs in, rotate the temporary password and remove or disable any bootstrap credential/script. If your deployment process does not provide a reviewed bootstrap path, stop here: do not assume that migration or `/api/setup` can create the first account.

## 3. Seed Starter Data

If the deployment needs starter quilts, sign in as the administrator and call the setup endpoint after migrations have completed.

Using curl with the authenticated session:

```bash
curl -X POST --cookie "<admin-session-cookie>" https://your-app-domain.vercel.app/api/setup
```

Using PowerShell with the authenticated session:

```powershell
Invoke-WebRequest -Uri "https://your-app-domain.vercel.app/api/setup" -Method POST -WebSession $adminSession
```

The endpoint is intended for starter data only. It does not create users or tables and should not be treated as the canonical schema migration mechanism.

## 4. Verify It Worked

After initialization, visit:

- `https://your-app-domain.vercel.app/quilts`

You should see starter quilt records instead of an empty state.

## 5. Troubleshooting

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

## 6. Next Steps

After initializing data:

1. Add or edit quilts from the app UI.
2. Test the usage tracking flow.
3. Explore analytics and reports.
