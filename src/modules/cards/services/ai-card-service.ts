import OpenAI from 'openai';
import { ebayProvider, web130Provider, CardDetails, eBaySalesResult } from './price-data-providers';

interface CardRecognitionResult {
  playerName?: string;
  year?: number;
  brand?: string;
  series?: string;
  cardNumber?: string;
  sport?: 'BASKETBALL' | 'SOCCER' | 'OTHER';
  team?: string;
  position?: string;
  gradingCompany?: string;
  grade?: number;
  isAutographed?: boolean;
  riskWarning?: string; // New field for authenticity risks
  imageQualityFeedback?: string; // New field for image quality issues (e.g., "Too blurry", "Glare obscuring text")
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface PriceEstimateResult {
  low: number;
  high: number;
  average: number;
  lastSold?: number;
  currency: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'; // Added
  sources: string[]; // Added
  salesCount: number; // Added
  lastSaleDate?: string; // Added
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
      const config = await systemSettingsRepository.getAzureOpenAIConfig();
      const apiKey = config.apiKey;
      const endpoint = config.endpoint;
      const deployment = config.deployment;

      if (!apiKey || !endpoint) {
        return { client: null, deployment: 'gpt-5-mini' };
      }

      // Handle AI Studio Project URLs by stripping the path if present
      let effectiveEndpoint = endpoint;
      if (endpoint.includes('/api/projects')) {
        try {
          const url = new URL(endpoint);
          effectiveEndpoint = url.origin;
        } catch {
          console.warn('Invalid Azure Endpoint URL, using as is:', endpoint);
        }
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
   * Identify card details from an image (Base64)
   */
  async identifyCard(base64Image: string, locale: string = 'en'): Promise<CardRecognitionResult> {
    const { client, deployment } = await this.getClient();

    // 1. Mock Mode (if no key)
    if (!client) {
      console.warn('AI Service: No Azure Key found in System Settings, using mock response.');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate delay
      return this.getMockRecognitionResult();
    }

    try {
      const language = locale === 'zh' ? 'Chinese (Simplified)' : 'English';

      // 2. Real Azure OpenAI Call
      const response = await client.chat.completions.create({
        model: deployment,
        messages: [
          {
            role: 'system',
            content: `You are an expert sports card identifier. 
              Analyze the image for details and POTENTIAL AUTHENTICITY RISKS.
              
              Extract: Player, Year, Brand, Series, Card Number, Sport, Team, Position, Grading.
              
              CRITICAL: Assess for "Prohibited" or "Sketchy" indicators:
              - Is it an unlicensed "custom" card?
              - Does the autograph look printed (facsimile) vs wet ink?
              - Are there visual signs of a reprint?
              - Is the slab/case suspicious?

              CRITICAL: Assess IMAGE QUALITY:
              - Is the image too blurry to read text?
              - Is there severe glare obscuring key details (especially the card number or name)?
              - Is the card too far away or cropped out?
              
              Return JSON only.
              
              IMPORTANT: 
              1. For 'riskWarning': If authentic risks are detected, provide a DETAILED explanation in ${language}.
              2. For 'imageQualityFeedback': If the image is poor (blurry, glare, etc.) and PREVENTS identification of key fields (Name, Number), provide a user-friendly suggestion to retake the photo in ${language}. If image is good, leave null.
              3. Keep other fields (like Player, Brand) in their original language (usually English) unless the card is specifically foreign.

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
                "riskWarning": "string (optional - detailed explanation in ${language} if risks found)",
                "imageQualityFeedback": "string (optional - suggestion to retake photo in ${language} if image is poor)",
                "confidence": "HIGH" | "MEDIUM" | "LOW"
              }`,
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Identify this card and flag any risks.' },
              {
                type: 'image_url',
                image_url: {
                  url: base64Image.startsWith('data:')
                    ? base64Image
                    : `data:image/jpeg;base64,${base64Image}`,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        max_completion_tokens: 2500,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error('No content from AI');

      return JSON.parse(content) as CardRecognitionResult;
    } catch (error) {
      console.error('AI Identification Failed:', error);
      throw new Error('Failed to identify card.');
    }
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
