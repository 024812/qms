import { NextRequest } from 'next/server';

/**
 * Rate Limiting Module
 *
 * Supports two backends:
 * 1. Upstash Redis (recommended for production/serverless)
 *    - Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars
 *    - Free tier: 500K commands/month
 * 2. In-memory (fallback for development or when Redis not configured)
 *    - Note: Does not persist across serverless function instances
 */

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// Check if Upstash is configured
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const USE_UPSTASH = !!(UPSTASH_URL && UPSTASH_TOKEN);

// In-memory store for rate limiting (fallback when Redis not configured)
const memoryStore: RateLimitStore = {};

// Clean up expired entries every 5 minutes (only for in-memory store)
if (typeof setInterval !== 'undefined') {
  setInterval(
    () => {
      const now = Date.now();
      Object.keys(memoryStore).forEach(key => {
        if (memoryStore[key].resetTime < now) {
          delete memoryStore[key];
        }
      });
    },
    5 * 60 * 1000
  );
}

/**
 * Simple Upstash REST API client (no extra dependencies needed)
 */
interface UpstashResponse<T = unknown> {
  result?: T;
}

async function upstashCommand<T = unknown>(command: string[]): Promise<T | null> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null;

  try {
    const response = await fetch(`${UPSTASH_URL}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
    });

    if (!response.ok) {
      console.warn('[RateLimit] Upstash request failed:', response.status);
      return null;
    }

    const data = (await response.json()) as UpstashResponse<T>;
    return data.result ?? null;
  } catch (error) {
    console.warn('[RateLimit] Upstash error, falling back to memory:', error);
    return null;
  }
}

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async check(request: NextRequest): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  }> {
    const key = this.generateKey(request);
    const now = Date.now();
    const windowSeconds = Math.ceil(this.config.windowMs / 1000);

    // Try Upstash first if configured
    if (USE_UPSTASH) {
      const upstashResult = await this.checkUpstash(key, windowSeconds, now);
      if (upstashResult) return upstashResult;
    }

    // Fall back to in-memory
    return this.checkMemory(key, now);
  }

  private async checkUpstash(
    key: string,
    windowSeconds: number,
    now: number
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  } | null> {
    try {
      // Use INCR with EXPIRE for atomic increment
      const count = await upstashCommand<number>(['INCR', key]);
      if (count === null) return null;

      // Set expiry on first request
      if (count === 1) {
        await upstashCommand(['EXPIRE', key, windowSeconds.toString()]);
      }

      // Get TTL for reset time
      const ttl = await upstashCommand<number>(['TTL', key]);
      if (ttl === null) return null;
      const resetTime = now + (ttl > 0 ? ttl * 1000 : this.config.windowMs);

      if (count > this.config.maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetTime,
          retryAfter: ttl > 0 ? ttl : windowSeconds,
        };
      }

      return {
        allowed: true,
        remaining: this.config.maxRequests - count,
        resetTime,
      };
    } catch {
      return null;
    }
  }

  private checkMemory(
    key: string,
    now: number
  ): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  } {
    let entry = memoryStore[key];

    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs,
      };
      memoryStore[key] = entry;
    }

    if (entry.count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      };
    }

    entry.count++;

    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  private generateKey(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
    return `rate_limit:${ip}:${request.nextUrl.pathname}`;
  }
}

// Predefined rate limiters for different use cases
export const rateLimiters = {
  // General API endpoints - 100 requests per minute
  api: new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 100,
  }),

  // Authentication endpoints - 5 requests per minute
  auth: new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 5,
  }),

  // File upload endpoints - 10 requests per minute
  upload: new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 10,
  }),

  // Database operations - 50 requests per minute
  database: new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 50,
  }),

  // Health check - 30 requests per minute
  health: new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 30,
  }),
};

// Helper function to apply rate limiting to API routes
export async function withRateLimit(
  request: NextRequest,
  limiter: RateLimiter,
  handler: () => Promise<Response>
): Promise<Response> {
  const result = await limiter.check(request);

  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: result.retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': limiter['config'].maxRequests.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
          'Retry-After': result.retryAfter?.toString() || '60',
        },
      }
    );
  }

  const response = await handler();

  response.headers.set('X-RateLimit-Limit', limiter['config'].maxRequests.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

  return response;
}

/**
 * Check if Upstash Redis is configured
 */
export function isUpstashConfigured(): boolean {
  return USE_UPSTASH;
}
