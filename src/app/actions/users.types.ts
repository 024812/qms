import type { UserModule, UserRole, UserSummary } from '@/lib/data/users';

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
