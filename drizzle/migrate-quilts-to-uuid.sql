-- Migration: Convert quilts.id from text to uuid
-- Date: 2026-06-16
-- 
-- This migration converts the quilts table ID from text to uuid type
-- Steps:
-- 1. Create new uuid column
-- 2. Migrate existing valid UUIDs
-- 3. Update foreign keys
-- 4. Swap columns
-- 5. Clean up

-- Step 1: Add temporary uuid column
ALTER TABLE quilts ADD COLUMN id_new UUID;

-- Step 2: Migrate existing IDs (only valid UUIDs will be converted)
UPDATE quilts 
SET id_new = id::uuid 
WHERE id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Step 3: Generate UUIDs for any NULL values (if invalid text IDs existed)
UPDATE quilts 
SET id_new = gen_random_uuid() 
WHERE id_new IS NULL;

-- Step 4: Update foreign key references
-- 4a. Add temporary column in usage_records
ALTER TABLE usage_records ADD COLUMN quilt_id_new UUID;
UPDATE usage_records ur
SET quilt_id_new = q.id_new
FROM quilts q
WHERE ur.quilt_id = q.id;

-- 4b. Add temporary column in maintenance_records
ALTER TABLE maintenance_records ADD COLUMN quilt_id_new UUID;
UPDATE maintenance_records mr
SET quilt_id_new = q.id_new
FROM quilts q
WHERE mr.quilt_id = q.id;

-- 4c. Update notifications if they reference quilts
UPDATE notifications n
SET quilt_id = q.id_new::text
FROM quilts q
WHERE n.quilt_id = q.id;

-- Step 5: Drop old foreign key constraints
ALTER TABLE usage_records DROP CONSTRAINT IF EXISTS usage_records_quilt_id_quilts_id_fk;
ALTER TABLE maintenance_records DROP CONSTRAINT IF EXISTS maintenance_records_quilt_id_quilts_id_fk;

-- Step 6: Drop old columns and rename new ones
ALTER TABLE quilts DROP COLUMN id;
ALTER TABLE quilts RENAME COLUMN id_new TO id;
ALTER TABLE quilts ADD PRIMARY KEY (id);

ALTER TABLE usage_records DROP COLUMN quilt_id;
ALTER TABLE usage_records RENAME COLUMN quilt_id_new TO quilt_id;
ALTER TABLE usage_records ALTER COLUMN quilt_id SET NOT NULL;

ALTER TABLE maintenance_records DROP COLUMN quilt_id;
ALTER TABLE maintenance_records RENAME COLUMN quilt_id_new TO quilt_id;
ALTER TABLE maintenance_records ALTER COLUMN quilt_id SET NOT NULL;

-- Step 7: Re-create foreign key constraints
ALTER TABLE usage_records 
ADD CONSTRAINT usage_records_quilt_id_quilts_id_fk 
FOREIGN KEY (quilt_id) REFERENCES quilts(id) ON DELETE CASCADE;

ALTER TABLE maintenance_records 
ADD CONSTRAINT maintenance_records_quilt_id_quilts_id_fk 
FOREIGN KEY (quilt_id) REFERENCES quilts(id) ON DELETE CASCADE;

-- Step 8: Re-create indexes
DROP INDEX IF EXISTS usage_records_quilt_idx;
CREATE INDEX usage_records_quilt_idx ON usage_records(quilt_id);

DROP INDEX IF EXISTS maintenance_records_quilt_idx;
CREATE INDEX maintenance_records_quilt_idx ON maintenance_records(quilt_id);

-- Verify migration
SELECT 'Migration complete. Quilts count: ' || COUNT(*) FROM quilts;
SELECT 'Usage records count: ' || COUNT(*) FROM usage_records;
SELECT 'Maintenance records count: ' || COUNT(*) FROM maintenance_records;
