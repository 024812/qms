'use client';

/**
 * Unified Card Dashboard
 *
 * Replaces separate View/Edit pages.
 * Provides a consolidated view for managing a card:
 * - Left: Images & Visuals
 * - Center: Editable Data Fields
 * - Right: AI Analysis & Market Data
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  Loader2,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  Save,
  Trash2,
  ChevronLeft,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { CardImageUpload } from '@/components/cards/CardImageUpload';
import { PlayerInfoFields } from './form-parts/PlayerInfoFields';
import { CardDetailsFields } from './form-parts/CardDetailsFields';
import { GradingFields } from './form-parts/GradingFields';
import { ValueFields } from './form-parts/ValueFields';
import { AdvancedDetailsFields } from './form-parts/AdvancedDetailsFields';
import { AnalysisPanel } from './AnalysisPanel';

import { useCardForm } from './hooks/useCardForm';
import { analyzeCardQuickAction } from '@/app/actions/ai-card-actions';
import { deleteCard } from '@/app/actions/card-actions';
import type { FormValues } from './form-schema';
import type { QuickAnalysisResult } from '@/modules/cards/services/ai-card-service';
import { Link } from '@/i18n/routing';

interface UnifiedCardDashboardProps {
  initialData: Partial<FormValues> & { id: string };
}

export function UnifiedCardDashboard({ initialData }: UnifiedCardDashboardProps) {
  const t = useTranslations('cards.form');
  const tCards = useTranslations('cards');
  const locale = useTranslations()('locale') || 'en';
  const router = useRouter();

  // Form Hook
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
    autoSaveOnAISuccess: false, // Manual save only
    onSuccess: () => {
      toast.success(t('success.updated'));
      router.refresh(); // Refresh server data
    },
  });

  // Analysis State
  // Default to showing analysis if we have data, or if user wants it.
  // We'll keep it collapsible or always visible on large screens?
  // Let's make it always visible in the 3rd column if space permits.
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<QuickAnalysisResult | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Analysis Handler
  const handleAnalysis = async () => {
    const values = form.getValues();
    if (!values.playerName || !values.year || !values.brand) {
      toast.error(t('errors.insufficientDataForEstimate'));
      return;
    }

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

  // Delete Handler
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteCard(initialData.id);
      toast.success(tCards('success.deleted'));
      router.push('/cards');
    } catch (err) {
      console.error(err);
      toast.error(tCards('errors.deleteFailed'));
      setIsDeleting(false);
    }
  };

  const hasUnsavedChanges =
    form.formState.isDirty || Object.keys(form.formState.dirtyFields).length > 0;

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-0 z-10 bg-background/95 backdrop-blur py-2 border-b">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/cards">
              <ChevronLeft className="w-4 h-4 mr-1" />
              {tCards('backToList')}
            </Link>
          </Button>
          <div className="hidden md:block w-px h-6 bg-border mx-2" />
          <h1 className="text-xl font-bold truncate max-w-[200px] md:max-w-md">
            {form.watch('year')} {form.watch('brand')} {form.watch('playerName')}
          </h1>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Delete */}
          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">{t('delete')}</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{tCards('actions.deleteTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {tCards('actions.deleteConfirm', {
                    card: `${initialData.year} ${initialData.brand} ${initialData.playerName}`,
                  })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {isDeleting ? <Loader2 className="animate-spin w-4 h-4" /> : t('delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Save */}
          <Button
            onClick={handleSubmit}
            disabled={loading || !hasUnsavedChanges}
            variant={hasUnsavedChanges ? 'default' : 'secondary'}
            className="flex-1 sm:flex-none min-w-[100px]"
          >
            {loading ? (
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {hasUnsavedChanges ? t('saveChanges') : t('saved')}
          </Button>
        </div>
      </div>

      <FormProvider {...form}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Images & AI Tools (3/12) */}
          <div className="lg:col-span-3 space-y-6">
            <div className="space-y-4">
              <CardImageUpload
                frontImage={form.watch('frontImage') || form.watch('mainImage') || ''}
                backImage={form.watch('backImage') || ''}
                onFrontImageChange={img => form.setValue('frontImage', img, { shouldDirty: true })}
                onBackImageChange={img => form.setValue('backImage', img, { shouldDirty: true })}
              />

              {/* AI Feedback Alerts */}
              {riskWarning && (
                <Alert variant="destructive" className="py-2">
                  <AlertDescription className="text-xs">{riskWarning}</AlertDescription>
                </Alert>
              )}
              {imageQualityFeedback && (
                <Alert className="py-2">
                  <AlertDescription className="text-xs">{imageQualityFeedback}</AlertDescription>
                </Alert>
              )}
              {authCheckResult === 'SAFE' && (
                <Alert className="border-green-500 text-green-700 bg-green-50 py-2">
                  <ShieldCheck className="h-4 w-4 stroke-green-600" />
                  <AlertDescription className="text-green-700 text-xs font-medium ml-2">
                    {t('ai.noRisksDetected')}
                  </AlertDescription>
                </Alert>
              )}

              {/* Tools */}
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSmartScan}
                  disabled={aiScanning || loading}
                  className="justify-start"
                >
                  {aiScanning ? (
                    <Loader2 className="animate-spin mr-2 h-3 w-3" />
                  ) : (
                    <Sparkles className="mr-2 h-3 w-3 text-blue-500" />
                  )}
                  {tCards('actions.smartScan')}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAuthenticityCheck}
                  disabled={checkingAuthenticity || loading}
                  className="justify-start"
                >
                  {checkingAuthenticity ? (
                    <Loader2 className="animate-spin mr-2 h-3 w-3" />
                  ) : (
                    <ShieldCheck className="mr-2 h-3 w-3 text-green-500" />
                  )}
                  {tCards('actions.checkAuthenticity')}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleEstimatePrice}
                  disabled={estimating || loading}
                  className="justify-start"
                >
                  {estimating ? (
                    <Loader2 className="animate-spin mr-2 h-3 w-3" />
                  ) : (
                    <BarChart3 className="mr-2 h-3 w-3 text-emerald-500" />
                  )}
                  {tCards('actions.estimatePrice')}
                </Button>
              </div>
            </div>
          </div>

          {/* MIDDLE COLUMN: Form Fields (5/12) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Player Info */}
            <PlayerInfoFields />

            {/* Card Details */}
            <CardDetailsFields />

            {/* Grading */}
            <GradingFields />

            {/* Value */}
            <ValueFields />

            {/* Physical & Storage */}
            <AdvancedDetailsFields />
          </div>

          {/* RIGHT COLUMN: Analysis (4/12) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Always show Analysis Panel Wrapper */}
            <div className="bg-muted/30 rounded-lg p-1">
              <div className="p-4 flex items-center justify-between border-b bg-background rounded-t-lg">
                <h3 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  {tCards('analysis.title')}
                </h3>
                <Button size="sm" variant="ghost" onClick={handleAnalysis} disabled={analyzing}>
                  {analyzing ? <Loader2 className="animate-spin w-4 h-4" /> : t('refresh')}
                </Button>
              </div>

              <div className="p-0">
                <AnalysisPanel
                  data={analysisResult}
                  loading={analyzing}
                  cardDetails={{
                    playerName: form.watch('playerName'),
                    year: form.watch('year'),
                    brand: form.watch('brand'),
                    cardNumber: form.watch('cardNumber') || undefined,
                    series: form.watch('series') || undefined,
                    gradingCompany: form.watch('gradingCompany') || undefined,
                    grade: form.watch('grade') ? Number(form.watch('grade')) : undefined,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </FormProvider>
    </div>
  );
}
