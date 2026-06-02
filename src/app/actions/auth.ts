'use server';

import { betterAuthInstance } from '@/auth';
import { db } from '@/db';
import { authAccount, authSession, authUser, users } from '@/db/schema';
import type { LoginActionState, RegisterResult } from './auth.types';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { z } from 'zod';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
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

export async function registerUser(
  _prevState: RegisterResult | null | undefined,
  formData: FormData
): Promise<RegisterResult> {
  let signedUpUserId: string | null = null;

  try {
    const validationResult = registerSchema.safeParse({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
    });

    if (!validationResult.success) {
      return {
        success: false,
        message: 'Validation failed',
        error: validationResult.error.issues.map(err => err.message).join(', '),
      };
    }

    const { name, email, password } = validationResult.data;
    const normalizedEmail = email.toLowerCase();
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existingUser.length > 0) {
      return {
        success: false,
        message: 'Registration failed',
        error: 'User with this email already exists',
      };
    }

    const signUpResult = await betterAuthInstance.api.signUpEmail({
      body: {
        name,
        email: normalizedEmail,
        password,
      },
      headers: await headers(),
    });
    signedUpUserId = signUpResult.user.id;

    await db.insert(users).values({
      id: signUpResult.user.id,
      name,
      email: normalizedEmail,
      hashedPassword: await bcrypt.hash(password, 10),
      preferences: {
        role: 'member',
        activeModules: [],
      },
    });

    return {
      success: true,
      message: 'Registration successful',
    };
  } catch (error) {
    if (signedUpUserId) {
      const userId = signedUpUserId;

      await db.transaction(async tx => {
        await tx.delete(authSession).where(eq(authSession.userId, userId));
        await tx.delete(authAccount).where(eq(authAccount.userId, userId));
        await tx.delete(authUser).where(eq(authUser.id, userId));
      });
    }

    if (process.env.NODE_ENV === 'development') {
      console.error('Registration error:', error);
    }

    return {
      success: false,
      message: 'Registration failed',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
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

  try {
    await betterAuthInstance.api.signInEmail({
      body: {
        email: email.toLowerCase(),
        password,
      },
      headers: await headers(),
    });

    redirect(callbackUrl);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    return {
      success: false,
      message: 'Login failed',
      error: 'Invalid email or password',
    };
  }
}
