import OpenAI from 'openai';
import { z } from 'zod';
import { ebayProvider, web130Provider, CardDetails, eBaySalesResult } from './price-data-providers';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { analysisCacheService } from './analysis-cache-service';
import { systemSettingsRepository } from '@/lib/repositories/system-settings.repository';

// Zod schema for validating AI response
const CardRecognitionSchema = z.object({
  playerName: z.string().nullable().optional(),
  year: z.number().nullable().optional(),
  brand: z.string().nullable().optional(),
  series: z.string().nullable().optional(),
  cardNumber: z.string().nullable().optional(),
  parallel: z.string().nullable().optional(),
  sport: z.enum(['BASKETBALL', 'SOCCER', 'OTHER']).nullable().optional(),
  team: z.string().nullable().optional(),
  position: z.string().nullable().optional(),
  gradingCompany: z.string().nullable().optional(),
  grade: z.number().nullable().optional(),
  isAutographed: z.boolean().nullable().optional(),
  serialNumber: z.string().nullable().optional(),
  riskWarning: z.string().nullable().optional(),
  imageQualityFeedback: z.string().nullable().optional(),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']).nullable().optional(),
});

type CardRecognitionResult = z.infer<typeof CardRecognitionSchema>;

const AuthenticityAnalysisSchema = z.object({
  riskWarning: z.string().nullable().optional(),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']).nullable().optional(),
});

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

export interface PlayerStatsAnalysisResult {
  stats: {
    games_played: number;
    ppg: number;
    rpg: number;
    apg: number;
    mpg: number;
    efficiency: number;
  };
  meta: {
    season: string;
    source: string;
    last_updated: string;
  };
  game_log: {
    date: string;
    opponent: string;
    points: number;
    rebounds: number;
    assists: number;
    minutes: string;
    fg_pct: number;
    three_pct: number;
    ft_pct: number;
  }[];
  aiAnalysis?: string;
}

export interface GradingAnalysisResult {
  rawPrice: number;
  psa9Price: number;
  psa10Price: number;
  psa9Roi: number;
  psa10Roi: number;
  marketDepth: {
    activeListings: number;
    lastChecked: number;
  };
  recommendation: 'GRADE' | 'HOLD' | 'SELL_RAW';
}

export interface QuickAnalysisResult {
  valuation: {
    value: number;
    trend30d: number;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  };
  recentSales: {
    date: string;
    price: number;
    title: string;
    url: string;
    image?: string;
  }[];
  aiSummary: string;
  lastUpdated: number;
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

    let apiKey: string | undefined;
    let endpoint: string | undefined;
    let deployment: string | undefined;

    try {
      // 1. Try Config from DB
      const config = await systemSettingsRepository.getAzureOpenAIConfig();
      apiKey = config.apiKey || undefined;
      endpoint = config.endpoint || undefined;
      deployment = config.deployment || undefined;
    } catch {
      // DB fetch failed, using env fallback
    }

    // 2. Fallback to Env Vars if DB is missing, invalid, or failed
    const isDbEndpointValid =
      endpoint &&
      !endpoint.includes('&') &&
      (endpoint.startsWith('http') || endpoint.includes('api.azure.com'));

    if (!apiKey || !isDbEndpointValid) {
      if (process.env.AZURE_OPENAI_API_KEY) apiKey = process.env.AZURE_OPENAI_API_KEY;
      if (process.env.AZURE_OPENAI_ENDPOINT) endpoint = process.env.AZURE_OPENAI_ENDPOINT;
      if (process.env.AZURE_OPENAI_DEPLOYMENT) deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
    }

