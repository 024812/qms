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

export async function analyzeAuthenticityAction(
  frontImage: string,
  backImage?: string,
  locale?: string
) {
  try {
    return await aiCardService.analyzeAuthenticity(frontImage, backImage, locale);
  } catch (error) {
    console.error('Authenticity Action Error:', error);
    if (error instanceof Error) {
      throw new Error(`Authenticity Check Failed: ${error.message}`);
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
    const sanitizedDetails = {
      ...details,
      playerName: details.playerName || '',
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

export async function analyzeCardQuickAction(details: EstimateParams, locale: string = 'en') {
  try {
    const sanitizedDetails = {
      ...details,
      playerName: details.playerName || '',
      grade: details.grade ?? undefined,
    };
    return await aiCardService.analyzeCardQuick(sanitizedDetails, locale);
  } catch (error) {
    console.error('Analysis Action Error:', error);
    if (error instanceof Error) {
      throw new Error(`Analysis Failed: ${error.message}`);
    }
    throw new Error('Failed to analyze card');
  }
}

export async function analyzeCardGradingAction(details: EstimateParams) {
  try {
    const sanitizedDetails = {
      ...details,
      playerName: details.playerName || '',
      grade: details.grade ?? undefined,
    };
    return await aiCardService.analyzeGradingPotential(sanitizedDetails);
  } catch (error) {
    console.error('Grading Assessment Error:', error);
    if (error instanceof Error) {
      throw new Error(`Grading Assessment Failed: ${error.message}`);
    }
    throw new Error('Failed to assess grading potential');
  }
}
