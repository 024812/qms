'use client';

import { useSearchParams, useParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Package, Calendar, Ruler, Weight, Layers, MapPin, Tag, Hash, Archive } from 'lucide-react';
import { useQuilt } from '@/hooks/useQuilts';
import { useQuiltUsageRecords } from '@/hooks/useUsage';
import { UsageHistoryTable } from '@/components/usage/UsageHistoryTable';

export default function QuiltUsageDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const t = useTranslations();
  const locale = useLocale();
  const from = searchParams.get('from') || 'usage';

  // Get quiltId from URL params
  const quiltId = params.quiltId as string;

  // Fetch quilt data
  const { data: quiltData, isLoading: quiltLoading } = useQuilt(quiltId);
  const { data: usageData, isLoading: usageLoading } = useQuiltUsageRecords(quiltId);

  const quilt = quiltData;
  const usageRecords = usageData || [];

  const handleBack = () => {
    if (from === 'quilts') {
      router.push('/quilts');
    } else {
      router.push('/usage');
    }
  };

  if (quiltLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!quilt) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Package className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          {locale === 'zh' ? '被子不存在' : 'Quilt Not Found'}
        </h2>
        <p className="text-muted-foreground mb-4">
          {locale === 'zh' ? '找不到指定的被子' : 'The specified quilt could not be found'}
        </p>
        <Button onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.back')}
        </Button>
      </div>
    );
  }

  const getSeasonColor = (season: string) => {
    switch (season) {
      case 'WINTER':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SUMMER':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'SPRING_AUTUMN':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_USE':
        return 'bg-green-100 text-green-800';
      case 'STORAGE':
        return 'bg-gray-100 text-gray-800';
      case 'MAINTENANCE':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.back')}
        </Button>
        <h1 className="text-2xl font-semibold">{t('usage.details.title')}</h1>
      </div>

      {/* Quilt Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            {locale === 'zh' ? '被子信息' : 'Quilt Information'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">{quilt.name}</h3>
                <div className="flex gap-2">
                  <Badge variant="outline" className={getSeasonColor(quilt.season)}>
                    {t(`season.${quilt.season}`)}
                  </Badge>
                  <Badge className={getStatusColor(quilt.currentStatus)}>
                    {t(`status.${quilt.currentStatus}`)}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('quilts.table.itemNumber')}:</span>
                  <span className="font-medium">#{quilt.itemNumber}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Ruler className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('quilts.table.size')}:</span>
                  <span className="font-medium">
                    {quilt.lengthCm && quilt.widthCm
                      ? `${quilt.lengthCm}×${quilt.widthCm}cm`
                      : '-'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Weight className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('quilts.table.weight')}:</span>
                  <span className="font-medium">{quilt.weightGrams}g</span>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Layers className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t('quilts.table.fillMaterial')}:</span>
                <span className="font-medium">{quilt.fillMaterial}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <div
                  className="w-4 h-4 rounded-full border-2"
                  style={{ backgroundColor: quilt.color }}
                />
                <span className="text-muted-foreground">{t('quilts.table.color')}:</span>
                <span className="font-medium">{quilt.color}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t('quilts.table.location')}:</span>
                <span className="font-medium">{quilt.location}</span>
              </div>

              {(quilt.packagingInfo) && (
                <div className="flex items-center gap-2 text-sm">
                  <Archive className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('quilts.table.packagingInfo')}:</span>
                  <span className="font-medium">{quilt.packagingInfo || '-'}</span>
                </div>
              )}

              {quilt.brand && (
                <div className="flex items-center gap-2 text-sm">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('quilts.form.brand')}:</span>
                  <span className="font-medium">{quilt.brand}</span>
                </div>
              )}

              {quilt.purchaseDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('quilts.form.purchaseDate')}:</span>
                  <span className="font-medium">
                    {new Date(quilt.purchaseDate).toLocaleDateString(
                      locale === 'zh' ? 'zh-CN' : 'en-US'
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          {quilt.notes && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-1">{t('quilts.form.notes')}:</p>
              <p className="text-sm">{quilt.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {locale === 'zh' ? '使用历史' : 'Usage History'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UsageHistoryTable
            usageRecords={usageRecords}
            isLoading={usageLoading}
            quiltName={quilt.name}
            quiltId={quilt.id}
            itemNumber={quilt.itemNumber}
          />
        </CardContent>
      </Card>
    </div>
  );
}
