import { randomUUID } from 'crypto';

import bcrypt from 'bcryptjs';
import { cacheLife, cacheTag, revalidateTag } from 'next/cache';
import { and, asc, eq, ne, sql } from 'drizzle-orm';

import { db } from '@/db';
import { authAccount, authSession, authUser, users, type User } from '@/db/schema';
import { normalizeModuleIds, type RegisteredModuleId } from '@/modules/module-ids';
import { usersCacheTags } from '@/modules/core/cache-tags';

export const usersCacheTag = usersCacheTags.root;

/**
 * Invalidate every user cache tag affected by a write.
 *
 * Contract: call this only AFTER the surrounding transaction has committed.
 * `revalidateTag` does not participate in rollback, so invalidating inside a
 * transaction could clear caches while leaving the data unchanged.
 */
function invalidateUserWriteTags(id?: string): void {
  revalidateTag(usersCacheTags.root, 'max');
  revalidateTag(usersCacheTags.list, 'max');
  if (id) {
    revalidateTag(usersCacheTags.item(id), 'max');
  }
}

export type UserRole = 'admin' | 'member';
export type UserModule = RegisteredModuleId;

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  activeModules: UserModule[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  hashedPassword: string;
  role: UserRole;
  activeModules: UserModule[];
}

export interface UpdateUserData {
  id: string;
  name?: string;
  email?: string;
  hashedPassword?: string;
  role?: UserRole;
  activeModules?: UserModule[];
}

function normalizeRole(value: unknown): UserRole {
  return value === 'admin' ? 'admin' : 'member';
}

export const normalizeModules = normalizeModuleIds;

