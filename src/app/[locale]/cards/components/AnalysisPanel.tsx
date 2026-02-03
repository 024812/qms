'use client';

/**
 * Analysis Panel Component
 *
 * Container component for card analysis tabs.
 * Delegates to MarketAnalysisTab and GradingAnalysisTab for specific functionality.
 *
 * Refactored from 522-line monolith to ~80-line composition.
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, BarChart3, Gauge } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { QuickAnalysisResult } from '@/modules/cards/services/ai-card-service';
import { MarketAnalysisTab, GradingAnalysisTab, type CardDetailsForAnalysis } from './analysis';

export interface AnalysisPanelProps {
  data: QuickAnalysisResult | null;
  loading: boolean;
  cardDetails?: CardDetailsForAnalysis;
}

export function AnalysisPanel({ data, loading, cardDetails }: AnalysisPanelProps) {
  const t = useTranslations('cards.analysis');
  const [activeTab, setActiveTab] = useState('market');

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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
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
        </div>

        <TabsContent value="market" className="flex-1 data-[state=inactive]:hidden flex flex-col">
          <MarketAnalysisTab data={data} loading={loading} cardDetails={cardDetails} />
        </TabsContent>

        <TabsContent value="grading" className="flex-1 data-[state=inactive]:hidden">
          <GradingAnalysisTab cardDetails={cardDetails} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
