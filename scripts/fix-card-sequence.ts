import 'dotenv/config';
import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Synchronizing cards_item_number_seq sequence...');

  try {
    // 1. Get the current max item_number
    const result = await db.execute(sql`SELECT MAX(item_number) as max_val FROM cards`);
    const maxVal = result.rows[0].max_val as number;
    console.log(`Current MAX(item_number): ${maxVal}`);

    if (maxVal) {
      // 2. Set sequence to maxVal
      // The next call to nextval() will return maxVal + 1 if is_called is true, or maxVal if false?
      // setval('seq', val, true) -> next is val+1. Default is true.
      await db.execute(sql`SELECT setval('cards_item_number_seq', ${maxVal})`);
      console.log(`Sequence set to ${maxVal}. Next value will be ${Number(maxVal) + 1}.`);
    } else {
      console.log('No cards found. Sequence not updated (or set to 1 if needed).');
    }

    console.log('Done.');
  } catch (error) {
    console.error('Failed to sync sequence:', error);
    process.exit(1);
  }
}

main();
