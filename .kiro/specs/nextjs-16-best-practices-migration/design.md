# Next.js 16 Best Practices Migration - Design

## Architecture Overview

### Current Architecture (Deprecated)

```
middleware.ts → Class Repositories → Database
     ↓
  Classes with 'use cache' (❌ Not serializable)
```

### New Architecture (Next.js 16 Best Practices)

```
proxy.ts → Data Access Layer (Functions) → Database
              ↓
         'use cache' + React cache()
              ↓
         Serializable Data
```

## Component Design

### 1. Proxy API (Replaces Middleware)

**File**: `src/proxy.ts`

```typescript
import type { NextRequest } from 'next/server';
import { auth } from '@/auth';

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};

export async function proxy(request: NextRequest) {
  const session = await auth();

  // Protected routes
  const protectedPaths = ['/quilts', '/usage', '/settings', '/analytics'];
  const isProtected = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path));

  if (isProtected && !session) {
    return Response.json({ success: false, message: 'Authentication required' }, { status: 401 });
  }
}
```

### 2. Data Access Layer - Functional Pattern

**File**: `src/lib/data/quilts.ts`

```typescript
import { cache } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import { updateTag } from 'next/cache';
import { sql } from '@/lib/neon';
import type { Quilt, QuiltFilters, QuiltStatus, Season } from '@/types/quilt';

// ============================================================================
// READ OPERATIONS (with caching)
// ============================================================================

/**
 * Get quilt by ID
 * Cache: 5 minutes
 * Tags: 'quilts', 'quilts-{id}'
 */
export async function getQuiltById(id: string): Promise<Quilt | null> {
  'use cache';
  cacheLife('minutes'); // 5 minutes
  cacheTag('quilts', `quilts-${id}`);

  const rows = await sql`
    SELECT * FROM quilts WHERE id = ${id}
  `;
  return rows[0] ? rowToQuilt(rows[0]) : null;
}

/**
 * Get all quilts with filters
 * Cache: 2 minutes
 * Tags: 'quilts', 'quilts-list', dynamic based on filters
 */
export async function getQuilts(filters: QuiltFilters = {}): Promise<Quilt[]> {
  'use cache';
  cacheLife('seconds'); // 2 minutes (120 seconds)

  const tags = ['quilts', 'quilts-list'];
  if (filters.status) tags.push(`quilts-status-${filters.status}`);
  if (filters.season) tags.push(`quilts-season-${filters.season}`);
  cacheTag(...tags);

  // Build query with filters...
  const rows = await sql`SELECT * FROM quilts ORDER BY created_at DESC`;
  return rows.map(rowToQuilt);
}

// ============================================================================
// WRITE OPERATIONS (with cache invalidation)
// ============================================================================

/**
 * Create a new quilt
 * Invalidates: 'quilts', 'quilts-list', status/season tags
 */
export async function createQuilt(data: CreateQuiltInput): Promise<Quilt> {
  const id = crypto.randomUUID();

  const rows = await sql`
    INSERT INTO quilts (id, name, season, ...)
    VALUES (${id}, ${data.name}, ${data.season}, ...)
    RETURNING *
  `;

  const quilt = rowToQuilt(rows[0]);

  // Invalidate cache
  updateTag('quilts');
  updateTag('quilts-list');
  updateTag(`quilts-status-${quilt.currentStatus}`);
  updateTag(`quilts-season-${quilt.season}`);

  return quilt;
}

/**
 * Update a quilt
 * Invalidates: specific quilt, list, and related tags
 */
export async function updateQuilt(id: string, data: UpdateQuiltInput): Promise<Quilt> {
  // Get current for cache invalidation
  const current = await getQuiltById(id);
  if (!current) throw new Error('Quilt not found');

  const rows = await sql`
    UPDATE quilts 
    SET name = ${data.name}, ...
    WHERE id = ${id}
    RETURNING *
  `;

  const updated = rowToQuilt(rows[0]);

  // Invalidate cache
  updateTag('quilts');
  updateTag('quilts-list');
  updateTag(`quilts-${id}`);

  // Invalidate old and new status/season if changed
  if (current.currentStatus !== updated.currentStatus) {
    updateTag(`quilts-status-${current.currentStatus}`);
    updateTag(`quilts-status-${updated.currentStatus}`);
  }
  if (current.season !== updated.season) {
    updateTag(`quilts-season-${current.season}`);
    updateTag(`quilts-season-${updated.season}`);
  }

  return updated;
}

// ============================================================================
// REQUEST DEDUPLICATION (React cache)
// ============================================================================

export const getQuiltByIdCached = cache(getQuiltById);
export const getQuiltsCached = cache(getQuilts);
```

