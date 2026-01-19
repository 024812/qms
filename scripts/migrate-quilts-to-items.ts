/**
 * Quilt Data Migration Script
 * 
 * This script migrates data from the dedicated `quilts` table to the generic `items` table
 * using the single-table inheritance pattern with JSONB attributes.
 * 
 * ⚠️ IMPORTANT: This migration is OPTIONAL
 * 
 * The wrapper/adapter pattern allows the existing `quilts` table to continue working
 * without migration. This script is provided for future use if you decide to consolidate
 * all data into the generic `items` table.
 * 
 * Requirements: 7.1, 7.3 - Data migration with integrity validation
 * 
 * Usage:
 *   npm run migrate:quilts
 * 
 * Safety Features:
 * - Dry-run mode by default (use --execute to actually migrate)
 * - Validates data integrity before and after migration
 * - Creates backup before migration
 * - Rolls back on error
 * - Preserves all 24+ fields
 * 
 * @example
 * // Dry run (preview only)
 * npm run migrate:quilts
 * 
 * // Execute migration
 * npm run migrate:quilts -- --execute
 * 
 * // Execute with backup
 * npm run migrate:quilts -- --execute --backup
 */

import { sql, withTransaction } from '@/lib/neon';
import { quiltRepository } from '@/lib/repositories/quilt.repository';
import { Quilt } from '@/lib/validations/quilt';

interface MigrationStats {
  totalQuilts: number;
  migratedQuilts: number;
  failedQuilts: number;
  errors: Array<{ quiltId: string; error: string }>;
}

interface MigrationOptions {
  execute: boolean;
  backup: boolean;
  userId: string; // Owner ID for the items
}

/**
 * Validate that a quilt has all required fields
 */
function validateQuilt(quilt: Quilt): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!quilt.id) errors.push('Missing id');
  if (!quilt.name) errors.push('Missing name');
  if (!quilt.season) errors.push('Missing season');
  if (!quilt.fillMaterial) errors.push('Missing fillMaterial');
  if (!quilt.color) errors.push('Missing color');
  if (!quilt.location) errors.push('Missing location');
  if (!quilt.currentStatus) errors.push('Missing currentStatus');

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Convert a Quilt to the items table format
 */
function quiltToItem(quilt: Quilt, ownerId: string) {
  // Map quilt status to item status
  const statusMap: Record<string, string> = {
    IN_USE: 'in_use',
    MAINTENANCE: 'maintenance',
    STORAGE: 'storage',
  };

  // All quilt-specific fields go into attributes JSONB
  const attributes = {
    itemNumber: quilt.itemNumber,
    groupId: quilt.groupId,
    season: quilt.season,
    lengthCm: quilt.lengthCm,
    widthCm: quilt.widthCm,
    weightGrams: quilt.weightGrams,
    fillMaterial: quilt.fillMaterial,
    materialDetails: quilt.materialDetails,
    color: quilt.color,
    brand: quilt.brand,
    purchaseDate: quilt.purchaseDate?.toISOString(),
    location: quilt.location,
    packagingInfo: quilt.packagingInfo,
    notes: quilt.notes,
    imageUrl: quilt.imageUrl,
    thumbnailUrl: quilt.thumbnailUrl,
  };

  // Images array
  const images: string[] = [];
  if (quilt.mainImage) images.push(quilt.mainImage);
  if (quilt.attachmentImages) images.push(...quilt.attachmentImages);

  return {
    id: quilt.id,
    type: 'quilt' as const,
    name: quilt.name,
    status: statusMap[quilt.currentStatus] || 'storage',
    ownerId,
    attributes,
    images,
    createdAt: quilt.createdAt,
    updatedAt: quilt.updatedAt,
  };
}

/**
 * Create a backup of the quilts table
 */
async function createBackup(): Promise<void> {
  console.log('📦 Creating backup of quilts table...');
  
  await sql`
    CREATE TABLE IF NOT EXISTS quilts_backup_${Date.now()} AS
    SELECT * FROM quilts
  `;
  
  console.log('✅ Backup created successfully');
}

/**
 * Migrate a single quilt to the items table
 */
async function migrateQuilt(quilt: Quilt, ownerId: string): Promise<void> {
  const item = quiltToItem(quilt, ownerId);

  await sql`
    INSERT INTO items (
      id, type, name, status, owner_id, attributes, images, created_at, updated_at
    ) VALUES (
      ${item.id},
      ${item.type},
      ${item.name},
      ${item.status},
      ${item.ownerId},
      ${JSON.stringify(item.attributes)},
      ${JSON.stringify(item.images)},
      ${item.createdAt.toISOString()},
      ${item.updatedAt.toISOString()}
    )
  `;
}

/**
 * Verify that migrated data matches original data
 */
