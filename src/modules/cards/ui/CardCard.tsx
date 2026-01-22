/**
 * CardCard Component for Module System
 *
 * This component displays a sports card in the module system's list view.
 *
 * Key features:
 * - Displays player name, sport, year, and brand
 * - Shows grading information if available
 * - Displays current value and special features (autograph, memorabilia)
 * - Responsive design with image optimization
 *
 * Requirements: 1.1, 1.2, 2.1, 2.2
 *
 * @param {CardCardProps} props - Component props
 * @param {CardItem} props.item - Card item to display
 * @returns {JSX.Element} Card component
 */

import { Badge } from '@/components/ui/badge';
import { CreditCard } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import type { CardItem, SportType, CardStatus } from '../schema';

interface CardCardProps {
  item: CardItem;
}

/**
 * Get sport badge color based on sport type
 */
function getSportBadgeColor(sport: SportType): string {
  const colorMap: Record<SportType, string> = {
    BASKETBALL:
      'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-200',
    SOCCER:
      'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-200',
    OTHER: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-200',
  };
  return colorMap[sport] || colorMap.OTHER;
}

/**
 * Get status badge color based on status type
 */
function getStatusBadgeColor(status: CardStatus): string {
  const colorMap: Record<CardStatus, string> = {
    COLLECTION: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    FOR_SALE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    SOLD: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    GRADING: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    DISPLAY: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  };
  return colorMap[status] || colorMap.COLLECTION;
}

/**
 * Format currency value
 */
function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * CardCard Component
 *
 * Displays a sports card item in a card format with:
 * - Main image (if available)
 * - Item number
 * - Player name
 * - Sport type and status badges
 * - Grading information (if graded)
 * - Year and brand
 * - Current value (if available)
 * - Special features (autograph, memorabilia)
 *
 * Note: This component does NOT include the Card wrapper - that's handled by the parent ItemCard component.
 *
 * Requirements: 1.1-1.13, 2.1-2.10, 9.1-9.5 (Accessibility)
 */
export function CardCard({ item }: CardCardProps) {
  const t = useTranslations('cards');

  return (
    <article>
      {/* Main Image */}
      {item.mainImage && (
        <div className="mb-3 relative h-40 bg-muted rounded-md overflow-hidden">
          <Image
            src={item.mainImage}
            alt={`${item.playerName} - ${item.year} ${item.brand} ${item.series || ''} ${t('detail.mainImage')}${item.gradingCompany !== 'UNGRADED' ? ` - ${t(`enums.grading.${item.gradingCompany as 'PSA' | 'BGS' | 'SGC' | 'CGC' | 'UNGRADED'}`)} ${item.grade}` : ''}`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy"
          />
        </div>
      )}

      <div className="space-y-2">
        {/* Header: Item Number and Player Name */}
        <header className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-xs text-muted-foreground">#{item.itemNumber}</span>
            </div>
            <h3 className="font-semibold text-foreground">{item.playerName}</h3>
          </div>
        </header>

        {/* Badges: Sport Type, Grading, Status */}
        <div className="flex flex-wrap gap-2" role="list" aria-label={t('upload.title')}>
          <Badge variant="outline" className={getSportBadgeColor(item.sport)} role="listitem">
            {t(`enums.sport.${item.sport}`)}
          </Badge>

          {/* Grading Badge - Only show if graded */}
          {item.gradingCompany !== 'UNGRADED' && item.grade && (
            <Badge
              variant="outline"
              className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-200"
              role="listitem"
            >
              {t(`enums.grading.${item.gradingCompany as 'PSA' | 'BGS' | 'SGC' | 'CGC' | 'UNGRADED'}`)} {item.grade}
            </Badge>
          )}

          <Badge className={getStatusBadgeColor(item.status)} role="listitem">
            {t(`enums.status.${item.status}`)}
          </Badge>
        </div>

        {/* Details: Year, Brand, Value, Special Features */}
        <section className="text-sm text-muted-foreground space-y-1">
          {/* Year and Brand */}
          <div>
            <span className="sr-only">{t('fields.year')} & {t('fields.brand')}: </span>
            {item.year} • {item.brand}
          </div>

          {/* Current Value and Special Features */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Current Value */}
            {item.currentValue && (
              <span className="font-medium text-foreground">
                <span className="sr-only">{t('fields.currentValue')}: </span>
                {formatCurrency(item.currentValue)}
              </span>
            )}

            {/* Autograph Marker */}
            {item.isAutographed && (
              <span className="text-xs" aria-label={t('values.autographed')}>
                {t('values.autographed')}
              </span>
            )}

            {/* Memorabilia Marker */}
            {item.hasMemorabilia && (
              <span className="text-xs" aria-label={t('values.memorabilia')}>
                {t('values.memorabilia')}
              </span>
            )}
          </div>
        </section>
      </div>
    </article>
  );
}
