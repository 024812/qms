/**
 * Database Connection and Client
 * 
 * This module provides the Drizzle ORM database client for the application.
 * It uses the Neon serverless driver for PostgreSQL connections.
 * 
 * Usage:
 * import { db } from '@/db';
 * const users = await db.select().from(usersTable);
 * 
 * Requirements: 1.4 (Database connection setup)
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create Neon HTTP client
const sql = neon(process.env.DATABASE_URL);

// Create Drizzle database instance with schema
export const db = drizzle(sql, { schema });

// Re-export schema for convenience
export * from './schema';
