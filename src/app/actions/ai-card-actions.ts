'use server';

import { aiCardService } from '@/modules/cards/services/ai-card-service';

export async function identifyCardAction(base64Image: string) {
  try {
    return await aiCardService.identifyCard(base64Image);
  } catch (error) {
    console.error('Identify Action Error:', error);
    throw new Error('Failed to identify card');
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
    throw new Error('Failed to estimate price');
  }
}
