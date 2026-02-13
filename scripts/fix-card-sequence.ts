import 'dotenv/config';
import { db } from '../src/db';
import { cards } from '../src/db/schema';
import { sql, max } from 'drizzle-orm';

async function fixSequence() {
  console.log('🔧 Starting sequence fix...');

  try {
    // 1. Get current max item number
    const result = await db.select({ maxNumber: max(cards.itemNumber) }).from(cards);
    const currentMax = result[0]?.maxNumber ?? 0;

    console.log(`📊 Current max item_number in DB: ${currentMax}`);

    // 2. Sync sequence
    // The sequence name is typically table_column_seq for SERIAL columns in Postgres
    const seqName = 'cards_item_number_seq';
    console.log(`🔄 Resetting sequence '${seqName}' to ${currentMax + 1}...`);

    // setval(sequence_name, next_value, is_called)
    // is_called = false means the next nextval() will return next_value
    await db.execute(sql`
      SELECT setval('${sql.raw(seqName)}', ${currentMax} + 1, false);
    `);

    console.log('✅ Sequence synchronized successfully.');
  } catch (error) {
    console.error('💥 Fix failed:', error);
    process.exit(1);
  }
}

fixSequence()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
