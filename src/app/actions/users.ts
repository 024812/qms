'use server';

import { updateTag } from 'next/cache';
import { z } from 'zod';

import type { GetUsersActionData } from './users.types';
import { auth } from '@/auth';
import { hashPassword } from '@/lib/auth/password';
import {
  createUser,
  deleteUser,
  isUserEmailTaken,
  listUsers,
  type UserSummary,
  updateUser,
} from '@/lib/data/users';
import { MODULE_IDS } from '@/modules/module-ids';
import { usersCacheTags } from '@/modules/core/cache-tags';
import {
  badRequestErrorResult,
  conflictErrorResult,
  internalErrorResult,
  notFoundErrorResult,
  unauthorizedErrorResult,
  validationErrorResult,
  zodFieldErrors,
  type ActionResult,
} from '@/lib/api/action-result';

const createUserSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z
    .string()
    .trim()
    .email('Invalid email address')
    .transform(value => value.toLowerCase()),
  password: z.string().min(12, 'Password must be at least 12 characters'),
  role: z.enum(['admin', 'member']).default('member'),
  activeModules: z.array(z.enum(MODULE_IDS)).default([]),
});

const updateUserSchema = z
  .object({
    id: z.string().trim().min(1, 'User ID is required'),
    name: z.string().trim().min(1, 'Name is required').optional(),
    email: z
      .string()
      .trim()
      .email('Invalid email address')
      .transform(value => value.toLowerCase())
      .optional(),
    password: z.string().optional(),
    role: z.enum(['admin', 'member']).optional(),
    activeModules: z.array(z.enum(MODULE_IDS)).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.password !== undefined && value.password !== '' && value.password.length < 6) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['password'],
        message: 'Password must be at least 6 characters',
      });
    }
  });

const deleteUserSchema = z.object({
  id: z.string().trim().min(1, 'User ID is required'),
});

async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== 'admin') {
    return null;
  }

  return session;
}

export async function getUsersAction(): Promise<ActionResult<GetUsersActionData>> {
  try {
    const session = await requireAdmin();

    if (!session) {
      return unauthorizedErrorResult('Requires admin privileges');
    }

    const users = await listUsers();

    return {
      success: true,
      data: {
        users,
        total: users.length,
      },
    };
  } catch {
    return internalErrorResult('Failed to fetch users');
  }
}

export async function createUserAction(
  input: unknown
): Promise<ActionResult<{ user: UserSummary }>> {
  try {
    const session = await requireAdmin();

    if (!session) {
      return unauthorizedErrorResult('Requires admin privileges');
    }

    const validationResult = createUserSchema.safeParse(input);

    if (!validationResult.success) {
      return validationErrorResult('Validation failed', zodFieldErrors(validationResult.error));
    }

    const data = validationResult.data;

    if (await isUserEmailTaken(data.email)) {
      return conflictErrorResult('A user with this email already exists');
    }

    const user = await createUser({
      ...data,
      hashedPassword: await hashPassword(data.password),
    });

    updateTag(usersCacheTags.root);
    updateTag(usersCacheTags.list);

    return {
      success: true,
      data: { user },
    };
  } catch {
    return internalErrorResult('Failed to create user');
  }
}

export async function updateUserAction(
  input: unknown
): Promise<ActionResult<{ user: UserSummary }>> {
  try {
    const session = await requireAdmin();

    if (!session) {
      return unauthorizedErrorResult('Requires admin privileges');
    }

    const validationResult = updateUserSchema.safeParse(input);

    if (!validationResult.success) {
      return validationErrorResult('Validation failed', zodFieldErrors(validationResult.error));
    }

    const data = validationResult.data;

    if (data.email && (await isUserEmailTaken(data.email, data.id))) {
      return conflictErrorResult('A user with this email already exists');
    }

    const user = await updateUser({
      ...data,
      ...(data.password
        ? {
            hashedPassword: await hashPassword(data.password),
          }
        : {}),
    });

    if (!user) {
      return notFoundErrorResult('User not found');
    }

    updateTag(usersCacheTags.root);
    updateTag(usersCacheTags.list);

    return {
      success: true,
      data: { user },
    };
  } catch {
    return internalErrorResult('Failed to update user');
  }
}

export async function deleteUserAction(
  input: unknown
): Promise<ActionResult<{ message: string; deletedUserId: string }>> {
  try {
    const session = await requireAdmin();

    if (!session) {
      return unauthorizedErrorResult('Requires admin privileges');
    }

    const validationResult = deleteUserSchema.safeParse(input);

    if (!validationResult.success) {
      return validationErrorResult('Validation failed', zodFieldErrors(validationResult.error));
    }

    const data = validationResult.data;

    if (session.user.id === data.id) {
      return badRequestErrorResult('You cannot delete your own account');
    }

    const deleted = await deleteUser(data.id);

    if (!deleted) {
      return notFoundErrorResult('User not found');
    }

    updateTag(usersCacheTags.root);
    updateTag(usersCacheTags.list);

    return {
      success: true,
      data: {
        message: 'User deleted',
        deletedUserId: data.id,
      },
    };
  } catch {
    return internalErrorResult('Failed to delete user');
  }
}
