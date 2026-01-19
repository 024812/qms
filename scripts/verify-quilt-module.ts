/**
 * Verification script for quilt module registration
 * 
 * This script verifies that:
 * 1. The quilt module is registered in MODULE_REGISTRY
 * 2. The module can be retrieved using getModule('quilt')
 * 3. The module has all required properties
 */

import { getModule, hasModule, getModuleIds } from '../src/modules/registry';

console.log('🔍 Verifying quilt module registration...\n');

// Test 1: Check if module exists
console.log('Test 1: Check if quilt module exists');
const exists = hasModule('quilt');
console.log(`  hasModule('quilt'): ${exists ? '✅ PASS' : '❌ FAIL'}`);

if (!exists) {
  console.error('\n❌ Quilt module is not registered!');
  process.exit(1);
}

// Test 2: Retrieve the module
console.log('\nTest 2: Retrieve quilt module');
const quiltModule = getModule('quilt');
console.log(`  getModule('quilt'): ${quiltModule ? '✅ PASS' : '❌ FAIL'}`);

if (!quiltModule) {
  console.error('\n❌ Failed to retrieve quilt module!');
  process.exit(1);
}

// Test 3: Verify module properties
console.log('\nTest 3: Verify module properties');
const requiredProps = ['id', 'name', 'description', 'icon', 'color', 'attributesSchema', 'formFields', 'listColumns', 'statsConfig'];
let allPropsPresent = true;

for (const prop of requiredProps) {
  const present = prop in quiltModule;
  console.log(`  ${prop}: ${present ? '✅' : '❌'}`);
  if (!present) allPropsPresent = false;
}

if (!allPropsPresent) {
  console.error('\n❌ Some required properties are missing!');
  process.exit(1);
}

// Test 4: Verify module details
console.log('\nTest 4: Verify module details');
console.log(`  ID: ${quiltModule.id}`);
console.log(`  Name: ${quiltModule.name}`);
console.log(`  Description: ${quiltModule.description}`);
console.log(`  Icon: ${quiltModule.icon}`);
console.log(`  Color: ${quiltModule.color}`);
console.log(`  Form Fields: ${quiltModule.formFields.length} fields`);
console.log(`  List Columns: ${quiltModule.listColumns.length} columns`);
console.log(`  Stats Metrics: ${quiltModule.statsConfig?.metrics.length ?? 0} metrics`);

// Test 5: Verify module is in registry
console.log('\nTest 5: Verify module is in registry');
const moduleIds = getModuleIds();
console.log(`  Registered modules: ${moduleIds.join(', ')}`);
console.log(`  Quilt in registry: ${moduleIds.includes('quilt') ? '✅ PASS' : '❌ FAIL'}`);

// Test 6: Verify schema
console.log('\nTest 6: Verify attributes schema');
try {
  // Test with valid data matching the schema requirements
  const validData = {
    size: 'queen',
    material: 'Cotton',
    warmthLevel: 3,
    season: 'winter',
    condition: 'good',
    purchaseDate: '2024-01-01T00:00:00Z',
    lastCleaned: '2024-01-15T00:00:00Z',
    storageLocation: 'Bedroom closet',
    notes: 'Test quilt for verification',
  };
  
  const result = quiltModule.attributesSchema.safeParse(validData);
  console.log(`  Schema validation: ${result.success ? '✅ PASS' : '❌ FAIL'}`);
  
  if (!result.success) {
    console.error('  Validation errors:', result.error.issues);
    process.exit(1);
  }
} catch (error) {
  console.error('  Schema validation: ❌ FAIL');
  console.error('  Error:', error);
  process.exit(1);
}

console.log('\n✅ All verification tests passed!');
console.log('\n📋 Summary:');
console.log('  - Quilt module is registered in MODULE_REGISTRY');
console.log('  - Module can be retrieved using getModule("quilt")');
console.log('  - Module has all required properties');
console.log('  - Module schema validates correctly');
