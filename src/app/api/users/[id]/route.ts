/**
 * User Detail API Route
 *
 * PATCH /api/users/[id] - Update user (admin only)
 * DELETE /api/users/[id] - Delete user (admin only)
 *
 * Requirements: 8.1 (User management)
 * 
 * Note: This uses the actual production database schema with "users" table
 * Schema: id (text), email (text), name (text), hashed_password (text), preferences (jsonb)
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
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
export async function PATCH(
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
    const body = await request.json();
    const { name, email, password, role, activeModules } = body;

    // Check if user exists
    const existingResult = await db.execute(sql`
      SELECT id, name, email, hashed_password, preferences FROM "users" WHERE id = ${id} LIMIT 1
    `);

    if (existingResult.rows.length === 0) {
      return createNotFoundResponse('用户不存在');
    }

    const existingUser = existingResult.rows[0] as {
      id: string;
      name: string;
      email: string;
      hashed_password: string | null;
      preferences: any;
    };

    // Prepare updated values
    const updatedName = name !== undefined ? name : existingUser.name;
    const updatedEmail = email !== undefined ? email : existingUser.email;
    let updatedHashedPassword = existingUser.hashed_password;
    
    // Update preferences
    const updatedPreferences = {
      ...existingUser.preferences,
      role: role !== undefined ? role.toLowerCase() : (existingUser.preferences?.role || 'member'),
      activeModules: activeModules !== undefined ? activeModules : (existingUser.preferences?.activeModules || []),
    };

    // Validate email if provided
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return createBadRequestResponse('邮箱格式不正确');
      }

      // Check if email is already taken by another user
      const emailCheckResult = await db.execute(sql`
        SELECT id FROM "users" WHERE email = ${email} AND id != ${id} LIMIT 1
      `);

      if (emailCheckResult.rows.length > 0) {
        return createBadRequestResponse('该邮箱已被其他用户使用');
      }
    }

    // Hash new password if provided
    if (password !== undefined && password !== '') {
      if (password.length < 6) {
        return createBadRequestResponse('密码至少需要6个字符');
      }
      updatedHashedPassword = await hashPassword(password);
    }

    // Execute update
    const result = await db.execute(sql`
      UPDATE "users"
      SET 
        name = ${updatedName}, 
        email = ${updatedEmail}, 
        hashed_password = ${updatedHashedPassword},
        preferences = ${JSON.stringify(updatedPreferences)},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, name, email, preferences
    `);

    const updatedUser = result.rows[0] as {
      id: string;
      name: string;
      email: string;
      preferences: any;
    };

    return createSuccessResponse({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.preferences?.role || 'member',
        activeModules: updatedUser.preferences?.activeModules || [],
        updatedAt: new Date(),
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
  _request: NextRequest,
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
    const existingResult = await db.execute(sql`
      SELECT id FROM "users" WHERE id = ${id} LIMIT 1
    `);

    if (existingResult.rows.length === 0) {
      return createNotFoundResponse('用户不存在');
    }

    // Delete user (cascade will delete related data)
    await db.execute(sql`
      DELETE FROM "users" WHERE id = ${id}
    `);

    return createSuccessResponse({
      message: '用户已删除',
      deletedUserId: id,
    });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return createInternalErrorResponse('删除用户失败', error);
  }
}
