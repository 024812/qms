import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  TrendingUp,
  TrendingDown,
  HelpCircle,
  ExternalLink,
  Loader2,
  Gauge,
  BarChart3,
  Layers,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import type {
  QuickAnalysisResult,
  GradingAnalysisResult,
} from '@/modules/cards/services/ai-card-service';
import { analyzeCardGradingAction } from '@/app/actions/ai-card-actions';
import Image from 'next/image';

interface AnalysisPanelProps {
  data: QuickAnalysisResult | null;
  loading: boolean;
  // We can pass card details here if needed to restart grading analysis,
  // but better to pass the grading result if parent handles it, OR let this panel fetch it.
  // For simplicity, let's let this panel fetch grading data when tab is active.
  cardDetails?: {
    playerName?: string;
    year?: number;
    brand?: string;
    cardNumber?: string;
    series?: string;
  };
}

export function AnalysisPanel({ data, loading, cardDetails }: AnalysisPanelProps) {
  const t = useTranslations('cards.analysis');
  const [gradingData, setGradingData] = useState<GradingAnalysisResult | null>(null);
  const [loadingGrading, setLoadingGrading] = useState(false);

  // Fetch Grading Data when switching to that tab
  const handleTabChange = async (value: string) => {
    if (value === 'grading' && !gradingData && !loadingGrading && cardDetails) {
      setLoadingGrading(true);
      try {
        const result = await analyzeCardGradingAction({
          playerName: cardDetails.playerName,
          year: cardDetails.year,
          brand: cardDetails.brand,
          cardNumber: cardDetails.cardNumber,
        });
        setGradingData(result);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingGrading(false);
      }
    }
  };

  const trendColor = useMemo(() => {
    if (!data) return 'text-gray-500';
    return data.valuation.trend30d >= 0 ? 'text-green-600' : 'text-red-600';
  }, [data]);

  const TrendIcon = useMemo(() => {
    if (!data) return HelpCircle;
    return data.valuation.trend30d >= 0 ? TrendingUp : TrendingDown;
  }, [data]);

  if (loading) {
    return (
      <Card className="h-full border-l-4 border-l-blue-500 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            {t('analyzing')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-24 w-full bg-gray-100 animate-pulse rounded-lg" />
          <div className="h-40 w-full bg-gray-100 animate-pulse rounded-lg" />
          <div className="h-60 w-full bg-gray-100 animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="market" className="h-full flex flex-col" onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="market" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            {t('tabs.market')}
          </TabsTrigger>
          <TabsTrigger value="grading" className="gap-2">
            <Gauge className="w-4 h-4" />
            {t('tabs.grading')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="market" className="flex-1 space-y-4 data-[state=inactive]:hidden">
          {/* 1. Valuation Hero */}
          <Card className="border-l-4 border-l-green-500 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">{t('estimatedValue')}</p>
                  <h2 className="text-3xl font-bold mt-1">
                    ${data.valuation.value.toLocaleString()}
                  </h2>
                </div>
                <div className={`flex flex-col items-end ${trendColor}`}>
                  <div className="flex items-center gap-1 font-bold bg-gray-50 px-2 py-1 rounded-md">
                    <TrendIcon className="h-4 w-4" />
                    <span>
                      {data.valuation.trend30d > 0 ? '+' : ''}
                      {data.valuation.trend30d}%
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">{t('trend30d')}</span>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Badge variant="secondary" className="text-xs">
                  {t('confidence')}: {t(`confidenceLevels.${data.valuation.confidence}`)}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {t('source')}: eBay
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* 2. AI Summary */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                ✨ {t('aiInsights')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-900 leading-relaxed border border-blue-100">
                {data.aiSummary || t('noSummary')}
              </div>
            </CardContent>
          </Card>

          {/* 3. Recent Sales */}
          <Card className="flex-1 shadow-sm flex flex-col min-h-[300px]">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base">{t('recentSales')}</CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1 h-[300px]">
              <div className="p-0">
                {data.recentSales.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    {t('noSalesFound')}
                  </div>
                ) : (
                  <div className="divide-y">
                    {data.recentSales.map((sale, i) => (
                      <div
                        key={`${sale.url}-${i}`}
                        className="p-3 hover:bg-gray-50 transition-colors flex gap-3 group"
                      >
                        <div className="h-12 w-12 relative flex-shrink-0 bg-gray-100 rounded overflow-hidden border">
                          {sale.image ? (
                            <Image
                              src={sale.image}
                              alt={sale.title}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-xs text-gray-400">
                              N/A
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-sm">${sale.price}</span>
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {new Date(sale.date).toLocaleDateString()}
                            </span>
                          </div>
                          <a
                            href={sale.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-gray-600 line-clamp-2 hover:text-blue-600 hover:underline mt-0.5"
                          >
                            {sale.title}
                            <ExternalLink className="inline-block ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="grading" className="flex-1 space-y-4 data-[state=inactive]:hidden">
          {/* Grading Lab Content */}
          {loadingGrading ? (
            <div className="flex flex-col items-center justify-center h-60 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-2 text-indigo-500" />
              <p>{t('grading.title')}...</p>
            </div>
          ) : !gradingData ? (
            <div className="text-center p-6 text-muted-foreground">Click tab to load data.</div>
          ) : (
            <>
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
                      <p className="text-sm text-gray-500 font-medium">
                        {t('grading.recommendation')}
                      </p>
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

                  <p className="text-xs text-gray-400 text-center pt-2">
                    {t('grading.disclaimer')}
                  </p>
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
                      <p className="text-sm text-gray-500 font-medium">
                        {t('grading.marketDepth')}
                      </p>
                      <p className="text-xl font-bold">
                        {gradingData.marketDepth.activeListings} {t('grading.activeListings')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
