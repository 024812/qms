/**
 * CardDetail Component for Module System
 *
 * This component displays comprehensive sports card information in the detail view.
 * It shows all card fields in an organized layout with image gallery.
 *
 * Key features:
 * - Displays all 30+ card fields in organized cards
 * - Shows image carousel/gallery for main and attachment images
 * - Calculates and displays investment ROI
 * - Compatible with module registry system
 * - Responsive design with grid layout
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  User,
  Calendar,
  Award,
  DollarSign,
  Package,
  MapPin,
  FileText,
  CreditCard,
  ExternalLink,
  TrendingUp,
} from 'lucide-react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import type { CardItem } from '../schema';
import {
  generateCardSearchQuery,
  getEbaySearchUrl,
  getPSACardFactsUrl,
  getBeckettSearchUrl,
  get130PointUrl,
  estimateCardValue,
} from '@/lib/services/card-market';

interface CardDetailProps {
  item: CardItem;
}

/**
 * Detail field component for consistent styling
 */
function DetailField({
  icon: Icon,
  label,
  value,
  fullWidth = false,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? 'col-span-2' : ''}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
        {Icon && <Icon className="w-4 h-4" aria-hidden="true" />}
        <span>{label}</span>
      </div>
      <div className="font-medium text-foreground">{value}</div>
    </div>
  );
}

/**
 * CardDetail Component
 *
 * Displays comprehensive card information including:
 * - Image gallery (main image + attachment images)
 * - Player information (name, sport, team, position)
 * - Card details (year, brand, series, card number)
 * - Grading information (company, grade, certification)
 * - Value information (purchase, current, estimated, ROI)
 * - Physical characteristics (parallel, serial, autograph, memorabilia)
 * - Storage information (status, location, storage type, condition)
 * - Additional notes
 * - Timestamps
 *
 * Layout:
 * - Top: Image gallery
 * - Middle: Information cards organized by category
 * - Bottom: Timestamps
 *
 * Requirements: 3.1-3.15, 9.1-9.5 (Accessibility)
 */
