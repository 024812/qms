import { ACTION_ERROR_STATUS, type ActionResult } from '@/lib/api/action-result';
import { createErrorResponse, createSuccessResponse } from '@/lib/api/response';

/**
 * Adapt a Server Action result into an HTTP response.
 *
 * The result shape and the code → status map both live in `@/lib/api/action-result`;
 * this module previously re-declared the shape as its own `RouteActionResult` /
 * `ActionErrorShape` and kept a second copy of the status map, so an error code
 * added to the actions could silently fall through to a 500 here.
 */
export function actionResultToApiResponse<T, TResponse = T>(
  result: ActionResult<T>,
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
    ACTION_ERROR_STATUS[result.error.code]
  );
}
