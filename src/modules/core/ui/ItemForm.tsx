/**
 * ItemForm Component
 *
 * Generic form component that dynamically generates form fields based on module configuration.
 * Uses Next.js 16 useActionState hook for progressive enhancement and error handling.
 *
 * Following Next.js 16 best practices from Context7:
 * - Uses useActionState hook for form state management
 * - Displays field-specific validation errors inline
 * - Shows loading state with pending flag
 * - Displays global errors prominently
 * - Progressive enhancement (works without JavaScript)
 *
 * Requirements: 4.2, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 *
 * Reference: https://nextjs.org/docs/app/guides/forms
 * Reference: https://nextjs.org/docs/app/guides/authentication
 */

'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getModule } from '@/modules/registry';
import { FormFieldConfig } from '@/modules/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { CreateItemFormState, UpdateItemFormState } from '@/app/actions/types';

/**
 * ItemForm Props
 *
 * Following Next.js 16 best practices:
 * - action accepts (prevState, formData) for useActionState compatibility
 * - redirectPath for navigation after successful submission
 */
interface ItemFormProps {
  moduleType: string;
  initialData?: {
    id?: string;
    name?: string;
    status?: string;
    attributes?: Record<string, string | number | boolean>;
    [key: string]: unknown;
  };
  action: (
    prevState: CreateItemFormState | UpdateItemFormState | undefined,
    formData: FormData
  ) => Promise<CreateItemFormState | UpdateItemFormState>;
  redirectPath: string;
  onCancel?: () => void;
}

/**
 * ItemForm Component
 *
 * Dynamically generates form fields based on module configuration.
 * Uses useActionState hook for form state management following Next.js 16 best practices.
 *
 * Pattern from Context7:
 * 1. useActionState hook manages form state
 * 2. Display field-specific errors inline
 * 3. Display global errors prominently
 * 4. Show loading state with pending flag
 * 5. Redirect on success using useEffect
 */
export function ItemForm({
  moduleType,
  initialData,
  action,
  redirectPath,
  onCancel,
}: ItemFormProps) {
  const moduleConfig = getModule(moduleType);
  const router = useRouter();

  // Use useActionState hook (Next.js 16 best practice from Context7)
  const [state, formAction, isPending] = useActionState(action, undefined);

  // Redirect on successful submission
  useEffect(() => {
    if (state && 'success' in state && state.success) {
      router.push(redirectPath);
    }
  }, [state, redirectPath, router]);

  if (!moduleConfig) {
    throw new Error(`Module ${moduleType} not found`);
  }

  return (
    <form action={formAction} className="space-y-6">
      {/* Global error display (Context7 pattern) */}
      {state && 'error' in state && typeof state.error === 'string' && (
        <div
          className="bg-destructive/10 text-destructive px-4 py-3 rounded-md"
          role="alert"
          aria-live="polite"
        >
          <p className="font-medium">{state.error}</p>
        </div>
      )}

      {/* Hidden fields for item ID and type */}
      {initialData?.id && <input type="hidden" name="id" value={String(initialData.id)} />}
      <input type="hidden" name="type" value={moduleType} />

      {/* Common name field with inline error (Context7 pattern) */}
      <div className="space-y-2">
        <Label htmlFor="name">
          名称 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          defaultValue={initialData?.name ? String(initialData.name) : undefined}
          placeholder="请输入物品名称"
          required
          aria-invalid={state && 'errors' in state && state.errors?.name ? 'true' : 'false'}
          aria-describedby={
            state && 'errors' in state && state.errors?.name ? 'name-error' : undefined
          }
          className="w-full"
        />
        {state && 'errors' in state && state.errors?.name && (
          <p id="name-error" className="text-sm text-destructive" role="alert">
            {state.errors.name[0]}
          </p>
        )}
      </div>

      {/* Status field (only shown when editing) */}
      {initialData && (
        <div className="space-y-2">
          <Label htmlFor="status">状态</Label>
          <select
            id="status"
            name="status"
            defaultValue={initialData?.status ? String(initialData.status) : 'storage'}
            aria-invalid={state && 'errors' in state && state.errors?.status ? 'true' : 'false'}
            aria-describedby={
              state && 'errors' in state && state.errors?.status ? 'status-error' : undefined
            }
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="in_use">使用中</option>
            <option value="storage">存储中</option>
            <option value="maintenance">维护中</option>
            <option value="lost">丢失</option>
          </select>
          {state && 'errors' in state && state.errors?.status && (
            <p id="status-error" className="text-sm text-destructive" role="alert">
              {state.errors.status[0]}
            </p>
          )}
        </div>
      )}

      {/* Hidden field for attributes (JSON string) */}
      <input
        type="hidden"
        name="attributes"
        value={JSON.stringify(initialData?.attributes || {})}
      />

      {/* Dynamic module-specific fields with inline errors */}
      {moduleConfig.formFields.map(fieldConfig => (
        <div key={fieldConfig.name} className="space-y-2">
          <Label htmlFor={fieldConfig.name}>
            {fieldConfig.label}
            {fieldConfig.required && <span className="text-destructive"> *</span>}
          </Label>
          {renderFormInput(
            fieldConfig,
            initialData?.attributes?.[fieldConfig.name] as string | number | boolean | undefined,
            state && 'errors' in state ? state.errors : undefined
          )}
          {fieldConfig.description && (
            <p className="text-sm text-muted-foreground">{fieldConfig.description}</p>
          )}
          {/* Display attribute-specific errors */}
          {state && 'errors' in state && state.errors?.attributes && (
            <p className="text-sm text-destructive" role="alert">
              {Array.isArray(state.errors.attributes)
                ? state.errors.attributes[0]
                : state.errors.attributes}
            </p>
          )}
        </div>
      ))}

      {/* Form actions with loading state (Context7 pattern) */}
      <FormActions isPending={isPending} onCancel={onCancel} />
    </form>
  );
}

