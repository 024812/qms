'use client';

/**
 * ModuleItemDialog
 *
 * Generic create/edit dialog driven by a module's FormFieldConfig[].
 * Works with the typed server actions of API-first modules
 * (paddles / antiques / maps / spirits).
 */

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/lib/toast';
import type { FormFieldConfig } from '@/modules/types';

export interface ModuleItemSubmitResult {
  success: boolean;
  error?: {
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
}

interface ModuleItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: FormFieldConfig[];
  /** Edit target; null/undefined means "create" mode. */
  item?: object | null;
  onSubmit: (values: Record<string, unknown>) => Promise<ModuleItemSubmitResult>;
  successMessage: string;
  errorMessage: string;
  submitLabel?: string;
  /** Field names that are server-managed and shown read-only (defaults to itemNumber). */
  readOnlyFields?: string[];
}

/** Selects whose options are exactly true/false represent booleans. */
function isBooleanSelect(field: FormFieldConfig): boolean {
  const values = (field.options ?? []).map(option => option.value).sort();
  return (
    field.type === 'select' && values.length === 2 && values[0] === 'false' && values[1] === 'true'
  );
}

/** Field types whose value can be cleared back to null in edit mode. */
const CLEARABLE_FIELD_TYPES = new Set(['text', 'number', 'date', 'textarea']);

function toInputValue(field: FormFieldConfig, raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  if (field.name === 'attachmentImages' && Array.isArray(raw)) {
    return raw.filter(value => typeof value === 'string').join('\n');
  }
  if (field.type === 'date') {
    const asDate = raw instanceof Date ? raw : new Date(String(raw));
    if (Number.isNaN(asDate.getTime())) return '';
    return asDate.toISOString().split('T')[0];
  }
  if (typeof raw === 'boolean') return raw ? 'true' : 'false';
  return String(raw);
}

export function ModuleItemDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  item,
  onSubmit,
  successMessage,
  errorMessage,
  submitLabel,
  readOnlyFields = ['itemNumber'],
}: ModuleItemDialogProps) {
  const t = useTranslations();
  const isEdit = Boolean(item);
  const itemRecord = item as Record<string, unknown> | null | undefined;
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editableFields = useMemo(() => fields, [fields]);

  // Re-initialize values each time the dialog opens or the target changes.
  useEffect(() => {
    if (!open) return;
    const initial: Record<string, string> = {};
    for (const field of editableFields) {
      initial[field.name] = toInputValue(field, itemRecord?.[field.name]);
    }
    setValues(initial);
    setError(null);
  }, [open, itemRecord, editableFields]);

  const handleChange = (name: string, value: string) => {
    setValues(previous => ({ ...previous, [name]: value }));
  };

  const buildPayload = (): Record<string, unknown> => {
    const payload: Record<string, unknown> = {};
    for (const field of editableFields) {
      if (readOnlyFields.includes(field.name)) continue;
      const value = values[field.name] ?? '';
      // In edit mode, clearing an optional text/number/date/textarea field
      // sends null so the stored value is removed. Enum selects and booleans
      // treat an empty selection as "leave unchanged".
      const canClear = isEdit && !field.required && CLEARABLE_FIELD_TYPES.has(field.type);

      if (value === '') {
        if (canClear) payload[field.name] = null;
        continue;
      }

      if (field.type === 'number') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
          payload[field.name] = parsed;
        } else if (canClear) {
          payload[field.name] = null;
        }
      } else if (field.name === 'attachmentImages') {
        payload[field.name] = value
          .split('\n')
          .map(line => line.trim())
          .filter(Boolean);
      } else if (isBooleanSelect(field)) {
        payload[field.name] = value === 'true';
      } else {
        payload[field.name] = value;
      }
    }
    return payload;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);
    try {
      const result = await onSubmit(buildPayload());
      if (!result.success) {
        setError(result.error?.message ?? errorMessage);
        return;
      }
      toast.success(successMessage);
      onOpenChange(false);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {editableFields.map(field => {
              const isReadOnly = readOnlyFields.includes(field.name);
              return (
                <div
                  key={field.name}
                  className={`space-y-2 ${field.type === 'textarea' || field.name === 'attachmentImages' ? 'sm:col-span-2' : ''}`}
                >
                  <Label htmlFor={`field-${field.name}`}>
                    {field.label}
                    {field.required && <span className="text-destructive"> *</span>}
                  </Label>

                  {field.type === 'textarea' || field.name === 'attachmentImages' ? (
                    <Textarea
                      id={`field-${field.name}`}
                      value={values[field.name] ?? ''}
                      onChange={event => handleChange(field.name, event.target.value)}
                      placeholder={field.placeholder}
                      required={field.required && !isReadOnly}
                      disabled={isReadOnly || loading}
                      rows={field.name === 'attachmentImages' ? 3 : 4}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      id={`field-${field.name}`}
                      value={values[field.name] ?? ''}
                      onChange={event => handleChange(field.name, event.target.value)}
                      required={field.required && !isReadOnly}
                      disabled={isReadOnly || loading}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">{field.placeholder || t('common.selectPlaceholder')}</option>
                      {field.options?.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      id={`field-${field.name}`}
                      type={
                        field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'
                      }
                      step={field.type === 'number' ? 'any' : undefined}
                      value={values[field.name] ?? ''}
                      onChange={event => handleChange(field.name, event.target.value)}
                      placeholder={field.placeholder}
                      required={field.required && !isReadOnly}
                      disabled={isReadOnly || loading}
                    />
                  )}

                  {field.description && (
                    <p className="text-xs text-muted-foreground">{field.description}</p>
                  )}
                </div>
              );
            })}
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? t('common.saving') : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
