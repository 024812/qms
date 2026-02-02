import OpenAI from 'openai';
import { z } from 'zod';
import { ebayProvider, web130Provider, CardDetails, eBaySalesResult } from './price-data-providers';

// Zod schema for validating AI response
const CardRecognitionSchema = z.object({
  playerName: z.string().optional(),
  year: z.number().optional(),
  brand: z.string().optional(),
  series: z.string().optional(),
  cardNumber: z.string().optional(),
  sport: z.enum(['BASKETBALL', 'SOCCER', 'OTHER']).optional(),
  team: z.string().optional(),
  position: z.string().optional(),
  gradingCompany: z.string().optional(),
  grade: z.number().optional(),
  isAutographed: z.boolean().optional(),
  riskWarning: z.string().optional(),
  imageQualityFeedback: z.string().optional(),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
});

type CardRecognitionResult = z.infer<typeof CardRecognitionSchema>;

export interface PriceEstimateResult {
  low: number;
  high: number;
  average: number;
  lastSold?: number;
  currency: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  sources: string[];
  salesCount: number;
  lastSaleDate?: string;
}

/**
 * Retry utility with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        console.warn(
          `AI request failed, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

/**
 * Service to handle AI operations for cards
 * Uses Azure OpenAI (GPT-5-mini) for vision tasks
 */
import { systemSettingsRepository } from '@/lib/repositories/system-settings.repository';

export class AICardService {
  private client: OpenAI | null = null;
  private deployment: string = 'gpt-5-mini';
  private lastConfigFetch: number = 0;
  private readonly CONFIG_TTL = 60 * 1000; // Cache config for 1 minute

  constructor() {}

  private async getClient(): Promise<{ client: OpenAI | null; deployment: string }> {
    // Check if we need to refresh config
    const now = Date.now();
    if (this.client && now - this.lastConfigFetch < this.CONFIG_TTL) {
      return { client: this.client, deployment: this.deployment };
    }

    try {
      // 1. Try Config from DB
      const config = await systemSettingsRepository.getAzureOpenAIConfig();
      let apiKey = config.apiKey;
      let endpoint = config.endpoint;
      let deployment = config.deployment;

      // 2. Fallback to Env Vars if DB is missing or invalid (specifically check for bad URL chars like &)
      const isDbEndpointValid =
        endpoint &&
        !endpoint.includes('&') &&
        (endpoint.startsWith('http') || endpoint.includes('api.azure.com'));

      if (!apiKey || !isDbEndpointValid) {
        console.warn('AI Service: DB Settings missing or invalid, checking env vars fallback...');
        if (process.env.AZURE_OPENAI_API_KEY) apiKey = process.env.AZURE_OPENAI_API_KEY;
        if (process.env.AZURE_OPENAI_ENDPOINT) endpoint = process.env.AZURE_OPENAI_ENDPOINT;
        if (process.env.AZURE_OPENAI_DEPLOYMENT) deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
      }

      if (!apiKey || !endpoint) {
        console.warn('AI Service: No valid config found (checked DB and Env), using mock mode.');
        return { client: null, deployment: 'gpt-5-mini' };
      }

      // 3. Strict URL Validation & Normalization
      let effectiveEndpoint = endpoint;
      try {
        // Strip /api/projects... if present
        if (endpoint.includes('/api/projects')) {
          const url = new URL(endpoint);
          effectiveEndpoint = url.origin;
        } else {
          // Just validate it parses as URL
          new URL(endpoint);
        }
      } catch (e) {
        console.error(`AI Service: Invalid Endpoint URL: "${endpoint}"`, e);
        // Fail gracefully to mock instead of crashing
        return { client: null, deployment: 'gpt-5-mini' };
      }

      this.client = new OpenAI({
        apiKey: apiKey,
        baseURL: `${effectiveEndpoint}/openai/deployments/${deployment}`,
        defaultQuery: { 'api-version': '2024-06-01' },
        defaultHeaders: { 'api-key': apiKey },
      });

      this.deployment = deployment || 'gpt-5-mini';
      this.lastConfigFetch = now;

      return { client: this.client, deployment: this.deployment };
    } catch (error) {
      console.error('Failed to load AI config from settings:', error);
      return { client: null, deployment: 'gpt-5-mini' };
    }
  }