function toUserSummary(user: User): UserSummary {
  const preferences = user.preferences ?? {};

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: normalizeRole(preferences.role),
    activeModules: normalizeModules(preferences.activeModules),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function listUsers(): Promise<UserSummary[]> {
  'use cache';
  cacheLife('moduleList');
  cacheTag(usersCacheTags.root, usersCacheTags.list);

  const result = await db.select().from(users).orderBy(asc(users.createdAt));
  return result.map(toUserSummary);
}

export async function isUserEmailTaken(email: string, excludeUserId?: string): Promise<boolean> {
  const conditions = [eq(users.email, email)];

  if (excludeUserId) {
    conditions.push(ne(users.id, excludeUserId));
  }

  const result = await db
    .select({ id: users.id })
    .from(users)
    .where(conditions.length > 1 ? and(...conditions) : conditions[0])
    .limit(1);

  return result.length > 0;
}

export async function createUser(data: CreateUserData): Promise<UserSummary> {
  const createdUser = await db.transaction(async tx => {
    const userId = `user_${randomUUID()}`;

    await tx.insert(authUser).values({
      id: userId,
      name: data.name,
      email: data.email,
      emailVerified: false,
    });

    await tx.insert(authAccount).values({
      id: `account_${randomUUID()}`,
      accountId: userId,
      providerId: 'credential',
      userId,
      password: data.hashedPassword,
    });

    const [user] = await tx
      .insert(users)
      .values({
        id: userId,
        name: data.name,
        email: data.email,
        hashedPassword: data.hashedPassword,
        preferences: {
          role: data.role,
          activeModules: [...new Set(data.activeModules)],
        },
      })
      .returning();

    return user;
  });

  invalidateUserWriteTags(createdUser.id);

  return toUserSummary(createdUser);
}

export async function updateUser(data: UpdateUserData): Promise<UserSummary | null> {
  const [updatedUser] = await db.transaction(async tx => {
    // Serialize preference merges with subscription changes to avoid lost updates.
    const [existingUser] = await tx
      .select()
      .from(users)
      .where(eq(users.id, data.id))
      .limit(1)
      .for('update');
    if (!existingUser) return [];
    const existingPreferences = existingUser.preferences ?? {};
    const now = new Date();

    await tx
      .update(authUser)
      .set({
        name: data.name ?? existingUser.name,
        email: data.email ?? existingUser.email,
        updatedAt: now,
      })
      .where(eq(authUser.id, data.id));

    if (data.hashedPassword) {
      await tx
        .update(authAccount)
        .set({ password: data.hashedPassword, updatedAt: now })
        .where(and(eq(authAccount.userId, data.id), eq(authAccount.providerId, 'credential')));
    }

    if (data.email !== undefined || data.hashedPassword !== undefined || data.role !== undefined) {
      await tx.delete(authSession).where(eq(authSession.userId, data.id));
    }

    return tx
      .update(users)
      .set({
        name: data.name ?? existingUser.name,
        email: data.email ?? existingUser.email,
        ...(data.hashedPassword ? { hashedPassword: data.hashedPassword } : {}),
        preferences: {
          ...existingPreferences,
          ...(data.role ? { role: data.role } : {}),
          ...(data.activeModules
            ? {
                activeModules: [...new Set(data.activeModules)],
              }
            : {}),
        },
        updatedAt: now,
      })
      .where(eq(users.id, data.id))
      .returning();
  });

  if (updatedUser) {
    invalidateUserWriteTags(data.id);
  }

  return updatedUser ? toUserSummary(updatedUser) : null;
}

export async function deleteUser(id: string): Promise<boolean> {
  const deletedUsers = await db.transaction(async tx => {
    await tx.delete(authSession).where(eq(authSession.userId, id));
    await tx.delete(authAccount).where(eq(authAccount.userId, id));
    await tx.delete(authUser).where(eq(authUser.id, id));

    return tx.delete(users).where(eq(users.id, id)).returning({ id: users.id });
  });

  if (deletedUsers.length > 0) {
    invalidateUserWriteTags(id);
  }

  return deletedUsers.length > 0;
}

// ============================================================================
// Module subscriptions
// ============================================================================

export type ModuleSubscriptionAction = 'subscribe' | 'unsubscribe' | 'toggle';

export interface ModuleSubscriptionResult {
  /** The user's modules after the operation. */
  activeModules: UserModule[];
  /** Whether `moduleId` is active after the operation. */
  subscribed: boolean;
  /** False when the request was a no-op (already in the desired state). */
  changed: boolean;
}

/**
 * Read a user's active modules.
 *
 * Normalised through `normalizeModuleIds`, so a stale or hand-edited value in
 * `preferences.activeModules` cannot leak a module ID that no longer exists.
 */
export async function getUserActiveModules(userId: string): Promise<UserModule[]> {
  const [row] = await db
    .select({ preferences: users.preferences })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!row) {
    throw new Error('User not found');
  }

  return normalizeModules(row.preferences?.activeModules);
}

/**
 * Add, remove, or toggle one module in a user's `preferences.activeModules`.
 *
 * The read-modify-write runs inside a transaction holding a row lock
 * (`SELECT ... FOR UPDATE`). The previous implementation read the array, computed the
 * new value and wrote it back with no transaction, so two concurrent toggles could both
 * read the same starting array and the later write would silently discard the earlier
 * one — a lost subscription.
 *
 * Cache invalidation happens after the commit, never inside the transaction.
 */
