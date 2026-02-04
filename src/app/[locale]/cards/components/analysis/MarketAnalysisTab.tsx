'use client';

/**
 * Market Analysis Tab
 *
 * Displays market valuation, AI insights, and recent sales with interactive filtering.
 * Extracted from AnalysisPanel for better maintainability.
 */

import { useMemo, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  TrendingUp,
  TrendingDown,
  HelpCircle,
  ExternalLink,
  Loader2,
  Search,
  Filter,
  EyeOff,
  Code,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { QuickAnalysisResult } from '@/modules/cards/services/ai-card-service';
import { analyzeCardQuickAction } from '@/app/actions/ai-card-actions';
import Image from 'next/image';

export interface CardDetailsForAnalysis {
  playerName?: string;
  year?: number;
  brand?: string;
  cardNumber?: string;
  series?: string;
  parallel?: string;
  grade?: number;
  gradingCompany?: string;
}

export interface MarketAnalysisTabProps {
  data: QuickAnalysisResult | null;
  loading: boolean;
  cardDetails?: CardDetailsForAnalysis;
}

export function MarketAnalysisTab({ data, loading, cardDetails }: MarketAnalysisTabProps) {
  const t = useTranslations('cards.analysis');

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

  const refreshAnalysis = async (
    newQuery?: string,
    newExcludedIds?: string[],
    forceRefresh: boolean = false
  ) => {
    if (!cardDetails) return;

    setIsRefreshing(true);
    try {
      const result = await analyzeCardQuickAction({
        ...cardDetails,
        customQuery: newQuery !== undefined ? newQuery : customQuery,
        excludedListingIds: newExcludedIds !== undefined ? newExcludedIds : excludedIds,
        forceRefresh,
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

  const handleForceRefresh = () => {
    refreshAnalysis(customQuery, excludedIds, true);
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

  const trendColor = useMemo(() => {
    if (!activeData) return 'text-gray-500';
    return activeData.valuation.trend30d >= 0 ? 'text-green-600' : 'text-red-600';
  }, [activeData]);

  const TrendIcon = useMemo(() => {
    if (!activeData) return HelpCircle;
    return activeData.valuation.trend30d >= 0 ? TrendingUp : TrendingDown;
  }, [activeData]);

  const hasActiveFilters = excludedIds.length > 0 || customQuery;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 w-full bg-gray-100 animate-pulse rounded-lg" />
        <div className="h-40 w-full bg-gray-100 animate-pulse rounded-lg" />
        <div className="h-60 w-full bg-gray-100 animate-pulse rounded-lg" />
      </div>
    );
  }

  if (!activeData) {
    return null;
  }

  return (
    <div className="space-y-4 flex flex-col flex-1">
      {/* Refresh Indicator */}
      {isRefreshing && (
        <div className="flex items-center text-xs text-blue-600 justify-end">
          <Loader2 className="w-3 h-3 animate-spin mr-1" />
          Updating...
        </div>
      )}

      {/* 1. Valuation Hero */}
      <Card
        className={`border-l-4 ${activeData.valuation.trend30d >= 0 ? 'border-l-green-500' : 'border-l-red-500'} shadow-sm`}
      >
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm text-muted-foreground font-medium">{t('estimatedValue')}</p>

                {/* Clear Filters Button if filters active */}
                {hasActiveFilters && (
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

            <div className="flex gap-1">
              {/* Force Refresh Button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                onClick={handleForceRefresh}
                disabled={isRefreshing}
                title="Force refresh data from eBay"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')} />
              </Button>

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
                            ? `${cardDetails.year} ${cardDetails.brand} ${cardDetails.playerName} ${cardDetails.series || ''} ${cardDetails.parallel || ''}`
                                .replace(/\s+/g, ' ')
                                .trim()
                            : 'Enter search terms'
                        }
                        onChange={e => setCustomQuery(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Defaults to: {cardDetails?.year} {cardDetails?.brand}{' '}
                        {cardDetails?.playerName} {cardDetails?.cardNumber} {cardDetails?.parallel}
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsSearchDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleApplySearch} disabled={isRefreshing}>
                      {isRefreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply Search'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Recent Sales */}
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
                {hasActiveFilters && (
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

      {/* 3. AI Summary */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 pt-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm flex items-center gap-2 text-indigo-700">
              ✨ {t('aiInsights')}
            </CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-indigo-300 hover:text-indigo-600"
                >
                  <Code className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>AI Interaction Debug</DialogTitle>
                  <DialogDescription>
                    Raw data sent to and received from the AI model.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Input Context (What AI Sees)</h4>
                    <div className="bg-slate-950 text-slate-50 p-4 rounded-md text-xs font-mono overflow-auto max-h-60">
                      <pre>
                        {JSON.stringify(
                          {
                            card: cardDetails,
                            salesContext: activeData.recentSales.slice(0, 10).map(s => ({
                              date: s.date,
                              price: s.price,
                              title: s.title,
                            })),
                          },
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-2">AI Output Result</h4>
                    <div className="bg-slate-950 text-slate-50 p-4 rounded-md text-xs font-mono overflow-auto max-h-60">
                      <pre>
                        {JSON.stringify(
                          {
                            valuation: activeData.valuation,
                            summary: activeData.aiSummary,
                          },
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="text-sm text-gray-700 leading-relaxed">
            {activeData.aiSummary || t('noSummary')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
