'use server';

import { updateTag } from 'next/cache';
import { z } from 'zod';

import { auth } from '@/auth';
import { hashPassword } from '@/lib/auth/password';
import {
  createUser,
  deleteUser,
  isUserEmailTaken,
  listUsers,
  updateUser,
  usersCacheTag,
  type UserModule,
  type UserRole,
  type UserSummary,
} from '@/lib/data/users';

const MODULE_IDS = ['quilts', 'cards'] as const;

interface ActionSuccess<T> {
  success: true;
  data: T;
}

interface ActionError {
  success: false;
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
}

type ActionResult<T> = ActionSuccess<T> | ActionError;

export interface GetUsersActionData {
  users: UserSummary[];
  total: number;
}

export interface CreateUserActionInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  activeModules: UserModule[];
}

export interface UpdateUserActionInput {
  id: string;
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  activeModules?: UserModule[];
}

export interface DeleteUserActionInput {
  id: string;
}

const createUserSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z
    .string()
    .trim()
    .email('Invalid email address')
    .transform(value => value.toLowerCase()),
  password: z.string().min(6, 'Password must be at least 6 characters'),
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

function zodFieldErrors(error: z.ZodError): Record<string, string[]> {
  return error.flatten().fieldErrors as Record<string, string[]>;
}

function unauthorizedResult(message = 'Requires admin privileges'): ActionResult<never> {
  return {
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message,
    },
  };
}

function validationErrorResult(
  message: string,
  fieldErrors: Record<string, string[]>
): ActionResult<never> {
  return {
    success: false,
    error: {
      code: 'VALIDATION_FAILED',
      message,
      fieldErrors,
    },
  };
}

function conflictErrorResult(message: string): ActionResult<never> {
  return {
    success: false,
    error: {
      code: 'ALREADY_EXISTS',
      message,
    },
  };
}

function badRequestResult(message: string): ActionResult<never> {
  return {
    success: false,
    error: {
      code: 'BAD_REQUEST',
      message,
    },
  };
}

function notFoundResult(message: string): ActionResult<never> {
  return {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message,
    },
  };
}

function internalErrorResult(message: string): ActionResult<never> {
  return {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message,
    },
  };
}

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
      return unauthorizedResult();
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
      return unauthorizedResult();
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

    updateTag(usersCacheTag);

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
      return unauthorizedResult();
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
      return notFoundResult('User not found');
    }

    updateTag(usersCacheTag);

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
      return unauthorizedResult();
    }

    const validationResult = deleteUserSchema.safeParse(input);

    if (!validationResult.success) {
      return validationErrorResult('Validation failed', zodFieldErrors(validationResult.error));
    }

    const data = validationResult.data;

    if (session.user.id === data.id) {
      return badRequestResult('You cannot delete your own account');
    }

    const deleted = await deleteUser(data.id);

    if (!deleted) {
      return notFoundResult('User not found');
    }

    updateTag(usersCacheTag);

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
