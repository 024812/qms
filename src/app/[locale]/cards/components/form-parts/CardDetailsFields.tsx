'use client';

import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { FormValues } from '../form-schema';

export function CardDetailsFields() {
  const t = useTranslations('cards.form');
  const form = useFormContext<FormValues>();

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
        {t('cardDetails')}
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="year"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('year')} *</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="brand"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('brand')} *</FormLabel>
              <FormControl>
                <Input placeholder={t('brandPlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="series"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('series')}</FormLabel>
              <FormControl>
                <Input placeholder={t('seriesPlaceholder')} {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cardNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('cardNumber')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('cardNumberPlaceholder')}
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
