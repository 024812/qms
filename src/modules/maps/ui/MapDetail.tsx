/**
 * Map Detail Component
 *
 * Display component for detailed map view
 */

import React from 'react';
import type { MapItem } from '../schema';
import {
  getMapTypeDisplayName,
  getStatusDisplayName,
  getMaterialDisplayName,
  formatCurrency,
  calculateValueChange,
} from '../schema';

interface MapDetailProps {
  item: MapItem;
}

export function MapDetail({ item }: MapDetailProps) {
  const valueChange = calculateValueChange(item.currentValue, item.purchasePrice);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <div className="text-sm text-gray-500 mb-1">#{item.itemNumber}</div>
        <h1 className="text-3xl font-bold mb-2">{item.name}</h1>
        <div className="flex gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {getMapTypeDisplayName(item.mapType)}
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            {getStatusDisplayName(item.status)}
          </span>
        </div>
      </div>

      {/* Images */}
      {item.mainImage && (
        <div>
          <h2 className="text-xl font-semibold mb-3">图片</h2>
          <img
            src={item.mainImage}
            alt={item.name}
            className="w-full max-w-2xl rounded-lg shadow-md"
          />
          {item.attachmentImages && item.attachmentImages.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {item.attachmentImages.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`${item.name} - ${idx + 1}`}
                  className="w-full h-32 object-cover rounded shadow-sm"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Basic Information */}
      <div>
        <h2 className="text-xl font-semibold mb-3">基本信息</h2>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">地图类型</dt>
            <dd className="mt-1 text-sm text-gray-900">{getMapTypeDisplayName(item.mapType)}</dd>
          </div>
          {item.scale && (
            <div>
              <dt className="text-sm font-medium text-gray-500">比例尺</dt>
              <dd className="mt-1 text-sm text-gray-900">{item.scale}</dd>
            </div>
          )}
          {item.publishedYear && (
            <div>
              <dt className="text-sm font-medium text-gray-500">出版年份</dt>
              <dd className="mt-1 text-sm text-gray-900">{item.publishedYear}</dd>
            </div>
          )}
          {item.publisher && (
            <div>
              <dt className="text-sm font-medium text-gray-500">出版社/制图者</dt>
              <dd className="mt-1 text-sm text-gray-900">{item.publisher}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-medium text-gray-500">材质</dt>
            <dd className="mt-1 text-sm text-gray-900">{getMaterialDisplayName(item.material)}</dd>
          </div>
          {(item.widthCm || item.heightCm) && (
            <div>
              <dt className="text-sm font-medium text-gray-500">尺寸</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {item.widthCm && item.heightCm
                  ? `${item.widthCm} × ${item.heightCm} cm`
                  : item.widthCm
                    ? `宽 ${item.widthCm} cm`
                    : `高 ${item.heightCm} cm`}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Geographic Information */}
      {(item.region || item.country || item.language) && (
        <div>
          <h2 className="text-xl font-semibold mb-3">地理信息</h2>
          <dl className="grid grid-cols-2 gap-4">
            {item.region && (
              <div>
                <dt className="text-sm font-medium text-gray-500">地区</dt>
                <dd className="mt-1 text-sm text-gray-900">{item.region}</dd>
              </div>
            )}
            {item.country && (
              <div>
                <dt className="text-sm font-medium text-gray-500">国家</dt>
                <dd className="mt-1 text-sm text-gray-900">{item.country}</dd>
              </div>
            )}
            {item.language && (
              <div>
                <dt className="text-sm font-medium text-gray-500">语言</dt>
                <dd className="mt-1 text-sm text-gray-900">{item.language}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Condition and Authenticity */}
      <div>
        <h2 className="text-xl font-semibold mb-3">品相与版本</h2>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">是否原版</dt>
            <dd className="mt-1 text-sm text-gray-900">{item.isOriginal ? '是' : '否'}</dd>
          </div>
          {item.edition && (
            <div>
              <dt className="text-sm font-medium text-gray-500">版次</dt>
              <dd className="mt-1 text-sm text-gray-900">{item.edition}</dd>
            </div>
          )}
          {item.condition && (
            <div className="col-span-2">
              <dt className="text-sm font-medium text-gray-500">品相描述</dt>
              <dd className="mt-1 text-sm text-gray-900">{item.condition}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Value Information */}
      {(item.purchasePrice !== null || item.currentValue !== null) && (
        <div>
          <h2 className="text-xl font-semibold mb-3">价值信息</h2>
          <dl className="grid grid-cols-2 gap-4">
            {item.acquiredDate && (
              <div>
                <dt className="text-sm font-medium text-gray-500">获得日期</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(item.acquiredDate).toLocaleDateString('zh-CN')}
                </dd>
              </div>
            )}
            {item.purchasePrice !== null && (
              <div>
                <dt className="text-sm font-medium text-gray-500">购买价格</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatCurrency(item.purchasePrice)}</dd>
              </div>
            )}
            {item.currentValue !== null && (
              <div>
                <dt className="text-sm font-medium text-gray-500">当前价值</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatCurrency(item.currentValue)}</dd>
              </div>
            )}
            {valueChange && (
              <div>
                <dt className="text-sm font-medium text-gray-500">价值变化</dt>
                <dd
                  className={`mt-1 text-sm font-medium ${
                    valueChange.change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {valueChange.change >= 0 ? '+' : ''}
                  {formatCurrency(valueChange.change)} ({valueChange.percentage >= 0 ? '+' : ''}
                  {valueChange.percentage.toFixed(2)}%)
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Storage Information */}
      <div>
        <h2 className="text-xl font-semibold mb-3">存储信息</h2>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">状态</dt>
            <dd className="mt-1 text-sm text-gray-900">{getStatusDisplayName(item.status)}</dd>
          </div>
          {item.location && (
            <div>
              <dt className="text-sm font-medium text-gray-500">存放位置</dt>
              <dd className="mt-1 text-sm text-gray-900">{item.location}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Notes */}
      {item.notes && (
        <div>
          <h2 className="text-xl font-semibold mb-3">备注</h2>
          <p className="text-sm text-gray-900 whitespace-pre-wrap">{item.notes}</p>
        </div>
      )}

      {/* Metadata */}
      <div className="border-t pt-4">
        <h2 className="text-xl font-semibold mb-3">元数据</h2>
        <dl className="grid grid-cols-2 gap-4 text-xs text-gray-500">
          <div>
            <dt className="font-medium">创建时间</dt>
            <dd className="mt-1">{new Date(item.createdAt).toLocaleString('zh-CN')}</dd>
          </div>
          <div>
            <dt className="font-medium">更新时间</dt>
            <dd className="mt-1">{new Date(item.updatedAt).toLocaleString('zh-CN')}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
