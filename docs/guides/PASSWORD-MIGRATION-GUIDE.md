# Password Migration Guide

This guide covers migration from older QMS password/auth setups to the current Better Auth implementation.

## Current State

QMS now uses:

- Better Auth email/password login.
- Better Auth tables: `auth_user`, `auth_session`, `auth_account`, `auth_verification`.
- Application user table: `users`.
- `users.id` aligned with `auth_user.id`.
- `users.hashed_password` retained for account settings and compatibility workflows.

The old environment-variable password model is no longer part of the runtime path.

## Deprecated Inputs

Remove these from new deployments:

- `QMS_PASSWORD_HASH`
- `QMS_JWT_SECRET`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

Use these instead:

```env
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
NEXT_PUBLIC_BETTER_AUTH_URL=
```

## Migration Targets

A migrated user should have:

1. A row in `auth_user`.
2. A matching row in `users` with the same `id`.
3. A bcrypt password hash stored in the Better Auth credential account and in `users.hashed_password` where needed.
4. Role and active modules stored in `users.preferences`.

## Recommended Migration Path

1. Apply the schema migration.

```bash
npm run db:migrate
```

2. Register or recreate users through the application UI when possible.

This is the safest path because the registration action creates both Better Auth and application user records.

3. For existing users, verify ID alignment.

```sql
select u.id, u.email, au.id as auth_user_id
from users u
left join auth_user au on au.id = u.id;
```

4. Set roles and modules in `users.preferences`.

Example shape:

```json
{
  "role": "admin",
  "activeModules": ["quilts", "cards"]
}
```

5. Redeploy or restart the app after changing auth environment variables.

## Verification

- `/register` creates a user that can immediately sign in.
- `/login` accepts the migrated user's email and password.
- Protected pages redirect to `/login` when signed out.
- Admin pages reject users whose `users.preferences.role` is not `admin`.
- The sidebar and module routing reflect `users.preferences.activeModules`.
- No deployment environment still depends on `QMS_PASSWORD_HASH` or `QMS_JWT_SECRET`.

## Troubleshooting

### Login succeeds but permissions or modules are wrong

Check `users.preferences`. Better Auth owns the session, but app permissions are read from `users`.

### Login fails after environment changes

Check `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and `NEXT_PUBLIC_BETTER_AUTH_URL`, then clear browser cookies and retry.

### A user exists in `users` but cannot sign in

Create the corresponding Better Auth records by registering the account again in a controlled environment, or migrate the user through a dedicated script that writes both Better Auth and application user records.
