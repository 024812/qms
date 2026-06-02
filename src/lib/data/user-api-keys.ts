import crypto from 'crypto';

import { and, eq, isNull, sql } from 'drizzle-orm';

import { db } from '@/db';
import { userApiKeys, users } from '@/db/schema';

export interface UserApiKeySummary {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface CreatedUserApiKey extends UserApiKeySummary {
  key: string;
}

export interface ApiKeyUserIdentity {
  apiKeyId: string;
  userId: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  activeModules: string[];
}

function hashApiKey(key: string) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

function createPlaintextApiKey() {
  return `qms_${crypto.randomBytes(32).toString('base64url')}`;
}

function normalizeRole(value: unknown): 'admin' | 'member' {
  return value === 'admin' ? 'admin' : 'member';
}

function normalizeModules(value: unknown): string[] {
  return Array.isArray(value) ? value.filter(item => typeof item === 'string') : [];
}

function toSummary(row: typeof userApiKeys.$inferSelect): UserApiKeySummary {
  return {
    id: row.id,
    name: row.name,
    keyPrefix: row.keyPrefix,
    createdAt: row.createdAt.toISOString(),
    lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
  };
}

async function ensureUserApiKeysTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS user_api_keys (
      id text PRIMARY KEY NOT NULL,
      user_id text NOT NULL REFERENCES users(id) ON DELETE cascade,
      name text NOT NULL,
      key_hash text NOT NULL UNIQUE,
      key_prefix text NOT NULL,
      last_used_at timestamp,
      created_at timestamp DEFAULT now() NOT NULL,
      revoked_at timestamp
    )
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS user_api_keys_user_idx ON user_api_keys USING btree (user_id)
  `);

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS user_api_keys_key_hash_idx
      ON user_api_keys USING btree (key_hash)
  `);
}

export async function listUserApiKeys(userId: string): Promise<UserApiKeySummary[]> {
  await ensureUserApiKeysTable();

  const rows = await db
    .select()
    .from(userApiKeys)
    .where(and(eq(userApiKeys.userId, userId), isNull(userApiKeys.revokedAt)));

  return rows.map(toSummary);
}

export async function createUserApiKey(userId: string, name: string): Promise<CreatedUserApiKey> {
  await ensureUserApiKeysTable();

  const key = createPlaintextApiKey();
  const [row] = await db
    .insert(userApiKeys)
    .values({
      userId,
      name,
      keyHash: hashApiKey(key),
      keyPrefix: key.slice(0, 12),
    })
    .returning();

  return { ...toSummary(row), key };
}

export async function revokeUserApiKey(userId: string, keyId: string): Promise<boolean> {
  await ensureUserApiKeysTable();

  const revoked = await db
    .update(userApiKeys)
    .set({ revokedAt: new Date() })
    .where(
      and(eq(userApiKeys.id, keyId), eq(userApiKeys.userId, userId), isNull(userApiKeys.revokedAt))
    )
    .returning({ id: userApiKeys.id });

  return revoked.length > 0;
}

export async function findUserByApiKey(key: string): Promise<ApiKeyUserIdentity | null> {
  await ensureUserApiKeysTable();

  const [row] = await db
    .select({
      apiKeyId: userApiKeys.id,
      userId: users.id,
      name: users.name,
      email: users.email,
      preferences: users.preferences,
    })
    .from(userApiKeys)
    .innerJoin(users, eq(userApiKeys.userId, users.id))
    .where(and(eq(userApiKeys.keyHash, hashApiKey(key)), isNull(userApiKeys.revokedAt)))
    .limit(1);

  if (!row) return null;

  await db
    .update(userApiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(userApiKeys.id, row.apiKeyId));

  return {
    apiKeyId: row.apiKeyId,
    userId: row.userId,
    name: row.name,
    email: row.email,
    role: normalizeRole(row.preferences.role),
    activeModules: normalizeModules(row.preferences.activeModules),
  };
}
