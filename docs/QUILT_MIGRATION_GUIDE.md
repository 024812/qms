# Quilt Data Migration Guide

## Overview

This guide explains the data migration strategy for integrating the existing quilt management system with the extensible item management framework.

## Migration Approaches

### Approach 1: Wrapper/Adapter Pattern (RECOMMENDED) ✅

**Status**: Currently Implemented
**Migration Required**: NO

The wrapper/adapter pattern allows the existing `quilts` table to continue working without any data migration. The module system provides an additional interface layer that adapts between the framework's expectations and the existing implementation.

#### Advantages
- ✅ **Zero data loss** - All existing data remains intact
- ✅ **No downtime** - No migration execution required
- ✅ **Backward compatible** - Existing code continues to work
- ✅ **Low risk** - No database changes
- ✅ **Immediate deployment** - Ready to use now
- ✅ **Preserves all features** - Usage tracking, images, maintenance records all work

#### How It Works
1. Existing `quilts` table remains unchanged
2. Module schema (`src/modules/quilts/schema.ts`) re-exports existing types
3. Module config (`src/modules/quilts/config.ts`) maps to existing fields
4. Adapter functions convert between formats when needed
5. Repository layer continues to use `quilts` table directly

#### Current Implementation
```typescript
// Schema adapter (src/modules/quilts/schema.ts)
export { QuiltSchema, Quilt } from '@/lib/validations/quilt';
export const quiltAttributesSchema = QuiltSchema.omit({ id, createdAt, updatedAt });

// Conversion helpers
export function quiltToQuiltItem(quilt: Quilt): QuiltItem { ... }
export function quiltItemToQuilt(item: QuiltItem): Quilt { ... }
```

### Approach 2: Data Migration to Generic Items Table (OPTIONAL) ⚠️

**Status**: Script provided but not executed
**Migration Required**: YES
**Script**: `scripts/migrate-quilts-to-items.ts`

This approach migrates data from the dedicated `quilts` table to the generic `items` table using single-table inheritance with JSONB attributes.

#### When to Consider This Approach
- You want to consolidate all item types into one table
- You're starting fresh with no existing data
- You want to simplify the database schema
- You're comfortable with JSONB performance characteristics

#### Disadvantages
- ⚠️ **Requires downtime** - Database migration needed
- ⚠️ **Risk of data loss** - Migration could fail
- ⚠️ **Performance impact** - JSONB queries may be slower
- ⚠️ **Code changes required** - Repository layer needs updates
- ⚠️ **Testing required** - Extensive testing needed
- ⚠️ **Backup required** - Must backup before migration

## Current Database Structure

