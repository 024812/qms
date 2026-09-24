import { NextRequest } from 'next/server';
import { z } from 'zod';

import { changePassword, PasswordChangeError } from '@/lib/data/settings';
import { requireApiSession } from '@/lib/api/route-auth';
import { withRateLimit, rateLimiters } from '@/lib/rate-limit';
import {
  createBadRequestResponse,
  createInternalErrorResponse,
  createSuccessResponse,
  createValidationErrorResponse,
} from '@/lib/api/response';
import { zodFieldErrors } from '@/lib/api/action-result';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(12),
});

/**
 * Compatibility API surface for password changes.
 *
 * The credential lookup, hash verification and session revocation live in
 * `src/lib/data/settings.ts#changePassword` — this route is only the HTTP
 * adapter. It used to re-implement all of it inline against `@/db`, which made
 * it a second, silently-diverging copy of the same business operation
 * (blueprint §10.3).
 */
export async function POST(request: NextRequest) {
  return withRateLimit(request, rateLimiters.auth, async () => {
    try {
      const authResult = await requireApiSession();
      if (!authResult.ok) return authResult.response;

      const validationResult = changePasswordSchema.safeParse(await request.json());

      if (!validationResult.success) {
        return createValidationErrorResponse(
          'Password validation failed',
          zodFieldErrors(validationResult.error)
        );
      }

      await changePassword(authResult.session.user.id, validationResult.data);

      return createSuccessResponse({
        changed: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      if (error instanceof SyntaxError) {
        return createBadRequestResponse('Request body must be valid JSON');
      }

      if (error instanceof PasswordChangeError) {
        // A wrong current password is a 400, not a 401 — the caller is
        // authenticated, they just supplied the wrong secret.
        return createValidationErrorResponse(error.message, {
          currentPassword: [error.message],
        });
      }

      return createInternalErrorResponse('Failed to change password', error);
    }
  });
}
