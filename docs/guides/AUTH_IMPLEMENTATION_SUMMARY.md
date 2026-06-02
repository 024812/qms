# Authentication Implementation Summary

The current authentication implementation uses Better Auth with email/password login, Drizzle, and PostgreSQL.

## Current Entry Points

- `src/auth.ts`
  Configures Better Auth, the Drizzle adapter, email/password hashing, session settings, and the exported `auth()` helper.
- `src/app/api/auth/[...all]/route.ts`
  Exposes the Better Auth route handler under `/api/auth/*`.
- `src/app/actions/auth.ts`
  Handles localized login and registration server actions.
- `src/app/actions/logout.ts`
  Handles sign-out through Better Auth.
- `src/lib/auth/client.ts`
  Provides the Better Auth React client and `useSession()` hook.
- `src/proxy.ts`
  Applies Next.js 16 route protection and locale routing.

## Data Model

Better Auth stores authentication records in dedicated tables:

- `auth_user`
- `auth_session`
- `auth_account`
- `auth_verification`

The application still keeps domain user data in `users`:

- `users.id` matches `auth_user.id`.
- `users.hashed_password` is kept for compatibility with settings/password workflows.
- `users.preferences.role` stores `admin` or `member`.
- `users.preferences.activeModules` stores enabled modules.

Registration creates both the Better Auth user and the application `users` record. If the app user insert fails, the server action removes the partially created Better Auth records.

## Session Shape

`auth()` returns this application-facing session shape:

```ts
type Session = {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    role: 'admin' | 'member';
    activeModules: string[];
  };
  expires: string;
};
```

The extra `role` and `activeModules` fields are loaded from `users.preferences` through Better Auth's `customSession` plugin.

## Required Environment Variables

```env
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
NEXT_PUBLIC_BETTER_AUTH_URL=
```

`AUTH_SECRET` is supported as a fallback alias. `NEXTAUTH_SECRET` is only accepted as a last-resort legacy fallback and should not be used for new deployments.

## Route Protection

`src/proxy.ts` protects non-API application routes:

- Unauthenticated users are redirected to the localized `/login` page.
- Authenticated users visiting `/login` or `/register` are redirected back into the app.
- Single-module users entering the root route are redirected to their only enabled module.
- `/api/**`, Next.js assets, and static files are excluded from proxy protection.

API routes that need authentication use explicit helpers such as `requireApiSession()` and `requireApiAdmin()`.

## Database Migration

Apply the Better Auth schema with Drizzle migrations before deploying this release:

```bash
npm run db:migrate
```

For environments managed through direct SQL migration scripts, apply `migrations/011_migrate_users_to_better_auth.sql` after the existing user schema is present.

## Verification Checklist

- Visiting a protected page while signed out redirects to `/login`.
- Registering a new user creates matching records in `auth_user` and `users`.
- Correct credentials create a session and redirect to the requested callback URL.
- Wrong credentials are rejected without exposing internal errors.
- `session.user` includes `id`, `role`, and `activeModules`.
- Admin-only API routes reject non-admin users.
- Changing auth environment variables is followed by clearing cookies and restarting/redeploying.

## Deprecated Auth Paths

These are no longer part of the current implementation:

- `src/app/api/auth/[...nextauth]/route.ts`
- `src/types/next-auth.d.ts`
- Auth.js/NextAuth.js session callbacks
- `NEXTAUTH_URL` for new deployments
- `NEXTAUTH_SECRET` for new deployments
- `QMS_PASSWORD_HASH`
- `QMS_JWT_SECRET`
