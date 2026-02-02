'use client';

import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormValues } from '../form-schema';

export function GradingFields() {
  const t = useTranslations('cards.form');
  const tGlobal = useTranslations('cards');
  const form = useFormContext<FormValues>();

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">{t('grading')}</h3>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="gradingCompany"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('gradingCompany')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="UNGRADED">{tGlobal('enums.grading.UNGRADED')}</SelectItem>
                  <SelectItem value="PSA">{tGlobal('enums.grading.PSA')}</SelectItem>
                  <SelectItem value="BGS">{tGlobal('enums.grading.BGS')}</SelectItem>
                  <SelectItem value="SGC">{tGlobal('enums.grading.SGC')}</SelectItem>
                  <SelectItem value="CGC">{tGlobal('enums.grading.CGC')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="grade"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('grade')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="10"
                  {...field}
                  value={field.value || ''}
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
