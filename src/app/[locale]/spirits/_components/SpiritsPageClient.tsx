'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Spirit } from '@/modules/spirits/schema';

interface SpiritsPageClientProps {
  initialSpirits: Spirit[];
  initialFilters: {
    page: number;
    pageSize: number;
    search?: string;
    spiritType?: string;
    status?: string;
    bottleStatus?: string;
    brand?: string;
    country?: string;
    region?: string;
    limitedEdition?: string;
    sort: string;
  };
}

export function SpiritsPageClient({ initialSpirits, initialFilters }: SpiritsPageClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialFilters.search ?? '');
  const [spiritType, setSpiritType] = useState(initialFilters.spiritType ?? '');
  const [status, setStatus] = useState(initialFilters.status ?? '');

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (spiritType) params.set('spiritType', spiritType);
    if (status) params.set('status', status);
    params.set('page', '1');
    params.set('pageSize', String(initialFilters.pageSize));
    params.set('sort', initialFilters.sort);

    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

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

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">藏酒管理</h1>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">搜索</label>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="名称、品牌、酒厂..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">酒类</label>
              <select
                value={spiritType}
                onChange={e => setSpiritType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">全部</option>
                {Object.entries(spiritTypeMap).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">全部</option>
                {Object.entries(statusMap).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={isPending}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isPending ? '搜索中...' : '搜索'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="text-sm text-gray-600">
            共找到 <span className="font-semibold">{initialSpirits.length}</span> 件藏酒
          </div>
        </div>
      </div>

      {/* Spirits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {initialSpirits.map(spirit => (
          <div
            key={spirit.id}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4 cursor-pointer"
            onClick={() => router.push(`/spirits/${spirit.id}`)}
          >
            {spirit.mainImage && (
              <div className="mb-3">
                <img
                  src={spirit.mainImage}
                  alt={spirit.name}
                  className="w-full h-48 object-cover rounded"
                />
              </div>
            )}
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-lg">{spirit.name}</h3>
                <span className="text-sm text-gray-500">#{spirit.itemNumber}</span>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">{spiritTypeMap[spirit.spiritType]}</span>
                {spirit.brand && <span className="ml-2">· {spirit.brand}</span>}
              </div>
              {(spirit.vintage || spirit.age) && (
                <div className="text-sm text-gray-600">
                  {spirit.vintage && <span>{spirit.vintage}年</span>}
                  {spirit.vintage && spirit.age && <span> · </span>}
                  {spirit.age && <span>{spirit.age}年陈</span>}
                </div>
              )}
              {spirit.abv && <div className="text-sm text-gray-600">酒精度: {spirit.abv}%</div>}
              <div className="flex gap-2 text-sm">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  {statusMap[spirit.status]}
                </span>
                {spirit.limitedEdition && (
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded">限量版</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {initialSpirits.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">暂无藏酒记录</p>
          <p className="text-sm mt-2">点击右上角按钮添加新的藏酒</p>
        </div>
      )}
    </div>
  );
}