    if (!apiKey || !endpoint) {
      // console.warn('AI Service: No valid config found (checked DB and Env), using mock mode.');
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

    try {
      this.client = new OpenAI({
        apiKey: apiKey,
        baseURL: `${effectiveEndpoint}/openai/deployments/${deployment}`,
        defaultQuery: { 'api-version': '2024-06-01' },
        defaultHeaders: { 'api-key': apiKey },
      });

      this.deployment = deployment || 'gpt-5-mini';
      this.lastConfigFetch = now;

      return { client: this.client, deployment: this.deployment };
    } catch (clientInitError) {
      console.error('AI Service: failed to init OpenAI client', clientInitError);
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
      // console.warn('AI Service: No Azure Key found in System Settings, using mock response.');
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
              
              CRITICAL - DATA SEPARATION:
              - Separate Brand and Series explicitly. 
              - Example: "Panini Prizm" -> Brand: "Panini", Series: "Prizm".
              - Common Series: "Prizm", "Select", "Chrome", "Optic", "Mosaic", "Donruss", "Topps Chrome".
              - If the card says "Prizm" anywhere, ensure 'series' is set to "Prizm".

              CRITICAL - PARALLEL/VARIATION DETECTION:
              - Look closely for "Refractor", "Prizm" text, or specific color variants (Silver, Gold, Blue, Green, etc.).
              - Put the color/variant name in 'parallel' (e.g., "Gold", "Silver Prizm"). Do NOT include serial numbers in the parallel field.
              - Note visual effects like "Holo", "Cracked Ice", "Wave", "Choice" if visible.

              CRITICAL - SERIAL / NUMBERED DETECTION:
              - Look for any numbered notation on the card, typically in format "X/Y" (e.g., "1/5", "23/99", "100/199").
              - This represents the card's limited edition number and total print run.
              - Put the FULL notation (e.g., "1/5") into the 'serialNumber' field.
              - Common locations: front surface, back surface, edges, or within the card design.
              - If no serial number is visible, set serialNumber to null.
              
              CRITICAL - IMAGE QUALITY:
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
                "parallel": "string (optional)",
                "sport": "BASKETBALL" | "SOCCER" | "OTHER",
                "team": "string (optional)",
                "position": "string (optional)",
                "gradingCompany": "PSA" | "BGS" | "SGC" | "CGC" | "UNGRADED",
                "grade": number (optional),
                "isAutographed": boolean,
                "serialNumber": "string (optional, e.g. '1/5', '23/99')",
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
        max_completion_tokens: 10000,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;

      if (!content) {
        console.error('AI Identification Error: Empty content received', {
          finish_reason: response.choices[0].finish_reason,
          id: response.id,
          model: response.model,
        });

        // Handle Content Filter specifically
        if (response.choices[0].finish_reason === 'content_filter') {
          return {
            playerName: 'Unknown - Content Filter Triggered',
            brand: 'Unknown',
            year: new Date().getFullYear(),
            confidence: 'LOW',
            imageQualityFeedback:
              locale === 'zh'
                ? '无法识别：图片内容触发了安全过滤器，请尝试更换背景或角度。'
                : 'Identification failed: Image triggered content safety filters. Please try a different angle.',
          } as CardRecognitionResult;
        }

        throw new Error(`No content from AI. Finish reason: ${response.choices[0].finish_reason}`);
      }

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
      throw new Error('AI Service not configured. Please check system settings.');
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

    return withRetry(async () => {
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
  
              Return VALID JSON ONLY. Do not include markdown formatting like \`\`\`json.
              
              IMPORTANT: Provide a detailed explanation in ${language}. 
              Use bullet points (-) and newlines for readability. Do not output a single large block of text.

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
        max_completion_tokens: 10000,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      if (!content) {
        console.error('AI Authenticity Error: Empty content received', {
          finish_reason: response.choices[0].finish_reason,
          id: response.id,
        });
        throw new Error('No content from AI');
      }

      // Parse and validate with Zod
      const parsed = JSON.parse(content);
      const validated = AuthenticityAnalysisSchema.safeParse(parsed);

      if (!validated.success) {
        console.warn('Authenticity AI response validation warning:', validated.error.issues);
        // Fallback to parsed if manageable, or handle error
        return {
          riskWarning: parsed.riskWarning || null,
          confidence: parsed.confidence || 'LOW',
        };
      }

      return {
        riskWarning: validated.data.riskWarning || null,
        confidence: validated.data.confidence || 'MEDIUM',
      };
    });
  }

  /**
   * Estimate price based on details using multiple data sources
   */
  async estimatePrice(
    details: Partial<CardRecognitionResult> & {
      customQuery?: string;
      excludedListingIds?: string[];
    }
  ): Promise<PriceEstimateResult> {
    const cardDetails: CardDetails & { customQuery?: string } = {
      playerName: details.playerName || '',
      year: details.year || undefined,
      brand: details.brand || undefined,
      series: details.series || undefined,
      cardNumber: details.cardNumber || undefined,
      parallel: details.parallel || undefined,
      gradingCompany: details.gradingCompany || undefined,
      grade: details.grade || undefined,
      isAutographed: details.isAutographed === null ? undefined : details.isAutographed,
      customQuery: details.customQuery,
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

    // 1b. Apply Exclusions (Phase 3)
    if (details.excludedListingIds && details.excludedListingIds.length > 0) {
      const excludeSet = new Set(details.excludedListingIds);
      sales = sales.filter(s => !excludeSet.has(s.url));
    }

    // 1c. AI/Smart Filtering (New Phase 4)
    // Filter results to ensure they match specific card details (Year, Player, Card #)
    sales = await this.filterEbaySalesWithAI(cardDetails, sales);

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
      serialNumber: '57/99',
    };
  }
  private analysisCache = new Map<string, QuickAnalysisResult>();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 Hours

  /**
   * Quick Comprehensive Analysis (Phase 1)
   * - Single eBay query
   * - Basic Valuation
   * - AI Summary
   */
  async analyzeCardQuick(
    cardDetails: CardDetails & {
      customQuery?: string;
      excludedListingIds?: string[];
      forceRefresh?: boolean;
    },
    locale: string = 'en'
  ): Promise<QuickAnalysisResult> {
    const cacheKey = this.generateAnalysisCacheKey(cardDetails);

    // 1. Check Cache - try memory first, then persistent storage
    // Skip if forceRefresh is true
    if (!cardDetails.forceRefresh) {
      const memoryCached = this.analysisCache.get(cacheKey);
      if (memoryCached && Date.now() - memoryCached.lastUpdated < this.CACHE_TTL) {
        return memoryCached;
      }

      // Try persistent cache (survives server restarts)
      const dbCached = await analysisCacheService.get<QuickAnalysisResult>(cacheKey);
      if (dbCached && Date.now() - dbCached.lastUpdated < this.CACHE_TTL) {
        // Populate memory cache for faster subsequent access
        this.analysisCache.set(cacheKey, dbCached);
        return dbCached;
      }
    }

    // 2. Fetch Data (eBay)
    // We get more results than usual to calculate trend
    let sales = await ebayProvider.getRecentSales(cardDetails);

    // 2b. Apply Exclusions (Phase 3)
    if (cardDetails.excludedListingIds && cardDetails.excludedListingIds.length > 0) {
      const excludeSet = new Set(cardDetails.excludedListingIds);
      // Filter by URL (assuming it's the ID, or extract Item ID if possible. URL is unique too)
      sales = sales.filter(s => !excludeSet.has(s.url));
    }

    // 2c. AI/Smart Filtering
    sales = await this.filterEbaySalesWithAI(cardDetails, sales);

    // Clean data
    const cleanedSales = this.removeOutliers(sales);

    // 3. Stats Calculation (Local)
    // Valuation (Simple Average for now)
    const prices = cleanedSales.map(s => s.price);
    const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;

    // Trend (Last 30 days vs Previous period, simplified)
    // For MVP, we'll just compare first half avg vs second half avg of the result set if enough data
    let trend = 0;
    if (cleanedSales.length >= 4) {
      const sortedByDate = [...cleanedSales].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      const half = Math.floor(sortedByDate.length / 2);
      const oldSlice = sortedByDate.slice(0, half);
      const newSlice = sortedByDate.slice(half);

      const oldAvg = oldSlice.reduce((a, b) => a + b.price, 0) / oldSlice.length;
      const newAvg = newSlice.reduce((a, b) => a + b.price, 0) / newSlice.length;

      if (oldAvg > 0) {
        trend = ((newAvg - oldAvg) / oldAvg) * 100;
      }
    }

    // 4. AI Summary (Azure OpenAI)
    let aiSummary = '';
    try {
      aiSummary = await this.generateInvestmentSummary(cardDetails, avgPrice, trend, locale);
    } catch (e) {
      console.error('AI Summary Gen Failed, using fallback', e);
      aiSummary =
        locale === 'zh'
          ? '暂无法生成AI投资简评，请参考价格数据。'
          : 'AI summary unavailable. Please refer to price data.';
    }

    const result: QuickAnalysisResult = {
      valuation: {
        value: Number(avgPrice.toFixed(2)),
        trend30d: Number(trend.toFixed(1)),
        confidence: cleanedSales.length >= 5 ? 'HIGH' : cleanedSales.length >= 2 ? 'MEDIUM' : 'LOW',
      },
      recentSales: cleanedSales.slice(0, 10).map(s => ({
        date: s.date,
        price: s.price,
        title: s.title,
        url: s.url,
        image: s.image,
      })),
      aiSummary,
      lastUpdated: Date.now(),
    };

    // 5. Cache & Return (both memory and persistent)
    this.analysisCache.set(cacheKey, result);
    // Fire-and-forget persistent cache update
    analysisCacheService
      .set(cacheKey, result as unknown as Record<string, unknown>)
      .catch(() => {});
    return result;
  }

  private generateAnalysisCacheKey(
    details: CardDetails & { customQuery?: string; excludedListingIds?: string[] }
  ): string {
    const base = `analysis|${details.year}|${details.playerName}|${details.brand}|${details.series}|${details.cardNumber}|${details.parallel}|${details.gradingCompany}|${details.grade}|${details.customQuery || ''}`;
    const exclusions = details.excludedListingIds?.sort().join(',') || '';
    return `${base}|ex:[${exclusions}]`;
  }

  /**

  /**
   * Fetch recent news/market sentiment using Perplexity
   */
  private async fetchPlayerNews(playerName: string, year: number, brand: string): Promise<string> {
    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    if (!perplexityKey) return '';

    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${perplexityKey}`,
        },
        body: JSON.stringify({
          model: 'sonar-pro', // Best for reasoning/search
          messages: [
            {
              role: 'system',
              content:
                'You are a sports card news aggregator. Return ONLY the most relevant recent news and market sentiment.',
            },
            {
              role: 'user',
              content: `Find recent news, injuries, trade rumors, or performance updates for NBA/Sport player "${playerName}". 
              Also check for specific sales trends for ${year} ${brand} cards if available.
              Summarize key points in 3 bullet points.`,
            },
          ],
          max_tokens: 500, // Enough for a good summary context
        }),
      });

      if (!response.ok) {
        console.warn(`Perplexity News Fetch Error: ${response.status}`);
        return '';
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || '';
    } catch (error) {
      console.error('Perplexity Fetch Exception:', error);
      return '';
    }
  }

