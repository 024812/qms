/**
 * Authentication Server Actions
 *
 * This module provides server-side authentication actions including:
 * - User registration with password hashing
 * - Input validation using Zod
 * - Error handling
 *
 * Requirements: 8.1 (Authentication and user management)
 */

'use server';

import { signIn } from '@/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import type { LoginActionState, RegisterResult } from './auth.types';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { AuthError } from 'next-auth';
import { z } from 'zod';

/**
 * Registration input validation schema
 */
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

function normalizeCallbackUrl(value: FormDataEntryValue | null): string {
  if (typeof value !== 'string' || value.length === 0) {
    return '/';
  }

  if (!value.startsWith('/') || value.startsWith('//')) {
    return '/';
  }

  return value;
}

/**
 * Register a new user
 *
 * This function:
 * 1. Validates input using Zod
 * 2. Checks if user already exists
 * 3. Hashes password using bcrypt
 * 4. Creates user in database
 * 5. Automatically signs in the user
 *
 * @param _prevState - Previous state (for useActionState)
 * @param formData - Form data containing name, email, password, confirmPassword
 * @returns RegisterResult with success status and message
 */
export async function registerUser(
  _prevState: RegisterResult | null | undefined,
  formData: FormData
): Promise<RegisterResult> {
  try {
    const rawData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
    };

    const validationResult = registerSchema.safeParse(rawData);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(err => err.message).join(', ');
      return {
        success: false,
        message: 'Validation failed',
        error: errors,
      };
    }

    const { name, email, password } = validationResult.data;
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (existingUser.length > 0) {
      return {
        success: false,
        message: 'Registration failed',
        error: 'User with this email already exists',
      };
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const { randomUUID } = await import('crypto');
    const userId = randomUUID();

    await db
      .insert(users)
      .values({
        id: userId,
        name,
        email,
        hashedPassword,
        preferences: {
          role: 'member',
          activeModules: [],
        },
      })
      .returning();

    await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    return {
      success: true,
      message: 'Registration successful',
    };
  } catch (error) {
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

/**
 * Login input validation schema
 */
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

/**
 * Login user
 *
 * This function:
 * 1. Validates input using Zod
 * 2. Attempts to sign in using Auth.js
 * 3. Lets Auth.js own the successful redirect + session cookie response
 *
 * @param prevState - Previous state (for useActionState)
 * @param formData - Form data containing email, password, and optional callbackUrl
 */
export async function loginUser(
  _prevState: LoginActionState | null | undefined,
  formData: FormData
): Promise<LoginActionState | null> {
  const callbackUrl = normalizeCallbackUrl(formData.get('callbackUrl'));
  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const validationResult = loginSchema.safeParse(rawData);

  if (!validationResult.success) {
    const errors = validationResult.error.issues.map(err => err.message).join(', ');
    return {
      success: false,
      message: 'Validation failed',
      error: errors,
    };
  }

  const { email, password } = validationResult.data;

  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: callbackUrl,
    });

    return null;
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        success: false,
        message: '登录失败',
        error:
          error.type === 'CredentialsSignin' ? '邮箱或密码错误' : '认证服务暂时不可用，请稍后重试',
      };
    }

    throw error;
  }
}
