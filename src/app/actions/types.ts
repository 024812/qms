/**
 * FormState Type Definitions for Server Actions
 *
 * These types define the structure of responses returned by Server Actions
 * when used with React's useActionState hook. Following Next.js 16 best practices,
 * all Server Actions return structured responses instead of throwing errors.
 *
 * Pattern from Context7 Next.js 16 documentation:
 * - success?: boolean - Indicates successful operation
 * - data?: T - Result data on success
 * - error?: string - Global error message
 * - errors?: Record<string, string[]> - Field-specific validation errors
 *
 * Reference: https://nextjs.org/docs/app/guides/forms
 */

/**
 * Base FormState type for all Server Actions
 *
 * This type follows the official Next.js 16 pattern for Server Actions
 * that integrate with useActionState hook.
 */
export type FormState<T = unknown> =
  | {
      success: true;
      data: T;
    }
  | {
      error: string;
    }
  | {
      errors: Record<string, string[]>;
    }
  | undefined;

/**
 * Item data structure returned by item operations
 */
export type ItemData = {
  id: string;
  type: string;
  name: string;
  ownerId: string;
  attributes: Record<string, unknown>;
  images: string[];
  status: 'in_use' | 'storage' | 'maintenance' | 'lost';
  createdAt: Date;
  updatedAt: Date;
};

/**
 * FormState for createItem Server Action
 *
 * Used with useActionState hook in item creation forms.
 * Returns the created item on success, or validation/auth errors on failure.
 */
export type CreateItemFormState = FormState<ItemData>;

/**
 * FormState for updateItem Server Action
 *
 * Used with useActionState hook in item edit forms.
 * Returns the updated item on success, or validation/auth errors on failure.
 */
export type UpdateItemFormState = FormState<ItemData>;

/**
 * FormState for deleteItem Server Action
 *
 * Used with useActionState hook in item deletion confirmations.
 * Returns deletion confirmation on success, or auth errors on failure.
 */
export type DeleteItemFormState = FormState<{
  deleted: boolean;
}>;

/**
 * Usage log data structure
 */
export type UsageLogData = {
  id: string;
  itemId: string;
  userId: string;
  action: string;
  snapshot: Record<string, unknown>;
  createdAt: Date;
};

/**
 * FormState for createUsageLog Server Action
 *
 * Used with useActionState hook in usage logging forms.
 * Returns the created log entry on success, or validation/auth errors on failure.
 */
export type CreateUsageLogFormState = FormState<UsageLogData>;
