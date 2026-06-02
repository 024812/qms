import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { customSession } from 'better-auth/plugins';
import { nextCookies } from 'better-auth/next-js';
import bcrypt from 'bcryptjs';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import * as schema from '@/db/schema';
import { users } from '@/db/schema';

type UserRole = 'admin' | 'member';

export interface AppSessionUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: UserRole;
  activeModules: string[];
}

export interface AppSession {
  user: AppSessionUser;
  expires: string;
}

function normalizeRole(value: unknown): UserRole {
  return value === 'admin' ? 'admin' : 'member';
}

function normalizeModules(value: unknown): string[] {
  return Array.isArray(value) ? value.filter(item => typeof item === 'string') : [];
}

export const betterAuthInstance = betterAuth({
  appName: 'QMS',
  basePath: '/api/auth',
  secret: process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      ...schema,
      user: schema.authUser,
      session: schema.authSession,
      account: schema.authAccount,
      verification: schema.authVerification,
    },
  }),
  user: {
    modelName: 'user',
  },
  session: {
    modelName: 'session',
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  account: {
    modelName: 'account',
  },
  verification: {
    modelName: 'verification',
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    password: {
      hash: password => bcrypt.hash(password, 10),
      verify: ({ hash, password }) => bcrypt.compare(password, hash),
    },
  },
  plugins: [
    customSession(async ({ user, session }) => {
      const [appUser] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
      const preferences = appUser?.preferences ?? {};

      return {
        session,
        user: {
          ...user,
          role: normalizeRole(preferences.role),
          activeModules: normalizeModules(preferences.activeModules),
        },
      };
    }),
    nextCookies(),
  ],
});

export const handlers = betterAuthInstance.handler;

export async function auth(): Promise<AppSession | null> {
  const session = await betterAuthInstance.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return null;
  }

  return {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
      role: normalizeRole(session.user.role),
      activeModules: normalizeModules(session.user.activeModules),
    },
    expires: session.session.expiresAt.toISOString(),
  };
}

export type Session = AppSession;
