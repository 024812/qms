/**
 * CardCard Component for Module System
 * 
 * This component displays a sports card in the module system's list view.
 * It shows key card information including player, sport, grading, and value.
 * 
 * Key features:
 * - Displays player name, sport, and year
 * - Shows grading information (company and grade)
 * - Displays current value and status
 * - Shows special features (autograph, memorabilia)
 * - Compatible with module registry system
 * 
 * Requirements: 4.1
 */

import { Badge } from '@/components/ui/badge';
import { CreditCard, TrendingUp, Award, Pen, Star } from 'lucide-react';
import Image from 'next/image';
import type { CardItem } from '../schema';

interface CardCardProps {
  item: CardItem;
}

/**
 * Get sport badge color based on sport type
 */
function getSportColor(sport: string) {
  switch (sport) {
    case 'BASKETBALL':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'BASEBALL':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'FOOTBALL':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'SOCCER':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'HOCKEY':
      return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

/**
 * Get status badge color based on status type
 */
function getStatusColor(status: string) {
  switch (status) {
    case 'COLLECTION':
      return 'bg-blue-100 text-blue-800';
    case 'FOR_SALE':
      return 'bg-green-100 text-green-800';
    case 'SOLD':
      return 'bg-gray-100 text-gray-800';
    case 'GRADING':
      return 'bg-yellow-100 text-yellow-800';
    case 'DISPLAY':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get localized sport label
 */
function getSportLabel(sport: string): string {
  const sportMap: Record<string, string> = {
    BASKETBALL: '篮球',
    BASEBALL: '棒球',
    FOOTBALL: '橄榄球',
    SOCCER: '足球',
    HOCKEY: '冰球',
    OTHER: '其他',
  };
  return sportMap[sport] || sport;
}

/**
 * Get localized status label
 */
function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    COLLECTION: '收藏中',
    FOR_SALE: '待售',
    SOLD: '已售出',
    GRADING: '评级中',
    DISPLAY: '展示中',
  };
  return statusMap[status] || status;
}

/**
 * Format currency value
 */
function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return '-';
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * CardCard Component
 * 
 * Displays a sports card item in a card format with:
 * - Main image (if available)
 * - Item number
 * - Player name and team
 * - Sport and status badges
 * - Year, brand, and series
 * - Grading information
 * - Current value
 * - Special features (autograph, memorabilia)
 * 
 * Note: This component does NOT include the Card wrapper - that's handled by the parent ItemCard component.
 */
export function CardCard({ item }: CardCardProps) {
  return (
    <>
      {/* Main Image */}
      {item.mainImage && (
        <div className="mb-3 relative h-40 bg-muted rounded-md overflow-hidden">
          <Image
            src={item.mainImage}
            alt={`${item.playerName} - ${item.year} ${item.brand}`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy"
          />
        </div>
      )}

      <div className="space-y-2">
        {/* Header: Item Number and Player Name */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                #{item.itemNumber}
              </span>
            </div>
            <h3 className="font-semibold text-foreground">{item.playerName}</h3>
            {item.team && (
              <p className="text-sm text-muted-foreground">{item.team}</p>
            )}
          </div>
        </div>

        {/* Badges: Sport and Status */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={getSportColor(item.sport)}>
            {getSportLabel(item.sport)}
          </Badge>
          <Badge className={getStatusColor(item.status)}>
            {getStatusLabel(item.status)}
          </Badge>
        </div>

        {/* Card Details: Year, Brand, Series */}
        <div className="text-sm text-muted-foreground space-y-1">
          <div className="font-medium">
            {item.year} {item.brand}
            {item.series && ` - ${item.series}`}
          </div>
          
          {/* Grading Information */}
          {item.gradingCompany && item.gradingCompany !== 'UNGRADED' && (
            <div className="flex items-center gap-1">
              <Award className="w-3 h-3" />
              <span>
                {item.gradingCompany}
                {item.grade && ` ${item.grade}`}
              </span>
            </div>
          )}
          
          {/* Current Value */}
          {item.currentValue && (
            <div className="flex items-center gap-1 font-medium text-foreground">
              <TrendingUp className="w-3 h-3" />
              <span>{formatCurrency(item.currentValue)}</span>
            </div>
          )}
        </div>

        {/* Special Features */}
        {(item.isAutographed || item.hasMemorabilia) && (
          <div className="flex gap-2 pt-1">
            {item.isAutographed && (
              <div className="flex items-center gap-1 text-xs text-blue-600">
                <Pen className="w-3 h-3" />
                <span>签名</span>
              </div>
            )}
            {item.hasMemorabilia && (
              <div className="flex items-center gap-1 text-xs text-purple-600">
                <Star className="w-3 h-3" />
                <span>实物</span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
