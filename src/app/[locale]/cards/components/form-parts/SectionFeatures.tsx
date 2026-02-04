'use client';

import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { FormValues } from '../form-schema';

export function SectionFeatures() {
  const t = useTranslations('cards.form');
  const form = useFormContext<FormValues>();

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-muted/10">
      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <span>🔰</span> {t('cardDetails')}
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
        <FormField
          control={form.control}
          name="parallel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('parallel')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('parallelPlaceholder')}
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Row 2: Features Switches */}
      <div className="flex gap-6 pt-2">
        <FormField
          control={form.control}
          name="isAutographed"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2">
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="text-sm font-normal cursor-pointer mb-0 pb-0 !mt-0">
                {t('autographed')}
              </FormLabel>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="hasMemorabilia"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2">
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="text-sm font-normal cursor-pointer mb-0 pb-0 !mt-0">
                {t('memorabilia')}
              </FormLabel>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
