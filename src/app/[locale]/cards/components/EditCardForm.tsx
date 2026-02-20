'use client';

/**
 * Edit Card Form Component
 *
 * Form for editing existing cards using the shared useCardForm hook.
 * Does NOT auto-save after AI scan - user must review and confirm.
 */

import { useState } from 'react';
import { AnalysisPanel } from './AnalysisPanel';
import { analyzeCardQuickAction } from '@/app/actions/ai-card-actions';
import type { QuickAnalysisResult } from '@/modules/cards/services/ai-card-service';
import { toast } from 'sonner';

import { FormProvider } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, ShieldCheck, TrendingUp, BarChart3 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CardImageUpload } from '@/components/cards/CardImageUpload';
import { SectionValueCost } from './form-parts/SectionValueCost';
import { SectionPlayerTeam } from './form-parts/SectionPlayerTeam';
import { SectionGradingCert } from './form-parts/SectionGradingCert';
import { SectionFeatures } from './form-parts/SectionFeatures';
import { SectionNotes } from './form-parts/SectionNotes';
import { useCardForm } from './hooks/useCardForm';
import type { FormValues } from './form-schema';

interface EditCardFormProps {
  initialData: Partial<FormValues> & { id: string };
  onSuccess?: () => void;
}

export function EditCardForm({ initialData, onSuccess }: EditCardFormProps) {
  const t = useTranslations('cards.form');
  const tCards = useTranslations('cards');
  const locale = useTranslations()('locale') || 'en'; // Hack if locale is not directly exposed, or use a hook

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
    authCheckResult,
  } = useCardForm({
    initialData,
    autoSaveOnAISuccess: false,
    onSuccess,
  });

  // Analysis State
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<QuickAnalysisResult | null>(null);

  const handleAnalysis = async () => {
    const values = form.getValues();
    if (!values.playerName || !values.year || !values.brand) {
      toast.error(t('errors.insufficientDataForEstimate'));
      return;
    }

    setShowAnalysis(true);
    setAnalyzing(true);
    try {
      const result = await analyzeCardQuickAction(
        {
          playerName: values.playerName,
          year: values.year,
          brand: values.brand,
          gradingCompany: values.gradingCompany || undefined,
          grade: values.grade || null,
        },
        locale
      );

      setAnalysisResult(result);
    } catch (error) {
      console.error(error);
      toast.error('Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* Main Form Area */}
      <div
        className={`min-w-0 transition-all duration-300 ${showAnalysis ? 'xl:basis-[55%] xl:flex-shrink-0' : 'w-full'}`}
      >
        <FormProvider {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Risk Warning from AI */}
            {riskWarning && (
              <Alert variant="destructive">
                <AlertDescription>{riskWarning}</AlertDescription>
              </Alert>
            )}

            {/* Authenticity Safe Message */}
            {authCheckResult === 'SAFE' && (
              <Alert className="border-green-500 text-green-700 bg-green-50">
                <ShieldCheck className="h-4 w-4 stroke-green-600" />
                <AlertDescription className="text-green-700 font-medium ml-2">
                  {t('ai.noRisksDetected')}
                </AlertDescription>
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSmartScan}
                  disabled={aiScanning || loading}
                  className="w-full justify-start text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  {aiScanning ? (
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {tCards('actions.smartScan')}
                </Button>

                {/* 2. Authenticity Check */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAuthenticityCheck}
                  disabled={checkingAuthenticity || loading}
                  className="w-full justify-start text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                >
                  {checkingAuthenticity ? (
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  ) : (
                    <ShieldCheck className="mr-2 h-4 w-4" />
                  )}
                  {tCards('actions.checkAuthenticity')}
                </Button>

                {/* 3. Comprehensive Analysis */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                  onClick={handleAnalysis}
                  disabled={analyzing || loading}
                >
                  {analyzing ? (
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  ) : (
                    <TrendingUp className="mr-2 h-4 w-4" />
                  )}
                  {tCards('analysis.title')}
                </Button>

                {/* 4. Estimate Price */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                  onClick={handleEstimatePrice}
                  disabled={estimating || loading}
                >
                  {estimating ? (
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  ) : (
                    <BarChart3 className="mr-2 h-4 w-4" />
                  )}
                  {tCards('actions.estimatePrice')}
                </Button>
              </div>
            </div>

            {/* Form Fields - always shown for edit */}
            <div className="space-y-6">
              <SectionValueCost />
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
          </form>
        </FormProvider>
      </div>

      {/* Analysis Panel */}
      {showAnalysis && (
        <div className="xl:basis-[45%] xl:flex-shrink-0 min-w-[350px] border-t xl:border-t-0 xl:border-l pl-0 xl:pl-6 pt-6 xl:pt-0">
          <AnalysisPanel
            data={analysisResult}
            loading={analyzing}
            cardDetails={{
              playerName: form.getValues().playerName,
              year: form.getValues().year,
              brand: form.getValues().brand,
              cardNumber: form.getValues().cardNumber || undefined,
              series: form.getValues().series || undefined,
              gradingCompany: form.getValues().gradingCompany || undefined,
              grade: form.getValues().grade ? Number(form.getValues().grade) : undefined,
            }}
          />
        </div>
      )}
    </div>
  );
}
