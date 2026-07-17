import { z } from 'zod';

import { requireApiAdmin } from '@/lib/api/route-auth';
import {
  createBadRequestResponse,
  createInternalErrorResponse,
  createSuccessResponse,
  createValidationErrorResponse,
} from '@/lib/api/response';
import { importQuiltWorkbook, MAX_IMPORT_FILE_BYTES } from '@/lib/import/quilts';

const requestSchema = z.object({
  fileName: z
    .string()
    .trim()
    .max(255)
    .refine(name => name.toLowerCase().endsWith('.xlsx')),
  fileData: z
    .string()
    .min(1)
    .max(Math.ceil((MAX_IMPORT_FILE_BYTES * 4) / 3) + 16),
  confirmed: z.literal(true),
});

export async function POST(request: Request) {
  const authResult = await requireApiAdmin();
  if (!authResult.ok) return authResult.response;

  try {
    const body = requestSchema.safeParse(await request.json());
    if (!body.success) {
      return createValidationErrorResponse(
        'Invalid import request',
        body.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    return createSuccessResponse({ result: await importQuiltWorkbook(body.data.fileData) });
  } catch (error) {
    if (error instanceof SyntaxError) return createBadRequestResponse('Request body must be JSON');
    return createInternalErrorResponse('Failed to import workbook', error);
  }
}