### 3. Server Actions Pattern

**File**: `src/app/actions/quilts.ts`

```typescript
'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { createQuilt, updateQuilt, deleteQuilt } from '@/lib/data/quilts';
import { createQuiltSchema } from '@/lib/validations/quilt';

export async function createQuiltAction(formData: FormData) {
  // 1. Authentication
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Authentication required' };
  }

  // 2. Validation
  const validatedFields = createQuiltSchema.safeParse({
    name: formData.get('name'),
    season: formData.get('season'),
    // ...
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // 3. Data Access Layer
  try {
    const quilt = await createQuilt(validatedFields.data);

    // 4. Revalidate UI
    revalidatePath('/quilts');

    return { success: true, data: quilt };
  } catch (error) {
    return { error: 'Failed to create quilt' };
  }
}
```

## Data Flow

### Read Flow

```
Component/Page
    ↓
getQuiltsCached() [React cache - request dedup]
    ↓
getQuilts() ['use cache' - persistent cache]
    ↓
Database Query
    ↓
Transform to Quilt type
    ↓
Return serializable data
```

### Write Flow

```
Form Submission
    ↓
Server Action (validation)
    ↓
createQuilt() [Data Access Layer]
    ↓
Database Mutation
    ↓
updateTag() [Cache invalidation]
    ↓
revalidatePath() [UI revalidation]
    ↓
Return result
```

## Migration Strategy

### Phase 1: Create New Patterns

1. Create `src/proxy.ts`
2. Create `src/lib/data/` directory
3. Implement functional data access for quilts
4. Test new patterns alongside old ones

### Phase 2: Update Consumers

1. Update Server Actions to use new data functions
2. Update API routes to use new data functions
3. Update components to use new patterns
4. Run tests to verify functionality

### Phase 3: Remove Old Patterns

1. Delete `src/middleware.ts`
2. Delete `src/lib/repositories/` directory
3. Remove unused imports
4. Clean up types and interfaces

### Phase 4: Optimize

1. Fine-tune cache lifetimes
2. Optimize cache tags
3. Add performance monitoring
4. Document new patterns

## Caching Strategy

### Cache Lifetimes

- **Individual items**: 5 minutes (`cacheLife('minutes')`)
- **Lists**: 2 minutes (`cacheLife('seconds')` = 120s)
- **Stats/Analytics**: 1 minute (`cacheLife('seconds')` = 60s)

### Cache Tags

- **Global**: `'quilts'`, `'usage-logs'`, `'stats'`
- **Specific**: `'quilts-{id}'`, `'usage-logs-{itemId}'`
- **Filtered**: `'quilts-status-{status}'`, `'quilts-season-{season}'`
- **Lists**: `'quilts-list'`, `'usage-logs-list'`

### Cache Invalidation Rules

- **Create**: Invalidate global + list + filter tags
- **Update**: Invalidate global + list + specific + old/new filter tags
- **Delete**: Invalidate global + list + specific + filter tags

## Type Safety

### Serializable Data

All cached functions must return JSON-serializable data:

- ✅ Primitives (string, number, boolean, null)
- ✅ Plain objects
- ✅ Arrays
- ❌ Class instances
- ❌ Functions
- ❌ Symbols
- ❌ undefined (use null instead)

### Type Transformations

```typescript
// Database row (snake_case)
type QuiltRow = {
  id: string;
  item_number: number;
  created_at: string;
  // ...
};

// Application model (camelCase)
type Quilt = {
  id: string;
  itemNumber: number;
  createdAt: Date;
  // ...
};

// Transform function
function rowToQuilt(row: QuiltRow): Quilt {
  return {
    id: row.id,
    itemNumber: row.item_number,
    createdAt: new Date(row.created_at),
    // ...
  };
}
```

## Testing Strategy

### Unit Tests

- Test each data access function independently
- Mock database calls
- Verify cache tags are set correctly
- Verify cache invalidation works

### Integration Tests

- Test full read/write flows
- Verify caching behavior
- Test cache invalidation
- Verify data consistency

### Performance Tests

- Measure cache hit rates
- Measure response times
- Compare before/after migration
- Monitor database query counts

## Rollback Plan

If issues arise:

1. Keep old repository classes temporarily
2. Feature flag to switch between old/new patterns
3. Gradual migration per module
4. Monitor errors and performance
5. Quick rollback if needed

## Success Metrics

- ✅ Zero deprecation warnings in build
- ✅ 50%+ reduction in database queries (cache hits)
- ✅ Faster page load times
- ✅ Successful Vercel deployment
- ✅ All tests passing
- ✅ Code follows Next.js 16 best practices