### Existing Quilts Table (Dedicated)
```sql
CREATE TABLE quilts (
  id TEXT PRIMARY KEY,
  item_number INTEGER,
  group_id INTEGER,
  name TEXT NOT NULL,
  season TEXT CHECK (season IN ('WINTER', 'SPRING_AUTUMN', 'SUMMER')),
  length_cm INTEGER,
  width_cm INTEGER,
  weight_grams INTEGER,
  fill_material TEXT,
  material_details TEXT,
  color TEXT,
  brand TEXT,
  purchase_date TIMESTAMP,
  location TEXT,
  packaging_info TEXT,
  current_status TEXT CHECK (current_status IN ('IN_USE', 'MAINTENANCE', 'STORAGE')),
  notes TEXT,
  image_url TEXT,
  thumbnail_url TEXT,
  main_image TEXT,
  attachment_images TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Features**:
- 24+ dedicated columns for quilt-specific data
- Strong typing with CHECK constraints
- Optimized indexes for common queries
- Direct foreign key relationships
- Array type for attachment_images

### Generic Items Table (Framework)
```sql
CREATE TABLE items (
  id UUID PRIMARY KEY,
  type item_type NOT NULL,
  name TEXT NOT NULL,
  status item_status NOT NULL DEFAULT 'storage',
  owner_id UUID NOT NULL REFERENCES users(id),
  attributes JSONB NOT NULL DEFAULT '{}',
  images JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Features**:
- Single table for all item types
- JSONB for flexible attributes
- Supports multiple modules (quilts, cards, shoes, etc.)
- Requires owner_id (multi-tenant support)

## Migration Script Usage

If you decide to migrate to the generic items table in the future:

### Dry Run (Preview Only)
```bash
npm run migrate:quilts
```

This will:
- Validate all quilt data
- Show preview of migration
- Report any validation errors
- **NOT make any changes**

### Execute Migration
```bash
# Set the owner user ID
export DEFAULT_USER_ID="your-user-id-here"

# Execute with backup
npm run migrate:quilts -- --execute --backup
```

This will:
1. Create backup table (`quilts_backup_<timestamp>`)
2. Validate all quilts
3. Migrate data in a transaction
4. Verify each migrated record
5. Rollback on any error

### Safety Features
- ✅ Dry-run mode by default
- ✅ Data validation before migration
- ✅ Automatic backup creation
- ✅ Transaction-based (all-or-nothing)
- ✅ Verification after each record
- ✅ Automatic rollback on error

## Data Mapping

### Quilt → Item Mapping

| Quilt Field | Item Field | Notes |
|-------------|------------|-------|
| id | id | Direct mapping |
| name | name | Direct mapping |
| current_status | status | Mapped: IN_USE→in_use, STORAGE→storage, MAINTENANCE→maintenance |
| - | type | Set to 'quilt' |
| - | owner_id | From DEFAULT_USER_ID env var |
| All other fields | attributes (JSONB) | Stored as JSON object |
| main_image, attachment_images | images (JSONB) | Combined into array |

### Attributes JSONB Structure
```json
{
  "itemNumber": 1,
  "groupId": null,
  "season": "WINTER",
  "lengthCm": 220,
  "widthCm": 200,
  "weightGrams": 2500,
  "fillMaterial": "Goose Down",
  "materialDetails": "90% Goose Down, 10% Feathers",
  "color": "White",
  "brand": "Nordic Dreams",
  "purchaseDate": "2023-10-15T00:00:00.000Z",
  "location": "Master Bedroom Closet",
  "packagingInfo": "Vacuum sealed bag",
  "notes": "Excellent for very cold nights",
  "imageUrl": null,
  "thumbnailUrl": null
}
```

## Recommendation

**We recommend using Approach 1 (Wrapper/Adapter Pattern)** for the following reasons:

1. **Zero Risk** - No data migration means no risk of data loss
2. **Immediate Value** - Framework features available now
3. **Preserves Performance** - Dedicated columns are faster than JSONB
4. **Maintains Features** - All existing functionality works as-is
5. **Future Flexibility** - Can migrate later if needed

The migration script is provided for future use, but there's no immediate need to execute it. The wrapper pattern provides all the benefits of the framework while maintaining the robustness of the existing system.

## Verification

To verify the current implementation works correctly:

```bash
# Run module verification
npm run verify:quilt-module

# Run repository tests
npm test src/lib/repositories/quilt.repository.test.ts

# Run schema tests
npm test src/modules/quilts/__tests__/schema.test.ts
```

## Rollback Plan

If you execute the migration and need to rollback:

1. **Restore from backup**:
   ```sql
   -- Find backup table
   SELECT tablename FROM pg_tables WHERE tablename LIKE 'quilts_backup_%';
   
   -- Restore from backup
   DROP TABLE items;
   ALTER TABLE quilts_backup_<timestamp> RENAME TO items;
   ```

2. **Revert code changes**:
   ```bash
   git revert <migration-commit>
   ```

3. **Verify data integrity**:
   ```bash
   npm run verify:quilt-module
   ```

## Support

For questions or issues:
1. Check the verification scripts in `scripts/`
2. Review the implementation documentation in `src/modules/quilts/`
3. Consult the spec at `.kiro/specs/extensible-item-management-framework/`

---

**Last Updated**: 2024-01-19
**Status**: Wrapper/Adapter Pattern Implemented ✅
**Migration Script**: Available but not required
