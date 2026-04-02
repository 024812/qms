import { randomUUID } from 'crypto';

import { cacheLife, cacheTag } from 'next/cache';
import { and, asc, eq, ne } from 'drizzle-orm';

import { db } from '@/db';
import { users, type User } from '@/db/schema';

export const usersCacheTag = 'users';

export type UserRole = 'admin' | 'member';
export type UserModule = 'quilts' | 'cards';

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

function normalizeModules(value: unknown): UserModule[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((module): module is UserModule => module === 'quilts' || module === 'cards');
}

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

async function findUserRecordById(id: string): Promise<User | null> {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] ?? null;
}

export async function listUsers(): Promise<UserSummary[]> {
  'use cache';
  cacheLife('minutes');
  cacheTag(usersCacheTag);

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
  const [createdUser] = await db
    .insert(users)
    .values({
      id: `user_${randomUUID()}`,
      name: data.name,
      email: data.email,
      hashedPassword: data.hashedPassword,
      preferences: {
        role: data.role,
        activeModules: [...new Set(data.activeModules)],
      },
    })
    .returning();

  return toUserSummary(createdUser);
}

export async function updateUser(data: UpdateUserData): Promise<UserSummary | null> {
  const existingUser = await findUserRecordById(data.id);

  if (!existingUser) {
    return null;
  }

  const existingPreferences = existingUser.preferences ?? {};

  const [updatedUser] = await db
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
      updatedAt: new Date(),
    })
    .where(eq(users.id, data.id))
    .returning();

  return updatedUser ? toUserSummary(updatedUser) : null;
}

export async function deleteUser(id: string): Promise<boolean> {
  const deletedUsers = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id });
  return deletedUsers.length > 0;
}
