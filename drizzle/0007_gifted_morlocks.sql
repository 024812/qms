-- Keep the newest active usage record for each quilt and close any older duplicates
-- before enforcing the invariant at the database level.
SELECT setval(
  pg_get_serial_sequence('quilts', 'item_number'),
  COALESCE((SELECT MAX("item_number") + 1 FROM "quilts"), 1),
  false
);
--> statement-breakpoint

WITH ranked_active AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "quilt_id"
      ORDER BY "start_date" DESC, "created_at" DESC, "id" DESC
    ) AS row_number
  FROM "usage_records"
  WHERE "end_date" IS NULL
)
UPDATE "usage_records" AS usage
SET
  "end_date" = GREATEST(usage."start_date", NOW()),
  "updated_at" = NOW()
FROM ranked_active
WHERE usage."id" = ranked_active."id"
  AND ranked_active.row_number > 1;
--> statement-breakpoint

-- Reconcile denormalized quilt status with the surviving active records.
UPDATE "quilts" AS quilt
SET "current_status" = 'IN_USE', "updated_at" = NOW()
WHERE EXISTS (
  SELECT 1
  FROM "usage_records" AS usage
  WHERE usage."quilt_id" = quilt."id"
    AND usage."end_date" IS NULL
);
--> statement-breakpoint

UPDATE "quilts" AS quilt
SET "current_status" = 'STORAGE', "updated_at" = NOW()
WHERE quilt."current_status" = 'IN_USE'
  AND NOT EXISTS (
    SELECT 1
    FROM "usage_records" AS usage
    WHERE usage."quilt_id" = quilt."id"
      AND usage."end_date" IS NULL
  );
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "usage_records_active_quilt_unique_idx"
  ON "usage_records" USING btree ("quilt_id")
  WHERE "end_date" IS NULL;
