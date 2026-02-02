'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FormValues } from '../form-schema';

export function AdvancedDetailsFields() {
  const t = useTranslations('cards.form');
  const form = useFormContext<FormValues>();
  const [open, setOpen] = React.useState(false);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="space-y-2 border rounded-md p-4 bg-muted/20"
    >
      <div className="flex items-center justify-between w-full">
        <h3 className="text-sm font-medium">{t('advanced')}</h3>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent className="space-y-4 pt-4">
        {/* Physical */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('physical')}
          </h4>
          <div className="flex gap-6">
            <FormField
              control={form.control}
              name="isAutographed"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 flex-1">
                  <div className="space-y-0.5 mr-4">
                    <FormLabel className="text-sm">{t('autographed')}</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hasMemorabilia"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 flex-1">
                  <div className="space-y-0.5 mr-4">
                    <FormLabel className="text-sm">{t('memorabilia')}</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          {form.watch('hasMemorabilia') && (
            <FormField
              control={form.control}
              name="memorabiliaType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('memorabiliaType')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('memorabiliaPlaceholder')}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="serialNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('serialNumber')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('serialNumberPlaceholder')}
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
              name="certificationNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('certNumber')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('certNumberPlaceholder')}
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

        {/* Storage & Purchase Info */}
        <div className="space-y-4 border-t pt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('storage')}
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('location')}</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
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
      </CollapsibleContent>
    </Collapsible>
  );
}
