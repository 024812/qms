#!/usr/bin/env tsx
/**
 * Interactive Database Setup Script
 * 
 * This script guides you through setting up the database for the
 * extensible item management framework.
 * 
 * Usage: npm run db:setup-interactive
 */

import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import { neon } from '@neondatabase/serverless';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('🚀 Database Setup Wizard\n');
  console.log('This wizard will help you set up your database.\n');

  // Check if DATABASE_URL already exists
  const envPath = path.join(process.cwd(), '.env.local');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
  }

  const hasDbUrl = envContent.includes('DATABASE_URL=') && 
                   !envContent.includes('# DATABASE_URL=');

  if (hasDbUrl) {
    console.log('✅ DATABASE_URL is already configured in .env.local\n');
    const proceed = await question('Do you want to test the connection? (y/n): ');
    
    if (proceed.toLowerCase() === 'y') {
      await testConnection();
    }
  } else {
    console.log('⚠️  DATABASE_URL is not configured\n');
    console.log('Options:');
    console.log('1. Use Neon PostgreSQL (recommended, free tier available)');
    console.log('2. Use local PostgreSQL');
    console.log('3. Enter connection string manually\n');
    
    const choice = await question('Choose an option (1-3): ');
    
    switch (choice) {
      case '1':
        await setupNeon();
        break;
      case '2':
        await setupLocal();
        break;
      case '3':
        await setupManual();
        break;
      default:
        console.log('Invalid choice. Exiting.');
        process.exit(1);
    }
  }

  rl.close();
}

async function setupNeon() {
  console.log('\n📝 Setting up Neon PostgreSQL\n');
  console.log('Steps:');
  console.log('1. Go to https://neon.tech');
  console.log('2. Sign up for a free account');
  console.log('3. Create a new project');
  console.log('4. Copy the connection string from the dashboard\n');
  
  const connectionString = await question('Paste your Neon connection string: ');
  
  if (!connectionString.trim()) {
    console.log('❌ No connection string provided. Exiting.');
    process.exit(1);
  }

  await saveAndTest(connectionString.trim());
}

async function setupLocal() {
  console.log('\n📝 Setting up local PostgreSQL\n');
  console.log('Make sure PostgreSQL is installed and running.\n');
  
  const host = await question('Host (default: localhost): ') || 'localhost';
  const port = await question('Port (default: 5432): ') || '5432';
  const database = await question('Database name (default: qms_development): ') || 'qms_development';
  const username = await question('Username (default: postgres): ') || 'postgres';
  const password = await question('Password: ');
  
  const connectionString = `postgresql://${username}:${password}@${host}:${port}/${database}`;
  
  await saveAndTest(connectionString);
}

async function setupManual() {
  console.log('\n📝 Manual connection string entry\n');
  console.log('Format: postgresql://username:password@host:port/database\n');
  
  const connectionString = await question('Enter connection string: ');
  
  if (!connectionString.trim()) {
    console.log('❌ No connection string provided. Exiting.');
    process.exit(1);
  }

  await saveAndTest(connectionString.trim());
}

async function saveAndTest(connectionString: string) {
  console.log('\n💾 Saving to .env.local...');
  
  const envPath = path.join(process.cwd(), '.env.local');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
  }

  // Remove existing DATABASE_URL lines
  envContent = envContent
    .split('\n')
    .filter(line => !line.includes('DATABASE_URL='))
    .join('\n');

  // Add new DATABASE_URL
  envContent += `\n\n# Database Configuration\nDATABASE_URL="${connectionString}"\n`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Saved to .env.local\n');

  // Test connection
  await testConnection(connectionString);
}

async function testConnection(connectionString?: string) {
  console.log('🔍 Testing database connection...\n');

  const dbUrl = connectionString || process.env.DATABASE_URL;

  if (!dbUrl) {
    console.log('❌ No DATABASE_URL found');
    process.exit(1);
  }

  try {
    const sql = neon(dbUrl);
    const result = await sql`SELECT version()`;
    
    console.log('✅ Connection successful!');
    console.log(`   PostgreSQL version: ${result[0].version}\n`);

    // Check for tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    if (tables.length === 0) {
      console.log('⚠️  No tables found. You need to run migrations.\n');
      const runMigrations = await question('Run migrations now? (y/n): ');
      
      if (runMigrations.toLowerCase() === 'y') {
        console.log('\n📦 Running migrations...');
        console.log('Please run: npm run db:push\n');
      }
    } else {
      console.log('✅ Found tables:');
      tables.forEach((table: any) => {
        console.log(`   - ${table.table_name}`);
      });
      console.log('\n✅ Database is ready!\n');
    }
  } catch (error) {
    console.error('❌ Connection failed');
    console.error(`   Error: ${error instanceof Error ? error.message : String(error)}\n`);
    console.log('Please check your connection string and try again.\n');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