async function verifyMigration(quiltId: string, ownerId: string): Promise<boolean> {
  // Get original quilt
  const originalRows = await sql`
    SELECT * FROM quilts WHERE id = ${quiltId}
  `;
  
  if (originalRows.length === 0) {
    console.error(`❌ Original quilt not found: ${quiltId}`);
    return false;
  }

  // Get migrated item
  const itemRows = await sql`
    SELECT * FROM items WHERE id = ${quiltId} AND type = 'quilt'
  `;
  
  if (itemRows.length === 0) {
    console.error(`❌ Migrated item not found: ${quiltId}`);
    return false;
  }

  const original = originalRows[0] as any;
  const item = itemRows[0] as any;

  // Verify key fields
  if (item.name !== original.name) {
    console.error(`❌ Name mismatch for ${quiltId}`);
    return false;
  }

  if (item.owner_id !== ownerId) {
    console.error(`❌ Owner ID mismatch for ${quiltId}`);
    return false;
  }

  // Verify attributes
  const attrs = item.attributes as any;
  if (attrs.season !== original.season) {
    console.error(`❌ Season mismatch for ${quiltId}`);
    return false;
  }

  if (attrs.fillMaterial !== original.fill_material) {
    console.error(`❌ Fill material mismatch for ${quiltId}`);
    return false;
  }

  return true;
}

/**
 * Main migration function
 */
async function migrateQuilts(options: MigrationOptions): Promise<MigrationStats> {
  const stats: MigrationStats = {
    totalQuilts: 0,
    migratedQuilts: 0,
    failedQuilts: 0,
    errors: [],
  };

  console.log('🚀 Starting quilt migration...');
  console.log(`Mode: ${options.execute ? 'EXECUTE' : 'DRY RUN'}`);
  console.log(`Backup: ${options.backup ? 'YES' : 'NO'}`);
  console.log(`Owner ID: ${options.userId}`);
  console.log('');

  try {
    // Get all quilts
    const quilts = await quiltRepository.findAll({ limit: 10000 });
    stats.totalQuilts = quilts.length;

    console.log(`📊 Found ${stats.totalQuilts} quilts to migrate`);
    console.log('');

    // Validate all quilts first
    console.log('🔍 Validating quilts...');
    for (const quilt of quilts) {
      const validation = validateQuilt(quilt);
      if (!validation.valid) {
        console.error(`❌ Validation failed for quilt ${quilt.id}:`, validation.errors);
        stats.errors.push({
          quiltId: quilt.id,
          error: `Validation failed: ${validation.errors.join(', ')}`,
        });
        stats.failedQuilts++;
      }
    }

    if (stats.failedQuilts > 0) {
      console.error(`\n❌ ${stats.failedQuilts} quilts failed validation`);
      console.error('Please fix validation errors before migrating');
      return stats;
    }

    console.log('✅ All quilts passed validation');
    console.log('');

    if (!options.execute) {
      console.log('📋 DRY RUN - No changes will be made');
      console.log('');
      console.log('Preview of migration:');
      quilts.slice(0, 3).forEach((quilt) => {
        const item = quiltToItem(quilt, options.userId);
        console.log(`\nQuilt: ${quilt.name} (${quilt.id})`);
        console.log(`  → Item type: ${item.type}`);
        console.log(`  → Status: ${quilt.currentStatus} → ${item.status}`);
        console.log(`  → Attributes: ${Object.keys(item.attributes).length} fields`);
        console.log(`  → Images: ${item.images.length} images`);
      });
      console.log('');
      console.log('To execute migration, run with --execute flag');
      return stats;
    }

    // Create backup if requested
    if (options.backup) {
      await createBackup();
    }

    // Execute migration in a transaction
    console.log('🔄 Migrating quilts...');
    await withTransaction(async () => {
      for (const quilt of quilts) {
        try {
          await migrateQuilt(quilt, options.userId);
          
          // Verify migration
          const verified = await verifyMigration(quilt.id, options.userId);
          if (!verified) {
            throw new Error(`Verification failed for quilt ${quilt.id}`);
          }

          stats.migratedQuilts++;
          
          if (stats.migratedQuilts % 10 === 0) {
            console.log(`  ✓ Migrated ${stats.migratedQuilts}/${stats.totalQuilts} quilts`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`❌ Failed to migrate quilt ${quilt.id}:`, errorMessage);
          stats.errors.push({
            quiltId: quilt.id,
            error: errorMessage,
          });
          stats.failedQuilts++;
          throw error; // Rollback transaction
        }
      }
    });

    console.log('');
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('📊 Migration Statistics:');
    console.log(`  Total quilts: ${stats.totalQuilts}`);
    console.log(`  Migrated: ${stats.migratedQuilts}`);
    console.log(`  Failed: ${stats.failedQuilts}`);

    return stats;
  } catch (error) {
    console.error('');
    console.error('❌ Migration failed:', error);
    console.error('');
    console.error('The transaction has been rolled back.');
    console.error('No changes were made to the database.');
    throw error;
  }
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  
  const options: MigrationOptions = {
    execute: args.includes('--execute'),
    backup: args.includes('--backup'),
    userId: process.env.DEFAULT_USER_ID || 'default-user-id',
  };

  // Validate user ID
  if (options.execute && options.userId === 'default-user-id') {
    console.error('❌ Error: DEFAULT_USER_ID environment variable not set');
    console.error('Please set DEFAULT_USER_ID to the owner user ID');
    process.exit(1);
  }

  try {
    const stats = await migrateQuilts(options);
    
    if (stats.failedQuilts > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { migrateQuilts, quiltToItem, validateQuilt };
