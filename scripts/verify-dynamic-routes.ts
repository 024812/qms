/**
 * Verification Script for Dynamic Routes
 * 
 * This script verifies that the dynamic routing system is properly set up:
 * 1. All required route files exist
 * 2. Module registry is accessible
 * 3. Routes handle module not found cases
 * 
 * Requirements: 3.1, 3.3
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { getModule, hasModule, getAllModules } from '../src/modules/registry';

console.log('🔍 Verifying Dynamic Routes Implementation...\n');

let hasErrors = false;

// 1. Check if all route files exist
console.log('1️⃣ Checking route files...');
const routeFiles = [
  'src/app/(dashboard)/[category]/page.tsx',
  'src/app/(dashboard)/[category]/new/page.tsx',
  'src/app/(dashboard)/[category]/[id]/page.tsx',
  'src/app/(dashboard)/[category]/[id]/edit/page.tsx',
];

for (const file of routeFiles) {
  const filePath = join(process.cwd(), file);
  if (existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - NOT FOUND`);
    hasErrors = true;
  }
}

// 2. Check module registry
console.log('\n2️⃣ Checking module registry...');
const modules = getAllModules();
console.log(`  ℹ️  Found ${modules.length} registered modules:`);
for (const module of modules) {
  console.log(`    - ${module.id}: ${module.name}`);
}

// 3. Test module retrieval
console.log('\n3️⃣ Testing module retrieval...');
const testModules = ['quilt', 'card', 'nonexistent'];
for (const moduleId of testModules) {
  const exists = hasModule(moduleId);
  const module = getModule(moduleId);
  if (moduleId === 'nonexistent') {
    if (!exists && !module) {
      console.log(`  ✅ ${moduleId}: Correctly returns undefined`);
    } else {
      console.log(`  ❌ ${moduleId}: Should return undefined but didn't`);
      hasErrors = true;
    }
  } else {
    if (exists && module) {
      console.log(`  ✅ ${moduleId}: Found (${module.name})`);
    } else {
      console.log(`  ❌ ${moduleId}: Not found but should exist`);
      hasErrors = true;
    }
  }
}

// 4. Check module configuration completeness
console.log('\n4️⃣ Checking module configurations...');
for (const module of modules) {
  const issues: string[] = [];
  
  if (!module.id) issues.push('missing id');
  if (!module.name) issues.push('missing name');
  if (!module.description) issues.push('missing description');
  if (!module.icon) issues.push('missing icon');
  if (!module.attributesSchema) issues.push('missing attributesSchema');
  if (!module.formFields || module.formFields.length === 0) issues.push('missing formFields');
  if (!module.listColumns || module.listColumns.length === 0) issues.push('missing listColumns');
  
  if (issues.length === 0) {
    console.log(`  ✅ ${module.id}: Complete configuration`);
  } else {
    console.log(`  ⚠️  ${module.id}: ${issues.join(', ')}`);
  }
}

// 5. Check core UI components
console.log('\n5️⃣ Checking core UI components...');
const coreComponents = [
  'src/modules/core/ui/ItemCard.tsx',
  'src/modules/core/ui/ItemList.tsx',
  'src/modules/core/ui/ItemForm.tsx',
  'src/modules/core/ui/StatusBadge.tsx',
];

for (const file of coreComponents) {
  const filePath = join(process.cwd(), file);
  if (existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - NOT FOUND`);
    hasErrors = true;
  }
}

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ Verification FAILED - Please fix the errors above');
  process.exit(1);
} else {
  console.log('✅ All verifications PASSED');
  console.log('\n📝 Dynamic routing system is ready!');
  console.log('   You can now access:');
  for (const module of modules) {
    console.log(`   - /${module.id} - List page`);
    console.log(`   - /${module.id}/new - Create page`);
    console.log(`   - /${module.id}/[id] - Detail page`);
    console.log(`   - /${module.id}/[id]/edit - Edit page`);
  }
  process.exit(0);
}
