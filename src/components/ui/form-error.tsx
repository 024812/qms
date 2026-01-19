/**
 * FormError Component
 *
 * Reusable component for displaying form errors following Next.js 16 best practices.
 * Supports both field-specific errors and global error messages.
 *
 * Following Context7 patterns:
 * - Uses aria-live="polite" for accessibility
 * - Displays field errors inline with text-sm text-destructive
 * - Displays global errors prominently with bg-destructive/10
 * - Supports multiple error messages per field (array)
 *
 * Requirements: 5.3, 5.4, 9.1, 9.2, 9.3, 9.4
 *
 * Reference: https://nextjs.org/docs/app/guides/forms
 * Reference: https://nextjs.org/docs/app/guides/authentication
 */

import { cn } from '@/lib/utils';

/**
 * FormError Props
 */
interface FormErrorProps {
  /**
   * Global error message (e.g., authentication error, database error)
   */
  error?: string;

  /**
   * Field-specific validation errors
   * Maps field names to arrays of error messages
   */
  errors?: Record<string, string[]>;

  /**
   * Specific field name to display errors for
   * If provided, only shows errors for this field
   */
  fieldName?: string;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * FormError Component
 *
 * Displays either:
 * 1. Field-specific error (when fieldName is provided)
 * 2. Global error (when error is provided)
 * 3. Nothing (when no errors)
 *
 * Pattern from Context7:
 * - Field errors: <p className="text-sm text-destructive">{error}</p>
 * - Global errors: <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">{error}</div>
 * - Always include role="alert" for accessibility
 */
export function FormError({ error, errors, fieldName, className }: FormErrorProps) {
  // Display field-specific error
  if (fieldName && errors?.[fieldName]) {
    const fieldErrors = errors[fieldName];

    // Single error
    if (fieldErrors.length === 1) {
      return (
        <p
          id={`${fieldName}-error`}
          className={cn('text-sm text-destructive mt-1', className)}
          role="alert"
        >
          {fieldErrors[0]}
        </p>
      );
    }

    // Multiple errors (e.g., password requirements)
    return (
      <div
        id={`${fieldName}-error`}
        className={cn('text-sm text-destructive mt-1', className)}
        role="alert"
      >
        <ul className="list-disc list-inside space-y-1">
          {fieldErrors.map(err => (
            <li key={err}>{err}</li>
          ))}
        </ul>
      </div>
    );
  }

  // Display global error
  if (error) {
    return (
      <div
        className={cn('bg-destructive/10 text-destructive px-4 py-3 rounded-md', className)}
        role="alert"
        aria-live="polite"
      >
        <p className="font-medium">{error}</p>
      </div>
    );
  }

  // No errors to display
  return null;
}

/**
 * FormFieldError Component
 *
 * Convenience component for displaying field-specific errors.
 * Automatically handles the fieldName prop.
 *
 * Usage:
 * <FormFieldError errors={state?.errors} fieldName="email" />
 */
interface FormFieldErrorProps {
  errors?: Record<string, string[]>;
  fieldName: string;
  className?: string;
}

export function FormFieldError({ errors, fieldName, className }: FormFieldErrorProps) {
  return <FormError errors={errors} fieldName={fieldName} className={className} />;
}

/**
 * FormGlobalError Component
 *
 * Convenience component for displaying global errors.
 * Automatically handles the error prop.
 *
 * Usage:
 * <FormGlobalError error={state?.error} />
 */
interface FormGlobalErrorProps {
  error?: string;
  className?: string;
}

export function FormGlobalError({ error, className }: FormGlobalErrorProps) {
  return <FormError error={error} className={className} />;
}
