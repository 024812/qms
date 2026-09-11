/**
 * Spirit Card Component
 *
 * Displays a spirit item in card format for list views.
 */

import React from 'react';
import type { SpiritItem } from '../schema';

interface SpiritCardProps {
  item: SpiritItem;
  onClick?: () => void;
}

export function SpiritCard({ item, onClick }: SpiritCardProps) {
  const spiritTypeMap: Record<string, string> = {
    WHISKY: '威士忌',
    COGNAC: '干邑',
    BRANDY: '白兰地',
    RUM: '朗姆酒',
    VODKA: '伏特加',
    GIN: '金酒',
    TEQUILA: '龙舌兰',
    BAIJIU: '白酒',
    WINE: '葡萄酒',
    OTHER: '其他',
  };

  const statusMap: Record<string, string> = {
    COLLECTION: '收藏中',
    AGING: '陈化中',
    FOR_SALE: '待售',
    SOLD: '已售出',
    OPENED: '已开瓶',
    EMPTY: '已饮完',
  };

  const bottleStatusMap: Record<string, string> = {
    SEALED: '未开封',
    OPENED: '已开封',
    EMPTY: '已空',
  };

  return (
    <div
      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      {item.mainImage && (
        <div className="mb-3">
          <img src={item.mainImage} alt={item.name} className="w-full h-48 object-cover rounded" />
        </div>
      )}
      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg">{item.name}</h3>
          <span className="text-sm text-gray-500">#{item.itemNumber}</span>
        </div>
        <div className="text-sm text-gray-600">
          <span className="font-medium">{spiritTypeMap[item.spiritType]}</span>
          {item.brand && <span className="ml-2">· {item.brand}</span>}
        </div>
        {(item.vintage || item.age) && (
          <div className="text-sm text-gray-600">
            {item.vintage && <span>{item.vintage}年</span>}
            {item.vintage && item.age && <span> · </span>}
            {item.age && <span>{item.age}年陈</span>}
          </div>
        )}
        {item.abv && <div className="text-sm text-gray-600">酒精度: {item.abv}%</div>}
        <div className="flex gap-2 text-sm">
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
            {statusMap[item.status]}
          </span>
          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
            {bottleStatusMap[item.bottleStatus]}
          </span>
          {item.limitedEdition && (
            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded">限量版</span>
          )}
        </div>
        {item.location && <div className="text-sm text-gray-500">📍 {item.location}</div>}
      </div>
    </div>
  );
}
