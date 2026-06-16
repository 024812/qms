import crypto from 'crypto';

import { and, eq, isNull } from 'drizzle-orm';

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

export async function listUserApiKeys(userId: string): Promise<UserApiKeySummary[]> {
  const rows = await db
    .select()
    .from(userApiKeys)
    .where(and(eq(userApiKeys.userId, userId), isNull(userApiKeys.revokedAt)));

  return rows.map(toSummary);
}

export async function createUserApiKey(userId: string, name: string): Promise<CreatedUserApiKey> {
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