  private async generateInvestmentSummary(
    details: CardDetails,
    price: number,
    trend: number,
    locale: string
  ): Promise<string> {
    const { client, deployment } = await this.getClient();
    if (!client) return '';

    const language = locale === 'zh' ? 'Chinese (Simplified)' : 'English';
    const trendText = trend > 0 ? `+${trend.toFixed(1)}%` : `${trend.toFixed(1)}%`;

    // 1. Fetch Real-time Context (if configured)
    const newsContext = await this.fetchPlayerNews(
      details.playerName,
      details.year || 0,
      details.brand || ''
    );

    // 2. Analyze with Azure OpenAI
    const response = await client.chat.completions.create({
      model: deployment,
      messages: [
        {
          role: 'system',
          content: `You are a sports card investment advisor. 
            Based on the provided card data and real-time news context, provide a **concise 2-3 sentence** summary.
            
            Guidelines:
            - Incorporate the provided news/context if relevant to value.
            - Explain the price trend (${trendText}) in relation to the news (e.g., "rising due to recent playoff performance").
            - Be objective but professional.
            - Answer in ${language}.`,
        },
        {
          role: 'user',
          content: `Card: ${details.year} ${details.brand} ${details.playerName}
            Current Avg Price: $${price}
            Recent Trend: ${trendText}
            
            Real-time News Context:
            ${newsContext || 'No specific recent news available.'}
            
            Provide investment summary.`,
        },
      ],
      max_completion_tokens: 300,
    });

    return response.choices[0].message.content || '';
  }

