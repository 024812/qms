/**
 * Vercel Authentication Diagnostics Script
 * 
 * This script helps diagnose authentication issues on Vercel by:
 * 1. Checking environment variables
 * 2. Testing database connection
 * 3. Verifying user exists and password is correct
 * 4. Providing actionable recommendations
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// Dynamically import db to ensure env vars are loaded first
const getDb = async () => {
  const { db } = await import('@/db');
  return db;
};

const TEST_EMAIL = 'lixi@oheng.com';
const TEST_PASSWORD = 'passwd12';

async function diagnose() {
  console.log('='.repeat(60));
  console.log('VERCEL AUTHENTICATION DIAGNOSTICS');
  console.log('='.repeat(60));
  console.log();

  // Step 1: Check environment variables
  console.log('📋 Step 1: Checking Environment Variables');
  console.log('-'.repeat(60));

  const envChecks = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
    NODE_ENV: process.env.NODE_ENV,
  };

  console.log('Environment Variables:');
  Object.entries(envChecks).forEach(([key, value]) => {
    const status = typeof value === 'string' ? `✅ ${value}` : value ? '✅ Set' : '❌ Missing';
    console.log(`  ${key}: ${status}`);
  });
  console.log();

  if (!envChecks.DATABASE_URL) {
    console.error('❌ CRITICAL: DATABASE_URL is not set!');
    console.log('   Fix: Set DATABASE_URL in Vercel environment variables');
    console.log('   Format: postgresql://user:password@host/database?sslmode=require');
    console.log();
  }

  if (!envChecks.NEXTAUTH_SECRET) {
    console.error('❌ CRITICAL: NEXTAUTH_SECRET is not set!');
    console.log('   Fix: Generate and set NEXTAUTH_SECRET in Vercel');
    console.log('   Command: openssl rand -base64 32');
    console.log();
  }

  if (!envChecks.NEXTAUTH_URL) {
    console.warn('⚠️  WARNING: NEXTAUTH_URL is not set!');
    console.log('   Fix: Set NEXTAUTH_URL to your Vercel deployment URL');
    console.log('   Example: https://your-app.vercel.app');
    console.log();
  }

  // Step 2: Test database connection
  console.log('🔌 Step 2: Testing Database Connection');
  console.log('-'.repeat(60));

  try {
    const db = await getDb();
    const result = await db.select().from(users).limit(1);
    console.log('✅ Database connection successful');
    console.log(`   Found ${result.length} user(s) in database`);
    console.log();
  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error('   Error:', error instanceof Error ? error.message : error);
    console.log('   Fix: Verify DATABASE_URL is correct and database is accessible');
    console.log();
    return;
  }

  // Step 3: Check test user exists
  console.log('👤 Step 3: Checking Test User');
  console.log('-'.repeat(60));

  try {
    const db = await getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, TEST_EMAIL))
      .limit(1);

    if (!user) {
      console.error(`❌ User not found: ${TEST_EMAIL}`);
      console.log('   Fix: Create user with scripts/add-oheng-user.ts');
      console.log();
      return;
    }

    console.log(`✅ User found: ${TEST_EMAIL}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.preferences?.role || 'N/A'}`);
    console.log(`   Active Modules: ${JSON.stringify(user.preferences?.activeModules || [])}`);
    console.log();

    // Step 4: Verify password
    console.log('🔐 Step 4: Verifying Password');
    console.log('-'.repeat(60));

    const passwordMatch = await bcrypt.compare(TEST_PASSWORD, user.hashedPassword);

    if (passwordMatch) {
      console.log('✅ Password verification successful');
      console.log(`   Test password "${TEST_PASSWORD}" matches stored hash`);
    } else {
      console.error('❌ Password verification failed!');
      console.log(`   Test password "${TEST_PASSWORD}" does NOT match stored hash`);
      console.log('   Fix: Reset password with scripts/setup-password.ts');
    }
    console.log();

  } catch (error) {
    console.error('❌ Error checking user:');
    console.error('   ', error instanceof Error ? error.message : error);
    console.log();
    return;
  }

  // Step 5: Summary and recommendations
  console.log('📊 Summary and Recommendations');
  console.log('='.repeat(60));

  const allGood = envChecks.DATABASE_URL && envChecks.NEXTAUTH_SECRET;

  if (allGood) {
    console.log('✅ All critical checks passed!');
    console.log();
    console.log('If login still fails on Vercel:');
    console.log('1. Verify environment variables are set in Vercel Dashboard');
    console.log('2. Redeploy the application after setting env vars');
    console.log('3. Clear browser cache and cookies');
    console.log('4. Check Vercel Function Logs for detailed errors');
    console.log('5. Visit /debug-session to verify session status');
  } else {
    console.log('❌ Critical issues found - see above for fixes');
    console.log();
    console.log('Required actions:');
    if (!envChecks.DATABASE_URL) {
      console.log('1. Set DATABASE_URL in Vercel environment variables');
    }
    if (!envChecks.NEXTAUTH_SECRET) {
      console.log('2. Generate and set NEXTAUTH_SECRET in Vercel');
    }
    console.log('3. Redeploy application after setting environment variables');
  }

  console.log();
  console.log('='.repeat(60));
  console.log('For detailed instructions, see: docs/VERCEL_ENV_CHECK.md');
  console.log('='.repeat(60));
}

diagnose()
  .then(() => {
    console.log('\n✅ Diagnostics complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Diagnostics failed:', error);
    process.exit(1);
  });
