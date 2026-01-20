/**
 * Change Password REST API
 *
 * POST /api/settings/change-password - Change user password
 *
 * Requirements: 1.2, 1.3 - REST API for settings
 * Requirements: 5.3 - Consistent API response format
 * Requirements: 11.5 - Rate limiting
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { withRateLimit, rateLimiters } from '@/lib/rate-limit';
import {
  createSuccessResponse,
  createValidationErrorResponse,
  createUnauthorizedResponse,
  createInternalErrorResponse,
} from '@/lib/api/response';

// Input schema for password change
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

/**
 * POST /api/settings/change-password
 *
 * Change the user password.
 *
 * Request Body:
 * - currentPassword: Current password for verification
 * - newPassword: New password (min 8 characters)
 */
export async function POST(request: NextRequest) {
  return withRateLimit(request, rateLimiters.auth, async () => {
    try {
      // Get current user session
      const session = await auth();
      if (!session?.user?.id) {
        return createUnauthorizedResponse('请先登录');
      }

      const body = await request.json();

      // Validate input using Zod schema
      const validationResult = changePasswordSchema.safeParse(body);

      if (!validationResult.success) {
        return createValidationErrorResponse(
          '密码数据验证失败',
          validationResult.error.flatten().fieldErrors as Record<string, string[]>
        );
      }

      const { currentPassword, newPassword } = validationResult.data;

      // Get current user's password hash from users table
      const userResult = await db.execute(sql`
        SELECT hashed_password FROM users WHERE id = ${session.user.id} LIMIT 1
      `);

      const user = userResult.rows[0] as { hashed_password: string | null } | undefined;

      if (!user || !user.hashed_password) {
        return createInternalErrorResponse('用户密码未设置');
      }

      // Verify current password
      const isValid = await verifyPassword(currentPassword, user.hashed_password);
      if (!isValid) {
        return createUnauthorizedResponse('当前密码不正确');
      }

      // Generate new hash
      const newHash = await hashPassword(newPassword);

      // Update password in users table
      await db.execute(sql`
        UPDATE users 
        SET hashed_password = ${newHash}, updated_at = NOW()
        WHERE id = ${session.user.id}
      `);

      return createSuccessResponse({
        changed: true,
        message: '密码修改成功',
      });
    } catch (error) {
      return createInternalErrorResponse('修改密码失败', error);
    }
  });
}
