'use client';

import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Calculator, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { calculateROI } from '@/modules/cards/utils';
import { FormValues } from '../form-schema';

interface ValueFieldsProps {
  onEstimate?: () => void;
  estimating?: boolean;
}

export function ValueFields({ onEstimate, estimating = false }: ValueFieldsProps) {
  const t = useTranslations('cards.form');
  const tGlobal = useTranslations('cards');
  const form = useFormContext<FormValues>();

  const purchasePrice = form.watch('purchasePrice');
  const currentValue = form.watch('currentValue');
  const roi = calculateROI(purchasePrice || undefined, currentValue || undefined);
  const isPositiveROI = roi.startsWith('+');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-2">
        <h3 className="text-sm font-medium text-muted-foreground">{t('valueStatus')}</h3>
        {onEstimate && (
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onEstimate}
            disabled={estimating}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0"
          >
            {estimating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Calculator className="mr-2 h-4 w-4" />
            )}
            {tGlobal('actions.estimatePrice')}
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="currentValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex justify-between items-center">
                {t('currentValue')}
                {roi !== '-' && (
                  <Badge
                    variant={isPositiveROI ? 'default' : 'destructive'}
                    className={`ml-2 px-1.5 py-0 text-[10px] h-5 ${isPositiveROI ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                  >
                    {roi} ROI
                  </Badge>
                )}
              </FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="purchasePrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('purchasePrice')}</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="purchaseDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('purchaseDate')}</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {form.watch('status') === 'SOLD' && (
          <>
            <FormField
              control={form.control}
              name="soldPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('soldPrice')}</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="soldDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('soldDate')}</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                      onChange={e =>
                        field.onChange(e.target.value ? new Date(e.target.value) : null)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('status')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="COLLECTION">{tGlobal('enums.status.COLLECTION')}</SelectItem>
                  <SelectItem value="FOR_SALE">{tGlobal('enums.status.FOR_SALE')}</SelectItem>
                  <SelectItem value="SOLD">{tGlobal('enums.status.SOLD')}</SelectItem>
                  <SelectItem value="GRADING">{tGlobal('enums.status.GRADING')}</SelectItem>
                  <SelectItem value="DISPLAY">{tGlobal('enums.status.DISPLAY')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
