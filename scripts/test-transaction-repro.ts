import 'dotenv/config';
import { db } from '@/db';
import { systemSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function runTest() {
  console.log('Starting Drizzle Transaction Test...');
  const testId = 'test-' + Date.now();
  console.log(`Test Key: ${testId}`);

  try {
    await db.transaction(async (tx) => {
      console.log('Inside Transaction');
      
      // 1. Create a dummy system setting
      console.log('Step 1: Inserting test record...');
      await tx.insert(systemSettings).values({
        key: testId,
        value: 'test-value',
        description: 'Transaction Test Item',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 2. Throw error to force rollback
      console.log('Step 2: Throwing error to force rollback...');
      throw new Error('Force Rollback');
    });
  } catch (e: any) {
    console.log('Caught expected error:', e.message);
  }

  // 3. Verify if record still exists
  console.log('Step 3: Checking if record persists (Failure means Rollback failed)...');
  
  const result = await db.select().from(systemSettings).where(eq(systemSettings.key, testId));

  if (result.length > 0) {
    console.error('❌ CRITICAL FAILURE: Record exists! Transaction rollback DID NOT work.');
    console.error('The database driver might be in autocommit mode or ignoring rollback.');
    
    // Cleanup
    await db.delete(systemSettings).where(eq(systemSettings.key, testId));
  } else {
    console.log('✅ SUCCESS: Record does not exist. Transaction rollback worked.');
  }

  process.exit(0);
}

runTest().catch((err) => {
  console.error(err);
  process.exit(1);
});
