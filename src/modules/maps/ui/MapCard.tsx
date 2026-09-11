/**
 * Map Card Component
 *
 * Display component for a single map in list view
 */

import React from 'react';
import type { MapItem } from '../schema';
import { getMapTypeDisplayName, getStatusDisplayName, formatCurrency } from '../schema';

interface MapCardProps {
  item: MapItem;
  onSelect?: (id: string) => void;
  isSelected?: boolean;
}

export function MapCard({ item, onSelect, isSelected }: MapCardProps) {
  return (
    <div
      className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
      }`}
      onClick={() => onSelect?.(item.id)}
    >
      {/* Image */}
      {item.mainImage && (
        <div className="mb-3">
          <img src={item.mainImage} alt={item.name} className="w-full h-48 object-cover rounded" />
        </div>
      )}

      {/* Item Number */}
      <div className="text-sm text-gray-500 mb-1">#{item.itemNumber}</div>

      {/* Name */}
      <h3 className="text-lg font-semibold mb-2 line-clamp-2">{item.name}</h3>

      {/* Type and Status */}
      <div className="flex gap-2 mb-2">
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
          {getMapTypeDisplayName(item.mapType)}
        </span>
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
          {getStatusDisplayName(item.status)}
        </span>
      </div>

      {/* Details */}
      <div className="text-sm text-gray-600 space-y-1">
        {item.region && (
          <div>
            <span className="font-medium">地区：</span>
            {item.region}
          </div>
        )}
        {item.publishedYear && (
          <div>
            <span className="font-medium">年份：</span>
            {item.publishedYear}
          </div>
        )}
        {item.publisher && (
          <div className="line-clamp-1">
            <span className="font-medium">出版社：</span>
            {item.publisher}
          </div>
        )}
        {item.currentValue !== null && (
          <div>
            <span className="font-medium">估值：</span>
            {formatCurrency(item.currentValue)}
          </div>
        )}
      </div>

      {/* Location */}
      {item.location && (
        <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
          存放位置：{item.location}
        </div>
      )}
    </div>
  );
}
