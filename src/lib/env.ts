/**
 * Environment Variable Validation
 *
 * Validates all required and optional environment variables on startup.
 * Throws descriptive errors if required variables are missing or invalid.
 *
 * Usage: Import this file in next.config.ts to validate on build/start
 */

import { z } from 'zod';

const envSchema = z.object({
  // Database (Required)
  DATABASE_URL: z
    .string()
    .url('DATABASE_URL must be a valid URL')
    .startsWith('postgresql://', 'DATABASE_URL must be a PostgreSQL connection string'),

  // Authentication (Required)
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, 'BETTER_AUTH_SECRET must be at least 32 characters')
    .describe('Generate with: openssl rand -base64 32'),

  // Authentication URLs (Optional but recommended for production)
  BETTER_AUTH_URL: z.string().url().optional(),
  NEXT_PUBLIC_BETTER_AUTH_URL: z.string().url().optional(),

  // Legacy auth fallback
  AUTH_SECRET: z.string().optional(),
  NEXTAUTH_SECRET: z.string().optional(),

  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Redis (Optional - for rate limiting)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  REDIS_URL: z.string().url().optional(),

  // Vercel (Auto-populated)
  VERCEL_URL: z.string().optional(),

  // Error Webhook (Optional)
  WEBHOOK_ERROR_URL: z.string().url().optional(),

  // AI Services (Optional - for cards module)
  AZURE_OPENAI_API_KEY: z.string().optional(),
  AZURE_OPENAI_ENDPOINT: z.string().url().optional(),
  AZURE_OPENAI_DEPLOYMENT: z.string().default('gpt-4o'),
  PERPLEXITY_API_KEY: z.string().optional(),

  // Card Data APIs (Optional)
  RAPID_API_KEY: z.string().optional(),
  EBAY_APP_ID: z.string().optional(),
  EBAY_CERT_ID: z.string().optional(),
  EBAY_DEV_ID: z.string().optional(),
  EBAY_ENVIRONMENT: z.enum(['sandbox', 'production']).default('production'),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(issue => {
        const path = issue.path.join('.');
        return `  ❌ ${path}: ${issue.message}`;
      });

      console.error('\n🚨 Environment Variable Validation Failed:\n');
      console.error(issues.join('\n'));
      console.error('\n📖 See .env.example for required variables\n');

      throw new Error('Invalid environment variables');
    }
    throw error;
  }
}

// Validate and export
export const env = validateEnv();

// Helper to check if optional features are enabled
export const features = {
  redis: Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN),
  azureOpenAI: Boolean(env.AZURE_OPENAI_API_KEY && env.AZURE_OPENAI_ENDPOINT),
  ebayAPI: Boolean(env.EBAY_APP_ID && env.EBAY_CERT_ID && env.EBAY_DEV_ID),
  rapidAPI: Boolean(env.RAPID_API_KEY),
  perplexity: Boolean(env.PERPLEXITY_API_KEY),
} as const;

// Export helper for runtime checks
export function requireEnv(key: keyof Env, feature: string): string {
  const value = env[key];
  if (!value || value === '') {
    throw new Error(`${feature} requires ${key} to be set. Please add it to your .env file.`);
  }
  return value;
}