  /**
   * Identify card details from images (Base64)
   * @param frontImage - Front image of the card (required)
   * @param backImage - Back image of the card (optional, improves accuracy)
   * @param locale - Language for risk warnings
   */
  async identifyCard(
    frontImage: string,
    backImage?: string,
    locale: string = 'en'
  ): Promise<CardRecognitionResult> {
    const { client, deployment } = await this.getClient();

    // 1. Mock Mode (if no key)
    if (!client) {
      console.warn('AI Service: No Azure Key found in System Settings, using mock response.');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate delay
      return this.getMockRecognitionResult();
    }

    const language = locale === 'zh' ? 'Chinese (Simplified)' : 'English';

    // Build image content array - use 'as const' for proper type inference
    const imageContent = [
      {
        type: 'image_url' as const,
        image_url: {
          url: frontImage.startsWith('data:') ? frontImage : `data:image/jpeg;base64,${frontImage}`,
          detail: 'high' as const,
        },
      },
    ];

    // Add back image if provided
    if (backImage) {
      imageContent.push({
        type: 'image_url' as const,
        image_url: {
          url: backImage.startsWith('data:') ? backImage : `data:image/jpeg;base64,${backImage}`,
          detail: 'high' as const,
        },
      });
    }

    return withRetry(async () => {
      const response = await client.chat.completions.create({
        model: deployment,
        messages: [
          {
            role: 'system',
            content: `You are an expert sports card identifier. 
              Analyze the image(s) for details.
              ${backImage ? 'You are provided with both FRONT and BACK images of the card. Use both to extract complete information.' : ''}
              
              Extract: Player, Year, Brand, Series, Card Number, Sport, Team, Position, Grading.
              
              CRITICAL: Assess IMAGE QUALITY.
              - Is the image too blurry to read text?
              - Is there severe glare obscuring key details?
              
              Return JSON only.
              
              IMPORTANT: 
              1. For 'imageQualityFeedback': If the image is poor (blurry, glare, etc.) and PREVENTS identification of key fields (Name, Number), provide a user-friendly suggestion to retake the photo in ${language}. If image is good, leave null.
              2. Keep other fields (like Player, Brand) in their original language (usually English) unless the card is specifically foreign.

              Format:
              {
                "playerName": "string",
                "year": number,
                "brand": "string",
                "series": "string (optional)",
                "cardNumber": "string (optional)",
                "sport": "BASKETBALL" | "SOCCER" | "OTHER",
                "team": "string (optional)",
                "position": "string (optional)",
                "gradingCompany": "PSA" | "BGS" | "SGC" | "CGC" | "UNGRADED",
                "grade": number (optional),
                "isAutographed": boolean,
                "imageQualityFeedback": "string (optional)",
                "confidence": "HIGH" | "MEDIUM" | "LOW"
              }`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: backImage ? 'Identify this card details.' : 'Identify this card details.',
              },
              ...imageContent,
            ],
          },
        ],
        max_completion_tokens: 1000,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error('No content from AI');

      // Parse and validate with Zod
      const parsed = JSON.parse(content);
      const validated = CardRecognitionSchema.safeParse(parsed);

      if (!validated.success) {
        console.warn('AI response validation warning:', validated.error.issues);
        return parsed as CardRecognitionResult;
      }

      return validated.data;
    });
  }

  /**
   * Analyze card for authenticity risks
   */
  async analyzeAuthenticity(
    frontImage: string,
    backImage?: string,
    locale: string = 'en'
  ): Promise<{ riskWarning: string | null; confidence: string }> {
    const { client, deployment } = await this.getClient();

    if (!client) {
      return { riskWarning: null, confidence: 'LOW' };
    }

    const language = locale === 'zh' ? 'Chinese (Simplified)' : 'English';

    const imageContent = [
      {
        type: 'image_url' as const,
        image_url: {
          url: frontImage.startsWith('data:') ? frontImage : `data:image/jpeg;base64,${frontImage}`,
          detail: 'high' as const,
        },
      },
    ];

    if (backImage) {
      imageContent.push({
        type: 'image_url' as const,
        image_url: {
          url: backImage.startsWith('data:') ? backImage : `data:image/jpeg;base64,${backImage}`,
          detail: 'high' as const,
        },
      });
    }

    const response = await client.chat.completions.create({
      model: deployment,
      messages: [
        {
          role: 'system',
          content: `You are an expert sports card authenticator.
            Analyze the image(s) for POTENTIAL AUTHENTICITY RISKS.
            
            Check for:
            - Is it an unlicensed "custom" or "home-made" card?
            - Does the autograph look printed (facsimile) vs wet ink?
            - Are there visual signs of a reprint / counterfeit?
            - Is the grading slab suspicious?

            Return JSON only.
            
            IMPORTANT: Provide a detailed explanation in ${language}.

            Format:
            {
              "riskWarning": "string (null if no risks found, otherwise detailed explanation)",
              "confidence": "HIGH" | "MEDIUM" | "LOW"
            }`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze authenticity risks.',
            },
            ...imageContent,
          ],
        },
      ],
      max_completion_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content || '{}';
    return JSON.parse(content);
  }

