'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  CreateUserActionInput,
  DeleteUserActionInput,
  GetUsersActionData,
  UpdateUserActionInput,
} from '@/app/actions/users.types';
import {
  createUserAction,
  deleteUserAction,
  getUsersAction,
  updateUserAction,
} from '@/app/actions/users';

const USERS_KEY = ['users'] as const;

function unwrapActionResult<T>(
  result:
    | {
        success: true;
        data: T;
      }
    | {
        success: false;
        error: {
          message: string;
        };
      }
): T {
  if (!result.success) {
    throw new Error(result.error.message);
  }

  return result.data;
}

export function useUsers(options?: { initialData?: GetUsersActionData }) {
  return useQuery({
    queryKey: USERS_KEY,
    queryFn: async () => unwrapActionResult(await getUsersAction()),
    ...(options?.initialData ? { initialData: options.initialData } : {}),
    staleTime: 60000,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateUserActionInput) =>
      unwrapActionResult(await createUserAction(input)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: USERS_KEY });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateUserActionInput) =>
      unwrapActionResult(await updateUserAction(input)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: USERS_KEY });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DeleteUserActionInput) =>
      unwrapActionResult(await deleteUserAction(input)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: USERS_KEY });
    },
  });
}
