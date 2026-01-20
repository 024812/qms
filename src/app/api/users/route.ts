/**
 * Users API Route
 *
 * GET /api/users - List all users (admin only)
 * POST /api/users - Create new user (admin only)
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
  createInternalErrorResponse,
} from '@/lib/api/response';

/**
 * GET /api/users - List all users
 */
export async function GET() {
  try {
    const session = await auth();

    // Check authentication and admin role
    if (!session?.user || session.user.role !== 'admin') {
      return createUnauthorizedResponse('需要管理员权限');
    }

    // Fetch all users (exclude password)
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        preferences: users.preferences,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .orderBy(users.createdAt);

    // Transform users to include role and activeModules
    const transformedUsers = allUsers.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.preferences?.role || 'member',
      activeModules: user.preferences?.activeModules || [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
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
    const { name, email, password, role = 'member', activeModules = [] } = body;

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
    const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (existingUser) {
      return createBadRequestResponse('该邮箱已被注册');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate user ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        id: userId,
        name,
        email,
        hashedPassword,
        preferences: {
          role,
          activeModules,
        },
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        preferences: users.preferences,
        createdAt: users.createdAt,
      });

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
