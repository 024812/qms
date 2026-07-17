import { NextRequest } from 'next/server';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { authAccount, authSession, db, users } from '@/db';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { withRateLimit, rateLimiters } from '@/lib/rate-limit';
import {
  createBadRequestResponse,
  createInternalErrorResponse,
  createSuccessResponse,
  createUnauthorizedResponse,
  createValidationErrorResponse,
} from '@/lib/api/response';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function POST(request: NextRequest) {
  return withRateLimit(request, rateLimiters.auth, async () => {
    try {
      const session = await auth();

      if (!session?.user?.id) {
        return createUnauthorizedResponse('Please sign in first');
      }

      const validationResult = changePasswordSchema.safeParse(await request.json());

      if (!validationResult.success) {
        return createValidationErrorResponse(
          'Password validation failed',
          validationResult.error.flatten().fieldErrors as Record<string, string[]>
        );
      }

      const { currentPassword, newPassword } = validationResult.data;
      const [account] = await db
        .select({ password: authAccount.password })
        .from(authAccount)
        .where(
          and(eq(authAccount.userId, session.user.id), eq(authAccount.providerId, 'credential'))
        )
        .limit(1);

      if (!account?.password) {
        return createInternalErrorResponse('Password is not configured for this user');
      }

      const isValid = await verifyPassword(currentPassword, account.password);

      if (!isValid) {
        return createUnauthorizedResponse('Current password is incorrect');
      }

      const newHash = await hashPassword(newPassword);

      await db.transaction(async tx => {
        await tx.delete(authSession).where(eq(authSession.userId, session.user.id));
        await tx
          .update(authAccount)
          .set({ password: newHash, updatedAt: new Date() })
          .where(
            and(eq(authAccount.userId, session.user.id), eq(authAccount.providerId, 'credential'))
          );

        await tx
          .update(users)
          .set({ hashedPassword: newHash, updatedAt: new Date() })
          .where(eq(users.id, session.user.id));
      });

      return createSuccessResponse({
        changed: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      if (error instanceof SyntaxError) {
        return createBadRequestResponse('Request body must be valid JSON');
      }
      return createInternalErrorResponse('Failed to change password', error);
    }
  });
}
