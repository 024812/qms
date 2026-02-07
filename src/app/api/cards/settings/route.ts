import { NextRequest } from 'next/server';
import { z } from 'zod';
import { systemSettingsRepository } from '@/lib/repositories/system-settings.repository';

import {
  createSuccessResponse,
  createValidationErrorResponse,
  createInternalErrorResponse,
  createUnauthorizedResponse,
} from '@/lib/api/response';
import { auth } from '@/auth';

const updateCardSettingsSchema = z.object({
  azureOpenAIApiKey: z.string().optional(),
  azureOpenAIEndpoint: z.string().url().optional().or(z.literal('')),
  azureOpenAIDeployment: z.string().optional(),
  ebayAppId: z.string().optional(),
  ebayCertId: z.string().optional(),
  ebayDevId: z.string().optional(),
  rapidApiKey: z.string().optional(),
  balldontlieApiKey: z.string().optional(),
});

/**
 * GET /api/cards/settings
 * Get card module settings (Azure OpenAI & eBay config & Rapid API & Balldontlie)
 * Admin only.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return createUnauthorizedResponse('Requires admin privileges');
    }

    const [azureConfig, ebayConfig, rapidApiKey, balldontlieApiKey] = await Promise.all([
      systemSettingsRepository.getAzureOpenAIConfig(),
      systemSettingsRepository.getEbayApiConfig(),
      systemSettingsRepository.getRapidApiKey(),
      systemSettingsRepository.getBalldontlieApiKey(),
    ]);

    return createSuccessResponse({
      settings: {
        azureOpenAIApiKey: azureConfig.apiKey ? '********' : '', // Mask API key
        azureOpenAIEndpoint: azureConfig.endpoint || '',
        azureOpenAIDeployment: azureConfig.deployment || '',
        ebayAppId: ebayConfig.appId || '',
        ebayCertId: ebayConfig.certId ? '********' : '', // Mask Secret
        ebayDevId: ebayConfig.devId || '',
        rapidApiKey: rapidApiKey ? '********' : '', // Mask Rapid API Key
        balldontlieApiKey: balldontlieApiKey ? '********' : '', // Mask Balldontlie API Key
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
    // Do not use sanitizeApiInput here as it corrupts URLs (e.g. escaping // to &#x2F;&#x2F;)
    // Zod validation below provides sufficient safety for the structure and types.
    const body = rawBody;
    const validationResult = updateCardSettingsSchema.safeParse(body);

    if (!validationResult.success) {
      return createValidationErrorResponse(
        'Validation failed',
        validationResult.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const input = validationResult.data;

    // 1. Update Azure Config
    const currentAzureConfig = await systemSettingsRepository.getAzureOpenAIConfig();
    const newAzureApiKey =
      input.azureOpenAIApiKey && input.azureOpenAIApiKey !== '********'
        ? input.azureOpenAIApiKey
        : currentAzureConfig.apiKey || '';

    await systemSettingsRepository.updateAzureOpenAIConfig({
      apiKey: newAzureApiKey,
      endpoint: input.azureOpenAIEndpoint || currentAzureConfig.endpoint || '',
      deployment: input.azureOpenAIDeployment || currentAzureConfig.deployment || '',
    });

    // 2. Update eBay Config
    const currentEbayConfig = await systemSettingsRepository.getEbayApiConfig();

    // Only update if provided (and not masked)
    const newEbayCertId =
      input.ebayCertId && input.ebayCertId !== '********'
        ? input.ebayCertId
        : currentEbayConfig.certId || '';

    await systemSettingsRepository.updateEbayApiConfig({
      appId: input.ebayAppId || currentEbayConfig.appId || '',
      certId: newEbayCertId,
      devId: input.ebayDevId || currentEbayConfig.devId || '',
    });

    // 3. Update Rapid API Key
    const currentRapidKey = await systemSettingsRepository.getRapidApiKey();
    const newRapidKey =
      input.rapidApiKey && input.rapidApiKey !== '********'
        ? input.rapidApiKey
        : currentRapidKey || '';

    await systemSettingsRepository.updateRapidApiKey(newRapidKey);

    // 4. Update Balldontlie API Key
    const currentBalldontlieKey = await systemSettingsRepository.getBalldontlieApiKey();
    const newBalldontlieKey =
      input.balldontlieApiKey && input.balldontlieApiKey !== '********'
        ? input.balldontlieApiKey
        : currentBalldontlieKey || '';

    await systemSettingsRepository.updateBalldontlieApiKey(newBalldontlieKey);

    return createSuccessResponse({
      updated: true,
    });
  } catch (error) {
    return createInternalErrorResponse('Failed to update card settings', error);
  }
}
