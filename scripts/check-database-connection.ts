#!/usr/bin/env tsx
/**
 * Database Connection Check Script
 * 
 * This script verifies that the DATABASE_URL is configured correctly
 * and that the database is accessible.
 * 
 * Usage: npm run db:check
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { neon } from '@neondatabase/serverless';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

async function checkDatabaseConnection() {
  console.log('🔍 Checking database connection...\n');

  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.log('\n📝 To fix this:');
    console.log('1. Create a Neon PostgreSQL database at https://neon.tech');
    console.log('2. Copy your connection string');
    console.log('3. Add it to .env.local:');
    console.log('   DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"');
    process.exit(1);
  }

  console.log('✅ DATABASE_URL is set');
  console.log(`   Connection string: ${process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@')}\n`);

  // Try to connect
  try {
    const sql = neon(process.env.DATABASE_URL);
    const result = await sql`SELECT version()`;
    
    console.log('✅ Database connection successful!');
    console.log(`   PostgreSQL version: ${result[0].version}\n`);
    
    // Check if tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    if (tables.length === 0) {
      console.log('⚠️  No tables found in database');
      console.log('   Run migrations with: npm run db:push\n');
    } else {
      console.log('✅ Found tables:');
      tables.forEach((table: any) => {
        console.log(`   - ${table.table_name}`);
      });
      console.log('');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed');
    console.error(`   Error: ${error instanceof Error ? error.message : String(error)}\n`);
    console.log('📝 Troubleshooting:');
    console.log('1. Verify your DATABASE_URL is correct');
    console.log('2. Check that your Neon database is active');
    console.log('3. Ensure your IP is allowed (Neon allows all by default)');
    console.log('4. Check your internet connection\n');
    process.exit(1);
  }
}

checkDatabaseConnection();
