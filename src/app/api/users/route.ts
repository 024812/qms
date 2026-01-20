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

    // Fetch all users from actual database table "users" (plural)
    console.log('[API /api/users] Executing query...');
    const result = await db.execute(sql`
      SELECT id, name, email, preferences, created_at as "createdAt"
      FROM "users"
      ORDER BY created_at
    `);

    console.log('[API /api/users] Query result:', result);
    console.log('[API /api/users] Result rows:', result.rows);

    const allUsers = result.rows as Array<{
      id: string;
      name: string | null;
      email: string;
      preferences: any;
      createdAt: Date;
    }>;

    console.log('[API /api/users] Found users:', allUsers.length);
    console.log('[API /api/users] Users:', allUsers.map(u => ({ email: u.email, name: u.name })));

    // Transform users to match expected format
    const transformedUsers = allUsers.map(user => ({
      id: user.id,
      name: user.name || '',
      email: user.email,
      role: user.preferences?.role || 'member',
      activeModules: user.preferences?.activeModules || [],
      createdAt: user.createdAt,
      updatedAt: user.createdAt,
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
    const { name, email, password, role = 'MEMBER', activeModules = [] } = body;

    console.log('[API /api/users POST] Creating user:', { name, email, role, activeModules });

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
      SELECT id FROM "users" WHERE email = ${email} LIMIT 1
    `);

    if (existingResult.rows.length > 0) {
      return createBadRequestResponse('该邮箱已被注册');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate user ID (using cuid format to match existing users)
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Prepare preferences
    const preferences = {
      role: role.toLowerCase(),
      activeModules: activeModules,
      defaultView: 'grid',
      seasonalReminders: true,
      notificationsEnabled: true,
    };

    console.log('[API /api/users POST] Preferences:', preferences);

    // Create user in actual database table
    const result = await db.execute(sql`
      INSERT INTO "users" (id, name, email, hashed_password, preferences, created_at, updated_at)
      VALUES (${userId}, ${name}, ${email}, ${hashedPassword}, ${JSON.stringify(preferences)}, NOW(), NOW())
      RETURNING id, name, email, preferences, created_at as "createdAt"
    `);

    const newUser = result.rows[0] as {
      id: string;
      name: string;
      email: string;
      preferences: any;
      createdAt: Date;
    };

    return createSuccessResponse(
      {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.preferences?.role || 'member',
          activeModules: newUser.preferences?.activeModules || [],
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