  /**
   * Phase 2: Analyze Grading Potential (ROI)
   * Fetches Raw, PSA 9, PSA 10 prices + Active Listings
   */
  async analyzeGradingPotential(cardDetails: CardDetails): Promise<GradingAnalysisResult> {
    const baseDetails = {
      playerName: cardDetails.playerName,
      year: cardDetails.year,
      brand: cardDetails.brand,
      series: cardDetails.series,
      cardNumber: cardDetails.cardNumber,
      isAutographed: cardDetails.isAutographed,
    };

    const [rawSales, psa9Sales, psa10Sales, activeCount] = await Promise.all([
      ebayProvider.getRecentSales({ ...baseDetails, gradingCompany: 'UNGRADED' }),
      ebayProvider.getRecentSales({ ...baseDetails, gradingCompany: 'PSA', grade: 9 }),
      ebayProvider.getRecentSales({ ...baseDetails, gradingCompany: 'PSA', grade: 10 }),
      ebayProvider.getActiveListingCount(baseDetails),
    ]);

    const calcAvg = (sales: eBaySalesResult[]) => {
      const cleaned = this.removeOutliers(sales);
      if (cleaned.length === 0) return 0;
      return cleaned.reduce((a, b) => a + b.price, 0) / cleaned.length;
    };

    const rawPrice = calcAvg(rawSales);
    const psa9Price = calcAvg(psa9Sales);
    const psa10Price = calcAvg(psa10Sales);

    const GRADING_COST = 30; // Approx PSA cost + shipping
    const calcRoi = (target: number) => {
      if (rawPrice === 0 || target === 0) return 0;
      const totalCost = rawPrice + GRADING_COST;
      return ((target - totalCost) / totalCost) * 100;
    };

    const psa9Roi = calcRoi(psa9Price);
    const psa10Roi = calcRoi(psa10Price);

    let recommendation: 'GRADE' | 'HOLD' | 'SELL_RAW' = 'SELL_RAW';
    if (psa10Roi > 100 || (psa9Roi > 20 && psa10Roi > 50)) {
      recommendation = 'GRADE';
    } else if (psa10Roi > 0) {
      recommendation = 'HOLD';
    }

    return {
      rawPrice: Number(rawPrice.toFixed(2)),
      psa9Price: Number(psa9Price.toFixed(2)),
      psa10Price: Number(psa10Price.toFixed(2)),
      psa9Roi: Number(psa9Roi.toFixed(1)),
      psa10Roi: Number(psa10Roi.toFixed(1)),
      marketDepth: {
        activeListings: activeCount,
        lastChecked: Date.now(),
      },
      recommendation,
    };
  }

