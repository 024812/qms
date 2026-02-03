import { useMemo, useState, useEffect } from 'react';
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
  Search,
  Filter,
  EyeOff,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type {
  QuickAnalysisResult,
  GradingAnalysisResult,
} from '@/modules/cards/services/ai-card-service';
import { analyzeCardGradingAction, analyzeCardQuickAction } from '@/app/actions/ai-card-actions';
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
    grade?: number;
    gradingCompany?: string;
  };
}

export function AnalysisPanel({ data, loading, cardDetails }: AnalysisPanelProps) {
  const t = useTranslations('cards.analysis');
  const [gradingData, setGradingData] = useState<GradingAnalysisResult | null>(null);
  const [loadingGrading, setLoadingGrading] = useState(false);

  // Interactive Analysis State
  const [localAnalysis, setLocalAnalysis] = useState<QuickAnalysisResult | null>(data);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [customQuery, setCustomQuery] = useState('');
  const [excludedIds, setExcludedIds] = useState<string[]>([]);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);

  // Sync prop data to local data when prop changes (e.g. first load)
  useEffect(() => {
    if (data) {
      setLocalAnalysis(data);
    }
  }, [data]);

  const activeData = localAnalysis;

  const refreshAnalysis = async (newQuery?: string, newExcludedIds?: string[]) => {
    if (!cardDetails) return;

    setIsRefreshing(true);
    try {
      const result = await analyzeCardQuickAction({
        ...cardDetails,
        customQuery: newQuery !== undefined ? newQuery : customQuery,
        excludedListingIds: newExcludedIds !== undefined ? newExcludedIds : excludedIds,
      });
      setLocalAnalysis(result);
    } catch (error) {
      console.error('Analysis refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleApplySearch = () => {
    refreshAnalysis(customQuery, excludedIds);
    setIsSearchDialogOpen(false);
  };

  const handleExcludeItem = (url: string) => {
    const newExcluded = [...excludedIds, url];
    setExcludedIds(newExcluded);
    refreshAnalysis(customQuery, newExcluded);
  };

  const handleClearFilters = () => {
    setExcludedIds([]);
    setCustomQuery('');
    refreshAnalysis('', []);
  };

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
    if (!activeData) return 'text-gray-500';
    return activeData.valuation.trend30d >= 0 ? 'text-green-600' : 'text-red-600';
  }, [activeData]);

  const TrendIcon = useMemo(() => {
    if (!activeData) return HelpCircle;
    return activeData.valuation.trend30d >= 0 ? TrendingUp : TrendingDown;
  }, [activeData]);

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

  if (!activeData) {
    return null;
  }

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="market" className="h-full flex flex-col" onValueChange={handleTabChange}>
        <div className="flex justify-between items-center mb-4">
          <TabsList className="grid w-auto grid-cols-2">
            <TabsTrigger value="market" className="gap-2 px-6">
              <BarChart3 className="w-4 h-4" />
              {t('tabs.market')}
            </TabsTrigger>
            <TabsTrigger value="grading" className="gap-2 px-6">
              <Gauge className="w-4 h-4" />
              {t('tabs.grading')}
            </TabsTrigger>
          </TabsList>

          {/* Refresh / Status Indicator */}
          {isRefreshing && (
            <div className="flex items-center text-xs text-blue-600">
              <Loader2 className="w-3 h-3 animate-spin mr-1" />
              Updating...
            </div>
          )}
        </div>

        <TabsContent
          value="market"
          className="flex-1 space-y-4 data-[state=inactive]:hidden flex flex-col"
        >
          {/* 1. Valuation Hero */}
          <Card
            className={`border-l-4 ${activeData.valuation.trend30d >= 0 ? 'border-l-green-500' : 'border-l-red-500'} shadow-sm`}
          >
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm text-muted-foreground font-medium">
                      {t('estimatedValue')}
                    </p>

                    {/* Clear Filters Button if filters active */}
                    {(excludedIds.length > 0 || customQuery) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-2 text-[10px] text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={handleClearFilters}
                      >
                        Reset ({excludedIds.length} excluded)
                      </Button>
                    )}
                  </div>

                  <h2 className="text-3xl font-bold mt-1">
                    ${activeData.valuation.value.toLocaleString()}
                  </h2>
                </div>
                <div className={`flex flex-col items-end ${trendColor}`}>
                  <div className="flex items-center gap-1 font-bold bg-gray-50 px-2 py-1 rounded-md">
                    <TrendIcon className="h-4 w-4" />
                    <span>
                      {activeData.valuation.trend30d > 0 ? '+' : ''}
                      {activeData.valuation.trend30d}%
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">{t('trend30d')}</span>
                </div>
              </div>

              <div className="mt-4 flex gap-2 justify-between items-center">
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {t('confidence')}: {t(`confidenceLevels.${activeData.valuation.confidence}`)}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {t('source')}: eBay
                  </Badge>
                </div>

                {/* Edit Search Dialog */}
                <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                      <Search className="w-3 h-3" />
                      Edit Search
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Search Query</DialogTitle>
                      <DialogDescription>
                        Modify the search query used to find recent sales data on eBay.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="query">Search Query</Label>
                        <Input
                          id="query"
                          value={customQuery}
                          placeholder={
                            cardDetails
                              ? `${cardDetails.year} ${cardDetails.brand} ${cardDetails.playerName}`
                              : 'Enter search terms'
                          }
                          onChange={e => setCustomQuery(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Defaults to: {cardDetails?.year} {cardDetails?.brand}{' '}
                          {cardDetails?.playerName} {cardDetails?.cardNumber}
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsSearchDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleApplySearch} disabled={isRefreshing}>
                        {isRefreshing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Apply Search'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* 2. AI Summary */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 pt-4">
              <CardTitle className="text-sm flex items-center gap-2 text-indigo-700">
                ✨ {t('aiInsights')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="text-sm text-gray-700 leading-relaxed">
                {activeData.aiSummary || t('noSummary')}
              </div>
            </CardContent>
          </Card>

          {/* 3. Recent Sales */}
          <Card className="flex-1 shadow-sm flex flex-col min-h-[300px] overflow-hidden">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between bg-gray-50/50">
              <CardTitle className="text-base">{t('recentSales')}</CardTitle>
              <Badge variant="secondary" className="text-xs font-normal text-muted-foreground">
                {activeData.recentSales.length} items
              </Badge>
            </CardHeader>
            <ScrollArea className="flex-1 h-[300px]">
              <div className="p-0">
                {activeData.recentSales.length === 0 ? (
                  <div className="p-8 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                    <Filter className="w-8 h-8 opacity-20" />
                    <p>{t('noSalesFound')}</p>
                    {(excludedIds.length > 0 || customQuery) && (
                      <Button variant="link" onClick={handleClearFilters} className="text-xs">
                        Reset filters to see more results
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y">
                    {activeData.recentSales.map(sale => (
                      <div
                        key={sale.url}
                        className={`p-3 hover:bg-gray-50 transition-colors flex gap-3 group relative ${isRefreshing ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        {/* Image */}
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

                        {/* Content */}
                        <div className="flex-1 min-w-0 pr-8">
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

                        {/* Actions (Hover) */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 p-1 rounded-md shadow-sm border">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-gray-500 hover:text-red-500 hover:bg-red-50"
                            title="Exclude this item (Outlier)"
                            onClick={() => handleExcludeItem(sale.url)}
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                          </Button>
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
            <div className="text-center p-6 text-muted-foreground">
              <Button onClick={() => handleTabChange('grading')}>Load Grading Data</Button>
            </div>
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
