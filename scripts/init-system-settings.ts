/**
 * Initialize System Settings Table
 *
 * This script creates the system_settings table and initializes it with default values.
 * Run this script once to set up the password storage in database.
 */

import 'dotenv/config';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth/password';

async function initSystemSettings() {
  try {
    console.log('🔧 Initializing system settings table...\n');

    // Create table
    console.log('Creating system_settings table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS system_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key VARCHAR(100) UNIQUE NOT NULL,
        value TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table created\n');

    // Create index
    console.log('Creating index...');
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key)
    `);
    console.log('✅ Index created\n');

    // Create trigger function
    console.log('Creating trigger function...');
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    console.log('✅ Trigger function created\n');

    // Create trigger
    console.log('Creating trigger...');
    await db.execute(sql`
      DROP TRIGGER IF EXISTS trigger_update_system_settings_updated_at ON system_settings
    `);
    await db.execute(sql`
      CREATE TRIGGER trigger_update_system_settings_updated_at
        BEFORE UPDATE ON system_settings
        FOR EACH ROW
        EXECUTE FUNCTION update_system_settings_updated_at()
    `);
    console.log('✅ Trigger created\n');

    // Initialize password hash
    console.log('Initializing password hash...');

    // Check if password hash from environment exists
    const envPasswordHash = process.env.QMS_PASSWORD_HASH;
    let passwordHash: string;

    if (envPasswordHash) {
      console.log('Using password hash from QMS_PASSWORD_HASH environment variable');
      passwordHash = envPasswordHash;
    } else {
      // Generate default password hash (admin123)
      console.log('No QMS_PASSWORD_HASH found, generating default password (admin123)');
      passwordHash = await hashPassword('admin123');
      console.log('⚠️  WARNING: Using default password "admin123". Please change it immediately!');
    }

    await db.execute(sql`
      INSERT INTO system_settings (key, value, description)
      VALUES (
        'password_hash',
        ${passwordHash},
        'Bcrypt hash of the admin password'
      )
      ON CONFLICT (key) DO UPDATE SET value = ${passwordHash}
    `);
    console.log('✅ Password hash initialized\n');

    // Initialize app name
    console.log('Initializing app name...');
    await db.execute(sql`
      INSERT INTO system_settings (key, value, description)
      VALUES (
        'app_name',
        'QMS - Quilt Management System',
        'Application display name'
      )
      ON CONFLICT (key) DO NOTHING
    `);
    console.log('✅ App name initialized\n');

    // Verify settings
    console.log('Verifying settings...');
    const result = await db.execute(sql`
      SELECT key, description FROM system_settings
    `);
    
    // Result rows might be different depending on driver. 
    // Drizzle execute returns { rows: [] } or array? 
    // Neon HTTP returned array. Pool driver returns Result object.
    const settings = result.rows || result;
    
    console.log('Current settings:');
    if (Array.isArray(settings)) {
        settings.forEach((setting: any) => {
        console.log(`  - ${setting.key}: ${setting.description}`);
        });
    }

    console.log('\n✅ System settings initialized successfully!');
    console.log('\n📝 Next steps:');
    console.log('  1. Go to Settings page in the app');
    console.log('  2. Change your password from the default');
    console.log('  3. (Optional) Remove QMS_PASSWORD_HASH from environment variables\n');
  } catch (error) {
    console.error('❌ Error initializing system settings:', error);
    throw error;
  }
}

// Run the script
initSystemSettings()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed:', error);
    process.exit(1);
  });
