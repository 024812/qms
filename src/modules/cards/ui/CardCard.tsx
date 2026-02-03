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

'use client';

import { Badge } from '@/components/ui/badge';
import { CreditCard } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useRouter } from '@/i18n/routing';
import type { CardItem, SportType, CardStatus } from '../schema';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CardCardProps {
  item: CardItem;
}

/**
 * Get sport badge color based on sport type
 */
function getSportBadgeColor(sport: SportType): string {
  const colorMap: Record<SportType, string> = {
    BASKETBALL: 'bg-orange-50 text-orange-700 border-orange-200/50 hover:bg-orange-100',
    SOCCER: 'bg-purple-50 text-purple-700 border-purple-200/50 hover:bg-purple-100',
    OTHER: 'bg-slate-50 text-slate-700 border-slate-200/50 hover:bg-slate-100',
  };
  return colorMap[sport] || colorMap.OTHER;
}

/**
 * Get status badge color based on status type
 */
function getStatusBadgeStyle(status: CardStatus): string {
  // Using dot indicator styles instead of full badges for status to keep it clean
  const colorMap: Record<CardStatus, string> = {
    COLLECTION: 'bg-blue-500',
    FOR_SALE: 'bg-amber-500',
    SOLD: 'bg-slate-400',
    GRADING: 'bg-purple-500',
    DISPLAY: 'bg-emerald-500',
  };
  return colorMap[status] || colorMap.COLLECTION;
}

/**
 * Format currency value
 */
function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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
  const router = useRouter();

  const handleDoubleClick = () => {
    router.push(`/cards/${item.id}`);
  };

  return (
    <Card
      className="group overflow-hidden border-slate-200 bg-white hover:shadow-lg hover:border-slate-300 transition-all duration-300 cursor-pointer h-full flex flex-col"
      onClick={handleDoubleClick}
    >
      {/* Card Image Area */}
      <div className="relative aspect-[3/4] overflow-hidden bg-slate-100">
        {item.mainImage ? (
          <Image
            src={item.mainImage}
            alt={`${item.playerName} - ${item.year} ${item.brand}`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <CreditCard className="w-12 h-12" />
          </div>
        )}

        {/* Status Dot */}
        <div className="absolute top-3 left-3 z-10 flex gap-1">
          <div
            className={cn(
              'w-2 h-2 rounded-full shadow-sm ring-2 ring-white',
              getStatusBadgeStyle(item.status)
            )}
            title={t(`enums.status.${item.status}`)}
          />
        </div>

        {/* Grading Badge Overlay */}
        {item.gradingCompany !== 'UNGRADED' && item.grade && (
          <div className="absolute top-3 right-3 z-10">
            <Badge className="bg-white/90 text-slate-900 shadow-sm border border-slate-200/50 backdrop-blur-sm font-mono font-bold hover:bg-white">
              {item.gradingCompany} {item.grade}
            </Badge>
          </div>
        )}

        {/* Hover Actions Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
          <Button variant="secondary" size="sm" className="pointer-events-none">
            View Details
          </Button>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-4 flex-1 flex flex-col gap-3">
        {/* Player & Key Info */}
        <div>
          <h3 className="font-bold text-slate-900 line-clamp-1 group-hover:text-primary transition-colors">
            {item.playerName}
          </h3>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            {item.year} {item.brand}
          </p>
        </div>

        {/* Tags / Features */}
        <div className="flex flex-wrap gap-1.5 mt-auto">
          <Badge
            variant="outline"
            className={cn('text-[10px] px-1.5 h-5 font-normal', getSportBadgeColor(item.sport))}
          >
            {t(`enums.sport.${item.sport}`)}
          </Badge>

          {item.isAutographed && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 h-5 font-normal border-amber-200 text-amber-700 bg-amber-50"
            >
              Auto
            </Badge>
          )}
          {item.hasMemorabilia && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 h-5 font-normal border-rose-200 text-rose-700 bg-rose-50"
            >
              Mem
            </Badge>
          )}
        </div>
      </CardContent>

      <div className="px-4 pb-4 pt-0 mt-auto flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-xs text-muted-foreground font-mono">#{item.itemNumber}</span>
        {item.currentValue ? (
          <span className="font-bold text-slate-900 font-mono">
            {formatCurrency(item.currentValue)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </div>
    </Card>
  );
}
