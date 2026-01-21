#!/usr/bin/env tsx

/**
 * Query Optimization Verification Script
 * 
 * This script verifies that database indexes are properly created and being used
 * for the quilts table query optimization.
 * 
 * Requirements: 9.1 - Database optimization verification
 */

import 'dotenv/config';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

interface IndexInfo {
  schemaname: string;
  tablename: string;
  indexname: string;
  indexdef: string;
}

interface IndexStats {
  schemaname: string;
  tablename: string;
  indexname: string;
  idx_scan: number;
  idx_tup_read: number;
  idx_tup_fetch: number;
}

async function verifyIndexes() {
  console.log('🔍 Verifying Query Optimization Implementation\n');
  console.log('=' .repeat(80));
  
  try {
    // Check if quilts table exists
    console.log('\n📊 Checking quilts table...');
    const tableCheckResult = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'quilts'
      ) as exists;
    `);
    const tableCheck = tableCheckResult.rows;
    
    if (!tableCheck[0].exists) {
      console.log('❌ Quilts table not found!');
      console.log('   This script is for the legacy quilts table.');
      console.log('   If you are using the new items table, indexes are already defined in schema.ts');
      return;
    }
    
    console.log('✅ Quilts table found');
    
    // Get all indexes on quilts table
    console.log('\n📋 Checking indexes on quilts table...');
    const indexesResult = await db.execute(sql`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'quilts'
      ORDER BY indexname;
    `);
    const indexes = indexesResult.rows as unknown as IndexInfo[];
    
    console.log(`\nFound ${indexes.length} indexes:\n`);
    
    // Expected indexes from migration 009
    const expectedIndexes = [
      'idx_quilts_current_status',
      'idx_quilts_season',
      'idx_quilts_item_number',
      'idx_quilts_status_season',
      'idx_quilts_created_at_desc',
      'idx_quilts_updated_at_desc',
      'idx_quilts_location_lower',
      'idx_quilts_brand_lower',
      'idx_quilts_status_created',
      'idx_quilts_season_created',
      'idx_quilts_in_use',
      'idx_quilts_storage',
    ];
    
    const foundIndexes = indexes.map(idx => idx.indexname);
    const missingIndexes = expectedIndexes.filter(name => !foundIndexes.includes(name));
    
    // Display all indexes
    indexes.forEach(idx => {
      const isExpected = expectedIndexes.includes(idx.indexname);
      const icon = isExpected ? '✅' : '📌';
      console.log(`${icon} ${idx.indexname}`);
      console.log(`   ${idx.indexdef}\n`);
    });
    
    // Report missing indexes
    if (missingIndexes.length > 0) {
      console.log('\n⚠️  Missing expected indexes:');
      missingIndexes.forEach(name => {
        console.log(`   ❌ ${name}`);
      });
      console.log('\n💡 Run migration 009_optimize_quilts_indexes.sql to create missing indexes');
    } else {
      console.log('\n✅ All expected indexes are present!');
    }
    
    // Get index usage statistics
    console.log('\n📈 Index Usage Statistics:');
    console.log('-'.repeat(80));
    
    const statsResult = await db.execute(sql`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes
      WHERE tablename = 'quilts'
      ORDER BY idx_scan DESC;
    `);
    const stats = statsResult.rows as unknown as IndexStats[];
    
    if (stats.length === 0) {
      console.log('ℹ️  No usage statistics available yet (table may be new or unused)');
    } else {
      console.log('\nIndex Name                          | Scans    | Tuples Read | Tuples Fetched');
      console.log('-'.repeat(80));
      
      stats.forEach(stat => {
        const name = stat.indexname.padEnd(35);
        const scans = stat.idx_scan.toString().padStart(8);
        const read = stat.idx_tup_read.toString().padStart(11);
        const fetch = stat.idx_tup_fetch.toString().padStart(14);
        console.log(`${name} | ${scans} | ${read} | ${fetch}`);
      });
      
      // Identify unused indexes
      const unusedIndexes = stats.filter(s => s.idx_scan === 0 && !s.indexname.includes('pkey'));
      if (unusedIndexes.length > 0) {
        console.log('\n⚠️  Unused indexes (consider removing if still unused after 30 days):');
        unusedIndexes.forEach(idx => {
          console.log(`   📌 ${idx.indexname}`);
        });
      }
    }
    
    // Get table statistics
    console.log('\n📊 Table Statistics:');
    console.log('-'.repeat(80));
    
    const tableStatsResult = await db.execute(sql`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_rows,
        n_dead_tup as dead_rows,
        last_vacuum,
        last_autovacuum,
        last_analyze,
        last_autoanalyze
      FROM pg_stat_user_tables
      WHERE tablename = 'quilts';
    `);
    const tableStats = tableStatsResult.rows;
    
    if (tableStats.length > 0) {
      const stats = tableStats[0];
      console.log(`\nLive Rows:        ${stats.live_rows}`);
      console.log(`Dead Rows:        ${stats.dead_rows}`);
      console.log(`Total Inserts:    ${stats.inserts}`);
      console.log(`Total Updates:    ${stats.updates}`);
      console.log(`Total Deletes:    ${stats.deletes}`);
      console.log(`Last Vacuum:      ${stats.last_vacuum || 'Never'}`);
      console.log(`Last Autovacuum:  ${stats.last_autovacuum || 'Never'}`);
      console.log(`Last Analyze:     ${stats.last_analyze || 'Never'}`);
      console.log(`Last Autoanalyze: ${stats.last_autoanalyze || 'Never'}`);
    }
    
    // Test query performance
    console.log('\n🚀 Testing Query Performance:');
    console.log('-'.repeat(80));
    
    // Test 1: Simple status filter
    console.log('\nTest 1: Status filter query');
    const test1Start = Date.now();
    await db.execute(sql`
      EXPLAIN ANALYZE
      SELECT * FROM quilts
      WHERE current_status = 'IN_USE'
      ORDER BY created_at DESC
      LIMIT 20;
    `);
    const test1Time = Date.now() - test1Start;
    console.log(`✅ Completed in ${test1Time}ms`);
    
    // Test 2: Composite filter
    console.log('\nTest 2: Status + Season filter query');
    const test2Start = Date.now();
    await db.execute(sql`
      EXPLAIN ANALYZE
      SELECT * FROM quilts
      WHERE current_status = 'IN_USE' AND season = 'WINTER'
      ORDER BY created_at DESC
      LIMIT 20;
    `);
    const test2Time = Date.now() - test2Start;
    console.log(`✅ Completed in ${test2Time}ms`);
    
    // Test 3: Text search
    console.log('\nTest 3: Location search query');
    const test3Start = Date.now();
    await db.execute(sql`
      EXPLAIN ANALYZE
      SELECT * FROM quilts
      WHERE LOWER(location) LIKE '%bedroom%'
      LIMIT 20;
    `);
    const test3Time = Date.now() - test3Start;
    console.log(`✅ Completed in ${test3Time}ms`);
    
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Verification Complete!');
    console.log('\n📝 Summary:');
    console.log(`   - Indexes found: ${indexes.length}`);
    console.log(`   - Expected indexes: ${expectedIndexes.length}`);
    console.log(`   - Missing indexes: ${missingIndexes.length}`);
    
    if (missingIndexes.length === 0) {
      console.log('\n🎉 All optimizations are properly implemented!');
    } else {
      console.log('\n⚠️  Some optimizations are missing. Run the migration to complete setup.');
    }
    
    console.log('\n💡 Next Steps:');
    console.log('   1. Monitor index usage over the next week');
    console.log('   2. Check for unused indexes after 30 days');
    console.log('   3. Use EXPLAIN ANALYZE to verify query plans');
    console.log('   4. Benchmark query performance with realistic data');
    
  } catch (error) {
    console.error('\n❌ Error during verification:', error);
    throw error;
  }
}

// Run verification
verifyIndexes()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
