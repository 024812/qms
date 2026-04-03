import { NextRequest } from 'next/server';
import { z } from 'zod';

import {
  createInternalErrorResponse,
  createSuccessResponse,
  createValidationErrorResponse,
} from '@/lib/api/response';
import { getAppSettings, updateAppSettings } from '@/lib/data/settings';
import { sanitizeApiInput } from '@/lib/sanitization';

const updateAppSettingsSchema = z.object({
  appName: z.string().min(1).max(100).optional(),
  language: z.enum(['zh', 'en']).optional(),
  itemsPerPage: z.number().min(10).max(100).optional(),
  defaultView: z.enum(['list', 'grid']).optional(),
  doubleClickAction: z.enum(['none', 'view', 'status', 'edit']).optional(),
  usageDoubleClickAction: z.enum(['none', 'view', 'edit']).optional(),
});

export async function GET() {
  try {
    return createSuccessResponse({
      settings: await getAppSettings(),
    });
  } catch (error) {
    return createInternalErrorResponse('Failed to fetch application settings', error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const body = sanitizeApiInput(rawBody);
    const validationResult = updateAppSettingsSchema.safeParse(body);

    if (!validationResult.success) {
      return createValidationErrorResponse(
        'Application settings are invalid',
        validationResult.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const settings = await updateAppSettings(validationResult.data);

    return createSuccessResponse({
      updated: true,
      settings,
    });
  } catch (error) {
    return createInternalErrorResponse('Failed to update application settings', error);
  }
}
