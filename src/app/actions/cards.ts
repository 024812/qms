'use server';

import { z } from 'zod';

import { auth } from '@/auth';
import {
  deleteCard as deleteCardData,
  getCardById,
  getCards as getCardsData,
  getCardStats as getCardStatsData,
  getMonthlyBuySellData as getMonthlyBuySellDataData,
  getRecentActivity as getRecentActivityData,
  saveCard as saveCardData,
  type CardListInput,
  type ActivityItem,
  type MonthlyBuySellData,
  type CardStats,
} from '@/lib/data/cards';
import { systemSettingsRepository } from '@/lib/repositories/system-settings.repository';
import type { CardItem } from '@/modules/cards/schema';

export interface CardSettings {
  azureOpenAIApiKey: string;
  azureOpenAIEndpoint: string;
  azureOpenAIDeployment: string;
  ebayAppId: string;
  ebayCertId: string;
  ebayDevId: string;
  rapidApiKey: string;
  tavilyApiKey: string;
}

export interface UpdateCardSettingsInput {
  azureOpenAIApiKey?: string;
  azureOpenAIEndpoint?: string;
  azureOpenAIDeployment?: string;
  ebayAppId?: string;
  ebayCertId?: string;
  ebayDevId?: string;
  rapidApiKey?: string;
  tavilyApiKey?: string;
}

interface ActionSuccess<T> {
  success: true;
  data: T;
}

interface ActionError {
  success: false;
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
}

type ActionResult<T> = ActionSuccess<T> | ActionError;

export interface GetCardsActionInput {
  search?: string;
  filter?: {
    sport?: 'BASKETBALL' | 'SOCCER' | 'OTHER';
    gradingCompany?: 'UNGRADED' | 'PSA' | 'BGS' | 'SGC' | 'CGC';
    status?: 'COLLECTION' | 'FOR_SALE' | 'SOLD' | 'GRADING' | 'DISPLAY';
  };
  page?: number;
  pageSize?: number;
}

export interface GetCardsActionResult {
  items: CardItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const updateCardSettingsSchema = z.object({
  azureOpenAIApiKey: z.string().optional(),
  azureOpenAIEndpoint: z.string().url().optional().or(z.literal('')),
  azureOpenAIDeployment: z.string().optional(),
  ebayAppId: z.string().optional(),
  ebayCertId: z.string().optional(),
  ebayDevId: z.string().optional(),
  rapidApiKey: z.string().optional(),
  tavilyApiKey: z.string().optional(),
});

const getCardsSchema = z.object({
  search: z.string().optional(),
  filter: z
    .object({
      sport: z.enum(['BASKETBALL', 'SOCCER', 'OTHER']).optional(),
      gradingCompany: z.enum(['UNGRADED', 'PSA', 'BGS', 'SGC', 'CGC']).optional(),
      status: z.enum(['COLLECTION', 'FOR_SALE', 'SOLD', 'GRADING', 'DISPLAY']).optional(),
    })
    .optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

const cardInputSchema = z.object({
  id: z.string().optional(),
  playerName: z.string().min(1, 'Player name is required'),
  sport: z.enum(['BASKETBALL', 'SOCCER', 'OTHER']),
  team: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  year: z.coerce.number().int().min(1900).max(2100),
  brand: z.string().min(1, 'Brand is required'),
  series: z.string().optional().nullable(),
  cardNumber: z.string().optional().nullable(),
  gradingCompany: z.enum(['UNGRADED', 'PSA', 'BGS', 'SGC', 'CGC']).optional().nullable(),
  grade: z.coerce.number().min(0).max(10).optional().nullable(),
  certificationNumber: z.string().optional().nullable(),
  purchasePrice: z.coerce.number().min(0).optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  currentValue: z.coerce.number().min(0).optional().nullable(),
  estimatedValue: z.coerce.number().min(0).optional().nullable(),
  soldPrice: z.coerce.number().min(0).optional().nullable(),
  soldDate: z.string().optional().nullable(),
  valuationDate: z.string().optional().nullable(),
  valuationConfidence: z.string().optional().nullable(),
  valuationSources: z.array(z.string()).optional().nullable(),
  isAutographed: z.boolean().optional().nullable(),
  hasMemorabilia: z.boolean().optional().nullable(),
  memorabiliaType: z.string().optional().nullable(),
  parallel: z.string().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  status: z.enum(['COLLECTION', 'FOR_SALE', 'SOLD', 'GRADING', 'DISPLAY']).optional().nullable(),
  location: z.string().optional().nullable(),
  storageType: z.string().optional().nullable(),
  condition: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  mainImage: z.string().optional().nullable(),
  frontImage: z.string().optional().nullable(),
  backImage: z.string().optional().nullable(),
  attachmentImages: z.array(z.string()).optional().nullable(),
});

function zodFieldErrors(error: z.ZodError): Record<string, string[]> {
  return error.flatten().fieldErrors as unknown as Record<string, string[]>;
}

function unauthorizedResult(message = 'Requires admin privileges'): ActionResult<never> {
  return {
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message,
    },
  };
}

function validationErrorResult(
  message: string,
  fieldErrors: Record<string, string[]>
): ActionResult<never> {
  return {
    success: false,
    error: {
      code: 'VALIDATION_FAILED',
      message,
      fieldErrors,
    },
  };
}

function internalErrorResult(message: string): ActionResult<never> {
  return {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message,
    },
  };
}

async function requireAdmin() {
  const session = await auth();

  if (!session || session.user.role !== 'admin') {
    return null;
  }

  return session;
}

async function requireAuthenticatedUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return session;
}

