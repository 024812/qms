'use client';

/**
 * Localizes a module's FormFieldConfig[] using the module's i18n namespace.
 *
 * Expected message shape (per module namespace):
 * - fields.<name>.label (required)
 * - fields.<name>.placeholder (when the config declares a placeholder)
 * - fields.<name>.description (when the config declares a description)
 * - enums.<name>.<value> (for select option labels)
 */

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { FormFieldConfig } from '@/modules/types';

export function useLocalizedFields(
  namespace: string,
  fields: FormFieldConfig[]
): FormFieldConfig[] {
  const t = useTranslations(namespace);

  return useMemo(
    () =>
      fields.map(field => ({
        ...field,
        label: t(`fields.${field.name}.label`),
        ...(field.placeholder ? { placeholder: t(`fields.${field.name}.placeholder`) } : {}),
        ...(field.description ? { description: t(`fields.${field.name}.description`) } : {}),
        ...(field.options
          ? {
              options: field.options.map(option => ({
                ...option,
                label: t(`enums.${field.name}.${option.value}`),
              })),
            }
          : {}),
      })),
    [t, fields]
  );
}
