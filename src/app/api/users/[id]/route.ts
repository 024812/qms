/**
 * User Detail API Route
 *
 * PATCH /api/users/[id] - Update user (admin only)
 * DELETE /api/users/[id] - Delete user (admin only)
 *
 * Requirements: 8.1 (User management)
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth/password';
import {
  createSuccessResponse,
  createUnauthorizedResponse,
  createBadRequestResponse,
  createNotFoundResponse,
  createInternalErrorResponse,
} from '@/lib/api/response';

/**
 * PATCH /api/users/[id] - Update user
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    // Check authentication and admin role
    if (!session?.user || session.user.role !== 'admin') {
      return createUnauthorizedResponse('需要管理员权限');
    }

    const { id } = await params;
    const body = await request.json();
    const { name, email, password, role, activeModules } = body;

    // Check if user exists
    const [existingUser] = await db.select().from(users).where(eq(users.id, id)).limit(1);

    if (!existingUser) {
      return createNotFoundResponse('用户不存在');
    }

    // Prepare update data
    const updateData: {
      name?: string;
      email?: string;
      hashedPassword?: string;
      preferences?: Record<string, unknown>;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (name !== undefined) {
      updateData.name = name;
    }

    if (email !== undefined) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return createBadRequestResponse('邮箱格式不正确');
      }

      // Check if email is already taken by another user
      const [emailUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);

      if (emailUser && emailUser.id !== id) {
        return createBadRequestResponse('该邮箱已被其他用户使用');
      }

      updateData.email = email;
    }

    if (password !== undefined && password !== '') {
      // Validate password length
      if (password.length < 6) {
        return createBadRequestResponse('密码至少需要6个字符');
      }
      updateData.hashedPassword = await hashPassword(password);
    }

    // Update preferences (role and activeModules)
    if (role !== undefined || activeModules !== undefined) {
      const currentPreferences = existingUser.preferences || {};
      updateData.preferences = {
        ...currentPreferences,
        ...(role !== undefined && { role }),
        ...(activeModules !== undefined && { activeModules }),
      };
    }

    // Update user
    const [updatedUser] = await db.update(users).set(updateData).where(eq(users.id, id)).returning({
      id: users.id,
      name: users.name,
      email: users.email,
      preferences: users.preferences,
      updatedAt: users.updatedAt,
    });

    return createSuccessResponse({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.preferences?.role || 'member',
        activeModules: updatedUser.preferences?.activeModules || [],
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    console.error('Failed to update user:', error);
    return createInternalErrorResponse('更新用户失败', error);
  }
}

/**
 * DELETE /api/users/[id] - Delete user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    // Check authentication and admin role
    if (!session?.user || session.user.role !== 'admin') {
      return createUnauthorizedResponse('需要管理员权限');
    }

    const { id } = await params;

    // Prevent deleting self
    if (session.user.id === id) {
      return createBadRequestResponse('不能删除自己的账户');
    }

    // Check if user exists
    const [existingUser] = await db.select().from(users).where(eq(users.id, id)).limit(1);

    if (!existingUser) {
      return createNotFoundResponse('用户不存在');
    }

    // Delete user (cascade will delete related items and logs)
    await db.delete(users).where(eq(users.id, id));

    return createSuccessResponse({
      message: '用户已删除',
      deletedUserId: id,
    });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return createInternalErrorResponse('删除用户失败', error);
  }
}
