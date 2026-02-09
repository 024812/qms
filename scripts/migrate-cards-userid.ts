/**
 * One-time migration script
 * Run with: npx tsx scripts/migrate-cards-userid.ts
 */
import 'dotenv/config';
import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Starting cards.userId migration...');

  try {
    // Step 1: Drop existing foreign key
    console.log('Step 1: Dropping existing foreign key constraint...');
    await db.execute(
      sql`ALTER TABLE "cards" DROP CONSTRAINT IF EXISTS "cards_user_id_users_id_fk"`
    );

    // Step 2: Alter column to allow NULL
    console.log('Step 2: Altering column to allow NULL...');
    await db.execute(sql`ALTER TABLE "cards" ALTER COLUMN "user_id" DROP NOT NULL`);

    // Step 3: Re-add foreign key with SET NULL on delete
    console.log('Step 3: Re-adding foreign key with SET NULL on delete...');
    await db.execute(sql`
      ALTER TABLE "cards" 
      ADD CONSTRAINT "cards_user_id_users_id_fk" 
      FOREIGN KEY ("user_id") 
      REFERENCES "public"."users"("id") 
      ON DELETE SET NULL 
      ON UPDATE NO ACTION
    `);

    console.log('✅ Migration completed successfully!');
    console.log('cards.userId is now nullable with SET NULL on delete.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();
