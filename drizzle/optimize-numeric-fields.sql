-- Migration: Optimize numeric field types in cards table
-- Date: 2026-06-16
-- 
-- This migration optimizes numeric fields by using proper PostgreSQL numeric type
-- with automatic JavaScript number mapping for better performance

-- No schema changes needed - Drizzle ORM will handle the mapping
-- This is a code-level optimization, not a database migration

-- The database schema remains:
-- purchasePrice NUMERIC(10, 2)
-- currentValue NUMERIC(10, 2)
-- estimatedValue NUMERIC(10, 2)
-- soldPrice NUMERIC(10, 2)
-- grade NUMERIC(3, 1)

-- But the application code will now:
-- 1. Use number type directly instead of string conversions
-- 2. Let Drizzle ORM handle precision automatically
-- 3. Eliminate cleanNumericToString() overhead

SELECT 'Numeric field optimization - code-level change only' AS status;