  /**
   * Phase 3: Player Stats & Performance Analysis
   */

  async analyzePlayerStats(playerName: string): Promise<PlayerStatsAnalysisResult> {
    const cached = await this.getCachedStats(playerName);
    if (cached) return cached;

    let statsData: PlayerStatsAnalysisResult | null = null;

    // 1. Try Perplexity API (Primary) - Web search + AI, works for active & retired players
    try {
      statsData = await this.fetchPlayerStatsViaPerplexity(playerName);
    } catch (e) {
      console.warn('Perplexity player stats fetch failed:', e);
    }

    // 2. Try NBA API Free Data (RapidAPI) - Fallback
    if (!statsData) {
      const rapidApiKey =
        (await systemSettingsRepository.getRapidApiKey()) || process.env.RAPID_API_KEY;
      if (rapidApiKey) {
        try {
          statsData = await this.fetchNbaApiFreeData(playerName, rapidApiKey);
        } catch (e) {
          console.warn('NBA API Free Data fetch failed:', e);
        }
      }
    }

    // Build result
    const result = statsData || {
      stats: { games_played: 0, ppg: 0, rpg: 0, apg: 0, mpg: 0, efficiency: 0 },
      meta: { season: '2024-25', source: 'None', last_updated: new Date().toISOString() },
      game_log: [],
    };

    // Always try to generate AI analysis if missing (even when all API sources fail)
    if (!result.aiAnalysis) {
      try {
        result.aiAnalysis = await this.generatePlayerAnalysis(playerName, result.stats, 'zh');
      } catch (e) {
        console.warn('AI analysis generation failed:', e);
        result.aiAnalysis = '暂无法生成AI分析，请检查Azure OpenAI配置。';
      }
    }

    if (statsData) {
      await this.cacheStats(playerName, result);
    }

    return result;
  }

  private async getCachedStats(playerName: string): Promise<PlayerStatsAnalysisResult | null> {
    return analysisCacheService.get<PlayerStatsAnalysisResult>(`stats|${playerName}|2025`);
  }

  private async cacheStats(playerName: string, data: PlayerStatsAnalysisResult): Promise<void> {
    await analysisCacheService.set(
      `stats|${playerName}|2025`,
      data as unknown as Record<string, unknown>,
      3600 * 1000
    );
  }

