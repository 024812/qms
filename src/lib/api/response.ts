/**
 * API Response Utilities
 *
 * Unified response format for consistent API responses across the application.
 * Requirements: 5.3 - Consistent error response format
 */

import { NextResponse } from 'next/server';
import { createError, ErrorCodes, type ErrorCode } from '@/lib/error-handler';
import { dbLogger } from '@/lib/logger';

/**
 * Standard API response interface
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

/**
 * Pagination metadata interface
 */
export interface PaginationMeta {
  page?: number;
  limit?: number;
  offset?: number;
  total: number;
  hasMore: boolean;
}

/**
 * Create a success response
 */
export function createSuccessResponse<T>(
  data: T,
  meta?: ApiResponse<T>['meta'],
  status: number = 200
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  return NextResponse.json(response, { status });
}

/**
 * Create a paginated success response
 */
export function createPaginatedResponse<T>(
  data: T[],
  pagination: PaginationMeta,
  status: number = 200
): NextResponse<ApiResponse<T[]>> {
  return createSuccessResponse(
    data,
    {
      total: pagination.total,
      limit: pagination.limit,
      page: pagination.page,
      hasMore: pagination.hasMore,
    },
    status
  );
}

/**
 * Create a created response (201)
 */
export function createCreatedResponse<T>(data: T): NextResponse<ApiResponse<T>> {
  return createSuccessResponse(data, undefined, 201);
}

/**
 * Create an error response
 */
export function createErrorResponse(
  code: ErrorCode | string,
  message: string,
  details?: Record<string, unknown>,
  status: number = 500
): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    {
      success: false,
      error: createError(code, message, details),
    },
    { status }
  );
}

/**
 * Create a validation error response
 */
export function createValidationErrorResponse(
  message: string,
  errors: Record<string, string[]>
): NextResponse<ApiResponse<never>> {
  return createErrorResponse(ErrorCodes.VALIDATION_FAILED, message, { errors }, 400);
}

/**
 * Create a not found error response
 */
export function createNotFoundResponse(resource: string): NextResponse<ApiResponse<never>> {
  return createErrorResponse(ErrorCodes.NOT_FOUND, `${resource}不存在`, undefined, 404);
}

/**
 * Create an unauthorized error response
 */
export function createUnauthorizedResponse(
  message: string = '未授权访问，请先登录'
): NextResponse<ApiResponse<never>> {
  return createErrorResponse(ErrorCodes.UNAUTHORIZED, message, undefined, 401);
}

/**
 * Create a forbidden error response
 */
export function createForbiddenResponse(
  message: string = '没有权限执行此操作'
): NextResponse<ApiResponse<never>> {
  return createErrorResponse(ErrorCodes.FORBIDDEN, message, undefined, 403);
}

/**
 * Create a conflict error response
 */
export function createConflictResponse(
  message: string,
  details?: Record<string, unknown>
): NextResponse<ApiResponse<never>> {
  return createErrorResponse(ErrorCodes.ALREADY_EXISTS, message, details, 409);
}

/**
 * Create a rate limit error response
 */
export function createRateLimitResponse(
  message: string = '请求过于频繁，请稍后重试'
): NextResponse<ApiResponse<never>> {
  return createErrorResponse('RATE_LIMITED', message, undefined, 429);
}

/**
 * Create an internal error response with logging
 * Note: Skips logging during build phase to reduce noise
 */
export function createInternalErrorResponse(
  message: string,
  error?: unknown,
  context?: Record<string, unknown>
): NextResponse<ApiResponse<never>> {
  // Skip logging during build phase (when NEXT_PHASE is set to "phase-production-build")
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

  // Log the error for debugging (only in runtime, not during build)
  if (error && !isBuildPhase) {
    dbLogger.error(message, { error, ...context });
  }

  return createErrorResponse(ErrorCodes.INTERNAL_ERROR, message, undefined, 500);
}

/**
 * Create a bad request error response
 */
export function createBadRequestResponse(
  message: string,
  details?: Record<string, unknown>
): NextResponse<ApiResponse<never>> {
  return createErrorResponse(ErrorCodes.INVALID_INPUT, message, details, 400);
}

/**
 * Wrap an async handler with error handling
 */
export function withErrorHandling<T>(
  handler: () => Promise<NextResponse<T>>,
  errorMessage: string
): Promise<NextResponse<T | ApiResponse<never>>> {
  return handler().catch((error: unknown) => {
    return createInternalErrorResponse(errorMessage, error);
  });
}
