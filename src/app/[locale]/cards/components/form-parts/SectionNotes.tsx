'use client';

import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { FormValues } from '../form-schema';

export function SectionNotes() {
  const t = useTranslations('cards.form');
  const form = useFormContext<FormValues>();

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-muted/10">
      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('notes')}</FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
