'use client';

import { useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PackageOpen, SearchX } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function CardsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">球星卡管理</h1>
          <p className="text-muted-foreground mt-1">管理体育球星卡收藏，追踪价值和评级信息</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          添加球星卡
        </Button>
      </div>

      <EmptyState
        icon={PackageOpen}
        title="暂无球星卡"
        description="开始添加您的球星卡收藏"
        action={{
          label: '添加球星卡',
          onClick: () => {
            // TODO: Open add dialog
          },
        }}
      />
    </div>
  );
}
