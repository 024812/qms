import { createErrorResponse, createSuccessResponse } from '@/lib/api/response';

interface ActionErrorShape {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

type RouteActionResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: ActionErrorShape;
    };

const STATUS_BY_CODE: Record<string, number> = {
  BAD_REQUEST: 400,
  VALIDATION_FAILED: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  ALREADY_EXISTS: 409,
  INTERNAL_ERROR: 500,
};

export function actionResultToApiResponse<T, TResponse = T>(
  result: RouteActionResult<T>,
  options?: {
    status?: number;
    mapData?: (data: T) => TResponse;
  }
) {
  if (result.success) {
    return createSuccessResponse(
      options?.mapData ? options.mapData(result.data) : (result.data as unknown as TResponse),
      undefined,
      options?.status ?? 200
    );
  }

  return createErrorResponse(
    result.error.code,
    result.error.message,
    result.error.fieldErrors ? { errors: result.error.fieldErrors } : undefined,
    STATUS_BY_CODE[result.error.code] ?? 500
  );
}
