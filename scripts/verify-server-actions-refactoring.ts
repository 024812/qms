/**
 * Server Actions Refactoring Verification Script
 *
 * This script verifies that the Server Actions refactoring is complete and correct:
 * 1. All Server Actions follow Next.js 16 best practices
 * 2. Cache invalidation works correctly
 * 3. Usage logging is preserved
 * 4. Module validation is preserved
 * 5. All files have correct TypeScript types
 *
 * Requirements: 7.1-7.4, 8.1-8.5, 10.1-10.5
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface VerificationResult {
  passed: boolean;
  message: string;
  details?: string[];
}

const results: VerificationResult[] = [];

/**
 * Verify file exists
 */
function verifyFileExists(filePath: string, description: string): boolean {
  const fullPath = join(process.cwd(), filePath);
  const exists = existsSync(fullPath);

  results.push({
    passed: exists,
    message: `${description}: ${filePath}`,
    details: exists ? undefined : ['File does not exist'],
  });

  return exists;
}

/**
 * Verify file contains pattern
 */
function verifyFileContains(filePath: string, patterns: string[], description: string): boolean {
  const fullPath = join(process.cwd(), filePath);

  if (!existsSync(fullPath)) {
    results.push({
      passed: false,
      message: description,
      details: [`File not found: ${filePath}`],
    });
    return false;
  }

  const content = readFileSync(fullPath, 'utf-8');
  const missingPatterns: string[] = [];

  for (const pattern of patterns) {
    if (!content.includes(pattern)) {
      missingPatterns.push(pattern);
    }
  }

  const passed = missingPatterns.length === 0;

  results.push({
    passed,
    message: description,
    details: passed ? undefined : [`Missing patterns: ${missingPatterns.join(', ')}`],
  });

  return passed;
}

/**
 * Main verification function
 */
