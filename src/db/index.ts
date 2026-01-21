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

import { drizzle, NeonDatabase } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PgTransaction } from 'drizzle-orm/pg-core';
import * as schema from './schema';
import ws from 'ws';

// Required for Neon serverless driver to work with WebSocket
neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true; // Enable HTTP batch queries for better performance

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10, // Maximum connections in the pool
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 10000, // Fail connection after 10 seconds
});

export const db = drizzle(pool, { schema });
export type Tx = NeonDatabase<typeof schema> | PgTransaction<any, typeof schema, any>;

// Re-export schema for convenience
export * from './schema';
