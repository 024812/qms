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

import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
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
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Re-export schema for convenience
export * from './schema';
