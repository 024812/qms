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

export function PlayerInfoFields() {
  const t = useTranslations('cards.form');
  const tGlobal = useTranslations('cards');
  const form = useFormContext<FormValues>();

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">{t('playerInfo')}</h3>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="playerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('playerName')} *</FormLabel>
              <FormControl>
                <Input placeholder={t('playerNamePlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="sport"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('sport')} *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="BASKETBALL">{tGlobal('enums.sports.BASKETBALL')}</SelectItem>
                  <SelectItem value="SOCCER">{tGlobal('enums.sports.SOCCER')}</SelectItem>
                  <SelectItem value="OTHER">{tGlobal('enums.sports.OTHER')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="team"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('team')}</FormLabel>
              <FormControl>
                <Input placeholder={t('teamPlaceholder')} {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="position"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('position')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('positionPlaceholder')}
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