  /**
   * Fetch player stats via Perplexity API (web search + AI)
   * Works for both active and retired players
   */
  private async fetchPlayerStatsViaPerplexity(
    playerName: string
  ): Promise<PlayerStatsAnalysisResult | null> {
    const perplexityKey = await systemSettingsRepository.getPerplexityApiKey();
    if (!perplexityKey) return null;

    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${perplexityKey}`,
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: [
            {
              role: 'system',
              content: `You are a sports data analyst. Search for the player's stats and return ONLY valid JSON (no markdown, no code fences).
The JSON must follow this exact schema:
{
  "stats": {
    "games_played": <number>,
    "ppg": <number>,
    "rpg": <number>,
    "apg": <number>,
    "mpg": <number>,
    "efficiency": <number>
  },
  "game_log": [
    {
      "date": "<YYYY-MM-DD>",
      "opponent": "<team abbreviation>",
      "points": <number>,
      "rebounds": <number>,
      "assists": <number>,
      "minutes": "<string>",
      "fg_pct": <number 0-1>,
      "three_pct": <number 0-1>,
      "ft_pct": <number 0-1>
    }
  ],
  "season": "<season string>",
  "aiAnalysis": "<Chinese language analysis of the player's performance, card value impact, and investment recommendation. 150 words max.>"
}

Rules:
- For ACTIVE players: use current 2024-25 season stats and last 5 games.
- For RETIRED players: use their career averages and last season played. game_log can be empty [].
- aiAnalysis MUST be in Chinese (Simplified). Include: performance summary, card value trend, buy/hold/sell recommendation.
- Return ONLY the JSON object, nothing else.`,
            },
            {
              role: 'user',
              content: `Search the web for the latest stats and performance data for NBA/sports player: "${playerName}". Include their most recent game log if they are currently active.`,
            },
          ],
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        console.warn(`Perplexity Stats API Error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) return null;

      // Parse JSON from the response (strip code fences if any)
      const jsonStr = content
        .replace(/```json?\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      const parsed = JSON.parse(jsonStr);

      return {
        stats: {
          games_played: parsed.stats?.games_played || 0,
          ppg: parsed.stats?.ppg || 0,
          rpg: parsed.stats?.rpg || 0,
          apg: parsed.stats?.apg || 0,
          mpg: parsed.stats?.mpg || 0,
          efficiency: parsed.stats?.efficiency || 0,
        },
        meta: {
          season: parsed.season || '2024-25',
          source: 'Perplexity',
          last_updated: new Date().toISOString(),
        },
        game_log: (parsed.game_log || []).map((g: any) => ({
          date: g.date || '',
          opponent: g.opponent || '',
          points: g.points || 0,
          rebounds: g.rebounds || 0,
          assists: g.assists || 0,
          minutes: String(g.minutes || '0'),
          fg_pct: g.fg_pct || 0,
          three_pct: g.three_pct || 0,
          ft_pct: g.ft_pct || 0,
        })),
        aiAnalysis: parsed.aiAnalysis || undefined,
      };
    } catch (error) {
      console.error('Perplexity Stats Exception:', error);
      return null;
    }
  }

  /**
   * Fetch player stats via NBA API Free Data (RapidAPI)
   * Uses nba-api-free-data.p.rapidapi.com
   */
  private async fetchNbaApiFreeData(
    playerName: string,
    apiKey: string
  ): Promise<PlayerStatsAnalysisResult | null> {
    const headers = {
      'x-rapidapi-host': 'nba-api-free-data.p.rapidapi.com',
      'x-rapidapi-key': apiKey,
    };

    try {
      // 1. Search Player by name
      const searchRes = await fetch(
        `https://nba-api-free-data.p.rapidapi.com/nba-player-listing/v1/data?search=${encodeURIComponent(playerName)}`,
        { headers }
      );
      if (!searchRes.ok) {
        console.warn(`NBA API Free Data search error: ${searchRes.status}`);
        return null;
      }
      const searchData = await searchRes.json();

      // Find matching player from response (handle various response shapes)
      const players = searchData?.data || searchData?.response || searchData;
      if (!players || (Array.isArray(players) && players.length === 0)) return null;

      // Take the best match
      const playerList = Array.isArray(players) ? players : [players];
      const player =
        playerList.find((p: any) => {
          const fullName = `${p.first_name || p.firstName || ''} ${p.last_name || p.lastName || ''}`
            .trim()
            .toLowerCase();
          const displayName = (p.name || p.display_name || fullName).toLowerCase();
          return (
            displayName.includes(playerName.toLowerCase()) ||
            playerName.toLowerCase().includes(displayName)
          );
        }) || playerList[0];