async function readMaskedCardSettings(): Promise<CardSettings> {
  const [azureConfig, ebayConfig, rapidApiKey, tavilyApiKey] = await Promise.all([
    systemSettingsRepository.getAzureOpenAIConfig(),
    systemSettingsRepository.getEbayApiConfig(),
    systemSettingsRepository.getRapidApiKey(),
    systemSettingsRepository.getTavilyApiKey(),
  ]);

  return {
    azureOpenAIApiKey: azureConfig.apiKey ? '********' : '',
    azureOpenAIEndpoint: azureConfig.endpoint || '',
    azureOpenAIDeployment: azureConfig.deployment || '',
    ebayAppId: ebayConfig.appId || '',
    ebayCertId: ebayConfig.certId ? '********' : '',
    ebayDevId: ebayConfig.devId || '',
    rapidApiKey: rapidApiKey ? '********' : '',
    tavilyApiKey: tavilyApiKey ? '********' : '',
  };
}

export async function getCardSettingsAction(): Promise<ActionResult<CardSettings>> {
  try {
    const session = await requireAdmin();

    if (!session) {
      return unauthorizedResult();
    }

    return {
      success: true,
      data: await readMaskedCardSettings(),
    };
  } catch {
    return internalErrorResult('Failed to fetch card settings');
  }
}

export async function updateCardSettingsAction(
  input: UpdateCardSettingsInput
): Promise<ActionResult<CardSettings>> {
  try {
    const session = await requireAdmin();

    if (!session) {
      return unauthorizedResult();
    }

    const validationResult = updateCardSettingsSchema.safeParse(input);

    if (!validationResult.success) {
      return validationErrorResult('Validation failed', zodFieldErrors(validationResult.error));
    }

    const data = validationResult.data;

    const [currentAzureConfig, currentEbayConfig, currentRapidKey, currentTavilyKey] =
      await Promise.all([
        systemSettingsRepository.getAzureOpenAIConfig(),
        systemSettingsRepository.getEbayApiConfig(),
        systemSettingsRepository.getRapidApiKey(),
        systemSettingsRepository.getTavilyApiKey(),
      ]);

    const newAzureApiKey =
      data.azureOpenAIApiKey && data.azureOpenAIApiKey !== '********'
        ? data.azureOpenAIApiKey
        : currentAzureConfig.apiKey || '';

    const newEbayCertId =
      data.ebayCertId && data.ebayCertId !== '********'
        ? data.ebayCertId
        : currentEbayConfig.certId || '';

    const newRapidKey =
      data.rapidApiKey && data.rapidApiKey !== '********'
        ? data.rapidApiKey
        : currentRapidKey || '';

    const newTavilyKey =
      data.tavilyApiKey && data.tavilyApiKey !== '********'
        ? data.tavilyApiKey
        : currentTavilyKey || '';

    await Promise.all([
      systemSettingsRepository.updateAzureOpenAIConfig({
        apiKey: newAzureApiKey,
        endpoint: data.azureOpenAIEndpoint || currentAzureConfig.endpoint || '',
        deployment: data.azureOpenAIDeployment || currentAzureConfig.deployment || '',
      }),
      systemSettingsRepository.updateEbayApiConfig({
        appId: data.ebayAppId || currentEbayConfig.appId || '',
        certId: newEbayCertId,
        devId: data.ebayDevId || currentEbayConfig.devId || '',
      }),
      systemSettingsRepository.updateRapidApiKey(newRapidKey),
      systemSettingsRepository.updateTavilyApiKey(newTavilyKey),
    ]);

    return {
      success: true,
      data: await readMaskedCardSettings(),
    };
  } catch {
    return internalErrorResult('Failed to update card settings');
  }
}

