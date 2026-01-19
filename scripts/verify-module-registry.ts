/**
 * Module Registry Verification Script
 * 
 * This script verifies that the module registry system is working correctly.
 */

import { MODULE_REGISTRY, getModule, getAllModules, hasModule, getModuleIds } from '../src/modules/registry';

console.log('🔍 Verifying Module Registry System...\n');

// Test 1: Check MODULE_REGISTRY exists and has modules
console.log('✓ Test 1: MODULE_REGISTRY exists');
console.log(`  Registered modules: ${Object.keys(MODULE_REGISTRY).join(', ')}`);

// Test 2: Test getModule() function
console.log('\n✓ Test 2: getModule() function');
const quiltModule = getModule('quilt');
if (quiltModule) {
  console.log(`  - Found quilt module: ${quiltModule.name}`);
  console.log(`  - Description: ${quiltModule.description}`);
  console.log(`  - Form fields: ${quiltModule.formFields.length}`);
  console.log(`  - List columns: ${quiltModule.listColumns.length}`);
} else {
  console.error('  ✗ Failed to get quilt module');
  process.exit(1);
}

const cardModule = getModule('card');
if (cardModule) {
  console.log(`  - Found card module: ${cardModule.name}`);
  console.log(`  - Description: ${cardModule.description}`);
  console.log(`  - Form fields: ${cardModule.formFields.length}`);
  console.log(`  - List columns: ${cardModule.listColumns.length}`);
} else {
  console.error('  ✗ Failed to get card module');
  process.exit(1);
}

// Test 3: Test getAllModules() function
console.log('\n✓ Test 3: getAllModules() function');
const allModules = getAllModules();
console.log(`  - Total modules: ${allModules.length}`);
allModules.forEach(module => {
  console.log(`    • ${module.id}: ${module.name}`);
});

// Test 4: Test hasModule() function
console.log('\n✓ Test 4: hasModule() function');
console.log(`  - hasModule('quilt'): ${hasModule('quilt')}`);
console.log(`  - hasModule('card'): ${hasModule('card')}`);
console.log(`  - hasModule('nonexistent'): ${hasModule('nonexistent')}`);

if (hasModule('quilt') && hasModule('card') && !hasModule('nonexistent')) {
  console.log('  ✓ hasModule() works correctly');
} else {
  console.error('  ✗ hasModule() not working correctly');
  process.exit(1);
}

// Test 5: Test getModuleIds() function
console.log('\n✓ Test 5: getModuleIds() function');
const moduleIds = getModuleIds();
console.log(`  - Module IDs: ${moduleIds.join(', ')}`);

// Test 6: Verify module interface completeness
console.log('\n✓ Test 6: Verify module interface completeness');
allModules.forEach(module => {
  const requiredFields = ['id', 'name', 'description', 'icon', 'color', 'attributesSchema', 'formFields', 'listColumns'];
  const missingFields = requiredFields.filter(field => !(field in module));
  
  if (missingFields.length === 0) {
    console.log(`  ✓ ${module.id} has all required fields`);
  } else {
    console.error(`  ✗ ${module.id} missing fields: ${missingFields.join(', ')}`);
    process.exit(1);
  }
});

// Test 7: Verify FormFieldConfig structure
console.log('\n✓ Test 7: Verify FormFieldConfig structure');
allModules.forEach(module => {
  const invalidFields = module.formFields.filter(field => {
    return !field.name || !field.label || !field.type;
  });
  
  if (invalidFields.length === 0) {
    console.log(`  ✓ ${module.id} has valid form field configurations (${module.formFields.length} fields)`);
  } else {
    console.error(`  ✗ ${module.id} has invalid form fields`);
    process.exit(1);
  }
});

// Test 8: Verify ColumnConfig structure
console.log('\n✓ Test 8: Verify ColumnConfig structure');
allModules.forEach(module => {
  const invalidColumns = module.listColumns.filter(column => {
    return !column.key || !column.label;
  });
  
  if (invalidColumns.length === 0) {
    console.log(`  ✓ ${module.id} has valid column configurations (${module.listColumns.length} columns)`);
  } else {
    console.error(`  ✗ ${module.id} has invalid columns`);
    process.exit(1);
  }
});

// Test 9: Verify StatsConfig structure (if present)
console.log('\n✓ Test 9: Verify StatsConfig structure');
allModules.forEach(module => {
  if (module.statsConfig) {
    const invalidMetrics = module.statsConfig.metrics.filter(metric => {
      return !metric.key || !metric.label || typeof metric.calculate !== 'function';
    });
    
    if (invalidMetrics.length === 0) {
      console.log(`  ✓ ${module.id} has valid stats configuration (${module.statsConfig.metrics.length} metrics)`);
    } else {
      console.error(`  ✗ ${module.id} has invalid stats metrics`);
      process.exit(1);
    }
  } else {
    console.log(`  - ${module.id} has no stats configuration (optional)`);
  }
});

console.log('\n✅ All module registry tests passed!');
console.log('\n📋 Summary:');
console.log(`  - Total modules registered: ${allModules.length}`);
console.log(`  - Module IDs: ${moduleIds.join(', ')}`);
console.log(`  - All required interfaces implemented correctly`);
console.log(`  - Strategy Pattern working as expected`);
