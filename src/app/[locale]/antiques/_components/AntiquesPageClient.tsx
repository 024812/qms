'use client';

import { useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { AntiqueItem } from '@/modules/antiques/schema';
import { AntiqueCard } from '@/modules/antiques/ui/AntiqueCard';

interface AntiquesPageClientProps {
  initialAntiques: AntiqueItem[];
  initialTotal: number;
  initialPage: number;
  initialPageSize: number;
  initialSearch?: string;
  initialCategory?: string;
  initialStatus?: string;
}

export function AntiquesPageClient({
  initialAntiques,
  initialTotal,
  initialPage,
  initialPageSize,
  initialSearch,
  initialCategory,
  initialStatus,
}: AntiquesPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(initialSearch || '');
  const [category, setCategory] = useState(initialCategory || '');
  const [status, setStatus] = useState(initialStatus || '');

  const totalPages = Math.ceil(initialTotal / initialPageSize);

  const updateUrl = (params: Record<string, string | undefined>) => {
    const newParams = new URLSearchParams(searchParams.toString());

    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });

    startTransition(() => {
      router.push(`${pathname}?${newParams.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl({ search: search || undefined, page: '1' });
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    updateUrl({ category: value || undefined, page: '1' });
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    updateUrl({ status: value || undefined, page: '1' });
  };

  const handlePageChange = (page: number) => {
    updateUrl({ page: page.toString() });
  };

  const categoryOptions = [
    { label: '全部类别', value: '' },
    { label: '玉器', value: 'JADE' },
    { label: '木器', value: 'WOOD' },
    { label: '陶瓷', value: 'CERAMIC' },
    { label: '金属', value: 'METAL' },
    { label: '石器', value: 'STONE' },
    { label: '纸品', value: 'PAPER' },
    { label: '其他', value: 'OTHER' },
  ];

  const statusOptions = [
    { label: '全部状态', value: '' },
    { label: '收藏中', value: 'COLLECTION' },
    { label: '待售', value: 'FOR_SALE' },
    { label: '已售出', value: 'SOLD' },
    { label: '展示中', value: 'DISPLAY' },
    { label: '鉴定中', value: 'APPRAISAL' },
  ];

  return (
    <div className="container mx-auto space-y-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">文玩管理</h1>
          <p className="text-muted-foreground">共 {initialTotal} 件藏品</p>
        </div>
        <button
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          onClick={() => router.push(`${pathname}/new`)}
        >
          添加文玩
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-4 rounded-lg border bg-card p-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="搜索名称、材质、备注..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 rounded-md border bg-background px-3 py-2"
          />
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
            disabled={isPending}
          >
            搜索
          </button>
        </form>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium">类别</label>
            <select
              value={category}
              onChange={e => handleCategoryChange(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2"
              disabled={isPending}
            >
              {categoryOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium">状态</label>
            <select
              value={status}
              onChange={e => handleStatusChange(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2"
              disabled={isPending}
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {isPending && (
        <div className="rounded-lg border bg-muted p-4 text-center text-muted-foreground">
          加载中...
        </div>
      )}

      {/* Antiques Grid */}
      {initialAntiques.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          暂无文玩记录
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {initialAntiques.map(antique => (
            <div
              key={antique.id}
              className="cursor-pointer transition-transform hover:scale-105"
              onClick={() => router.push(`${pathname}/${antique.id}`)}
            >
              <AntiqueCard item={antique} />
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handlePageChange(initialPage - 1)}
            disabled={initialPage <= 1 || isPending}
            className="rounded-md border bg-card px-3 py-1 disabled:opacity-50"
          >
            上一页
          </button>

          <span className="text-sm text-muted-foreground">
            第 {initialPage} / {totalPages} 页
          </span>

          <button
            onClick={() => handlePageChange(initialPage + 1)}
            disabled={initialPage >= totalPages || isPending}
            className="rounded-md border bg-card px-3 py-1 disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
