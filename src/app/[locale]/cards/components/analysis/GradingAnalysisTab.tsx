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
}

export function GradingAnalysisTab({ cardDetails }: GradingAnalysisTabProps) {
  const t = useTranslations('cards.analysis');

  const [gradingData, setGradingData] = useState<GradingAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGradingAnalysis = useCallback(async () => {
    if (!cardDetails) return;

    setLoading(true);
    setError(null);
    try {
      const result = await analyzeCardGradingAction({
        playerName: cardDetails.playerName,
        year: cardDetails.year,
        brand: cardDetails.brand,
        cardNumber: cardDetails.cardNumber,
      });
      setGradingData(result);
    } catch (e) {
      console.error('Grading analysis failed:', e);
      setError('Failed to load grading analysis');
    } finally {
      setLoading(false);
    }
  }, [cardDetails]);

  // Auto-fetch on mount if cardDetails available
  // useEffect(() => {
  //   if (cardDetails && !gradingData && !loading) {
  //     fetchGradingAnalysis();
  //   }
  // }, [cardDetails, gradingData, loading, fetchGradingAnalysis]);

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

  if (!gradingData) {
    return (
      <div className="text-center p-6 text-muted-foreground">
        <p className="mb-4 text-sm">{t('grading.clickToLoad')}</p>
        <Button onClick={fetchGradingAnalysis} disabled={!cardDetails}>
          {t('grading.loadData')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. Recommendation Hero */}
      <Card
        className={`border-l-4 shadow-sm ${
          gradingData.recommendation === 'GRADE'
            ? 'border-l-green-500 bg-green-50/10'
            : gradingData.recommendation === 'HOLD'
              ? 'border-l-yellow-500'
              : 'border-l-gray-400'
        }`}
      >
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">{t('grading.recommendation')}</p>
              <h3 className="text-2xl font-bold mt-1 text-gray-900">
                {t(`grading.actions.${gradingData.recommendation}`)}
              </h3>
            </div>
            <Gauge
              className={`w-8 h-8 ${
                gradingData.recommendation === 'GRADE' ? 'text-green-500' : 'text-gray-400'
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
              <span className="font-bold">${gradingData.rawPrice}</span>
            </div>
            <Progress value={100} className="h-2 bg-gray-100" />
          </div>

          {/* PSA 9 */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-indigo-600">{t('grading.psa9')}</span>
              <div className="text-right">
                <span className="font-bold block">${gradingData.psa9Price}</span>
                <span
                  className={`text-xs ${gradingData.psa9Roi > 0 ? 'text-green-600' : 'text-red-500'}`}
                >
                  ROI: {gradingData.psa9Roi > 0 ? '+' : ''}
                  {gradingData.psa9Roi}%
                </span>
              </div>
            </div>
            <Progress
              value={Math.min(
                100,
                Math.max(0, (gradingData.psa9Price / (gradingData.psa10Price || 1)) * 100)
              )}
              className="h-2 [&>div]:bg-indigo-500"
            />
          </div>

          {/* PSA 10 */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-green-600">{t('grading.psa10')}</span>
              <div className="text-right">
                <span className="font-bold block">${gradingData.psa10Price}</span>
                <span
                  className={`text-xs ${gradingData.psa10Roi > 0 ? 'text-green-600' : 'text-red-500'}`}
                >
                  ROI: {gradingData.psa10Roi > 0 ? '+' : ''}
                  {gradingData.psa10Roi}%
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
                {gradingData.marketDepth.activeListings} {t('grading.activeListings')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
