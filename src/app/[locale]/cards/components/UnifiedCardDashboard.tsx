'use client';

/**
 * Unified Card Dashboard
 *
 * Replaces separate View/Edit pages.
 * Provides a consolidated view for managing a card:
 * - Left: Images & AI Action Buttons (3 cols)
 * - Center: Editable Data Fields (4 cols)
 * - Right: AI Results Display (3 cols)
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider } from 'react-hook-form';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import {
  Loader2,
  Sparkles,
  ShieldCheck,
  BarChart3,
  Save,
  Trash2,
  ChevronLeft,
  AlertTriangle,
  Search,
  Gauge,
  Activity,
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

import { CardImageUpload } from '@/components/cards/CardImageUpload';
import { GlassPanel } from '@/components/ui/glass-panel';
import { calculateROI } from '@/modules/cards/utils';
import { SectionValueCost } from './form-parts/SectionValueCost';
import { SectionPlayerTeam } from './form-parts/SectionPlayerTeam';
import { SectionGradingCert } from './form-parts/SectionGradingCert';
import { SectionFeatures } from './form-parts/SectionFeatures';
import { SectionNotes } from './form-parts/SectionNotes';
import { MarketAnalysisTab, GradingAnalysisTab } from './analysis';

import { useCardForm } from './hooks/useCardForm';
import {
  analyzeCardQuickAction,
  analyzeCardGradingAction,
  analyzePlayerStatsAction,
} from '@/app/actions/ai-card-actions';
import { deleteCard } from '@/app/actions/card-actions';
import type { FormValues } from './form-schema';
import type {
  QuickAnalysisResult,
  GradingAnalysisResult,
  PlayerStatsAnalysisResult,
} from '@/modules/cards/services/ai-card-service';
import { Link } from '@/i18n/routing';

interface UnifiedCardDashboardProps {
  initialData: Partial<FormValues> & { id: string };
}

// Types for AI results displayed in the right panel
type ResultType = 'authenticity' | 'market' | 'grading' | 'player_stats' | 'empty';

interface AIResultDisplay {
  type: ResultType;
  title: string;
  loading: boolean;
  marketData?: QuickAnalysisResult | null;
  gradingData?: GradingAnalysisResult | null;
  playerStatsData?: PlayerStatsAnalysisResult | null;
  authResult?: 'SAFE' | 'WARNING' | null;
  riskWarning?: string;
  imageQualityFeedback?: string;
}

export function UnifiedCardDashboard({ initialData }: UnifiedCardDashboardProps) {
  const t = useTranslations('cards.form');
  const tCards = useTranslations('cards');
  const locale = useLocale();
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
      // Success handled by useCardForm (toast + refresh)
    },
  });

  // Right Panel State - unified result display
  const [currentResult, setCurrentResult] = useState<AIResultDisplay>({
    type: 'empty',
    title: '',
    loading: false,
  });

  // Market Analysis State
  const [marketAnalyzing, setMarketAnalyzing] = useState(false);
  const [marketData, setMarketData] = useState<QuickAnalysisResult | null>(null);
  const [customQuery, setCustomQuery] = useState('');
  const [excludedIds, setExcludedIds] = useState<string[]>([]);

  // Grading Analysis State
  const [gradingAnalyzing, setGradingAnalyzing] = useState(false);
  const [gradingData, setGradingData] = useState<GradingAnalysisResult | null>(null);

  // Player Stats Analysis State
  const [playerStatsAnalyzing, setPlayerStatsAnalyzing] = useState(false);
  const [playerStatsData, setPlayerStatsData] = useState<PlayerStatsAnalysisResult | null>(null);

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get card details for analysis
  const getCardDetails = useCallback(
    () => ({
      playerName: form.watch('playerName'),
      year: form.watch('year'),
      brand: form.watch('brand'),
      cardNumber: form.watch('cardNumber') || undefined,
      series: form.watch('series') || undefined,
      parallel: form.watch('parallel') || undefined,
      gradingCompany: form.watch('gradingCompany') || undefined,
      grade: form.watch('grade') ? Number(form.watch('grade')) : undefined,
    }),
    [form]
  );

  // Market Analysis Handler (eBay Search)
  const handleMarketAnalysis = async (params?: {
    newQuery?: string;
    newExcludedIds?: string[];
    forceRefresh?: boolean;
  }) => {
    const values = form.getValues();
    if (!values.playerName || !values.year || !values.brand) {
      toast.error(t('errors.insufficientDataForEstimate'));
      return;
    }

    // Use provided params or fallback to current state
    const activeQuery = params?.newQuery !== undefined ? params.newQuery : customQuery;
    const activeExcluded =
      params?.newExcludedIds !== undefined ? params.newExcludedIds : excludedIds;
    const isForce = params?.forceRefresh || false;

    // Update state if params provided
    if (params?.newQuery !== undefined) setCustomQuery(params.newQuery);
    if (params?.newExcludedIds !== undefined) setExcludedIds(params.newExcludedIds);

    setMarketAnalyzing(true);
    // Only switch tab if not already there (optional, but good UX)
    if (currentResult.type !== 'market') {
      setCurrentResult({ type: 'market', title: tCards('analysis.tabs.market'), loading: true });
    }

    try {
      const result = await analyzeCardQuickAction(
        {
          playerName: values.playerName,
          year: values.year,
          brand: values.brand,
          series: values.series || undefined,
          cardNumber: values.cardNumber || undefined,
          parallel: values.parallel || undefined,
          isAutographed: values.isAutographed,
          gradingCompany: values.gradingCompany || undefined,
          grade: values.grade || null,
          customQuery: activeQuery,
          excludedListingIds: activeExcluded,
          forceRefresh: isForce,
        },
        locale
      );
      setMarketData(result);
      setCurrentResult({
        type: 'market',
        title: tCards('analysis.tabs.market'),
        loading: false,
        marketData: result,
      });
    } catch (error) {
      console.error(error);
      toast.error(tCards('errors.analysisFailed'));
      setCurrentResult(prev => ({ ...prev, loading: false }));
    } finally {
      setMarketAnalyzing(false);
    }
  };

  // Grading Analysis Handler
  const handleGradingAnalysis = async () => {
    const cardDetails = getCardDetails();
    if (!cardDetails.playerName || !cardDetails.year || !cardDetails.brand) {
      toast.error(t('errors.insufficientDataForEstimate'));
      return;
    }

    setGradingAnalyzing(true);
    setCurrentResult({ type: 'grading', title: tCards('analysis.tabs.grading'), loading: true });

    try {
      const result = await analyzeCardGradingAction({
        playerName: cardDetails.playerName,
        year: cardDetails.year,
        brand: cardDetails.brand,
        cardNumber: cardDetails.cardNumber,
      });
      setGradingData(result);
      setCurrentResult({
        type: 'grading',
        title: tCards('analysis.tabs.grading'),
        loading: false,
        gradingData: result,
      });
    } catch (error) {
      console.error(error);
      toast.error(tCards('errors.analysisFailed'));
      setCurrentResult({ type: 'empty', title: '', loading: false });
    } finally {
      setGradingAnalyzing(false);
    }
  };

  // Player Stats Analysis Handler
  const handlePlayerStatsAnalysis = async () => {
    const cardDetails = getCardDetails();
    if (!cardDetails.playerName) {
      toast.error(t('errors.insufficientDataForEstimate'));
      return;
    }

    setPlayerStatsAnalyzing(true);
    setCurrentResult({ type: 'player_stats', title: 'Player Bio/Stats', loading: true });

    try {
      const result = await analyzePlayerStatsAction(cardDetails.playerName);
      setPlayerStatsData(result);
      setCurrentResult({
        type: 'player_stats',
        title: tCards('analysis.tabs.playerStats'),
        loading: false,
        playerStatsData: result,
      });
    } catch (error) {
      console.error(error);
      toast.error(tCards('errors.analysisFailed'));
      setCurrentResult({ type: 'empty', title: '', loading: false });
    } finally {
      setPlayerStatsAnalyzing(false);
    }
  };

  // Wrap authenticity check to update right panel
  const handleAuthCheck = async () => {
    setCurrentResult({
      type: 'authenticity',
      title: tCards('actions.checkAuthenticity'),
      loading: true,
    });
    await handleAuthenticityCheck();
    // Clear loading state after check completes
    setCurrentResult(prev => ({ ...prev, loading: false }));
  };

  // Update right panel when auth check completes
  const showAuthResults = authCheckResult || riskWarning || imageQualityFeedback;

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

  // Computed Values for Header
  const purchasePrice = form.watch('purchasePrice');
  const maxPrice = form.watch('currentValue') || 0;
  const roi = calculateROI(purchasePrice || undefined, maxPrice || undefined);
  const isPositiveROI = roi.startsWith('+');

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
                  {t('currentValue')}
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

        {/* === MAIN GRID: 3:4:3 ratio === */}
        <FormProvider {...form}>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-10 gap-6 pb-12 items-stretch"
          >
            {/* 1. IMAGE & BUTTONS PANEL (3 cols) */}
            <div className="lg:col-span-3 flex flex-col">
              <GlassPanel className="p-4 flex flex-col flex-1" variant="slab">
                {/* Grade Badge */}
                <div className="flex justify-end mb-2">
                  <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/50">
                    {form.watch('grade')
                      ? `${form.watch('gradingCompany')} ${form.watch('grade')}`
                      : 'RAW'}
                  </Badge>
                </div>

                {/* Image Area */}
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-100">
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
                </div>

                {/* AI Action Buttons - flexible grid for 5+ buttons */}
                <div className="mt-6 grid grid-cols-3 gap-2">
                  <TooltipButton
                    onClick={handleSmartScan}
                    loading={aiScanning}
                    icon={<Sparkles className="w-4 h-4 text-cyan-500" />}
                    label={tCards('actions.smartScan')}
                  />
                  <TooltipButton
                    onClick={handleAuthCheck}
                    loading={checkingAuthenticity}
                    icon={<ShieldCheck className="w-4 h-4 text-emerald-500" />}
                    label={tCards('actions.checkAuthenticity')}
                  />
                  <TooltipButton
                    onClick={handleEstimatePrice}
                    loading={estimating}
                    icon={<BarChart3 className="w-4 h-4 text-violet-500" />}
                    label={tCards('actions.estimatePrice')}
                  />
                  <TooltipButton
                    onClick={() => handleMarketAnalysis()}
                    loading={marketAnalyzing}
                    icon={<Search className="w-4 h-4 text-blue-500" />}
                    label="eBay"
                  />
                  <TooltipButton
                    onClick={handleGradingAnalysis}
                    loading={gradingAnalyzing}
                    icon={<Gauge className="w-4 h-4 text-indigo-500" />}
                    label={tCards('analysis.tabs.grading')}
                  />
                  <TooltipButton
                    onClick={handlePlayerStatsAnalysis}
                    loading={playerStatsAnalyzing}
                    icon={<Activity className="w-4 h-4 text-amber-500" />}
                    label={tCards('analysis.tabs.playerStats')}
                  />
                </div>
              </GlassPanel>
            </div>

            {/* 2. FORM FIELDS PANEL (4 cols) */}
            <div className="lg:col-span-3 space-y-6 flex flex-col">
              {/* Value & Cost Section - Top Priority */}
              <GlassPanel className="p-6 border-t-4 border-t-emerald-500">
                <SectionValueCost />
              </GlassPanel>

              {/* Player & Team Section */}
              <GlassPanel className="p-6 border-t-4 border-t-cyan-500">
                <SectionPlayerTeam />
              </GlassPanel>

              {/* Features & Notes Section */}
              <GlassPanel className="p-6">
                <div className="space-y-6">
                  <SectionFeatures />
                  <div className="h-px bg-slate-200" />
                  <SectionNotes />
                </div>
              </GlassPanel>

              {/* Grading & Certification Section */}
              <GlassPanel className="p-6 border-t-4 border-t-indigo-500">
                <SectionGradingCert />
              </GlassPanel>
            </div>

            {/* 3. AI RESULTS PANEL (4 cols) */}
            <div className="lg:col-span-4 flex flex-col">
              <GlassPanel className="flex-1 flex flex-col">
                <ScrollArea className="flex-1">
                  <div className="p-4">
                    {/* Loading State */}
                    {(currentResult.loading ||
                      marketAnalyzing ||
                      gradingAnalyzing ||
                      playerStatsAnalyzing ||
                      checkingAuthenticity) && (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                        <Loader2 className="w-8 h-8 animate-spin mb-3 text-violet-500" />
                        <p className="text-sm">{tCards('analysis.analyzing')}</p>
                      </div>
                    )}

                    {/* Auth Check Results - ONLY show if explicitly in authenticity tab */}
                    {!currentResult.loading &&
                      !checkingAuthenticity &&
                      currentResult.type === 'authenticity' &&
                      showAuthResults && (
                        <div className="space-y-3 mb-4">
                          {authCheckResult === 'SAFE' && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-emerald-50 text-emerald-700 border border-emerald-200 p-3 rounded-lg flex items-start gap-2"
                            >
                              <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span className="text-xs leading-relaxed">
                                {t('ai.noRisksDetected')}
                              </span>
                            </motion.div>
                          )}
                          {riskWarning && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-lg flex items-start gap-2"
                            >
                              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span className="text-xs leading-relaxed whitespace-pre-wrap">
                                {riskWarning}
                              </span>
                            </motion.div>
                          )}
                          {imageQualityFeedback && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-amber-50 text-amber-700 border border-amber-200 p-3 rounded-lg flex items-start gap-2"
                            >
                              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span className="text-xs leading-relaxed">
                                {imageQualityFeedback}
                              </span>
                            </motion.div>
                          )}
                        </div>
                      )}

                    {/* Market Analysis Results */}
                    {!marketAnalyzing && marketData && currentResult.type === 'market' && (
                      <MarketAnalysisTab
                        data={marketData}
                        loading={false}
                        cardDetails={getCardDetails()}
                        customQuery={customQuery}
                        excludedIds={excludedIds}
                        onUpdateAnalysis={handleMarketAnalysis}
                      />
                    )}

                    {/* Grading Analysis Results */}
                    {!gradingAnalyzing && gradingData && currentResult.type === 'grading' && (
                      <GradingAnalysisTab cardDetails={getCardDetails()} data={gradingData} />
                    )}

                    {/* Player Stats Results */}
                    {!playerStatsAnalyzing &&
                      playerStatsData &&
                      currentResult.type === 'player_stats' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                          {/* AI Analysis Summary */}
                          <div className="bg-amber-50/50 p-4 rounded-lg border border-amber-100">
                            <h4 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                              <Sparkles className="w-4 h-4" />{' '}
                              {tCards('analysis.playerStats.title')}
                            </h4>
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                              {playerStatsData.aiAnalysis}
                            </p>
                          </div>

                          {/* Season Averages */}
                          {playerStatsData.stats && (
                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm text-center">
                                <div className="text-xs text-slate-500 uppercase tracking-wider">
                                  PTS
                                </div>
                                <div className="text-lg font-bold text-slate-900">
                                  {playerStatsData.stats.ppg.toFixed(1)}
                                </div>
                              </div>
                              <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm text-center">
                                <div className="text-xs text-slate-500 uppercase tracking-wider">
                                  REB
                                </div>
                                <div className="text-lg font-bold text-slate-900">
                                  {playerStatsData.stats.rpg.toFixed(1)}
                                </div>
                              </div>
                              <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm text-center">
                                <div className="text-xs text-slate-500 uppercase tracking-wider">
                                  AST
                                </div>
                                <div className="text-lg font-bold text-slate-900">
                                  {playerStatsData.stats.apg.toFixed(1)}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Recent Games */}
                          {playerStatsData.game_log?.length ? (
                            <div className="bg-white rounded-lg border border-slate-100 overflow-hidden">
                              <div className="bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 border-b border-slate-100">
                                {tCards('analysis.playerStats.last5Games')}
                              </div>
                              <div className="divide-y divide-slate-50">
                                {playerStatsData.game_log.map(game => (
                                  <div
                                    key={`${game.date}-${game.opponent}`}
                                    className="flex items-center justify-between p-3 text-sm hover:bg-slate-50 transition-colors"
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-medium text-slate-900">
                                        {tCards('analysis.playerStats.vs')} {game.opponent}
                                      </span>
                                      <span className="text-xs text-slate-400">
                                        {new Date(game.date).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <div className="flex gap-4 font-mono text-xs">
                                      <div className="flex flex-col items-center w-8">
                                        <span className="text-slate-400 mb-0.5">PTS</span>
                                        <span
                                          className={cn(
                                            'font-bold',
                                            game.points >= 30
                                              ? 'text-emerald-600'
                                              : 'text-slate-700'
                                          )}
                                        >
                                          {game.points}
                                        </span>
                                      </div>
                                      <div className="flex flex-col items-center w-8">
                                        <span className="text-slate-400 mb-0.5">REB</span>
                                        <span className="text-slate-700 font-bold">
                                          {game.rebounds}
                                        </span>
                                      </div>
                                      <div className="flex flex-col items-center w-8">
                                        <span className="text-slate-400 mb-0.5">AST</span>
                                        <span className="text-slate-700 font-bold">
                                          {game.assists}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4 text-slate-400 text-sm">
                              {tCards('analysis.playerStats.noData')}
                            </div>
                          )}

                          <div className="text-xs text-right text-slate-400 mt-2">
                            {tCards('analysis.playerStats.source', {
                              source: playerStatsData.meta.source,
                            })}
                          </div>
                        </div>
                      )}

                    {/* Empty State */}
                    {!currentResult.loading &&
                      !marketAnalyzing &&
                      !gradingAnalyzing &&
                      !playerStatsAnalyzing &&
                      !checkingAuthenticity &&
                      !showAuthResults &&
                      currentResult.type === 'empty' && (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                          <Sparkles className="w-10 h-10 mb-3 opacity-30" />
                          <p className="text-sm text-center">{tCards('analysis.noSummary')}</p>
                          <p className="text-xs text-center mt-2 text-slate-400">
                            点击左侧按钮开始分析
                          </p>
                        </div>
                      )}
                  </div>
                </ScrollArea>
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
        'h-16 flex flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm',
        loading && 'opacity-50 cursor-not-allowed'
      )}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : icon}
      <span className="text-[10px] uppercase font-bold text-slate-500 truncate max-w-full">
        {label}
      </span>
    </Button>
  );
}
