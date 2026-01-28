import { NextRequest } from 'next/server';
import { z } from 'zod';
import { systemSettingsRepository } from '@/lib/repositories/system-settings.repository';
import { sanitizeApiInput } from '@/lib/sanitization';
import {
  createSuccessResponse,
  createValidationErrorResponse,
  createInternalErrorResponse,
  createUnauthorizedResponse,
} from '@/lib/api/response';
import { auth } from '@/auth';

const updateCardSettingsSchema = z.object({
  azureOpenAIApiKey: z.string().min(1).optional(),
  azureOpenAIEndpoint: z.string().url().optional(),
  azureOpenAIDeployment: z.string().min(1).optional(),
});

/**
 * GET /api/cards/settings
 * Get card module settings (Azure OpenAI config)
 * Admin only.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return createUnauthorizedResponse('Requires admin privileges');
    }

    const config = await systemSettingsRepository.getAzureOpenAIConfig();

    return createSuccessResponse({
      settings: {
        azureOpenAIApiKey: config.apiKey ? '********' : '', // Mask API key
        azureOpenAIEndpoint: config.endpoint || '',
        azureOpenAIDeployment: config.deployment || '',
      },
    });
  } catch (error) {
    return createInternalErrorResponse('Failed to fetch card settings', error);
  }
}

/**
 * PUT /api/cards/settings
 * Update card module settings
 * Admin only.
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return createUnauthorizedResponse('Requires admin privileges');
    }

    const rawBody = await request.json();
    const body = sanitizeApiInput(rawBody);
    const validationResult = updateCardSettingsSchema.safeParse(body);

    if (!validationResult.success) {
      return createValidationErrorResponse(
        'Validation failed',
        validationResult.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const input = validationResult.data;

    // Get existing config to merge if partial update (though UI likely sends all)
    const currentConfig = await systemSettingsRepository.getAzureOpenAIConfig();

    // If input key is masked/empty and we have existing, keep existing
    // But simplistic approach: update if provided and not masked.
    // If user sends '********', we should NOT update it.

    const newApiKey =
      input.azureOpenAIApiKey && input.azureOpenAIApiKey !== '********'
        ? input.azureOpenAIApiKey
        : currentConfig.apiKey || '';

    await systemSettingsRepository.updateAzureOpenAIConfig({
      apiKey: newApiKey,
      endpoint: input.azureOpenAIEndpoint || currentConfig.endpoint || '',
      deployment: input.azureOpenAIDeployment || currentConfig.deployment || '',
    });

    return createSuccessResponse({
      updated: true,
    });
  } catch (error) {
    return createInternalErrorResponse('Failed to update card settings', error);
  }
}
