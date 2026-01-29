import OpenAI from 'openai';

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
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface PriceEstimateResult {
  low: number;
  high: number;
  average: number;
  lastSold?: number;
  currency: string;
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
  async identifyCard(base64Image: string): Promise<CardRecognitionResult> {
    const { client, deployment } = await this.getClient();

    // 1. Mock Mode (if no key)
    if (!client) {
      console.warn('AI Service: No Azure Key found in System Settings, using mock response.');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate delay
      return this.getMockRecognitionResult();
    }

    try {
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
              
              Return JSON only. Format:
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
                "riskWarning": "string (optional - only if you detect potential issues like 'Looks like a facsimile auto' or 'Possible reprint')",
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
   * Estimate price based on details
   * (Currently Mocked - would connect to eBay/130point API)
   */
  async estimatePrice(details: Partial<CardRecognitionResult>): Promise<PriceEstimateResult> {
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock logic based on input to make it feel "real"
    const basePrice = details.gradingCompany === 'PSA' && details.grade === 10 ? 500 : 50;
    const yearMod = details.year ? (2025 - details.year) * 2 : 0;
    const randomFlux = Math.floor(Math.random() * 50);

    const avg = basePrice + yearMod + randomFlux;

    return {
      low: Math.floor(avg * 0.8),
      high: Math.floor(avg * 1.2),
      average: avg,
      lastSold: avg - 5,
      currency: 'USD',
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
