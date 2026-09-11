'use client';

/**
 * PaddlesPageClient Component
 *
 * Client shell for the paddles page.
 * Handles UI state, dialogs, and interactions.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { PaddleItem } from '@/modules/paddles/schema';
import type { PaddleSearchInput } from '@/app/actions/paddles';
import { PaddleCard } from '@/modules/paddles/ui/PaddleCard';

interface PaddlesPageClientProps {
  initialData: {
    paddles: PaddleItem[];
    total: number;
    hasMore: boolean;
  };
  initialSearchParams?: PaddleSearchInput;
  initialSearchTerm: string;
}

export function PaddlesPageClient({
  initialData,
  initialSearchParams,
  initialSearchTerm,
}: PaddlesPageClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    startTransition(() => {
      const params = new URLSearchParams();
      if (term) params.set('search', term);
      if (initialSearchParams?.filters?.status) {
        params.set('status', initialSearchParams.filters.status);
      }
      router.push(`/paddles?${params.toString()}`);
    });
  };

  const handleCardClick = (paddle: PaddleItem) => {
    router.push(`/paddles/${paddle.id}`);
  };

  const handleCreateNew = () => {
    // Navigate to create page or open dialog
    router.push('/paddles/new');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">乒乓球底板管理</h1>
          <p className="text-gray-600 mt-1">共 {initialData.total} 个底板</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + 新增底板
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="搜索底板名称、品牌、型号、胶皮..."
          value={searchTerm}
          onChange={e => handleSearch(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isPending}
        />
      </div>

      {/* Status Filter */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {[
          { label: '全部', value: undefined },
          { label: '使用中', value: 'ACTIVE' },
          { label: '已退役', value: 'RETIRED' },
          { label: '待售', value: 'FOR_SALE' },
          { label: '已售出', value: 'SOLD' },
          { label: '展示', value: 'DISPLAY' },
        ].map(({ label, value }) => (
          <button
            key={label}
            onClick={() => {
              startTransition(() => {
                const params = new URLSearchParams();
                if (searchTerm) params.set('search', searchTerm);
                if (value) params.set('status', value);
                router.push(`/paddles?${params.toString()}`);
              });
            }}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              (value === undefined && !initialSearchParams?.filters?.status) ||
              initialSearchParams?.filters?.status === value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            disabled={isPending}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isPending && <div className="text-center py-8 text-gray-500">加载中...</div>}

      {/* Paddles Grid */}
      {!isPending && initialData.paddles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">暂无底板数据</p>
          <button
            onClick={handleCreateNew}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            添加第一个底板
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {initialData.paddles.map(paddle => (
            <PaddleCard key={paddle.id} item={paddle} onClick={() => handleCardClick(paddle)} />
          ))}
        </div>
      )}

      {/* Pagination Info */}
      {initialData.hasMore && (
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            显示 {initialData.paddles.length} / {initialData.total} 个底板
          </p>
        </div>
      )}
    </div>
  );
}
