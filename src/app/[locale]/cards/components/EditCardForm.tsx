'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FormProvider } from 'react-hook-form';
import { Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardImageUpload } from '@/components/cards/CardImageUpload';
import { saveCard } from '@/app/actions/card-actions';
import { identifyCardAction, estimatePriceAction } from '@/app/actions/ai-card-actions';
import { useToast } from '@/hooks/useToast';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { formSchema, FormValues } from './form-schema';
import { PlayerInfoFields } from './form-parts/PlayerInfoFields';
import { CardDetailsFields } from './form-parts/CardDetailsFields';
import { GradingFields } from './form-parts/GradingFields';
import { ValueFields } from './form-parts/ValueFields';
import { AdvancedDetailsFields } from './form-parts/AdvancedDetailsFields';

interface EditCardFormProps {
  initialData?: Partial<FormValues>;
  onSuccess?: () => void;
}

export function EditCardForm({ initialData, onSuccess }: EditCardFormProps) {
  const t = useTranslations('cards.form');
  const tGlobal = useTranslations('cards');
  const locale = useLocale();
  const { success, error, info } = useToast();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [aiScanning, setAiScanning] = React.useState(false);
  const [estimating, setEstimating] = React.useState(false);
  const [warningMsg, setWarningMsg] = React.useState<string | null>(null);

  const form = useForm<FormValues>({
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

  const handleEstimatePrice = async () => {
    const rawGrade = form.getValues('grade');
    const details = {
      playerName: form.getValues('playerName'),
      year: form.getValues('year'),
      brand: form.getValues('brand'),
      gradingCompany: form.getValues('gradingCompany'),
      grade:
        rawGrade === null || rawGrade === undefined || rawGrade === '' ? null : Number(rawGrade),
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

      // Get back image if available
      const backImage = form.getValues('backImage') || undefined;

      // Compress images before sending (dynamic import for client-side only)
      const { compressImage } = await import('@/lib/utils/image-compression');
      const compressedFront = await compressImage(frontImage);
      const compressedBack = backImage ? await compressImage(backImage) : undefined;

      // Call AI with both images
      const result = await identifyCardAction(compressedFront, compressedBack, locale);

      if (result) {
        if (result.imageQualityFeedback) {
          error(t('ai.imageQualityIssue'), result.imageQualityFeedback);
          // In Edit mode, we probably don't stop, just warn.
        }

        // Batch update form values
        const updates: Partial<FormValues> = {};
        if (result.playerName) updates.playerName = result.playerName;
        if (result.year) updates.year = result.year;
        if (result.brand) updates.brand = result.brand;
        if (result.series) updates.series = result.series;
        if (result.cardNumber) updates.cardNumber = result.cardNumber;
        if (result.sport) updates.sport = result.sport;
        if (result.team) updates.team = result.team;
        if (result.position) updates.position = result.position;
        if (result.gradingCompany)
          updates.gradingCompany = result.gradingCompany as FormValues['gradingCompany'];
        if (result.grade) updates.grade = result.grade;
        if (result.isAutographed !== undefined) updates.isAutographed = result.isAutographed;

        Object.entries(updates).forEach(([key, value]) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          form.setValue(key as any, value, {
            shouldValidate: true,
            shouldDirty: true,
          });
        });

        if (result.riskWarning) {
          setWarningMsg(result.riskWarning);
        }

        success(t('ai.title'), t('ai.identifySuccess'));

        // No Auto-Save in Edit Mode - User must review changes
      }
    } catch (err) {
      console.error(err);
      error(t('ai.title'), t('ai.identifyError'));
    } finally {
      setAiScanning(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        mainImage: values.frontImage || values.mainImage,
        attachmentImages: values.backImage ? [values.backImage] : [],
        grade: values.grade === null ? null : values.grade,
        purchasePrice: values.purchasePrice === null ? null : values.purchasePrice,
        currentValue: values.currentValue === null ? null : values.currentValue,
        estimatedValue: values.estimatedValue === null ? null : values.estimatedValue,
        soldPrice: values.soldPrice === null ? null : values.soldPrice,
        soldDate: values.soldDate === null ? null : values.soldDate,
        valuationDate: values.valuationDate ? new Date(values.valuationDate) : null,
        valuationConfidence: values.valuationConfidence,
        valuationSources: values.valuationSources,
      };

      await saveCard(payload);
      success(t('success'), t('cardSaved'));
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
    <FormProvider {...form}>
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

        {/* Modular Form Parts */}
        <PlayerInfoFields />
        <CardDetailsFields />
        <ValueFields onEstimate={handleEstimatePrice} estimating={estimating} />
        <GradingFields />
        <AdvancedDetailsFields />

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => onSuccess?.()}>
            {t('cancel')}
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t('save')}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
