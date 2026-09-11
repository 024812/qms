/**
 * Spirit Detail Component
 *
 * Displays detailed information about a spirit item.
 */

import React from 'react';
import type { SpiritItem } from '../schema';

interface SpiritDetailProps {
  item: SpiritItem;
}

export function SpiritDetail({ item }: SpiritDetailProps) {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-3xl font-bold">{item.name}</h1>
          <span className="text-lg text-gray-500">#{item.itemNumber}</span>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
            {spiritTypeMap[item.spiritType]}
          </span>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
            {statusMap[item.status]}
          </span>
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
            {bottleStatusMap[item.bottleStatus]}
          </span>
          {item.limitedEdition && (
            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
              限量版
            </span>
          )}
        </div>
      </div>

      {/* Main Image */}
      {item.mainImage && (
        <div className="w-full max-w-2xl mx-auto">
          <img src={item.mainImage} alt={item.name} className="w-full rounded-lg shadow-lg" />
        </div>
      )}

      {/* Basic Information */}
      <div className="grid grid-cols-2 gap-4">
        {item.brand && (
          <div>
            <div className="text-sm text-gray-500">品牌</div>
            <div className="font-medium">{item.brand}</div>
          </div>
        )}
        {item.distillery && (
          <div>
            <div className="text-sm text-gray-500">酒厂/酒庄</div>
            <div className="font-medium">{item.distillery}</div>
          </div>
        )}
        {item.region && (
          <div>
            <div className="text-sm text-gray-500">产区</div>
            <div className="font-medium">{item.region}</div>
          </div>
        )}
        {item.country && (
          <div>
            <div className="text-sm text-gray-500">国家</div>
            <div className="font-medium">{item.country}</div>
          </div>
        )}
      </div>

      {/* Vintage & Age */}
      {(item.vintage || item.age || item.abv) && (
        <div className="grid grid-cols-3 gap-4 border-t pt-4">
          {item.vintage && (
            <div>
              <div className="text-sm text-gray-500">年份</div>
              <div className="font-medium">{item.vintage}</div>
            </div>
          )}
          {item.age && (
            <div>
              <div className="text-sm text-gray-500">陈年</div>
              <div className="font-medium">{item.age} 年</div>
            </div>
          )}
          {item.abv && (
            <div>
              <div className="text-sm text-gray-500">酒精度</div>
              <div className="font-medium">{item.abv}%</div>
            </div>
          )}
        </div>
      )}

      {/* Bottle Details */}
      {(item.volumeMl || item.bottleNumber || item.caskType) && (
        <div className="grid grid-cols-3 gap-4 border-t pt-4">
          {item.volumeMl && (
            <div>
              <div className="text-sm text-gray-500">容量</div>
              <div className="font-medium">{item.volumeMl} ml</div>
            </div>
          )}
          {item.bottleNumber && (
            <div>
              <div className="text-sm text-gray-500">瓶号</div>
              <div className="font-medium">{item.bottleNumber}</div>
            </div>
          )}
          {item.caskType && (
            <div>
              <div className="text-sm text-gray-500">桶型</div>
              <div className="font-medium">{item.caskType}</div>
            </div>
          )}
        </div>
      )}

      {/* Dates */}
      {(item.bottlingDate || item.acquiredDate) && (
        <div className="grid grid-cols-2 gap-4 border-t pt-4">
          {item.bottlingDate && (
            <div>
              <div className="text-sm text-gray-500">装瓶日期</div>
              <div className="font-medium">{new Date(item.bottlingDate).toLocaleDateString()}</div>
            </div>
          )}
          {item.acquiredDate && (
            <div>
              <div className="text-sm text-gray-500">获得日期</div>
              <div className="font-medium">{new Date(item.acquiredDate).toLocaleDateString()}</div>
            </div>
          )}
        </div>
      )}

      {/* Value Information */}
      {(item.purchasePrice || item.currentValue || item.estimatedValue) && (
        <div className="grid grid-cols-3 gap-4 border-t pt-4">
          {item.purchasePrice && (
            <div>
              <div className="text-sm text-gray-500">购买价格</div>
              <div className="font-medium">¥{Number(item.purchasePrice).toLocaleString()}</div>
            </div>
          )}
          {item.currentValue && (
            <div>
              <div className="text-sm text-gray-500">当前价值</div>
              <div className="font-medium">¥{Number(item.currentValue).toLocaleString()}</div>
            </div>
          )}
          {item.estimatedValue && (
            <div>
              <div className="text-sm text-gray-500">估值</div>
              <div className="font-medium">¥{Number(item.estimatedValue).toLocaleString()}</div>
            </div>
          )}
        </div>
      )}

      {/* Storage */}
      {(item.location || item.storageCondition) && (
        <div className="border-t pt-4">
          {item.location && (
            <div className="mb-3">
              <div className="text-sm text-gray-500">存放位置</div>
              <div className="font-medium">{item.location}</div>
            </div>
          )}
          {item.storageCondition && (
            <div>
              <div className="text-sm text-gray-500">储存条件</div>
              <div className="font-medium whitespace-pre-wrap">{item.storageCondition}</div>
            </div>
          )}
        </div>
      )}

      {/* Tasting Notes */}
      {item.tastingNotes && (
        <div className="border-t pt-4">
          <div className="text-sm text-gray-500 mb-2">品鉴笔记</div>
          <div className="prose max-w-none whitespace-pre-wrap">{item.tastingNotes}</div>
        </div>
      )}

      {/* Notes */}
      {item.notes && (
        <div className="border-t pt-4">
          <div className="text-sm text-gray-500 mb-2">备注</div>
          <div className="whitespace-pre-wrap">{item.notes}</div>
        </div>
      )}

      {/* Attachment Images */}
      {item.attachmentImages && item.attachmentImages.length > 0 && (
        <div className="border-t pt-4">
          <div className="text-sm text-gray-500 mb-3">附加图片</div>
          <div className="grid grid-cols-3 gap-4">
            {item.attachmentImages.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`${item.name} - ${idx + 1}`}
                className="w-full h-48 object-cover rounded-lg"
              />
            ))}
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div className="border-t pt-4 text-sm text-gray-500">
        <div>创建时间: {new Date(item.createdAt).toLocaleString()}</div>
        <div>更新时间: {new Date(item.updatedAt).toLocaleString()}</div>
      </div>
    </div>
  );
}
