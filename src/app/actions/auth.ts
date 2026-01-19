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

import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { signIn } from '@/auth';

/**
 * Registration input validation schema
 */
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

/**
 * Registration result type
 */
type RegisterResult = {
  success: boolean;
  message: string;
  error?: string;
};

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
 * @param formData - Form data containing name, email, password, confirmPassword
 * @returns RegisterResult with success status and message
 */
export async function registerUser(formData: FormData): Promise<RegisterResult> {
  try {
    // Extract form data
    const rawData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
    };

    // Validate input
    const validationResult = registerSchema.safeParse(rawData);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((err) => err.message).join(', ');
      return {
        success: false,
        message: 'Validation failed',
        error: errors,
      };
    }

    const { name, email, password } = validationResult.data;

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return {
        success: false,
        message: 'Registration failed',
        error: 'User with this email already exists',
      };
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate UUID for id field
    const { randomUUID } = await import('crypto');
    const userId = randomUUID();

    // Create user with preferences
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

    // Automatically sign in the user
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
    console.error('Registration error:', error);
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
 * Login result type
 */
type LoginResult = {
  success: boolean;
  message: string;
  error?: string;
};

/**
 * Login user
 * 
 * This function:
 * 1. Validates input using Zod
 * 2. Attempts to sign in using Auth.js
 * 3. Returns result with success status
 * 
 * @param formData - Form data containing email and password
 * @returns LoginResult with success status and message
 */
export async function loginUser(formData: FormData): Promise<LoginResult> {
  try {
    // Extract form data
    const rawData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

    // Validate input
    const validationResult = loginSchema.safeParse(rawData);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((err) => err.message).join(', ');
      return {
        success: false,
        message: 'Validation failed',
        error: errors,
      };
    }

    const { email, password } = validationResult.data;

    // Attempt sign in
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (!result) {
      return {
        success: false,
        message: 'Login failed',
        error: 'Invalid credentials',
      };
    }

    return {
      success: true,
      message: 'Login successful',
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'Login failed',
      error: error instanceof Error ? error.message : 'Invalid credentials',
    };
  }
}
