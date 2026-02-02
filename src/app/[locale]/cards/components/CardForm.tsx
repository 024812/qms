'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2, Sparkles, ChevronDown, ChevronUp, Calculator, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CardImageUpload } from '@/components/cards/CardImageUpload';
import { saveCard } from '@/app/actions/card-actions';
import { identifyCardAction, estimatePriceAction } from '@/app/actions/ai-card-actions';
import { useToast } from '@/hooks/useToast';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

// Schema based on src/modules/cards/schema.ts
const formSchema = z.object({
  id: z.string().optional(),
  itemNumber: z.number().optional(),

  // Player Info
  playerName: z.string().min(1, 'Player name is required'),
  sport: z.enum(['BASKETBALL', 'SOCCER', 'OTHER']),
  team: z.string().optional().nullable().or(z.literal('')),
  position: z.string().optional().nullable().or(z.literal('')),

  // Card Details
  year: z.coerce
    .number()
    .min(1800)
    .max(new Date().getFullYear() + 1),
  brand: z.string().min(1, 'Brand is required'),
  series: z.string().optional().nullable().or(z.literal('')),
  cardNumber: z.string().optional().nullable().or(z.literal('')),

  // Grading
  gradingCompany: z.enum(['PSA', 'BGS', 'SGC', 'CGC', 'UNGRADED']).default('UNGRADED'),
  grade: z.coerce.number().min(1).max(10).optional().nullable().or(z.literal('')),
  certificationNumber: z.string().optional().nullable().or(z.literal('')),

  // Value
  purchasePrice: z.coerce.number().min(0).optional().nullable().or(z.literal('')),
  purchaseDate: z.string().optional().nullable().or(z.literal('')),
  currentValue: z.coerce.number().min(0).optional().nullable().or(z.literal('')),
  estimatedValue: z.coerce.number().min(0).optional().nullable().or(z.literal('')),
  soldPrice: z.coerce.number().min(0).optional().nullable().or(z.literal('')),
  soldDate: z.string().optional().nullable().or(z.literal('')),

  // Valuation Metadata
  valuationDate: z.string().optional().nullable(), // ISO string
  valuationConfidence: z.string().optional().nullable(),
  valuationSources: z.array(z.string()).optional().default([]),

  // Physical
  parallel: z.string().optional().nullable().or(z.literal('')),
  serialNumber: z.string().optional().nullable().or(z.literal('')),
  isAutographed: z.boolean().default(false),
  hasMemorabilia: z.boolean().default(false),
  memorabiliaType: z.string().optional().nullable().or(z.literal('')),

  // Storage
  status: z.enum(['COLLECTION', 'FOR_SALE', 'SOLD', 'GRADING', 'DISPLAY']).default('COLLECTION'),
  location: z.string().optional().nullable().or(z.literal('')),
  storageType: z.string().optional().nullable().or(z.literal('')),
  condition: z.string().optional().nullable().or(z.literal('')),
  notes: z.string().optional().nullable().or(z.literal('')),

  // Images
  mainImage: z.string().optional().nullable().or(z.literal('')),
  frontImage: z.string().optional().nullable().or(z.literal('')),
  backImage: z.string().optional().nullable().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

interface CardFormProps {
  initialData?: Partial<FormValues>;
  onSuccess?: () => void;
}

export function CardForm({ initialData, onSuccess }: CardFormProps) {
  const t = useTranslations('cards.form');
  const tGlobal = useTranslations('cards');
  const { success, error, info } = useToast();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [aiScanning, setAiScanning] = React.useState(false);
  const [estimating, setEstimating] = React.useState(false);
  const [advancedOpen, setAdvancedOpen] = React.useState(false);
  const [warningMsg, setWarningMsg] = React.useState<string | null>(null);

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      sport: 'BASKETBALL',
      gradingCompany: 'UNGRADED',
      status: 'COLLECTION',
      isAutographed: false,
      hasMemorabilia: false,
      year: new Date().getFullYear(),
      ...initialData,
    },
  });

  const handleSmartScan = async () => {
    const frontImage = form.getValues('frontImage') || form.getValues('mainImage');
    if (!frontImage) {
      error(t('ai.title'), 'Please upload a front image first.');
      return;
    }

    setAiScanning(true);
    setWarningMsg(null);
    try {
      info(t('ai.title'), t('ai.identifying'));
      const result = await identifyCardAction(frontImage);

      if (result) {
        if (result.playerName)
          form.setValue('playerName', result.playerName, {
            shouldValidate: true,
            shouldDirty: true,
          });
        if (result.year)
          form.setValue('year', result.year, { shouldValidate: true, shouldDirty: true });
        if (result.brand)
          form.setValue('brand', result.brand, { shouldValidate: true, shouldDirty: true });
        if (result.series)
          form.setValue('series', result.series, { shouldValidate: true, shouldDirty: true });
        if (result.cardNumber)
          form.setValue('cardNumber', result.cardNumber, {
            shouldValidate: true,
            shouldDirty: true,
          });
        if (result.sport)
          form.setValue('sport', result.sport, { shouldValidate: true, shouldDirty: true });
        if (result.team)
          form.setValue('team', result.team, { shouldValidate: true, shouldDirty: true });
        if (result.position)
          form.setValue('position', result.position, { shouldValidate: true, shouldDirty: true });

        if (result.gradingCompany)
          form.setValue('gradingCompany', result.gradingCompany as any, {
            shouldValidate: true,
            shouldDirty: true,
          });
        if (result.grade)
          form.setValue('grade', result.grade, { shouldValidate: true, shouldDirty: true });
        if (result.isAutographed !== undefined)
          form.setValue('isAutographed', result.isAutographed, {
            shouldValidate: true,
            shouldDirty: true,
          });

        if (result.riskWarning) {
          setWarningMsg(result.riskWarning);
        }

        success(t('ai.title'), t('ai.identifySuccess'));
      }
    } catch (err) {
      console.error(err);
      error(t('ai.title'), t('ai.identifyError'));
    } finally {
      setAiScanning(false);
    }
  };

  const handleEstimatePrice = async () => {
    const rawGrade = form.getValues('grade');
    const details = {
      playerName: form.getValues('playerName'),
      year: form.getValues('year'),
      brand: form.getValues('brand'),
      gradingCompany: form.getValues('gradingCompany'),
      grade: rawGrade === '' ? null : rawGrade,
    };

    setEstimating(true);
    try {
      info(t('ai.title'), t('ai.estimating'));
      const result = await estimatePriceAction(details);

      if (result && result.average) {
        form.setValue('estimatedValue', result.average);
        form.setValue('currentValue', result.average);

        // Set new metadata fields
        if (result.confidence) {
          form.setValue('valuationConfidence', result.confidence);
        }
        if (result.sources) {
          form.setValue('valuationSources', result.sources);
        }
        form.setValue('valuationDate', new Date().toISOString());

        info(
          t('ai.title'),
          `Est: $${result.low}-$${result.high} (Conf: ${result.confidence}, Srces: ${result.sources?.join(', ')})`
        );
      }
    } catch (err) {
      console.error(err);
      error(t('ai.title'), t('ai.estimateError'));
    } finally {
      setEstimating(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        mainImage: values.frontImage || values.mainImage,
        attachmentImages: values.backImage ? [values.backImage] : [],
        grade: values.grade === '' ? null : values.grade,
        purchasePrice: values.purchasePrice === '' ? null : values.purchasePrice,
        currentValue: values.currentValue === '' ? null : values.currentValue,
        estimatedValue: values.estimatedValue === '' ? null : values.estimatedValue,
        soldPrice: values.soldPrice === '' ? null : values.soldPrice,
        soldDate: values.soldDate === '' ? null : values.soldDate,
        valuationDate: values.valuationDate ? new Date(values.valuationDate) : null,
        valuationConfidence: values.valuationConfidence,
        valuationSources: values.valuationSources,
      };

      await saveCard(payload);
      success(t('success'), t('cardSaved'));
      // Update form state to the new saved values so it doesn't revert to old initialData
      form.reset(values);
      router.refresh();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      error(t('error'), t('failedToSave'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Risk Warning Alert */}
        {warningMsg && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-md flex items-start animate-in fade-in slide-in-from-top-2">
            <AlertTriangle className="h-5 w-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-amber-800">{t('ai.riskTitle')}</h4>
              <p className="text-sm text-amber-700 mt-1">{warningMsg}</p>
            </div>
          </div>
        )}

        {/* Top Section: Image Upload & AI Scan */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">{t('images')}</h3>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <CardImageUpload
                frontImage={form.watch('frontImage') || form.watch('mainImage') || ''}
                backImage={form.watch('backImage') || ''}
                onFrontImageChange={url => form.setValue('frontImage', url)}
                onBackImageChange={url => form.setValue('backImage', url)}
              />
            </div>

            {/* AI Actions Panel - shown when front image exists */}
            {(form.watch('frontImage') || form.watch('mainImage')) && (
              <div className="w-full md:w-64 flex flex-col gap-3 justify-center border-l pl-0 md:pl-6">
                <Button
                  type="button"
                  variant="default"
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0"
                  onClick={handleSmartScan}
                  disabled={aiScanning}
                >
                  {aiScanning ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {tGlobal('actions.smartScan')}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  {aiScanning ? t('ai.identifying') : t('ai.autoDetect')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Player Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
            {t('playerInfo')}
          </h3>
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
                      <SelectItem value="BASKETBALL">
                        {tGlobal('enums.sports.BASKETBALL')}
                      </SelectItem>
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
                    <Input
                      placeholder={t('teamPlaceholder')}
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

        {/* Value Group */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">{t('valueStatus')}</h3>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleEstimatePrice}
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
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="currentValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('currentValue')}</FormLabel>
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
                          value={
                            field.value ? new Date(field.value).toISOString().split('T')[0] : ''
                          }
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
                      <SelectItem value="COLLECTION">
                        {tGlobal('enums.status.COLLECTION')}
                      </SelectItem>
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

        {/* Card Details Group */}
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
                    <Input
                      placeholder={t('seriesPlaceholder')}
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

        {/* Grading Group */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
            {t('grading')}
          </h3>
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

        {/* Advanced Details Collapsible */}
        <Collapsible
          open={advancedOpen}
          onOpenChange={setAdvancedOpen}
          className="space-y-2 border rounded-md p-4 bg-muted/20"
        >
          <div className="flex items-center justify-between w-full">
            <h3 className="text-sm font-medium">{t('advanced')}</h3>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {advancedOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
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

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (onSuccess) onSuccess();
              else router.back();
            }}
          >
            {t('cancel')}
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('save')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