  /**
   * Estimate price based on details using multiple data sources
   */
  async estimatePrice(details: Partial<CardRecognitionResult>): Promise<PriceEstimateResult> {
    const cardDetails: CardDetails = {
      playerName: details.playerName || '',
      year: details.year,
      brand: details.brand,
      series: details.series,
      cardNumber: details.cardNumber,
      gradingCompany: details.gradingCompany,
      grade: details.grade,
      isAutographed: details.isAutographed,
    };

    // 1. Fetch sales data (eBay as primary)
    let sales = await ebayProvider.getRecentSales(cardDetails);
    const sources = ['eBay'];

    // If insufficient data, try fallback
    if (sales.length < 3) {
      const webSales = await web130Provider.getRecentSales(cardDetails);
      if (webSales.length > 0) {
        sales = [...sales, ...webSales];
        sources.push('130Point');
      }
    }

    // 2. Data Cleaning: Outlier Detection (IQR)
    const cleanedSales = this.removeOutliers(sales);

    // 3. Statistical Estimate (if enough data)
    if (cleanedSales.length >= 2) {
      return this.calculateStatisticalEstimate(cleanedSales, sources);
    }

    // 4. AI-Assisted Estimate (Fallback for low data)
    // For now, we return a conservative estimate or a specific flag
    // TODO: Implement GPT-based extrapolation if needed
    // Using a basic fallback based on what we found (even if single item)
    if (cleanedSales.length === 1) {
      return {
        low: cleanedSales[0].price,
        high: cleanedSales[0].price,
        average: cleanedSales[0].price,
        lastSold: cleanedSales[0].price,
        currency: 'USD',
        confidence: 'LOW',
        sources,
        salesCount: 1,
        lastSaleDate: cleanedSales[0].date,
      };
    }

    // If absolutely no data found
    return {
      low: 0,
      high: 0,
      average: 0,
      currency: 'USD',
      confidence: 'LOW',
      sources: [],
      salesCount: 0,
    };
  }

  /**
   * Remove outliers using Interquartile Range (IQR) method
   */
  private removeOutliers(sales: eBaySalesResult[]): eBaySalesResult[] {
    if (sales.length < 4) return sales;

    const prices = sales.map(s => s.price).sort((a, b) => a - b);
    const q1 = prices[Math.floor(prices.length / 4)];
    const q3 = prices[Math.floor(prices.length * (3 / 4))];
    const iqr = q3 - q1;

    // Define bounds (typically 1.5 * IQR)
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    return sales.filter(s => s.price >= lowerBound && s.price <= upperBound);
  }

  /**
   * Calculate estimate from cleaned sales data
   */
  private calculateStatisticalEstimate(
    sales: eBaySalesResult[],
    sources: string[]
  ): PriceEstimateResult {
    const prices = sales.map(s => s.price);
    const average = prices.reduce((a, b) => a + b, 0) / prices.length;
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    // Sort by date to get last sold
    const sortedByDate = [...sales].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return {
      low: min,
      high: max,
      average: Number(average.toFixed(2)),
      lastSold: sortedByDate[0].price,
      currency: 'USD',
      confidence: sales.length >= 5 ? 'HIGH' : 'MEDIUM',
      sources,
      salesCount: sales.length,
      lastSaleDate: sortedByDate[0].date,
    };
  }

  private getMockRecognitionResult(): CardRecognitionResult {
    return {
      playerName: 'Michael Jordan',
      year: 1986,
      brand: 'Fleer',
      series: 'Premier',
      cardNumber: '57',
      sport: 'BASKETBALL',
      team: 'Chicago Bulls',
      position: 'SG',
      gradingCompany: 'PSA',
      grade: 9,
      isAutographed: false,
    };
  }
}

export const aiCardService = new AICardService();
