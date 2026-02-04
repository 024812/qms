'use client';

/**
 * Grading Analysis Tab
 *
 * Displays grading ROI analysis, price comparisons, and recommendations.
 * Extracted from AnalysisPanel for better maintainability.
 */

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Gauge, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import type { GradingAnalysisResult } from '@/modules/cards/services/ai-card-service';
import { analyzeCardGradingAction } from '@/app/actions/ai-card-actions';
import type { CardDetailsForAnalysis } from './MarketAnalysisTab';

export interface GradingAnalysisTabProps {
  cardDetails?: CardDetailsForAnalysis;
  data?: GradingAnalysisResult | null;
}

export function GradingAnalysisTab({ cardDetails, data }: GradingAnalysisTabProps) {
  const t = useTranslations('cards.analysis');

  // If data is provided via props (controlled mode), use it. otherwise local state.
  const [internalData, setInternalData] = useState<GradingAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveData = data || internalData; // Use prop data if available

  const fetchGradingAnalysis = useCallback(async () => {
    if (!cardDetails) return;

    // If parent is handling data fetching (data prop is provided but null),
    // we shouldn't fetch here unless we are in fully uncontrolled mode,
    // but the dashboard pattern suggests we should let the parent handle it.
    // However, if this component is used standalone, it needs this.
    // For now, if 'data' prop is undefined, we act uncontrolled.
    // If 'data' is passed (even null), we assume parent controls it?
    // Actually, simpler: this fetch is for the "Retry" or "Load" button if local state is null.

    setLoading(true);
    setError(null);
    try {
      const result = await analyzeCardGradingAction({
        playerName: cardDetails.playerName,
        year: cardDetails.year,
        brand: cardDetails.brand,
        cardNumber: cardDetails.cardNumber,
      });
      setInternalData(result);
    } catch (e) {
      console.error('Grading analysis failed:', e);
      setError('Failed to load grading analysis');
    } finally {
      setLoading(false);
    }
  }, [cardDetails]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-60 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-2 text-indigo-500" />
        <p>{t('grading.title')}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6 text-red-500">
        <p className="mb-4">{error}</p>
        <Button onClick={fetchGradingAnalysis}>Retry</Button>
      </div>
    );
  }

  if (!effectiveData) {
    return (
      <div className="text-center p-6 text-muted-foreground">
        <p className="mb-4 text-sm">{t('grading.clickToLoad')}</p>
        <Button onClick={fetchGradingAnalysis} disabled={!cardDetails}>
          {t('grading.loadData')}
        </Button>
      </div>
    );
  }

  // Check for empty data (all zeros)
  const noDataAvailable =
    effectiveData.rawPrice === 0 && effectiveData.psa9Price === 0 && effectiveData.psa10Price === 0;

  if (noDataAvailable) {
    return (
      <div className="text-center p-6 text-muted-foreground space-y-3">
        <p className="text-sm">{t('grading.noGradingData')}</p>
        <Button variant="outline" size="sm" onClick={fetchGradingAnalysis}>
          {t('grading.retry')}
        </Button>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return price > 0 ? `$${price}` : t('grading.noPriceData');
  };

  return (
    <div className="space-y-4">
      {/* 1. Recommendation Hero */}
      <Card
        className={`border-l-4 shadow-sm ${
          effectiveData.recommendation === 'GRADE'
            ? 'border-l-green-500 bg-green-50/10'
            : effectiveData.recommendation === 'HOLD'
              ? 'border-l-yellow-500'
              : 'border-l-gray-400'
        }`}
      >
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">{t('grading.recommendation')}</p>
              <h3 className="text-2xl font-bold mt-1 text-gray-900">
                {t(`grading.actions.${effectiveData.recommendation}`)}
              </h3>
            </div>
            <Gauge
              className={`w-8 h-8 ${
                effectiveData.recommendation === 'GRADE' ? 'text-green-500' : 'text-gray-400'
              }`}
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. ROI Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('grading.roi')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Raw */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-gray-600">{t('grading.raw')}</span>
              <span className="font-bold">{formatPrice(effectiveData.rawPrice)}</span>
            </div>
            <Progress value={100} className="h-2 bg-gray-100" />
          </div>

          {/* PSA 9 */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-indigo-600">{t('grading.psa9')}</span>
              <div className="text-right">
                <span className="font-bold block">{formatPrice(effectiveData.psa9Price)}</span>
                <span
                  className={`text-xs ${effectiveData.psa9Roi > 0 ? 'text-green-600' : 'text-red-500'}`}
                >
                  ROI: {effectiveData.psa9Roi > 0 ? '+' : ''}
                  {effectiveData.psa9Roi}%
                </span>
              </div>
            </div>
            <Progress
              value={Math.min(
                100,
                Math.max(0, (effectiveData.psa9Price / (effectiveData.psa10Price || 1)) * 100)
              )}
              className="h-2 [&>div]:bg-indigo-500"
            />
          </div>

          {/* PSA 10 */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-green-600">{t('grading.psa10')}</span>
              <div className="text-right">
                <span className="font-bold block">{formatPrice(effectiveData.psa10Price)}</span>
                <span
                  className={`text-xs ${effectiveData.psa10Roi > 0 ? 'text-green-600' : 'text-red-500'}`}
                >
                  ROI: {effectiveData.psa10Roi > 0 ? '+' : ''}
                  {effectiveData.psa10Roi}%
                </span>
              </div>
            </div>
            <Progress value={100} className="h-2 [&>div]:bg-green-500" />
          </div>

          <p className="text-xs text-gray-400 text-center pt-2">{t('grading.disclaimer')}</p>
        </CardContent>
      </Card>

      {/* 3. Market Depth */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-full">
              <Layers className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{t('grading.marketDepth')}</p>
              <p className="text-xl font-bold">
                {effectiveData.marketDepth.activeListings} {t('grading.activeListings')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
