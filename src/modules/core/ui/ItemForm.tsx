/**
 * ItemForm Component
 * 
 * Generic form component that dynamically generates form fields based on module configuration.
 * Uses Next.js 16 Form component for progressive enhancement.
 * Supports native HTML validation and Zod validation in Server Actions.
 * 
 * Requirements: 4.2, 5.2
 * 
 * Best Practices:
 * - Uses Next.js 16 Form component for progressive enhancement (works without JavaScript)
 * - Passes Server Action directly to action prop
 * - Uses native HTML form validation (required, type, pattern, etc.)
 * - Server Action performs Zod validation
 */

'use client';

import { getModule } from '@/modules/registry';
import { FormFieldConfig } from '@/modules/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useFormStatus } from 'react-dom';

/**
 * ItemForm Props
 */
interface ItemFormProps {
  moduleType: string;
  initialData?: any;
  action: (formData: FormData) => Promise<void>;
  onCancel?: () => void;
}

/**
 * ItemForm Component
 * 
 * Dynamically generates form fields based on module configuration.
 * Implements progressive enhancement - works without JavaScript.
 */
export function ItemForm({ moduleType, initialData, action, onCancel }: ItemFormProps) {
  const module = getModule(moduleType);

  if (!module) {
    throw new Error(`Module ${moduleType} not found`);
  }

  return (
    <form action={action} className="space-y-6">
      {/* Common name field */}
      <div className="space-y-2">
        <Label htmlFor="name">
          名称 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          defaultValue={initialData?.name}
          placeholder="请输入物品名称"
          required
          className="w-full"
        />
      </div>

      {/* Status field (only shown when editing) */}
      {initialData && (
        <div className="space-y-2">
          <Label htmlFor="status">状态</Label>
          <select
            id="status"
            name="status"
            defaultValue={initialData?.status || 'storage'}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="in_use">使用中</option>
            <option value="storage">存储中</option>
            <option value="maintenance">维护中</option>
            <option value="lost">丢失</option>
          </select>
        </div>
      )}

      {/* Dynamic module-specific fields */}
      {module.formFields.map((fieldConfig) => (
        <div key={fieldConfig.name} className="space-y-2">
          <Label htmlFor={fieldConfig.name}>
            {fieldConfig.label}
            {fieldConfig.required && <span className="text-destructive"> *</span>}
          </Label>
          {renderFormInput(fieldConfig, initialData?.attributes?.[fieldConfig.name])}
          {fieldConfig.description && (
            <p className="text-sm text-muted-foreground">{fieldConfig.description}</p>
          )}
        </div>
      ))}

      {/* Form actions */}
      <FormActions onCancel={onCancel} />
    </form>
  );
}

/**
 * Form Actions Component
 * Separated to use useFormStatus hook
 */
function FormActions({ onCancel }: { onCancel?: () => void }) {
  const { pending } = useFormStatus();

  return (
    <div className="flex gap-2 pt-4">
      <Button type="submit" disabled={pending}>
        {pending ? '保存中...' : '保存'}
      </Button>
      {onCancel && (
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          取消
        </Button>
      )}
    </div>
  );
}

/**
 * Render form input based on field type
 */
function renderFormInput(config: FormFieldConfig, defaultValue?: any) {
  const fieldName = `attributes.${config.name}`;

  switch (config.type) {
    case 'text':
      return (
        <Input
          id={config.name}
          name={fieldName}
          type="text"
          defaultValue={defaultValue}
          placeholder={config.placeholder}
          required={config.required}
          className="w-full"
        />
      );

    case 'number':
      return (
        <Input
          id={config.name}
          name={fieldName}
          type="number"
          defaultValue={defaultValue}
          placeholder={config.placeholder}
          required={config.required}
          step="any"
          className="w-full"
        />
      );

    case 'select':
      return (
        <select
          id={config.name}
          name={fieldName}
          defaultValue={defaultValue}
          required={config.required}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">{config.placeholder || '请选择'}</option>
          {config.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );

    case 'date':
      return (
        <Input
          id={config.name}
          name={fieldName}
          type="date"
          defaultValue={defaultValue}
          required={config.required}
          className="w-full"
        />
      );

    case 'textarea':
      return (
        <Textarea
          id={config.name}
          name={fieldName}
          defaultValue={defaultValue}
          placeholder={config.placeholder}
          required={config.required}
          rows={4}
          className="w-full"
        />
      );

    default:
      return (
        <Input
          id={config.name}
          name={fieldName}
          defaultValue={defaultValue}
          required={config.required}
          className="w-full"
        />
      );
  }
}