export async function getCardsAction(
  input: GetCardsActionInput = {}
): Promise<ActionResult<GetCardsActionResult>> {
  try {
    const session = await requireAuthenticatedUser();

    if (!session) {
      return unauthorizedResult('Unauthorized');
    }

    const validationResult = getCardsSchema.safeParse(input);

    if (!validationResult.success) {
      return validationErrorResult('Validation failed', zodFieldErrors(validationResult.error));
    }

    const data = await getCardsData(validationResult.data as CardListInput);

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch cards',
      },
    };
  }
}

export async function getCardAction(id: string): Promise<ActionResult<CardItem | null>> {
  try {
    const session = await requireAuthenticatedUser();

    if (!session) {
      return unauthorizedResult('Unauthorized');
    }

    if (!id || typeof id !== 'string') {
      return validationErrorResult('Validation failed', { id: ['Invalid card ID'] });
    }

    const card = await getCardById(id);

    return {
      success: true,
      data: card,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch card',
      },
    };
  }
}

export async function saveCardAction(data: unknown): Promise<ActionResult<{ success: true }>> {
  try {
    const session = await requireAuthenticatedUser();

    if (!session) {
      return unauthorizedResult('Unauthorized');
    }

    const validationResult = cardInputSchema.safeParse(data);

    if (!validationResult.success) {
      return validationErrorResult('Validation failed', zodFieldErrors(validationResult.error));
    }

    await saveCardData(validationResult.data);

    return {
      success: true,
      data: { success: true },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to save card',
      },
    };
  }
}

export async function deleteCardAction(id: string): Promise<ActionResult<{ success: true }>> {
  try {
    const session = await requireAuthenticatedUser();

    if (!session) {
      return unauthorizedResult('Unauthorized');
    }

    if (!id || typeof id !== 'string') {
      return validationErrorResult('Validation failed', { id: ['Invalid card ID'] });
    }

    await deleteCardData(id);

    return {
      success: true,
      data: { success: true },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete card',
      },
    };
  }
}

export async function getCardStatsAction(): Promise<ActionResult<CardStats>> {
  try {
    const session = await requireAuthenticatedUser();

    if (!session) {
      return unauthorizedResult('Unauthorized');
    }

    return {
      success: true,
      data: await getCardStatsData(),
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch card stats',
      },
    };
  }
}

export async function getMonthlyBuySellDataAction(
  limit?: number
): Promise<ActionResult<MonthlyBuySellData[]>> {
  try {
    const session = await requireAuthenticatedUser();

    if (!session) {
      return unauthorizedResult('Unauthorized');
    }

    const data = await getMonthlyBuySellDataData();

    return {
      success: true,
      data: typeof limit === 'number' ? data.slice(0, limit) : data,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch monthly card data',
      },
    };
  }
}

export async function getRecentActivityAction(limit = 10): Promise<ActionResult<ActivityItem[]>> {
  try {
    const session = await requireAuthenticatedUser();

    if (!session) {
      return unauthorizedResult('Unauthorized');
    }

    return {
      success: true,
      data: await getRecentActivityData(limit),
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch recent activity',
      },
    };
  }
}
