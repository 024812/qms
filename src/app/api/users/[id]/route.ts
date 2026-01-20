/**
 * User Detail API Route
 *
 * PATCH /api/users/[id] - Update user (admin only)
 * DELETE /api/users/[id] - Delete user (admin only)
 *
 * Requirements: 8.1 (User management)
 * 
 * Note: This uses the actual production database schema with "user" table (singular)
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
    const { name, email, password, role } = body;

    // Check if user exists
    const existingResult = await db.execute(sql`
      SELECT id, name, email, role FROM "user" WHERE id = ${id} LIMIT 1
    `);

    if (existingResult.rows.length === 0) {
      return createNotFoundResponse('用户不存在');
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: unknown[] = [];

    if (name !== undefined) {
      updates.push(`name = $${updates.length + 1}`);
      values.push(name);
    }

    if (email !== undefined) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return createBadRequestResponse('邮箱格式不正确');
      }

      // Check if email is already taken by another user
      const emailCheckResult = await db.execute(sql`
        SELECT id FROM "user" WHERE email = ${email} AND id != ${id} LIMIT 1
      `);

      if (emailCheckResult.rows.length > 0) {
        return createBadRequestResponse('该邮箱已被其他用户使用');
      }

      updates.push(`email = $${updates.length + 1}`);
      values.push(email);
    }

    if (password !== undefined && password !== '') {
      // Validate password length
      if (password.length < 6) {
        return createBadRequestResponse('密码至少需要6个字符');
      }
      const hashedPassword = await hashPassword(password);
      updates.push(`password = $${updates.length + 1}`);
      values.push(hashedPassword);
    }

    if (role !== undefined) {
      updates.push(`role = $${updates.length + 1}`);
      values.push(role.toUpperCase());
    }

    // If no updates, return current user
    if (updates.length === 0) {
      const user = existingResult.rows[0] as {
        id: string;
        name: string;
        email: string;
        role: string;
      };
      return createSuccessResponse({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role.toLowerCase(),
          activeModules: [],
          updatedAt: new Date(),
        },
      });
    }

    // Add id to values for WHERE clause
    values.push(id);

    // Execute update
    const updateQuery = `
      UPDATE "user"
      SET ${updates.join(', ')}
      WHERE id = $${values.length}
      RETURNING id, name, email, role
    `;

    const result = await db.execute(sql.raw(updateQuery, values));
    const updatedUser = result.rows[0] as {
      id: string;
      name: string;
      email: string;
      role: string;
    };

    return createSuccessResponse({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role.toLowerCase(),
        activeModules: [],
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
    const existingResult = await db.execute(sql`
      SELECT id FROM "user" WHERE id = ${id} LIMIT 1
    `);

    if (existingResult.rows.length === 0) {
      return createNotFoundResponse('用户不存在');
    }

    // Delete user (cascade will delete related data)
    await db.execute(sql`
      DELETE FROM "user" WHERE id = ${id}
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
