/**
 * Users API Route
 *
 * GET /api/users - List all users (admin only)
 * POST /api/users - Create new user (admin only)
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
  createInternalErrorResponse,
} from '@/lib/api/response';

/**
 * GET /api/users - List all users
 */
export async function GET() {
  try {
    const session = await auth();

    console.log('[API /api/users] Session:', session?.user);

    // Check authentication and admin role
    if (!session?.user || session.user.role !== 'admin') {
      console.log('[API /api/users] Unauthorized access attempt');
      return createUnauthorizedResponse('需要管理员权限');
    }

    // Fetch all users from actual database table "user" (not "users")
    console.log('[API /api/users] Executing query...');
    const result = await db.execute(sql`
      SELECT id, name, email, role, created_at as "createdAt"
      FROM "user"
      ORDER BY created_at
    `);

    console.log('[API /api/users] Query result:', result);
    console.log('[API /api/users] Result rows:', result.rows);

    const allUsers = result.rows as Array<{
      id: string;
      name: string | null;
      email: string;
      role: string | null;
      createdAt: Date;
    }>;

    console.log('[API /api/users] Found users:', allUsers.length);
    console.log('[API /api/users] Users:', allUsers.map(u => ({ email: u.email, name: u.name })));

    // Transform users to match expected format
    const transformedUsers = allUsers.map(user => ({
      id: user.id,
      name: user.name || '',
      email: user.email,
      role: user.role?.toLowerCase() || 'member',
      activeModules: [], // TODO: Add activeModules support to database
      createdAt: user.createdAt,
      updatedAt: user.createdAt, // Use createdAt as updatedAt for now
    }));

    return createSuccessResponse({
      users: transformedUsers,
      total: transformedUsers.length,
    });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return createInternalErrorResponse('获取用户列表失败', error);
  }
}

/**
 * POST /api/users - Create new user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // Check authentication and admin role
    if (!session?.user || session.user.role !== 'admin') {
      return createUnauthorizedResponse('需要管理员权限');
    }

    const body = await request.json();
    const { name, email, password, role = 'MEMBER' } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return createBadRequestResponse('姓名、邮箱和密码是必需的');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return createBadRequestResponse('邮箱格式不正确');
    }

    // Validate password length
    if (password.length < 6) {
      return createBadRequestResponse('密码至少需要6个字符');
    }

    // Check if email already exists
    const existingResult = await db.execute(sql`
      SELECT id FROM "user" WHERE email = ${email} LIMIT 1
    `);

    if (existingResult.rows.length > 0) {
      return createBadRequestResponse('该邮箱已被注册');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate user ID (UUID format to match existing users)
    const userId = crypto.randomUUID();

    // Create user in actual database table
    const result = await db.execute(sql`
      INSERT INTO "user" (id, name, email, password, role, created_at)
      VALUES (${userId}, ${name}, ${email}, ${hashedPassword}, ${role.toUpperCase()}, NOW())
      RETURNING id, name, email, role, created_at as "createdAt"
    `);

    const newUser = result.rows[0] as {
      id: string;
      name: string;
      email: string;
      role: string;
      createdAt: Date;
    };

    return createSuccessResponse(
      {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role.toLowerCase(),
          activeModules: [],
          createdAt: newUser.createdAt,
        },
      },
      undefined,
      201
    );
  } catch (error) {
    console.error('Failed to create user:', error);
    return createInternalErrorResponse('创建用户失败', error);
  }
}