export async function setUserModuleSubscription(
  userId: string,
  moduleId: UserModule,
  action: ModuleSubscriptionAction
): Promise<ModuleSubscriptionResult> {
  const result = await db.transaction(async tx => {
    const [locked] = await tx
      .select({ preferences: users.preferences })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .for('update');

    if (!locked) {
      throw new Error('User not found');
    }

    const currentModules = normalizeModules(locked.preferences?.activeModules);
    const isSubscribed = currentModules.includes(moduleId);

    const shouldBeSubscribed =
      action === 'subscribe' ? true : action === 'unsubscribe' ? false : !isSubscribed;

    if (shouldBeSubscribed === isSubscribed) {
      return { activeModules: currentModules, subscribed: isSubscribed, changed: false };
    }

    const activeModules = shouldBeSubscribed
      ? [...currentModules, moduleId]
      : currentModules.filter(module => module !== moduleId);

    await tx
      .update(users)
      .set({
        preferences: { ...(locked.preferences ?? {}), activeModules },
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return { activeModules, subscribed: shouldBeSubscribed, changed: true };
  });

  if (result.changed) {
    invalidateUserWriteTags(userId);
  }

  return result;
}

// ============================================================================
// Legacy Auth Migration DAL Helper
// ============================================================================

async function ensureBetterAuthTables() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS auth_user (
      id text PRIMARY KEY NOT NULL,
      name text NOT NULL,
      email text NOT NULL UNIQUE,
      email_verified boolean DEFAULT false NOT NULL,
      image text,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS auth_account (
      id text PRIMARY KEY NOT NULL,
      account_id text NOT NULL,
      provider_id text NOT NULL,
      user_id text NOT NULL REFERENCES auth_user(id) ON DELETE cascade,
      access_token text,
      refresh_token text,
      id_token text,
      access_token_expires_at timestamp,
      refresh_token_expires_at timestamp,
      scope text,
      password text,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS auth_session (
      id text PRIMARY KEY NOT NULL,
      expires_at timestamp NOT NULL,
      token text NOT NULL UNIQUE,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL,
      ip_address text,
      user_agent text,
      user_id text NOT NULL REFERENCES auth_user(id) ON DELETE cascade
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS auth_verification (
      id text PRIMARY KEY NOT NULL,
      identifier text NOT NULL,
      value text NOT NULL,
      expires_at timestamp NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    )
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS auth_user_email_idx ON auth_user USING btree (email)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS auth_account_user_idx ON auth_account USING btree (user_id)
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS auth_account_provider_account_idx
      ON auth_account USING btree (provider_id, account_id)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS auth_session_token_idx ON auth_session USING btree (token)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS auth_session_user_idx ON auth_session USING btree (user_id)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS auth_verification_identifier_idx
      ON auth_verification USING btree (identifier)
  `);
}

/**
 * Check whether a user exists in the legacy `users` table and migrate their credentials
 * into Better Auth's `auth_user` and `auth_account` tables on first successful password match.
 */
export async function migrateLegacyUserToBetterAuth(
  email: string,
  password: string
): Promise<boolean> {
  const normalizedEmail = email.toLowerCase();
  const legacyRows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      hashedPassword: users.hashedPassword,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(sql`lower(${users.email}) = ${normalizedEmail}`)
    .limit(1);
  const legacyUser = legacyRows[0];

  if (!legacyUser) return false;

  const passwordMatches = await bcrypt.compare(password, legacyUser.hashedPassword);
  if (!passwordMatches) return false;

  await ensureBetterAuthTables();

  await db.transaction(async tx => {
    const [existingAuthUser] = await tx
      .select({ id: authUser.id })
      .from(authUser)
      .where(sql`lower(${authUser.email}) = ${normalizedEmail}`)
      .limit(1);
    const authUserId = existingAuthUser?.id ?? legacyUser.id;

    if (existingAuthUser) {
      await tx
        .update(authUser)
        .set({
          name: legacyUser.name,
          email: normalizedEmail,
          updatedAt: new Date(),
        })
        .where(eq(authUser.id, authUserId));
    } else {
      await tx
        .insert(authUser)
        .values({
          id: authUserId,
          name: legacyUser.name,
          email: normalizedEmail,
          emailVerified: false,
          createdAt: legacyUser.createdAt,
          updatedAt: legacyUser.updatedAt,
        })
        .onConflictDoUpdate({
          target: authUser.id,
          set: {
            name: legacyUser.name,
            email: normalizedEmail,
            updatedAt: new Date(),
          },
        });
    }

    await tx
      .insert(authAccount)
      .values({
        id: `credential_${authUserId}`,
        accountId: authUserId,
        providerId: 'credential',
        userId: authUserId,
        password: legacyUser.hashedPassword,
        createdAt: legacyUser.createdAt,
        updatedAt: legacyUser.updatedAt,
      })
      .onConflictDoUpdate({
        target: [authAccount.providerId, authAccount.accountId],
        set: {
          password: legacyUser.hashedPassword,
          updatedAt: new Date(),
        },
      });
  });

  return true;
}
