-- Backfill Better Auth credential records from the existing application users table.
-- Run after drizzle/0004_glorious_nightmare.sql has created auth_user/auth_account.

INSERT INTO auth_user (id, name, email, email_verified, created_at, updated_at)
SELECT id, name, lower(email), false, created_at, updated_at
FROM users
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = EXCLUDED.updated_at;

INSERT INTO auth_account (
  id,
  account_id,
  provider_id,
  user_id,
  password,
  created_at,
  updated_at
)
SELECT
  'credential_' || id,
  id,
  'credential',
  id,
  hashed_password,
  created_at,
  updated_at
FROM users
ON CONFLICT (provider_id, account_id) DO UPDATE SET
  password = EXCLUDED.password,
  updated_at = EXCLUDED.updated_at;
