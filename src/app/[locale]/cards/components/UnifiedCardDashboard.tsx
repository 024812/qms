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
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

import { CardImageUpload } from '@/components/cards/CardImageUpload';
import { GlassPanel } from '@/components/ui/glass-panel';
import { calculateROI } from '@/modules/cards/utils';
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
    autoSaveOnAISuccess: false,
    onSuccess: () => {
      toast.success(t('success.updated'));
      router.refresh();
    },
  });

  // Analysis State
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<QuickAnalysisResult | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Computed Values for Header
  const purchasePrice = form.watch('purchasePrice');
  const maxPrice = form.watch('currentValue') || 0;
  const roi = calculateROI(purchasePrice || undefined, maxPrice || undefined);
  const isPositiveROI = roi.startsWith('+');

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
      toast.error(tCards('errors.analysisFailed'));
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 font-sans selection:bg-cyan-500/20">
      <div className="w-full space-y-6">
        {/* === HEADER === */}
        <header className="sticky top-4 z-50 rounded-2xl border border-white/40 bg-white/80 backdrop-blur-xl px-6 py-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            >
              <Link href="/cards">
                <ChevronLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {form.watch('year') || 'Year'} {form.watch('brand') || 'Brand'}
              </h1>
              <p className="text-sm text-slate-500 font-mono tracking-wide">
                {form.watch('playerName') || 'Player Name'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Quick Stats in Header */}
            <div className="hidden lg:flex items-center gap-6 px-6 border-l border-r border-slate-200">
              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  Current Value
                </span>
                <span className="text-lg font-mono font-bold text-emerald-600">
                  ${maxPrice?.toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-lg uppercase tracking-wider text-slate-500 font-bold">
                  ROI
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    'font-mono border-0 bg-slate-100',
                    isPositiveROI ? 'text-emerald-600' : 'text-rose-600'
                  )}
                >
                  {roi}
                </Badge>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-full"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-white border-slate-200 text-slate-900">
                  <AlertDialogHeader>
                    <AlertDialogTitle>{tCards('actions.deleteTitle')}</AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-500">
                      {tCards('actions.deleteConfirm', {
                        card: `${initialData.year} ${initialData.brand} ${initialData.playerName}`,
                      })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-transparent border-slate-200 hover:bg-slate-50 text-slate-600">
                      {t('cancel')}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-rose-600 hover:bg-rose-700 text-white border-0 shadow-sm"
                    >
                      {isDeleting ? <Loader2 className="animate-spin w-4 h-4" /> : t('delete')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                onClick={handleSubmit}
                disabled={loading || !hasUnsavedChanges}
                className={cn(
                  'rounded-full px-6 font-medium transition-all duration-300 shadow-sm',
                  hasUnsavedChanges
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-200'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                )}
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
        </header>

        {/* === BENTO GRID === */}
        <FormProvider {...form}>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-12"
          >
            {/* 1. HERO SLAB (Top Left) - 4 cols */}
            <div className="md:col-span-4 lg:col-span-3 row-span-2">
              <GlassPanel
                className="h-full flex flex-col p-4 relative group"
                variant="slab"
                hoverEffect
              >
                <div className="absolute top-4 right-4 z-20">
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/50 backdrop-blur-md">
                    {form.watch('grade')
                      ? `${form.watch('gradingCompany')} ${form.watch('grade')}`
                      : 'RAW'}
                  </Badge>
                </div>
                <div className="flex-1 flex items-center justify-center p-2">
                  <div className="relative w-full aspect-[3/4] transition-transform duration-500 group-hover:scale-105 group-hover:rotate-1">
                    <CardImageUpload
                      frontImage={form.watch('frontImage') || form.watch('mainImage') || ''}
                      backImage={form.watch('backImage') || ''}
                      onFrontImageChange={img =>
                        form.setValue('frontImage', img, { shouldDirty: true })
                      }
                      onBackImageChange={img =>
                        form.setValue('backImage', img, { shouldDirty: true })
                      }
                    />
                    {/* Gloss Reflection */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-lg" />
                  </div>
                </div>

                {/* AI Tools Bar */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <TooltipButton
                    onClick={handleSmartScan}
                    loading={aiScanning}
                    icon={<Sparkles className="w-4 h-4 text-cyan-400" />}
                    label={tCards('actions.smartScan')}
                  />

                  <TooltipButton
                    onClick={handleAuthenticityCheck}
                    loading={checkingAuthenticity}
                    icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
                    label={tCards('actions.checkAuthenticity')}
                  />
                  <TooltipButton
                    onClick={handleEstimatePrice}
                    loading={estimating}
                    icon={<BarChart3 className="w-4 h-4 text-violet-400" />}
                    label={tCards('actions.estimatePrice')}
                  />
                </div>
                {/* AI Alerts Overlay */}
                <div className="absolute bottom-20 left-4 right-4 space-y-2 pointer-events-none">
                  {riskWarning && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-500/90 text-white text-xs p-2 rounded backdrop-blur-md shadow-lg border border-red-400"
                    >
                      {riskWarning}
                    </motion.div>
                  )}
                  {imageQualityFeedback && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-amber-500/90 text-white text-xs p-2 rounded backdrop-blur-md shadow-lg border border-amber-400"
                    >
                      {imageQualityFeedback}
                    </motion.div>
                  )}
                  {authCheckResult === 'SAFE' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-emerald-500/90 text-white text-xs p-2 rounded backdrop-blur-md shadow-lg border border-emerald-400 flex items-center gap-2"
                    >
                      <ShieldCheck className="w-3 h-3" />
                      {t('ai.noRisksDetected')}
                    </motion.div>
                  )}
                </div>
              </GlassPanel>
            </div>

            {/* 2. IDENTITY (Top Mid) - 5 cols */}
            <div className="md:col-span-8 lg:col-span-5">
              <GlassPanel className="p-6 h-full border-t-4 border-t-cyan-500">
                <div className="flex items-center gap-2 mb-6 text-cyan-500">
                  <Sparkles className="w-5 h-5" />
                  <h3 className="font-bold tracking-wider text-sm uppercase">
                    {t('sections.identity')}
                  </h3>
                </div>
                <div className="space-y-6">
                  <PlayerInfoFields />
                  <div className="h-px bg-slate-200 my-4" />
                  <CardDetailsFields />
                </div>
              </GlassPanel>
            </div>

            {/* 3. MARKET INTEL (Top Right) - 4 cols */}
            <div className="md:col-span-12 lg:col-span-4 row-span-2">
              <GlassPanel className="h-full flex flex-col">
                <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-violet-600">
                    <TrendingUp className="w-5 h-5" />
                    <h3 className="font-bold tracking-wider text-sm uppercase">
                      {t('sections.market')}
                    </h3>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleAnalysis}
                    disabled={analyzing}
                    className="h-8 w-8 p-0 rounded-full hover:bg-slate-200 text-slate-500"
                  >
                    {analyzing ? (
                      <Loader2 className="animate-spin w-4 h-4" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <div className="flex-1 p-0 overflow-hidden relative">
                  <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
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
              </GlassPanel>
            </div>

            {/* 4. VALUATION (Mid Mid) - 5 cols */}
            <div className="md:col-span-8 lg:col-span-5">
              <GlassPanel className="p-6 border-t-4 border-t-emerald-500">
                <div className="flex items-center gap-2 mb-6 text-emerald-400">
                  <BarChart3 className="w-5 h-5" />
                  <h3 className="font-bold tracking-wider text-sm uppercase">
                    {t('sections.valuation')}
                  </h3>
                </div>
                <ValueFields />
              </GlassPanel>
            </div>

            {/* 5. DETAILS (Bottom) - 8 cols */}
            <div className="md:col-span-12 lg:col-span-8">
              <GlassPanel className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-bold tracking-wider text-sm uppercase text-slate-500 mb-4">
                      {t('sections.grading')}
                    </h3>
                    <GradingFields />
                  </div>
                  <div>
                    <h3 className="font-bold tracking-wider text-sm uppercase text-slate-500 mb-4">
                      {t('sections.physical')}
                    </h3>
                    <AdvancedDetailsFields />
                  </div>
                </div>
              </GlassPanel>
            </div>
          </motion.div>
        </FormProvider>
      </div>
    </div>
  );
}

function TooltipButton({
  onClick,
  loading,
  icon,
  label,
}: {
  onClick: () => void;
  loading: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      disabled={loading}
      className={cn(
        'h-12 flex flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white/50 hover:bg-white hover:border-slate-300 transition-all shadow-sm',
        loading && 'opacity-50 cursor-not-allowed'
      )}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : icon}
      <span className="text-[10px] uppercase font-bold text-slate-500">{label}</span>
    </Button>
  );
}
