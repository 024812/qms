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
  team: z.string().optional(),
  position: z.string().optional(),

  // Card Details
  year: z.coerce
    .number()
    .min(1800)
    .max(new Date().getFullYear() + 1),
  brand: z.string().min(1, 'Brand is required'),
  series: z.string().optional(),
  cardNumber: z.string().optional(),

  // Grading
  gradingCompany: z.enum(['PSA', 'BGS', 'SGC', 'CGC', 'UNGRADED']).default('UNGRADED'),
  grade: z.coerce.number().min(1).max(10).optional().nullable().or(z.literal('')),
  certificationNumber: z.string().optional(),

  // Value
  purchasePrice: z.coerce.number().min(0).optional().nullable().or(z.literal('')),
  purchaseDate: z.string().optional(),
  currentValue: z.coerce.number().min(0).optional().nullable().or(z.literal('')),
  estimatedValue: z.coerce.number().min(0).optional().nullable().or(z.literal('')),

  // Physical
  parallel: z.string().optional(),
  serialNumber: z.string().optional(),
  isAutographed: z.boolean().default(false),
  hasMemorabilia: z.boolean().default(false),
  memorabiliaType: z.string().optional(),

  // Storage
  status: z.enum(['COLLECTION', 'FOR_SALE', 'SOLD', 'GRADING', 'DISPLAY']).default('COLLECTION'),
  location: z.string().optional(),
  storageType: z.string().optional(),
  condition: z.string().optional(),
  notes: z.string().optional(),

  // Images
  mainImage: z.string().optional(),
  frontImage: z.string().optional(),
  backImage: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CardFormProps {
  initialData?: Partial<FormValues>;
  onSuccess?: () => void;
}

export function CardForm({ initialData, onSuccess }: CardFormProps) {
  const t = useTranslations('cards.form');
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
        if (result.playerName) form.setValue('playerName', result.playerName);
        if (result.year) form.setValue('year', result.year);
        if (result.brand) form.setValue('brand', result.brand);
        if (result.series) form.setValue('series', result.series);
        if (result.cardNumber) form.setValue('cardNumber', result.cardNumber);
        if (result.sport) form.setValue('sport', result.sport);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (result.gradingCompany) form.setValue('gradingCompany', result.gradingCompany as any);
        if (result.grade) form.setValue('grade', result.grade);
        if (result.isAutographed !== undefined)
          form.setValue('isAutographed', result.isAutographed);

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
        info(t('ai.title'), `Estimated value: $${result.low} - $${result.high}`);
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
      };

      await saveCard(payload);
      success(t('success'), t('cardSaved'));
      form.reset();
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
                  {t('actions.smartScan')}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  {aiScanning ? t('ai.identifying') : 'Auto-detect card details from image'}
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
                      <SelectItem value="BASKETBALL">{t('enums.sports.BASKETBALL')}</SelectItem>
                      <SelectItem value="SOCCER">{t('enums.sports.SOCCER')}</SelectItem>
                      <SelectItem value="OTHER">{t('enums.sports.OTHER')}</SelectItem>
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
                    <Input placeholder={t('teamPlaceholder')} {...field} />
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
                    <Input placeholder={t('positionPlaceholder')} {...field} />
                  </FormControl>
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
                    <Input placeholder={t('seriesPlaceholder')} {...field} />
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
                    <Input placeholder={t('cardNumberPlaceholder')} {...field} />
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
                      <SelectItem value="UNGRADED">{t('enums.grading.UNGRADED')}</SelectItem>
                      <SelectItem value="PSA">{t('enums.grading.PSA')}</SelectItem>
                      <SelectItem value="BGS">{t('enums.grading.BGS')}</SelectItem>
                      <SelectItem value="SGC">{t('enums.grading.SGC')}</SelectItem>
                      <SelectItem value="CGC">{t('enums.grading.CGC')}</SelectItem>
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

        {/* Value Group */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">{t('valueStatus')}</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleEstimatePrice}
              disabled={estimating}
              className="h-7 text-xs"
            >
              {estimating ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <Calculator className="mr-1 h-3 w-3" />
              )}
              {t('actions.estimatePrice')}
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
                      <SelectItem value="COLLECTION">{t('enums.status.COLLECTION')}</SelectItem>
                      <SelectItem value="FOR_SALE">{t('enums.status.FOR_SALE')}</SelectItem>
                      <SelectItem value="SOLD">{t('enums.status.SOLD')}</SelectItem>
                      <SelectItem value="GRADING">{t('enums.status.GRADING')}</SelectItem>
                      <SelectItem value="DISPLAY">{t('enums.status.DISPLAY')}</SelectItem>
                    </SelectContent>
                  </Select>
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
                        <Input placeholder={t('memorabiliaPlaceholder')} {...field} />
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
                        <Input placeholder={t('serialNumberPlaceholder')} {...field} />
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
                        <Input placeholder={t('certNumberPlaceholder')} {...field} />
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
                {t('storage')} & {t('purchaseDate')}
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('location')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <Input type="date" {...field} />
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
                      <Input {...field} />
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
          <Button type="button" variant="outline" onClick={() => onSuccess && onSuccess()}>
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