export function CardDetail({ item }: CardDetailProps) {
  const t = useTranslations('cards');
  const locale = useLocale();

  const formatDate = (date: Date | null | undefined): string => {
    if (!date) return '-';
    // Use the locale from next-intl, defaulting to zh-CN/en-US based on locale string
    return new Date(date).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '-';
    return `$${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Collect all images (main + attachments)
  const allImages: string[] = [];
  if (item.mainImage) {
    allImages.push(item.mainImage);
  }
  if (item.attachmentImages && item.attachmentImages.length > 0) {
    allImages.push(...item.attachmentImages);
  }

  // Generate market data
  const searchQuery = generateCardSearchQuery({
    playerName: item.playerName,
    year: item.year,
    brand: item.brand,
    series: item.series || undefined,
    cardNumber: item.cardNumber || undefined,
    gradingCompany: item.gradingCompany !== 'UNGRADED' ? item.gradingCompany : undefined,
    grade: item.grade || undefined,
  });

  const estimatedRange = estimateCardValue({
    year: item.year,
    gradingCompany: item.gradingCompany,
    grade: item.grade || undefined,
    isAutographed: item.isAutographed,
    hasMemorabilia: item.hasMemorabilia,
  });

  const getROILabel = (currentValue: number | null, purchasePrice: number | null) => {
    if (!currentValue || !purchasePrice || purchasePrice === 0) {
      return t('values.noData');
    }
    const roi = ((currentValue - purchasePrice) / purchasePrice) * 100;
    return `${roi > 0 ? '+' : ''}${roi.toFixed(2)}%`;
  };

  return (
    <article className="space-y-6">
      {/* Image Gallery */}
      {allImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('detail.images')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              role="list"
              aria-label={t('upload.title')}
            >
              {allImages.map(imageUrl => (
                <div
                  key={imageUrl}
                  className="relative aspect-square bg-muted rounded-lg overflow-hidden"
                  role="listitem"
                >
                  <Image
                    src={imageUrl}
                    alt={`${item.playerName} - ${item.year} ${item.brand} ${item.series || ''} ${t('detail.images')}${imageUrl === item.mainImage ? t('detail.mainImage') : t('upload.backLabel')}${item.gradingCompany !== 'UNGRADED' ? ` - ${t(`enums.grading.${item.gradingCompany as 'PSA' | 'BGS' | 'SGC' | 'CGC' | 'UNGRADED'}`)} ${item.grade}` : ''}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    loading="lazy"
                    priority={false}
                  />
                  {imageUrl === item.mainImage && (
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="text-xs">
                        {t('detail.mainImage')}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Player Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t('detail.playerInfo')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailField icon={User} label={t('fields.playerName')} value={item.playerName} />
            <DetailField label={t('fields.sport')} value={t(`enums.sport.${item.sport}`)} />
            <DetailField label={t('fields.team')} value={item.team || '-'} />
            <DetailField label={t('fields.position')} value={item.position || '-'} />
          </div>
        </CardContent>
      </Card>

      {/* Card Details */}
      <Card>
        <CardHeader>
          <CardTitle>{t('detail.cardDetails')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailField icon={CreditCard} label={t('fields.year')} value={item.year} />
            <DetailField label={t('fields.brand')} value={item.brand} />
            <DetailField label={t('fields.series')} value={item.series || '-'} />
            <DetailField label={t('fields.cardNumber')} value={item.cardNumber || '-'} />
          </div>
        </CardContent>
      </Card>

      {/* Grading Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t('detail.gradingInfo')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailField
              icon={Award}
              label={t('fields.gradingCompany')}
              value={t(`enums.grading.${item.gradingCompany as 'PSA' | 'BGS' | 'SGC' | 'CGC' | 'UNGRADED'}`)}
            />
            <DetailField
              label={t('fields.grade')}
              value={item.grade !== null ? item.grade.toString() : '-'}
            />
            <DetailField label={t('fields.certNumber')} value={item.certificationNumber || '-'} fullWidth />
          </div>
        </CardContent>
      </Card>

      {/* Value Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t('detail.valueInfo')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailField
              icon={DollarSign}
              label={t('fields.purchasePrice')}
              value={formatCurrency(item.purchasePrice)}
            />
            <DetailField icon={Calendar} label={t('fields.purchaseDate')} value={formatDate(item.purchaseDate)} />
            <DetailField label={t('fields.currentValue')} value={formatCurrency(item.currentValue)} />
            <DetailField label={t('fields.estimatedValue')} value={formatCurrency(item.estimatedValue)} />
            <DetailField
              label={t('fields.roi')}
              value={
                <span
                  className={
                    getROILabel(item.currentValue, item.purchasePrice).startsWith('+')
                      ? 'text-green-600 dark:text-green-400'
                      : getROILabel(item.currentValue, item.purchasePrice).startsWith('-')
                        ? 'text-red-600 dark:text-red-400'
                        : ''
                  }
                  aria-label={`${t('fields.roi')} ${getROILabel(item.currentValue, item.purchasePrice)}`}
                >
                  {getROILabel(item.currentValue, item.purchasePrice)}
                </span>
              }
              fullWidth
            />
          </div>
        </CardContent>
      </Card>

      {/* Market Data - External Links */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" aria-hidden="true" />
            <CardTitle>{t('detail.marketData')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Estimated Value Range */}
          {estimatedRange && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">{t('detail.estimatedRange')}</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">
                  ${estimatedRange.low} - ${estimatedRange.high}
                </span>
                <span className="text-sm text-muted-foreground">
                  ({t('detail.estimated')} ${estimatedRange.estimated})
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t('detail.estimateDisclaimer')}
              </p>
            </div>
          )}

          {/* External Market Links */}
          <div>
            <div className="text-sm font-medium mb-3">{t('detail.checkMarketPrice')}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button variant="outline" className="justify-start" asChild>
                <a
                  href={getEbaySearchUrl(searchQuery)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  <span>{t('detail.ebaySold')}</span>
                </a>
              </Button>

              <Button variant="outline" className="justify-start" asChild>
                <a
                  href={getPSACardFactsUrl({
                    playerName: item.playerName,
                    year: item.year,
                    brand: item.brand,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  <span>{t('detail.psaFacts')}</span>
                </a>
              </Button>

              <Button variant="outline" className="justify-start" asChild>
                <a
                  href={getBeckettSearchUrl(searchQuery)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  <span>{t('detail.beckettPrice')}</span>
                </a>
              </Button>

              <Button variant="outline" className="justify-start" asChild>
                <a
                  href={get130PointUrl({
                    playerName: item.playerName,
                    year: item.year,
                    brand: item.brand,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  <span>{t('detail.point130')}</span>
                </a>
              </Button>
            </div>
          </div>

          {/* Search Query Info */}
          <div className="text-xs text-muted-foreground pt-2 border-t">
            <span className="font-medium">{t('detail.searchKeywords')} </span>
            <span className="font-mono">{searchQuery}</span>
          </div>
        </CardContent>
      </Card>

      {/* Physical Characteristics */}
      <Card>
        <CardHeader>
          <CardTitle>{t('detail.physical')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailField icon={Package} label={t('fields.parallel')} value={item.parallel || '-'} />
            <DetailField label={t('fields.serialNumber')} value={item.serialNumber || '-'} />
            <DetailField
              label={t('fields.autograph')}
              value={
                item.isAutographed ? (
                  <Badge
                    className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    aria-label={t('values.autographed')}
                  >
                    {t('values.yes')}
                  </Badge>
                ) : (
                  <Badge variant="outline" aria-label={t('values.no')}>
                    {t('values.no')}
                  </Badge>
                )
              }
            />
            <DetailField
              label={t('fields.memorabilia')}
              value={
                item.hasMemorabilia ? (
                  <Badge
                    className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    aria-label={t('values.memorabilia')}
                  >
                    {t('values.yes')}
                  </Badge>
                ) : (
                  <Badge variant="outline" aria-label={t('values.no')}>
                    {t('values.no')}
                  </Badge>
                )
              }
            />
            {item.memorabiliaType && (
              <DetailField label={t('fields.memorabiliaType')} value={item.memorabiliaType} fullWidth />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Storage Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t('detail.storage')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailField label={t('fields.status')} value={t(`enums.status.${item.status}`)} />
            <DetailField icon={MapPin} label={t('fields.location')} value={item.location || '-'} />
            <DetailField label={t('fields.storageType')} value={item.storageType || '-'} />
            <DetailField label={t('fields.condition')} value={item.condition || '-'} fullWidth />
          </div>
        </CardContent>
      </Card>

      {/* Notes (conditional) */}
      {item.notes && (
        <Card>
          <CardHeader>
            <CardTitle>{t('detail.notes')}</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailField
              icon={FileText}
              label={t('fields.notes')}
              value={<p className="whitespace-pre-wrap">{item.notes}</p>}
              fullWidth
            />
          </CardContent>
        </Card>
      )}

      {/* Timestamps */}
      <Card>
        <CardHeader>
          <CardTitle>{t('detail.records')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailField icon={Calendar} label={t('fields.createdAt')} value={formatDate(item.createdAt)} />
            <DetailField icon={Calendar} label={t('fields.updatedAt')} value={formatDate(item.updatedAt)} />
          </div>
        </CardContent>
      </Card>
    </article>
  );
}
