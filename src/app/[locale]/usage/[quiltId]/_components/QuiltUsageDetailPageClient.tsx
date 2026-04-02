'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import {
  Archive,
  ArrowLeft,
  Calendar,
  Hash,
  Layers,
  MapPin,
  Package,
  Ruler,
  Tag,
  Weight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UsageHistoryTable } from '@/components/usage/UsageHistoryTable';
import type { Quilt, UsageRecord } from '@/lib/validations/quilt';

interface QuiltUsageDetailPageClientProps {
  from: 'quilts' | 'usage';
  quilt: Quilt | null;
  usageRecords: UsageRecord[];
}

export function QuiltUsageDetailPageClient({
  from,
  quilt,
  usageRecords,
}: QuiltUsageDetailPageClientProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const isZh = locale === 'zh';

  const handleBack = () => {
    router.push(from === 'quilts' ? '/quilts' : '/usage');
  };

  if (!quilt) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Package className="mb-4 h-16 w-16 text-muted-foreground" />
        <h2 className="mb-2 text-xl font-semibold">{isZh ? '被子不存在' : 'Quilt Not Found'}</h2>
        <p className="mb-4 text-muted-foreground">
          {isZh ? '找不到指定的被子' : 'The specified quilt could not be found'}
        </p>
        <Button onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common.back')}
        </Button>
      </div>
    );
  }

  const getSeasonColor = (season: string) => {
    switch (season) {
      case 'WINTER':
        return 'border-blue-200 bg-blue-100 text-blue-800';
      case 'SUMMER':
        return 'border-orange-200 bg-orange-100 text-orange-800';
      case 'SPRING_AUTUMN':
        return 'border-green-200 bg-green-100 text-green-800';
      default:
        return 'border-gray-200 bg-gray-100 text-gray-800';
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
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common.back')}
        </Button>
        <h1 className="text-2xl font-semibold">{t('usage.details.title')}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {isZh ? '被子信息' : 'Quilt Information'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 text-lg font-semibold">{quilt.name}</h3>
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
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('quilts.table.itemNumber')}:</span>
                  <span className="font-medium">#{quilt.itemNumber}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Ruler className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('quilts.table.size')}:</span>
                  <span className="font-medium">
                    {quilt.lengthCm && quilt.widthCm ? `${quilt.lengthCm}×${quilt.widthCm}cm` : '-'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Weight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('quilts.table.weight')}:</span>
                  <span className="font-medium">{quilt.weightGrams}g</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t('quilts.table.fillMaterial')}:</span>
                <span className="font-medium">{quilt.fillMaterial}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <div
                  className="h-4 w-4 rounded-full border-2"
                  style={{ backgroundColor: quilt.color }}
                />
                <span className="text-muted-foreground">{t('quilts.table.color')}:</span>
                <span className="font-medium">{quilt.color}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t('quilts.table.location')}:</span>
                <span className="font-medium">{quilt.location}</span>
              </div>

              {quilt.packagingInfo && (
                <div className="flex items-center gap-2 text-sm">
                  <Archive className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('quilts.table.packagingInfo')}:</span>
                  <span className="font-medium">{quilt.packagingInfo}</span>
                </div>
              )}

              {quilt.brand && (
                <div className="flex items-center gap-2 text-sm">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('quilts.form.brand')}:</span>
                  <span className="font-medium">{quilt.brand}</span>
                </div>
              )}

              {quilt.purchaseDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('quilts.form.purchaseDate')}:</span>
                  <span className="font-medium">
                    {new Date(quilt.purchaseDate).toLocaleDateString(isZh ? 'zh-CN' : 'en-US')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {quilt.notes && (
            <div className="mt-4 border-t pt-4">
              <p className="mb-1 text-sm text-muted-foreground">{t('quilts.form.notes')}:</p>
              <p className="text-sm">{quilt.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {isZh ? '使用历史' : 'Usage History'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UsageHistoryTable
            usageRecords={usageRecords}
            isLoading={false}
            quiltName={quilt.name}
            quiltId={quilt.id}
            itemNumber={quilt.itemNumber}
          />
        </CardContent>
      </Card>
    </div>
  );
}
