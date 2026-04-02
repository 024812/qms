import * as React from 'react';
import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

/**
 * Card Skeleton
 * Used for loading card-based content
 */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border border-border p-6 shadow-sm', className)}>
      <div className="space-y-3">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  );
}

/**
 * Table Skeleton
 * Used for loading table data
 */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  const headerKeys = Array.from({ length: columns }, (_, index) => `header-${index + 1}`);
  const rowKeys = Array.from({ length: rows }, (_, index) => `row-${index + 1}`);
  const cellKeys = Array.from({ length: columns }, (_, index) => `cell-${index + 1}`);

  return (
    <div className="space-y-3">
      {/* Table Header */}
      <div className="flex gap-4 border-b border-border pb-3">
        {headerKeys.map(key => (
          <Skeleton key={key} className="h-4 flex-1" />
        ))}
      </div>
      {/* Table Rows */}
      {rowKeys.map(rowKey => (
        <div key={rowKey} className="flex gap-4">
          {cellKeys.map(cellKey => (
            <Skeleton key={`${rowKey}-${cellKey}`} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Form Skeleton
 * Used for loading form fields
 */
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  const fieldKeys = Array.from({ length: fields }, (_, index) => `field-${index + 1}`);

  return (
    <div className="space-y-4">
      {fieldKeys.map(key => (
        <div key={key} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
      <div className="flex gap-3 pt-4">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  );
}

/**
 * List Skeleton
 * Used for loading list items
 */
export function ListSkeleton({ items = 5 }: { items?: number }) {
  const itemKeys = Array.from({ length: items }, (_, index) => `item-${index + 1}`);

  return (
    <div className="space-y-3">
      {itemKeys.map(key => (
        <div key={key} className="flex items-center gap-4 rounded-lg border border-border p-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Dashboard Stats Skeleton
 * Used for loading dashboard statistics cards
 */
export function DashboardStatsSkeleton({ cards = 4 }: { cards?: number }) {
  const cardKeys = Array.from({ length: cards }, (_, index) => `stat-${index + 1}`);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cardKeys.map(key => (
        <div key={key} className="rounded-lg border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-12 w-12 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Page Skeleton
 * Used for loading entire page content
 */
export function PageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      {/* Stats */}
      <DashboardStatsSkeleton />
      {/* Content */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
