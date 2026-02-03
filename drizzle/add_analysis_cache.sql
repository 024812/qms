-- Migration to add analysis_cache table for persistent caching
-- Generated: 2026-02-03

CREATE TABLE IF NOT EXISTS "analysis_cache" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "cache_key" text NOT NULL UNIQUE,
  "result" jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "expires_at" timestamp NOT NULL
);

CREATE INDEX IF NOT EXISTS "analysis_cache_key_idx" ON "analysis_cache" USING btree ("cache_key");
CREATE INDEX IF NOT EXISTS "analysis_cache_expires_idx" ON "analysis_cache" USING btree ("expires_at");
