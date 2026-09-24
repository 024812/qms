'use server';

import { betterAuthInstance } from '@/auth';
import { migrateLegacyUserToBetterAuth } from '@/lib/data/users';
import type { LoginActionState, RegisterResult } from './auth.types';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { z } from 'zod';
import { normalizeInternalRedirect } from '@/lib/redirect-validation';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  // Existing credentials may predate the current password creation policy.
  password: z.string().min(1, 'Password is required'),
});

function normalizeCallbackUrl(value: FormDataEntryValue | null): string {
  return normalizeInternalRedirect(value, '/');
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

    const migrated = await migrateLegacyUserToBetterAuth(normalizedEmail, password).catch(error => {
      if (process.env.NODE_ENV === 'development') {
        console.error('Legacy auth migration error:', error);
      }
      return false;
    });

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
