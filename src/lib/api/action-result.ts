/**
 * The Server Action result contract.
 *
 * Every Server Action in `src/app/actions/` returns this shape, and the client
 * hooks in `src/hooks/` unwrap it. It used to be declared once per action
 * module — ten copies of the same three interfaces, plus twenty copies of the
 * error factories — and the copies had drifted: the "unauthorized" helper was
 * named `unauthorizedResult` in five modules and `unauthorizedErrorResult` in
 * the other five, `notFoundResult` existed alongside `notFoundErrorResult`, and
 * two modules omitted `fieldErrors` from the error shape entirely.
 *
 * Two properties are worth stating explicitly, because they are what the
 * consolidation buys:
 *
 *   1. `ACTION_ERROR_CODES` is the single runtime list of codes. The
 *      code → HTTP status map is typed as `Record<ActionErrorCode, number>`, so
 *      a new code cannot be emitted without also deciding its status — before
 *      this, an unknown code silently became a 500.
 *   2. `ActionError.code` is `ActionErrorCode` rather than `string`, so a typo
 *      in a factory is a compile error instead of an unmapped status at runtime.
 *
 * This module is imported by client components, so it must stay free of
 * server-only dependencies.
 */

import type { ZodError } from 'zod';

/**
 * Every error code a Server Action may return, in rough HTTP-status order.
 * Exported as a tuple so it can feed `z.enum()` and drive the status map.
 */
export const ACTION_ERROR_CODES = [
  'BAD_REQUEST',
  'VALIDATION_FAILED',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'ALREADY_EXISTS',
  'INTERNAL_ERROR',
] as const;

export type ActionErrorCode = (typeof ACTION_ERROR_CODES)[number];

/** HTTP status for each code. Typed as a total map — a new code must be added here. */
export const ACTION_ERROR_STATUS: Record<ActionErrorCode, number> = {
  BAD_REQUEST: 400,
  VALIDATION_FAILED: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  ALREADY_EXISTS: 409,
  INTERNAL_ERROR: 500,
};

export interface ActionSuccess<T> {
  success: true;
  data: T;
}

export interface ActionError {
  success: false;
  error: {
    code: ActionErrorCode;
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
}

export type ActionResult<T> = ActionSuccess<T> | ActionError;

// ============================================================================
// Error factories
// ============================================================================

/** The input failed schema validation. `fieldErrors` is optional: not every caller has a Zod error. */
export function validationErrorResult(
  message: string,
  fieldErrors?: Record<string, string[]>
): ActionResult<never> {
  return {
    success: false,
    error: {
      code: 'VALIDATION_FAILED',
      message,
      ...(fieldErrors ? { fieldErrors } : {}),
    },
  };
}

/** A read-modify-write targeted a row that does not exist. */
export function notFoundErrorResult(message: string): ActionResult<never> {
  return { success: false, error: { code: 'NOT_FOUND', message } };
}

/**
 * A write conflicts with the current state of the data.
 *
 * Emits `ALREADY_EXISTS` (409), not a hypothetical `CONFLICT` code — that is
 * what every existing call site sent, and the wire contract is unchanged.
 */
export function conflictErrorResult(message: string): ActionResult<never> {
  return { success: false, error: { code: 'ALREADY_EXISTS', message } };
}

/** The request was malformed in a way schema validation cannot express. */
export function badRequestErrorResult(message: string): ActionResult<never> {
  return { success: false, error: { code: 'BAD_REQUEST', message } };
}

/**
 * No valid session, or the session lacks the required access.
 *
 * The default message is the one most call sites relied on. The two admin-only
 * callers that used to default to `'Requires admin privileges'` pass it
 * explicitly, so no user-visible string changed in this refactor.
 */
export function unauthorizedErrorResult(message = 'Unauthorized'): ActionResult<never> {
  return { success: false, error: { code: 'UNAUTHORIZED', message } };
}

/** The caller is authenticated but not allowed to perform this operation. */
export function forbiddenErrorResult(message = 'Forbidden'): ActionResult<never> {
  return { success: false, error: { code: 'FORBIDDEN', message } };
}

/** An unexpected fault. The message is safe to surface; details are logged server-side. */
export function internalErrorResult(message: string): ActionResult<never> {
  return { success: false, error: { code: 'INTERNAL_ERROR', message } };
}

/**
 * Flatten a Zod error into the `fieldErrors` shape the contract expects.
 *
 * `zod` is imported as a type only: this module is pulled into the client bundle
 * by the hooks, and `flatten()` is called on an instance the caller already has,
 * so no zod runtime code is needed here.
 */
export function zodFieldErrors(error: ZodError): Record<string, string[]> {
  return error.flatten().fieldErrors as Record<string, string[]>;
}

// ============================================================================
// Client-side unwrapping
// ============================================================================

/**
 * Unwrap a successful result, or throw the error message.
 *
 * Used by the client hooks so a failed action surfaces through TanStack Query's
 * error channel instead of being silently treated as data. Previously each of
 * the four hooks carried its own byte-identical copy of this function.
 */
export function unwrapActionResult<T>(
  result: { success: true; data: T } | { success: false; error: { message: string } }
): T {
  if (!result.success) {
    throw new Error(result.error.message);
  }

  return result.data;
}
