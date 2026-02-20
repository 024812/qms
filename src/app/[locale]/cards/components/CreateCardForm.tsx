'use client';

/**
 * Create Card Form Component
 *
 * Simplified form for creating new cards using the shared useCardForm hook.
 * Features auto-save after successful AI scan.
 */

import { FormProvider } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CardImageUpload } from '@/components/cards/CardImageUpload';
import { SectionValueCost } from './form-parts/SectionValueCost';
import { SectionPlayerTeam } from './form-parts/SectionPlayerTeam';
import { SectionGradingCert } from './form-parts/SectionGradingCert';
import { SectionFeatures } from './form-parts/SectionFeatures';
import { SectionNotes } from './form-parts/SectionNotes';
import { useCardForm } from './hooks/useCardForm';

interface CreateCardFormProps {
  onSuccess?: () => void;
}

export function CreateCardForm({ onSuccess }: CreateCardFormProps) {
  const t = useTranslations('cards.form');
  const tCards = useTranslations('cards');

  const {
    form,
    loading,
    aiScanning,
    imageQualityFeedback,
    showDetails,
    handleSmartScan,
    handleEstimatePrice,
    estimating,
    handleSubmit,
  } = useCardForm({
    autoSaveOnAISuccess: true, // Key difference: auto-save enabled for new cards
    onSuccess,
  });

  const hasFrontImage = !!(form.watch('frontImage') || form.watch('mainImage'));

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Risk Warning from AI */}
        {/* Note: Risk Warning is intentionally omitted here as we auto-save on success */
        /* Only Image Quality feedback is relevant for creation flow */}

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
              frontImage={form.watch('frontImage') || ''}
              backImage={form.watch('backImage') || ''}
              onFrontImageChange={img => form.setValue('frontImage', img)}
              onBackImageChange={img => form.setValue('backImage', img)}
            />
          </div>

          {/* Smart Scan Button */}
          {hasFrontImage && (
            <div className="flex flex-col gap-2 justify-start">
              <Button
                type="button"
                onClick={handleSmartScan}
                disabled={aiScanning}
                className="min-w-[140px]"
              >
                {aiScanning ? (
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {tCards('actions.smartScan')}
              </Button>
              <p className="text-xs text-muted-foreground">{t('smartScanHint')}</p>
            </div>
          )}
        </div>

        {/* Form Fields - shown after AI scan or manual toggle */}
        {showDetails && (
          <div className="space-y-6">
            <SectionValueCost onEstimate={handleEstimatePrice} estimating={estimating} />
            <SectionPlayerTeam />
            <SectionFeatures />
            <SectionGradingCert />
            <SectionNotes />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                {t('save')}
              </Button>
            </div>
          </div>
        )}
      </form>
    </FormProvider>
  );
}
