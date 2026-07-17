# Authentication Implementation Summary

The current authentication implementation uses Better Auth with email/password login, Drizzle, and PostgreSQL.

## Current Entry Points

- `src/auth.ts`
  Configures Better Auth, the Drizzle adapter, email/password hashing, session settings, and the exported `auth()` helper.
- `src/app/api/auth/[...all]/route.ts`
  Exposes the Better Auth route handler under `/api/auth/*` and explicitly rejects `/api/auth/sign-up/*`.
- `src/app/actions/auth.ts`
  Handles localized login; the legacy registration action always rejects public account creation.
- `src/app/actions/users.ts`
  Provides the administrator-only account creation, update, and deletion workflow.
- `src/app/actions/logout.ts`
  Handles sign-out through Better Auth.
- `src/lib/auth/client.ts`
  Provides the Better Auth React client and `useSession()` hook.
- `src/proxy.ts`
  Applies Next.js 16 route protection and locale routing; `/register` always redirects to `/login`.

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

Administrator account creation writes the Better Auth user, credential account, and application `users` record in one database transaction. Public self-registration is not part of the account lifecycle.

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
- `/login` remains public; `/register` redirects to `/login` because public self-registration is disabled.
- New accounts are created by administrators from the user-management page.
- Single-module users entering the root route are redirected to their only enabled module.
- `/api/**`, Next.js assets, and static files are excluded from proxy protection.

API routes that need authentication use explicit helpers such as `requireApiSession()` and `requireApiAdmin()`.

## Database Migration

Apply all pending Drizzle migrations before deploying a release:

```bash
npm run db:migrate
```

The canonical schema is `src/db/schema.ts`, migration files live in `drizzle/`, and production changes use `npm run db:migrate` rather than `db:push` or ad-hoc SQL.

## Verification Checklist

- Visiting a protected page while signed out redirects to `/login`.
- `/register` and `/api/auth/sign-up/*` reject public account creation.
- An administrator-created account has matching records in `auth_user`, `auth_account`, and `users`.
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
