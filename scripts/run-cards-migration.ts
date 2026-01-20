/**
 * Run Cards Table Migration
 *
 * This script executes the cards table migration SQL directly against the database.
 * It creates the cards table, enum types, and indexes without affecting existing data.
 */

import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  console.log('🚀 Starting cards table migration...\n');

  const sql = neon(DATABASE_URL);

  // Define SQL statements manually to avoid parsing issues
  const statements = [
    `CREATE TYPE "public"."sport_type" AS ENUM('BASKETBALL', 'SOCCER', 'OTHER')`,
    `CREATE TYPE "public"."grading_company_type" AS ENUM('PSA', 'BGS', 'SGC', 'CGC', 'UNGRADED')`,
    `CREATE TYPE "public"."card_status_type" AS ENUM('COLLECTION', 'FOR_SALE', 'SOLD', 'GRADING', 'DISPLAY')`,
    `CREATE TABLE "public"."cards" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "user_id" text NOT NULL,
      "item_number" serial NOT NULL,
      "player_name" text NOT NULL,
      "sport" "sport_type" NOT NULL,
      "team" text,
      "position" text,
      "year" integer NOT NULL,
      "brand" text NOT NULL,
      "series" text,
      "card_number" text,
      "grading_company" "grading_company_type" DEFAULT 'UNGRADED',
      "grade" numeric(3, 1),
      "certification_number" text,
      "purchase_price" numeric(10, 2),
      "purchase_date" date,
      "current_value" numeric(10, 2),
      "estimated_value" numeric(10, 2),
      "parallel" text,
      "serial_number" text,
      "is_autographed" boolean DEFAULT false NOT NULL,
      "has_memorabilia" boolean DEFAULT false NOT NULL,
      "memorabilia_type" text,
      "status" "card_status_type" DEFAULT 'COLLECTION' NOT NULL,
      "location" text,
      "storage_type" text,
      "condition" text,
      "notes" text,
      "main_image" text,
      "attachment_images" jsonb DEFAULT '[]'::jsonb,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL,
      CONSTRAINT "cards_item_number_unique" UNIQUE("item_number")
    )`,
    `ALTER TABLE "public"."cards" ADD CONSTRAINT "cards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action`,
    `CREATE INDEX "cards_user_idx" ON "public"."cards" USING btree ("user_id")`,
    `CREATE INDEX "cards_sport_idx" ON "public"."cards" USING btree ("sport")`,
    `CREATE INDEX "cards_grade_idx" ON "public"."cards" USING btree ("grade")`,
    `CREATE INDEX "cards_value_idx" ON "public"."cards" USING btree ("current_value")`,
    `CREATE INDEX "cards_status_idx" ON "public"."cards" USING btree ("status")`,
    `CREATE INDEX "cards_sport_grade_idx" ON "public"."cards" USING btree ("sport","grade")`,
    `CREATE INDEX "cards_item_number_idx" ON "public"."cards" USING btree ("item_number")`,
  ];

  console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

  try {
    // Execute each statement using neon's query method for raw SQL
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];

      // Skip comment-only statements
      if (stmt.startsWith('--') || stmt.length === 0) {
        continue;
      }

      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);

      try {
        // Use sql.query() for raw SQL execution
        await sql.query(stmt);
        console.log(`✅ Statement ${i + 1} executed successfully`);
      } catch (error: any) {
        // Check if error is about type already existing
        if (error.message && error.message.includes('already exists')) {
          console.log(`⚠️  Statement ${i + 1} skipped (already exists)`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📊 Verifying table creation...');

    // Verify table was created
    const result = await sql`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'cards' 
      ORDER BY ordinal_position
      LIMIT 5
    `;

    if (result.length > 0) {
      console.log('✅ Cards table verified:');
      result.forEach((row: any) => {
        console.log(`   - ${row.column_name}: ${row.data_type}`);
      });
    } else {
      console.log('⚠️  Could not verify table creation');
    }

    console.log('\n🎉 Migration complete! Cards table is ready to use.');
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