      if (!player) return null;

      const playerId = player.id || player.player_id || player.playerId;
      if (!playerId) return null;

      // 2. Get Player Statistics
      const statsRes = await fetch(
        `https://nba-api-free-data.p.rapidapi.com/nba-player-statistics/v1/data?player_id=${playerId}&season=2024`,
        { headers }
      );

      if (!statsRes.ok) {
        console.warn(`NBA API Free Data stats error: ${statsRes.status}`);
        return null;
      }

      const statsData = await statsRes.json();
      const games = statsData?.data || statsData?.response || statsData || [];
      const gameList = Array.isArray(games) ? games : [];

      if (gameList.length === 0) return null;

      // Sort by date (descending) and take last 5 games
      const sortedGames = [...gameList].sort((a: any, b: any) => {
        const dateA = a.date || a.game?.date || a.game_date || '';
        const dateB = b.date || b.game?.date || b.game_date || '';
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });

      const last5 = sortedGames.slice(0, 5);

      // Calculate averages
      let totalPts = 0,
        totalReb = 0,
        totalAst = 0,
        totalMin = 0;
      const count = gameList.length;

      gameList.forEach((g: any) => {
        totalPts += g.points || g.pts || 0;
        totalReb += g.rebounds || g.totReb || g.reb || g.total_rebounds || 0;
        totalAst += g.assists || g.ast || 0;
        totalMin += g.minutes
          ? parseFloat(String(g.minutes))
          : g.min
            ? parseFloat(String(g.min))
            : 0;
      });

