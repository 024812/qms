'use server';

import { aiCardService } from '@/modules/cards/services/ai-card-service';

export async function identifyCardAction(frontImage: string, backImage?: string, locale?: string) {
  try {
    return await aiCardService.identifyCard(frontImage, backImage, locale);
  } catch (error) {
    console.error('Identify Action Error:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
      // Reshape error to be simple text so it serializes safely to client
      throw new Error(`AI Scan Failed: ${error.message}`);
    }
    throw new Error('Failed to identify card due to unknown error');
  }
}

interface EstimateParams {
  playerName?: string;
  year?: number;
  brand?: string;
  gradingCompany?: string;
  grade?: number | null;
}

export async function estimatePriceAction(details: EstimateParams) {
  try {
    const sanitizedDetails = {
      ...details,
      grade: details.grade ?? undefined,
    };
    return await aiCardService.estimatePrice(sanitizedDetails);
  } catch (error) {
    console.error('Estimate Action Error:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
      throw new Error(`Estimate Failed: ${error.message}`);
    }
    throw new Error('Failed to estimate price');
  }
}