/**
 * Form Actions Component
 *
 * Following Context7 pattern:
 * - Disable submit button when pending
 * - Show loading text when pending
 * - Use isPending from useActionState (passed as prop)
 */
function FormActions({ isPending, onCancel }: { isPending: boolean; onCancel?: () => void }) {
  return (
    <div className="flex gap-2 pt-4">
      <Button type="submit" disabled={isPending}>
        {isPending ? '保存中...' : '保存'}
      </Button>
      {onCancel && (
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          取消
        </Button>
      )}
    </div>
  );
}

/**
 * Render form input based on field type
 *
 * Note: Attributes are now sent as a JSON string in a hidden field,
 * so these fields update that hidden field via onChange
 */
function renderFormInput(
  config: FormFieldConfig,
  defaultValue?: string | number | boolean,
  errors?: Record<string, string[]>
) {
  const fieldName = `attributes.${config.name}`;
  const hasError = errors?.[fieldName];
  const stringValue = defaultValue !== undefined ? String(defaultValue) : undefined;

  switch (config.type) {
    case 'text':
      return (
        <>
          <Input
            id={config.name}
            name={fieldName}
            type="text"
            defaultValue={stringValue}
            placeholder={config.placeholder}
            required={config.required}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={hasError ? `${config.name}-error` : undefined}
            className="w-full"
          />
          {hasError && (
            <p id={`${config.name}-error`} className="text-sm text-destructive" role="alert">
              {errors[fieldName][0]}
            </p>
          )}
        </>
      );

    case 'number':
      return (
        <>
          <Input
            id={config.name}
            name={fieldName}
            type="number"
            defaultValue={stringValue}
            placeholder={config.placeholder}
            required={config.required}
            step="any"
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={hasError ? `${config.name}-error` : undefined}
            className="w-full"
          />
          {hasError && (
            <p id={`${config.name}-error`} className="text-sm text-destructive" role="alert">
              {errors[fieldName][0]}
            </p>
          )}
        </>
      );

    case 'select':
      return (
        <>
          <select
            id={config.name}
            name={fieldName}
            defaultValue={stringValue}
            required={config.required}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={hasError ? `${config.name}-error` : undefined}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">{config.placeholder || '请选择'}</option>
            {config.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {hasError && (
            <p id={`${config.name}-error`} className="text-sm text-destructive" role="alert">
              {errors[fieldName][0]}
            </p>
          )}
        </>
      );

    case 'date':
      return (
        <>
          <Input
            id={config.name}
            name={fieldName}
            type="date"
            defaultValue={stringValue}
            required={config.required}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={hasError ? `${config.name}-error` : undefined}
            className="w-full"
          />
          {hasError && (
            <p id={`${config.name}-error`} className="text-sm text-destructive" role="alert">
              {errors[fieldName][0]}
            </p>
          )}
        </>
      );

    case 'textarea':
      return (
        <>
          <Textarea
            id={config.name}
            name={fieldName}
            defaultValue={stringValue}
            placeholder={config.placeholder}
            required={config.required}
            rows={4}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={hasError ? `${config.name}-error` : undefined}
            className="w-full"
          />
          {hasError && (
            <p id={`${config.name}-error`} className="text-sm text-destructive" role="alert">
              {errors[fieldName][0]}
            </p>
          )}
        </>
      );

    default:
      return (
        <>
          <Input
            id={config.name}
            name={fieldName}
            defaultValue={stringValue}
            required={config.required}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={hasError ? `${config.name}-error` : undefined}
            className="w-full"
          />
          {hasError && (
            <p id={`${config.name}-error`} className="text-sm text-destructive" role="alert">
              {errors[fieldName][0]}
            </p>
          )}
        </>
      );
  }
}