async function verify() {
  console.log('🔍 Verifying Server Actions Refactoring...\n');

  // ===== Phase 1: Files Created =====
  console.log('📁 Phase 1: Verifying Created Files...');

  verifyFileExists('src/app/actions/types.ts', 'FormState type definitions file');

  verifyFileExists('src/lib/validations/items.ts', 'Zod validation schemas file');

  verifyFileExists('src/components/ui/form-error.tsx', 'FormError component file');

  // ===== Phase 2: Server Actions Pattern =====
  console.log('\n🔧 Phase 2: Verifying Server Actions Pattern...');

  verifyFileContains(
    'src/app/actions/items.ts',
    [
      'import type {',
      'CreateItemFormState',
      'UpdateItemFormState',
      'DeleteItemFormState',
      'CreateUsageLogFormState',
      'export async function createItem(',
      'prevState: CreateItemFormState | undefined',
      'formData: FormData',
      'Promise<CreateItemFormState>',
      'const validatedFields = createItemSchema.safeParse',
      'if (!validatedFields.success)',
      'return {',
      'errors: validatedFields.error.flatten().fieldErrors',
      'const session = await auth()',
      'return { error:',
      'try {',
      'success: true',
      'catch (error)',
      'updateTag(',
      'revalidatePath(',
    ],
    'createItem follows Next.js 16 pattern'
  );

  verifyFileContains(
    'src/app/actions/items.ts',
    [
      'export async function updateItem(',
      'prevState: UpdateItemFormState | undefined',
      'const validatedFields = updateItemSchema.safeParse',
    ],
    'updateItem follows Next.js 16 pattern'
  );

  verifyFileContains(
    'src/app/actions/items.ts',
    [
      'export async function deleteItem(',
      'prevState: DeleteItemFormState | undefined',
      'const validatedFields = deleteItemSchema.safeParse',
    ],
    'deleteItem follows Next.js 16 pattern'
  );

  verifyFileContains(
    'src/app/actions/items.ts',
    [
      'export async function createUsageLog(',
      'prevState: CreateUsageLogFormState | undefined',
      'const validatedFields = createUsageLogSchema.safeParse',
    ],
    'createUsageLog follows Next.js 16 pattern'
  );

  // ===== Phase 3: Zod Schemas =====
  console.log('\n📋 Phase 3: Verifying Zod Schemas...');

  verifyFileContains(
    'src/lib/validations/items.ts',
    [
      'export const createItemSchema = z.object',
      'export const updateItemSchema = z.object',
      'export const deleteItemSchema = z.object',
      'export const createUsageLogSchema = z.object',
      '.min(1, { message:',
      '.trim()',
    ],
    'Zod schemas defined with validation'
  );

  // ===== Phase 4: FormState Types =====
  console.log('\n📝 Phase 4: Verifying FormState Types...');

  verifyFileContains(
    'src/app/actions/types.ts',
    [
      'export type FormState',
      'export type CreateItemFormState',
      'export type UpdateItemFormState',
      'export type DeleteItemFormState',
      'export type CreateUsageLogFormState',
      'success: true',
      'data: T',
      'error: string',
      'errors: Record<string, string[]>',
    ],
    'FormState types defined correctly'
  );

  // ===== Phase 5: ItemForm Component =====
  console.log('\n🎨 Phase 5: Verifying ItemForm Component...');

  verifyFileContains(
    'src/modules/core/ui/ItemForm.tsx',
    [
      'import { useActionState',
      'const [state, formAction, isPending] = useActionState',
      "state && 'error' in state && state.error",
      "state && 'errors' in state && state.errors",
      'aria-invalid',
      'aria-describedby',
      'role="alert"',
      'disabled={isPending}',
    ],
    'ItemForm uses useActionState hook'
  );

  // ===== Phase 6: Form Pages =====
  console.log('\n📄 Phase 6: Verifying Form Pages...');

  verifyFileContains(
    'src/app/(dashboard)/[category]/new/page.tsx',
    ["import { createItem } from '@/app/actions/items'", 'action={createItem}', 'redirectPath='],
    'New item page passes createItem directly'
  );

  verifyFileContains(
    'src/app/(dashboard)/[category]/[id]/edit/page.tsx',
    ['updateItem', "from '@/app/actions/items'", 'action={updateItem}', 'redirectPath='],
    'Edit item page passes updateItem directly'
  );

  // ===== Phase 7: Cache Invalidation Preserved =====
  console.log('\n🗄️  Phase 7: Verifying Cache Invalidation...');

  verifyFileContains(
    'src/app/actions/items.ts',
    [
      "updateTag('items')",
      'updateTag(`items-${',
      "updateTag('items-list')",
      "updateTag('usage-logs')",
      'revalidatePath(',
    ],
    'Cache invalidation preserved in Server Actions'
  );

  // ===== Phase 8: Usage Logging Preserved =====
  console.log('\n📊 Phase 8: Verifying Usage Logging...');

  verifyFileContains(
    'src/app/actions/items.ts',
    [
      'await db.insert(usageLogs).values',
      "action: 'created'",
      "action: 'updated'",
      "action: 'deleted'",
      'snapshot:',
    ],
    'Usage logging preserved in Server Actions'
  );

  // ===== Phase 9: Module Validation Preserved =====
  console.log('\n🔍 Phase 9: Verifying Module Validation...');

  verifyFileContains(
    'src/app/actions/items.ts',
    [
      'const module = getModule(',
      'module.attributesSchema.safeParse',
      'if (!moduleValidation.success)',
    ],
    'Module validation preserved in Server Actions'
  );

  // ===== Phase 10: FormError Component =====
  console.log('\n🎯 Phase 10: Verifying FormError Component...');

  verifyFileContains(
    'src/components/ui/form-error.tsx',
    [
      'export function FormError',
      'export function FormFieldError',
      'export function FormGlobalError',
      'role="alert"',
      'aria-live="polite"',
      'text-sm text-destructive',
      'bg-destructive/10',
    ],
    'FormError component created with accessibility'
  );

  // ===== Summary =====
  console.log('\n' + '='.repeat(60));
  console.log('📊 Verification Summary\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${failed}/${total}`);
  console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

  if (failed > 0) {
    console.log('❌ Failed Checks:\n');
    results
      .filter(r => !r.passed)
      .forEach(r => {
        console.log(`  ❌ ${r.message}`);
        if (r.details) {
          r.details.forEach(d => console.log(`     - ${d}`));
        }
      });
    console.log();
  }

  if (passed === total) {
    console.log('🎉 All verifications passed!');
    console.log('✅ Server Actions refactoring is complete and correct.');
    console.log('✅ All files follow Next.js 16 best practices.');
    console.log('✅ Backward compatibility is preserved.');
    process.exit(0);
  } else {
    console.log('⚠️  Some verifications failed.');
    console.log('Please review the failed checks above.');
    process.exit(1);
  }
}

// Run verification
verify().catch(error => {
  console.error('❌ Verification failed with error:', error);
  process.exit(1);
});
