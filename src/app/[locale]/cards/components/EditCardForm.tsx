'use client';

/**
 * Edit Card Form Component
 *
 * Form for editing existing cards using the shared useCardForm hook.
 * Does NOT auto-save after AI scan - user must review and confirm.
 */

import { FormProvider } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, ShieldCheck, DollarSign } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CardImageUpload } from '@/components/cards/CardImageUpload';
import { PlayerInfoFields } from './form-parts/PlayerInfoFields';
import { CardDetailsFields } from './form-parts/CardDetailsFields';
import { GradingFields } from './form-parts/GradingFields';
import { ValueFields } from './form-parts/ValueFields';
import { AdvancedDetailsFields } from './form-parts/AdvancedDetailsFields';
import { useCardForm } from './hooks/useCardForm';
import type { FormValues } from './form-schema';

interface EditCardFormProps {
  initialData: Partial<FormValues> & { id: string };
  onSuccess?: () => void;
}

export function EditCardForm({ initialData, onSuccess }: EditCardFormProps) {
  const t = useTranslations('cards.form');
  const tCards = useTranslations('cards');

  const {
    form,
    loading,
    aiScanning,
    riskWarning,
    imageQualityFeedback,
    handleSmartScan,
    handleEstimatePrice,
    estimating,
    handleSubmit,
    handleAuthenticityCheck,
    checkingAuthenticity,
  } = useCardForm({
    initialData,
    autoSaveOnAISuccess: false, // Key difference: no auto-save for edits
    onSuccess,
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Risk Warning from AI */}
        {riskWarning && (
          <Alert variant="destructive">
            <AlertDescription>{riskWarning}</AlertDescription>
          </Alert>
        )}

        {/* Image Quality Feedback from AI */}
        {imageQualityFeedback && (
          <Alert>
            <AlertDescription>{imageQualityFeedback}</AlertDescription>
          </Alert>
        )}

        {/* Image Upload Section */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <CardImageUpload
              frontImage={form.watch('frontImage') || form.watch('mainImage') || ''}
              backImage={form.watch('backImage') || ''}
              onFrontImageChange={img => form.setValue('frontImage', img)}
              onBackImageChange={img => form.setValue('backImage', img)}
            />
          </div>

          {/* Utility Buttons - Vertical Group */}
          <div className="flex flex-col gap-3 justify-start w-full sm:w-auto min-w-[160px]">
            {/* 1. Smart Scan */}
            <div className="flex flex-col gap-1">
              <Button
                type="button"
                variant="secondary"
                onClick={handleSmartScan}
                disabled={aiScanning || loading}
                className="w-full justify-start"
              >
                {aiScanning ? (
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4 text-blue-500" />
                )}
                {tCards('actions.smartScan')}
              </Button>
              <p className="text-[10px] text-muted-foreground px-1">{t('rescanHint')}</p>
            </div>

            {/* 2. Authenticity Check */}
            <Button
              type="button"
              variant="outline"
              onClick={handleAuthenticityCheck}
              disabled={checkingAuthenticity || loading}
              className="w-full justify-start"
            >
              {checkingAuthenticity ? (
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
              ) : (
                <ShieldCheck className="mr-2 h-4 w-4 text-green-600" />
              )}
              {t('actions.checkAuthenticity')}
            </Button>

            {/* 3. Estimate Price */}
            <Button
              type="button"
              variant="outline"
              onClick={handleEstimatePrice}
              disabled={estimating || loading}
              className="w-full justify-start"
            >
              {estimating ? (
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
              ) : (
                <DollarSign className="mr-2 h-4 w-4 text-yellow-600" />
              )}
              {t('actions.estimateValue')}
            </Button>
          </div>
        </div>

        {/* Form Fields - always shown for edit */}
        <div className="space-y-6">
          <PlayerInfoFields />
          <CardDetailsFields />
          <GradingFields />
          <ValueFields onEstimate={handleEstimatePrice} estimating={estimating} />
          <AdvancedDetailsFields />

          <div className="flex justify-end gap-2 pt-4">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
              {t('save')}
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
