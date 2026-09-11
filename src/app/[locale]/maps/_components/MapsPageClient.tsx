'use client';

import React, { useState, useTransition } from 'react';
import type { MapDTO } from '@/lib/data/maps';

interface MapsPageClientProps {
  initialData: {
    maps: MapDTO[];
    total: number;
    hasMore: boolean;
  };
  initialSearchParams?: {
    filters?: {
      mapType?: string;
      status?: string;
      material?: string;
      region?: string;
      country?: string;
      search?: string;
    };
    sortBy?: string;
    sortOrder?: string;
    skip?: number;
    take?: number;
  };
  initialSearchTerm: string;
}

export function MapsPageClient({
  initialData,
  initialSearchParams,
  initialSearchTerm,
}: MapsPageClientProps) {
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [selectedMapIds, setSelectedMapIds] = useState<Set<string>>(new Set());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    startTransition(() => {
      const params = new URLSearchParams(window.location.search);
      if (value) {
        params.set('search', value);
      } else {
        params.delete('search');
      }
      params.set('offset', '0'); // Reset to first page
      window.history.pushState(null, '', `?${params.toString()}`);
      window.location.reload();
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    startTransition(() => {
      const params = new URLSearchParams(window.location.search);
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.set('offset', '0'); // Reset to first page
      window.history.pushState(null, '', `?${params.toString()}`);
      window.location.reload();
    });
  };

  const toggleMapSelection = (id: string) => {
    setSelectedMapIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedMapIds(new Set(initialData.maps.map(m => m.id)));
  };

  const clearSelection = () => {
    setSelectedMapIds(new Set());
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">地图管理</h1>
        <p className="text-gray-600">
          共 {initialData.total} 张地图
          {selectedMapIds.size > 0 && ` • 已选择 ${selectedMapIds.size} 项`}
        </p>
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex gap-4 flex-wrap items-center">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="搜索地图..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                handleSearch(searchTerm);
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filters */}
        <select
          value={initialSearchParams?.filters?.mapType || ''}
          onChange={e => handleFilterChange('mapType', e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">所有类型</option>
          <option value="TOPOGRAPHIC">地形图</option>
          <option value="ROAD">道路图</option>
          <option value="CITY">城市图</option>
          <option value="HISTORICAL">历史地图</option>
          <option value="THEMATIC">专题地图</option>
          <option value="NAUTICAL">航海图</option>
          <option value="AERONAUTICAL">航空图</option>
          <option value="OTHER">其他</option>
        </select>

        <select
          value={initialSearchParams?.filters?.status || ''}
          onChange={e => handleFilterChange('status', e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">所有状态</option>
          <option value="COLLECTION">收藏中</option>
          <option value="FOR_SALE">待售</option>
          <option value="SOLD">已售出</option>
          <option value="DISPLAY">展示中</option>
          <option value="FRAMED">已装裱</option>
        </select>

        {/* Actions */}
        <button
          onClick={() => setIsCreateDialogOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          添加地图
        </button>

        {selectedMapIds.size > 0 && (
          <>
            <button
              onClick={clearSelection}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              取消选择
            </button>
            <button
              onClick={() => {
                if (confirm(`确定要删除选中的 ${selectedMapIds.size} 张地图吗？`)) {
                  // TODO: Implement batch delete
                  alert('批量删除功能待实现');
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              批量删除
            </button>
          </>
        )}
      </div>

      {/* Loading State */}
      {isPending && <div className="mb-4 p-4 bg-blue-50 text-blue-700 rounded-lg">加载中...</div>}

      {/* Map Grid */}
      {initialData.maps.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-xl mb-2">暂无地图</p>
          <p className="text-sm">点击&quot;添加地图&quot;按钮开始添加</p>
        </div>
      ) : (
        <>
          {/* Selection Controls */}
          <div className="mb-4 flex gap-2">
            <button onClick={selectAll} className="text-sm text-blue-600 hover:underline">
              全选
            </button>
            {selectedMapIds.size > 0 && (
              <button onClick={clearSelection} className="text-sm text-gray-600 hover:underline">
                清除选择
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {initialData.maps.map(map => (
              <div
                key={map.id}
                className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                  selectedMapIds.has(map.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => toggleMapSelection(map.id)}
              >
                {/* Image */}
                {map.mainImage && (
                  <div className="mb-3">
                    <img
                      src={map.mainImage}
                      alt={map.name}
                      className="w-full h-48 object-cover rounded"
                    />
                  </div>
                )}

                {/* Item Number */}
                <div className="text-sm text-gray-500 mb-1">#{map.itemNumber}</div>

                {/* Name */}
                <h3 className="text-lg font-semibold mb-2 line-clamp-2">{map.name}</h3>

                {/* Details */}
                <div className="text-sm text-gray-600 space-y-1">
                  {map.region && <div>地区：{map.region}</div>}
                  {map.publishedYear && <div>年份：{map.publishedYear}</div>}
                  {map.publisher && <div className="line-clamp-1">出版社：{map.publisher}</div>}
                </div>

                {/* Location */}
                {map.location && (
                  <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
                    {map.location}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination Info */}
          <div className="mt-6 text-center text-sm text-gray-600">
            显示 {(initialSearchParams?.skip || 0) + 1} -{' '}
            {Math.min(
              (initialSearchParams?.skip || 0) + initialData.maps.length,
              initialData.total
            )}{' '}
            / 共 {initialData.total} 项{initialData.hasMore && ' • 还有更多'}
          </div>
        </>
      )}

      {/* Create Dialog Placeholder */}
      {isCreateDialogOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setIsCreateDialogOpen(false)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-2xl w-full"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4">添加地图</h2>
            <p className="text-gray-600 mb-4">表单功能待实现</p>
            <button
              onClick={() => setIsCreateDialogOpen(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
