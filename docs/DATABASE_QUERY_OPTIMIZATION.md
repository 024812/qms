# Database Query Optimization

## Overview

This document describes the database query optimizations implemented for the quilt management system to improve performance and reduce query execution time.

**Requirements: 9.1 - Database optimization with indexes and query optimization**

## Current State Analysis

### Existing Queries in quilt.repository.ts

The repository performs the following types of queries:

1. **Single item lookup by ID** - `SELECT * FROM quilts WHERE id = ?`
2. **List queries with filters** - Multiple WHERE conditions (season, status, location, brand, search)
3. **Sorting** - ORDER BY on various fields (item_number, name, season, weight_grams, created_at, updated_at)
4. **Pagination** - LIMIT and OFFSET
5. **Aggregation** - COUNT queries for pagination
6. **Status-based queries** - `WHERE current_status = ?`
7. **Season-based queries** - `WHERE season = ?`

### Frequently Queried Fields

Based on the repository code analysis:
- `id` (primary key - already indexed)
- `current_status` - filtered in findByStatus() and findAll()
- `season` - filtered in findBySeason() and findAll()
- `item_number` - used for sorting and MAX queries
- `location` - LIKE queries in findAll()
- `brand` - LIKE queries in findAll()
- `name`, `color`, `fill_material`, `notes` - full-text search in findAll()
- `created_at`, `updated_at` - used for sorting

## Optimization Strategy

### 1. Index Creation

Create indexes for frequently queried and filtered fields:

```sql
-- Status index (already exists in items table, need for quilts)
CREATE INDEX IF NOT EXISTS idx_quilts_current_status ON quilts(current_status);

-- Season index (frequently filtered)
CREATE INDEX IF NOT EXISTS idx_quilts_season ON quilts(season);

-- Item number index (used for sorting and MAX queries)
CREATE INDEX IF NOT EXISTS idx_quilts_item_number ON quilts(item_number);

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_quilts_status_season ON quilts(current_status, season);

-- Location index for LIKE queries (using text_pattern_ops for prefix matching)
CREATE INDEX IF NOT EXISTS idx_quilts_location_lower ON quilts(LOWER(location) text_pattern_ops);

-- Brand index for LIKE queries
CREATE INDEX IF NOT EXISTS idx_quilts_brand_lower ON quilts(LOWER(brand) text_pattern_ops);

-- Created_at index for sorting
CREATE INDEX IF NOT EXISTS idx_quilts_created_at ON quilts(created_at DESC);

-- Updated_at index for sorting
CREATE INDEX IF NOT EXISTS idx_quilts_updated_at ON quilts(updated_at DESC);
```

### 2. Query Optimization

#### Current Implementation Analysis

The repository already implements several best practices:
- ✅ Uses parameterized queries (SQL injection safe)
- ✅ Implements pagination with LIMIT/OFFSET
- ✅ Sorts at database level before pagination
- ✅ Uses NULL-safe comparisons for optional filters
- ✅ Implements efficient COUNT queries

#### Potential Improvements

1. **Full-Text Search**: The current LIKE-based search on multiple fields could benefit from PostgreSQL's full-text search:
   ```sql
   -- Add tsvector column for full-text search
   ALTER TABLE quilts ADD COLUMN search_vector tsvector;
   
   -- Create GIN index for full-text search
   CREATE INDEX idx_quilts_search_vector ON quilts USING GIN(search_vector);
   
   -- Update trigger to maintain search_vector
   CREATE TRIGGER quilts_search_vector_update
   BEFORE INSERT OR UPDATE ON quilts
   FOR EACH ROW EXECUTE FUNCTION
   tsvector_update_trigger(search_vector, 'pg_catalog.simple', 
     name, color, fill_material, notes);
   ```

2. **Partial Indexes**: For status-specific queries:
   ```sql
   -- Index for active quilts (most common query)
   CREATE INDEX idx_quilts_in_use ON quilts(season, created_at) 
   WHERE current_status = 'IN_USE';
   
   -- Index for storage quilts
   CREATE INDEX idx_quilts_storage ON quilts(season, created_at) 
   WHERE current_status = 'STORAGE';
   ```

3. **Covering Indexes**: For list queries that only need specific columns:
   ```sql
   -- Covering index for list view (includes commonly displayed fields)
   CREATE INDEX idx_quilts_list_view ON quilts(
     current_status, season, created_at
   ) INCLUDE (id, item_number, name, color, brand, location);
   ```

### 3. N+1 Query Prevention

The current repository doesn't have N+1 issues because:
- ✅ Single queries fetch all needed data
- ✅ No lazy loading of related entities in loops
- ✅ Usage records are fetched separately when needed (not in loops)

### 4. Connection Pooling

The system uses Neon's serverless driver which handles connection pooling automatically:
- ✅ Configured in `src/lib/neon.ts`
- ✅ Uses `@neondatabase/serverless` with built-in pooling
- ✅ Suitable for serverless environments

## Implementation Plan

### Phase 1: Essential Indexes (Immediate Impact)
1. Create indexes for `current_status`, `season`, `item_number`
2. Create composite index for `(current_status, season)`
3. Create indexes for `created_at` and `updated_at`

### Phase 2: Search Optimization (Medium Priority)
1. Add indexes for `location` and `brand` with text_pattern_ops
2. Consider full-text search implementation for better search performance

### Phase 3: Advanced Optimization (Future Enhancement)
1. Implement partial indexes for common status filters
2. Add covering indexes for list views
3. Monitor query performance and adjust indexes based on actual usage patterns

## Performance Monitoring

### Metrics to Track
- Query execution time for list queries
- Index usage statistics
- Cache hit rates
- Database connection pool utilization

### Tools
- PostgreSQL `EXPLAIN ANALYZE` for query plans
- Neon dashboard for connection and query metrics
- Application-level logging for slow queries

## Testing Strategy

1. **Before/After Benchmarks**: Measure query execution time before and after index creation
2. **Load Testing**: Test with realistic data volumes (1000+ quilts)
3. **Query Plan Analysis**: Use EXPLAIN ANALYZE to verify index usage
4. **Cache Testing**: Verify Next.js 16 caching works correctly with optimized queries

## Rollback Plan

If indexes cause issues:
```sql
-- Drop indexes individually
DROP INDEX IF EXISTS idx_quilts_current_status;
DROP INDEX IF EXISTS idx_quilts_season;
-- etc.
```

## Maintenance

- **Index Maintenance**: PostgreSQL automatically maintains indexes
- **Vacuum**: Neon handles automatic vacuuming
- **Statistics**: PostgreSQL auto-analyzes tables for query planning
- **Monitoring**: Regularly check index usage with `pg_stat_user_indexes`

## References

- PostgreSQL Index Documentation: https://www.postgresql.org/docs/current/indexes.html
- Neon Performance Guide: https://neon.tech/docs/guides/performance
- Next.js 16 Caching: https://nextjs.org/docs/app/building-your-application/caching
