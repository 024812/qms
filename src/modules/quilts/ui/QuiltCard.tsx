/**
 * QuiltCard Component for Module System
 * 
 * This component displays a quilt card in the module system's list view.
 * It preserves the existing design and functionality from the original QuiltCard
 * while being compatible with the module registry system.
 * 
 * Key features:
 * - Displays key quilt information (name, size, warmth level, status)
 * - Shows status badge with appropriate colors
 * - Displays main image if available
 * - Compatible with both module system and existing routes
 * 
 * Requirements: 4.1
 */

import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';
import Image from 'next/image';
import type { QuiltItem } from '../schema';

interface QuiltCardProps {
  item: QuiltItem;
}

/**
 * Get season badge color based on season type
 */
function getSeasonColor(season: string) {
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
}

/**
 * Get status badge color based on status type
 */
function getStatusColor(status: string) {
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
}

/**
 * Get localized season label
 */
function getSeasonLabel(season: string): string {
  const seasonMap: Record<string, string> = {
    WINTER: '冬季',
    SPRING_AUTUMN: '春秋',
    SUMMER: '夏季',
  };
  return seasonMap[season] || season;
}

/**
 * Get localized status label
 */
function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    IN_USE: '使用中',
    STORAGE: '存储中',
    MAINTENANCE: '维护中',
  };
  return statusMap[status] || status;
}

/**
 * QuiltCard Component
 * 
 * Displays a quilt item in a card format with:
 * - Main image (if available)
 * - Item number
 * - Name
 * - Season and status badges
 * - Dimensions and weight
 * - Fill material, color, and location
 * 
 * Note: This component does NOT include the Card wrapper - that's handled by the parent ItemCard component.
 */
export function QuiltCard({ item }: QuiltCardProps) {
  return (
    <>
      {/* Main Image */}
      {item.mainImage && (
        <div className="mb-3 relative h-40 bg-muted rounded-md overflow-hidden">
          <Image
            src={item.mainImage}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy"
          />
        </div>
      )}

      <div className="space-y-2">
        {/* Header: Item Number and Name */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                #{item.itemNumber}
              </span>
            </div>
            <h3 className="font-semibold text-foreground">{item.name}</h3>
          </div>
        </div>

        {/* Badges: Season and Status */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={getSeasonColor(item.season)}>
            {getSeasonLabel(item.season)}
          </Badge>
          <Badge className={getStatusColor(item.currentStatus)}>
            {getStatusLabel(item.currentStatus)}
          </Badge>
        </div>

        {/* Details: Dimensions, Weight, Material, Color, Location */}
        <div className="text-sm text-muted-foreground space-y-1">
          {/* Dimensions */}
          <div>
            {item.lengthCm && item.widthCm
              ? `${item.lengthCm}×${item.widthCm}cm`
              : '-'}
          </div>
          
          {/* Weight and Fill Material */}
          <div>
            {item.weightGrams ? `${item.weightGrams}g` : '-'} · {item.fillMaterial}
          </div>
          
          {/* Color and Location */}
          <div>
            {item.color} · {item.location}
          </div>
        </div>
      </div>
    </>
  );
}
