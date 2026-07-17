'use server';

import { auth } from '@/auth';
import { rateLimiters } from '@/lib/rate-limit';
import { imageReferenceSchema } from '@/lib/validations/image';
import { aiCardService } from '@/modules/cards/services/ai-card-service';
import { z } from 'zod';

const localeSchema = z.enum(['en', 'zh']).default('en');

const estimateParamsSchema = z.object({
  playerName: z.string().trim().max(100).optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  brand: z.string().trim().max(100).optional(),
  series: z.string().trim().max(100).optional(),
  cardNumber: z.string().trim().max(50).optional(),
  parallel: z.string().trim().max(100).optional(),
  gradingCompany: z.string().trim().max(20).optional(),
  grade: z.number().min(0).max(10).nullable().optional(),
  isAutographed: z.boolean().optional(),
  customQuery: z.string().trim().max(500).optional(),
  excludedListingIds: z.array(z.string().max(200)).max(100).optional(),
  forceRefresh: z.boolean().optional(),
});

async function requireAiAccess() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  if (session.user.role !== 'admin' && !session.user.activeModules.includes('cards')) {
    throw new Error('Forbidden');
  }

  const rateLimit = await rateLimiters.ai.checkKey(`ai:user:${session.user.id}`);
  if (!rateLimit.allowed) {
    throw new Error('AI request limit exceeded. Please try again later.');
  }
}

export async function identifyCardAction(frontImage: string, backImage?: string, locale?: string) {
  try {
    await requireAiAccess();
    const safeFrontImage = imageReferenceSchema.parse(frontImage);
    const safeBackImage = backImage ? imageReferenceSchema.parse(backImage) : undefined;
    return await aiCardService.identifyCard(
      safeFrontImage,
      safeBackImage,
      localeSchema.parse(locale)
    );
  } catch (error) {
    console.error('Identify Action Error:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
      throw new Error('AI scan failed');
    }
    throw new Error('Failed to identify card due to unknown error');
  }
}

export async function analyzeAuthenticityAction(
  frontImage: string,
  backImage?: string,
  locale?: string
) {
  try {
    await requireAiAccess();
    const safeFrontImage = imageReferenceSchema.parse(frontImage);
    const safeBackImage = backImage ? imageReferenceSchema.parse(backImage) : undefined;
    return await aiCardService.analyzeAuthenticity(
      safeFrontImage,
      safeBackImage,
      localeSchema.parse(locale)
    );
  } catch (error) {
    console.error('Authenticity Action Error:', error);
    if (error instanceof Error) {
      throw new Error('Authenticity check failed');
    }
    throw new Error('Failed to analyze authenticity');
  }
}

interface EstimateParams {
  playerName?: string;
  year?: number;
  brand?: string;
  series?: string;
  cardNumber?: string;
  parallel?: string;
  gradingCompany?: string;
  grade?: number | null;
  isAutographed?: boolean;
  customQuery?: string;
  excludedListingIds?: string[];
  forceRefresh?: boolean;
}

export async function estimatePriceAction(details: EstimateParams) {
  try {
    await requireAiAccess();
    const safeDetails = estimateParamsSchema.parse(details);
    const sanitizedDetails = {
      ...safeDetails,
      playerName: safeDetails.playerName || '',
      grade: safeDetails.grade ?? undefined,
    };
    return await aiCardService.estimatePrice(sanitizedDetails);
  } catch (error) {
    console.error('Estimate Action Error:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
      throw new Error('Estimate failed');
    }
    throw new Error('Failed to estimate price');
  }
}

export async function analyzeCardQuickAction(details: EstimateParams, locale: string = 'en') {
  try {
    await requireAiAccess();
    const safeDetails = estimateParamsSchema.parse(details);
    const sanitizedDetails = {
      ...safeDetails,
      playerName: safeDetails.playerName || '',
      grade: safeDetails.grade ?? undefined,
    };
    return await aiCardService.analyzeCardQuick(sanitizedDetails, localeSchema.parse(locale));
  } catch (error) {
    console.error('Analysis Action Error:', error);
    if (error instanceof Error) {
      throw new Error('Analysis failed');
    }
    throw new Error('Failed to analyze card');
  }
}

export async function analyzeCardGradingAction(details: EstimateParams) {
  try {
    await requireAiAccess();
    const safeDetails = estimateParamsSchema.parse(details);
    const sanitizedDetails = {
      ...safeDetails,
      playerName: safeDetails.playerName || '',
      grade: safeDetails.grade ?? undefined,
    };
    return await aiCardService.analyzeGradingPotential(sanitizedDetails);
  } catch (error) {
    console.error('Grading Assessment Error:', error);
    if (error instanceof Error) {
      throw new Error('Grading assessment failed');
    }
    throw new Error('Failed to assess grading potential');
  }
}

export async function analyzePlayerStatsAction(playerName: string) {
  try {
    await requireAiAccess();
    return await aiCardService.analyzePlayerStats(
      z.string().trim().min(1).max(100).parse(playerName)
    );
  } catch (error) {
    console.error('Player Stats Analysis Error:', error);
    if (error instanceof Error) {
      throw new Error('Stats analysis failed');
    }
    throw new Error('Failed to analyze player stats');
  }
}