      return {
        stats: {
          games_played: count,
          ppg: count ? Number((totalPts / count).toFixed(1)) : 0,
          rpg: count ? Number((totalReb / count).toFixed(1)) : 0,
          apg: count ? Number((totalAst / count).toFixed(1)) : 0,
          mpg: count ? Number((totalMin / count).toFixed(1)) : 0,
          efficiency: 0,
        },
        meta: {
          season: '2024-25',
          source: 'NBA API Free Data',
          last_updated: new Date().toISOString(),
        },
        game_log: last5.map((g: any) => ({
          date: g.date || g.game?.date || g.game_date || '',
          opponent: g.opponent || g.matchup || g.game?.opponent || '',
          points: g.points || g.pts || 0,
          rebounds: g.rebounds || g.totReb || g.reb || g.total_rebounds || 0,
          assists: g.assists || g.ast || 0,
          minutes: String(g.minutes || g.min || '0'),
          fg_pct: g.fg_pct || g.fgp || 0,
          three_pct: g.three_pct || g.fg3_pct || g.tpp || 0,
          ft_pct: g.ft_pct || g.ftp || 0,
        })),
      };
    } catch (error) {
      console.warn('NBA API Free Data fetch exception:', error);
      return null;
    }
  }

  private async generatePlayerAnalysis(
    playerName: string,
    stats: any,
    locale: string = 'en'
  ): Promise<string> {
    const { client, deployment } = await this.getClient();
    if (!client) {
      return locale === 'zh' ? '无法生成AI分析。' : 'AI Analysis Unavailable.';
    }

    const statsContext = stats
      ? `
      Season Averages (2024-25): ${stats.points} PPG, ${stats.rebounds} RPG, ${stats.assists} APG.
      Last 5 Games Trend: ${JSON.stringify(stats.last5Games)}
      `
      : 'No specific recent stats data available.';

    const language = locale === 'zh' ? 'Chinese (Simplified)' : 'English';

    const response = await client.chat.completions.create({
      model: deployment,
      messages: [
        {
          role: 'system',
          content: `You are a sports card market analyst. 
            Analyze the player's recent performance and its potential impact on their card values.
            
            Stats Context:
            ${statsContext}
            
            Guidelines:
            - Response Language: STRICTLY ${language} ONLY. Do not use English unless it's a proper noun.
            - Structure: Start with a Sentiment (e.g. Buy/Hold) in ${language}, followed by a concise analysis.
            - If stats are missing, rely on general knowledge (rookie status, potential).
            - Keep it under 150 words.`,
        },
        {
          role: 'user',
          content: `Analyze card value potential for: ${playerName}`,
        },
      ],
    });

    return (
      response.choices[0].message.content || (locale === 'zh' ? '分析失败。' : 'Analysis failed.')
    );
  }
  /**
   * AI-assisted filtering of eBay sales results
   * Validates each result against the target card specification
   */
  async filterEbaySalesWithAI(
    targetCard: CardDetails,
    sales: eBaySalesResult[]
  ): Promise<eBaySalesResult[]> {
    if (sales.length === 0) return [];

    const { client, deployment } = await this.getClient();
    if (!client) {
      // Fallback: basic title matching without AI
      return this.basicTitleFilter(targetCard, sales);
    }

    // Build target card description
    const targetDesc = [
      targetCard.year,
      targetCard.brand,
      targetCard.playerName,
      targetCard.series,
      targetCard.cardNumber ? `#${targetCard.cardNumber}` : null,
      targetCard.parallel,
      targetCard.gradingCompany !== 'UNGRADED' ? targetCard.gradingCompany : null,
      targetCard.grade ? `Grade ${targetCard.grade}` : null,
    ]
      .filter(Boolean)
      .join(' ');

    // Batch process titles - limit to top 50 to fit context window comfortably
    const salesToVerify = sales.slice(0, 50);
    const titles = salesToVerify.map((s, i) => `${i + 1}. ${s.title}`).join('\n');

    try {
      const response = await client.chat.completions.create({
        model: deployment,
        messages: [
          {
            role: 'system',
            content: `You are a sports card expert. Identify which eBay listings EXACTLY match the target card.
A listing matches ONLY if:
1. Same player name
2. Same year (mandatory)
3. Same card number if specified in Target (mandatory). If Target has no number, ignore listing number.
4. Same Brand AND Series/Set. 
   - Example: If Target is "Panini Prizm", "Panini Select" is a MISMATCH.
   - Example: If Target is "Panini Prizm", "Panini Prizm Draft Picks" is a MISMATCH.
   - Example: If Target is just "Panini" (generic), accept "Panini Prizm", "Panini Select" etc. (Generic matches specific).
5. Grading matches if specified.

Return a JSON array of matching listing numbers. Be STRICT.`,
          },
          {
            role: 'user',
            content: `Target Card: ${targetDesc}

eBay Listings:
${titles}

Return JSON: { "matchingIndices": [1, 3, 5] } (numbers of matching listings)`,
          },
        ],
        max_completion_tokens: 500,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      if (!content) return sales;

      const parsed = JSON.parse(content);
      const matches = new Set(parsed.matchingIndices || []);

      // Filter the batch we sent
      const verifiedBatch = salesToVerify.filter((_, index) => matches.has(index + 1));

      return verifiedBatch;
    } catch (error) {
      console.error('AI Filtering Failed, falling back to basic filter:', error);
      return this.basicTitleFilter(targetCard, sales);
    }
  }

  /**
   * Basic title filter when AI is unavailable
   */
  private basicTitleFilter(targetCard: CardDetails, sales: eBaySalesResult[]): eBaySalesResult[] {
    const normalizedTarget = {
      year: String(targetCard.year || ''),
      player: targetCard.playerName.toLowerCase(),
      cardNum: targetCard.cardNumber ? String(targetCard.cardNumber) : '',
      brand: (targetCard.brand || '').toLowerCase(),
    };

    return sales.filter(sale => {
      const title = sale.title.toLowerCase();

      // Must contain year
      if (normalizedTarget.year && !title.includes(normalizedTarget.year)) {
        return false;
      }

      // Must contain player name (at least last name)
      const lastName = normalizedTarget.player.split(' ').pop() || '';
      if (!title.includes(lastName)) {
        return false;
      }

      // Must contain card number if specified
      if (normalizedTarget.cardNum) {
        const cardNumPatterns = [
          `#${normalizedTarget.cardNum}`,
          `no.${normalizedTarget.cardNum}`,
          `/${normalizedTarget.cardNum}`,
          ` ${normalizedTarget.cardNum} `, // isolated number
        ];
        const matchesnum =
          cardNumPatterns.some(p => title.includes(p.toLowerCase())) ||
          title.includes(normalizedTarget.cardNum);
        if (!matchesnum) return false;
      }

      return true;
    });
  }
}

export const aiCardService = new AICardService();
