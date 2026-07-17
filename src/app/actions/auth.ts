'use server';

import { betterAuthInstance } from '@/auth';
import { db } from '@/db';
import { authAccount, authUser, users } from '@/db/schema';
import type { LoginActionState, RegisterResult } from './auth.types';
import bcrypt from 'bcryptjs';
import { eq, sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

function normalizeCallbackUrl(value: FormDataEntryValue | null): string {
  if (typeof value !== 'string' || value.length === 0) {
    return '/';
  }

  if (!value.startsWith('/') || value.startsWith('//')) {
    return '/';
  }

  return value;
}

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

async function ensureLegacyUserCanUseBetterAuth(email: string, password: string) {
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

export async function registerUser(
  _prevState: RegisterResult | null | undefined,
  _formData: FormData
): Promise<RegisterResult> {
  return {
    success: false,
    message: 'Public registration is disabled',
    error: 'Ask an administrator to create the account.',
  };
}

export async function loginUser(
  _prevState: LoginActionState | null | undefined,
  formData: FormData
): Promise<LoginActionState | null> {
  const callbackUrl = normalizeCallbackUrl(formData.get('callbackUrl'));
  const validationResult = loginSchema.safeParse({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  });

  if (!validationResult.success) {
    return {
      success: false,
      message: 'Validation failed',
      error: validationResult.error.issues.map(err => err.message).join(', '),
    };
  }

  const { email, password } = validationResult.data;
  const normalizedEmail = email.toLowerCase();

  try {
    await betterAuthInstance.api.signInEmail({
      body: {
        email: normalizedEmail,
        password,
      },
      headers: await headers(),
    });

    redirect(callbackUrl);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    const migrated = await ensureLegacyUserCanUseBetterAuth(normalizedEmail, password).catch(
      error => {
        if (process.env.NODE_ENV === 'development') {
          console.error('Legacy auth migration error:', error);
        }
        return false;
      }
    );

    if (migrated) {
      try {
        await betterAuthInstance.api.signInEmail({
          body: {
            email: normalizedEmail,
            password,
          },
          headers: await headers(),
        });

        redirect(callbackUrl);
      } catch (retryError) {
        if (isRedirectError(retryError)) {
          throw retryError;
        }
      }
    }

    return {
      success: false,
      message: 'Login failed',
      error: 'Invalid email or password',
    };
  }
}
