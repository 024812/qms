/**
 * ItemList Component
 * 
 * Generic list component that displays items in a responsive grid layout.
 * Handles empty states and delegates card rendering to ItemCard component.
 * 
 * Requirements: 4.1, 4.2
 */

'use client';

// Generic Item type for list display
 
interface Item {
  id: string;
  name: string;
  createdAt: Date;
  type?: string;
  status?: string;
  [key: string]: any; // Allow other properties for Quilt/Card types
}
import { ItemCard } from './ItemCard';
import { useRouter } from 'next/navigation';
import { getModule } from '@/modules/registry';

/**
 * ItemList Props
 */
interface ItemListProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[];
  moduleType: string;
}

/**
 * ItemList Component
 * 
 * Displays a grid of item cards with responsive layout.
 * Shows an empty state when no items are available.
 */
export function ItemList({ items, moduleType }: ItemListProps) {
  const router = useRouter();
  const module = getModule(moduleType);

  // Handle empty state
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <svg
            className="h-12 w-12 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2">暂无数据</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {module ? `还没有添加任何${module.name}` : '还没有添加任何物品'}
        </p>
        <p className="text-xs text-muted-foreground">
          点击右上角的"添加"按钮创建第一个物品
        </p>
      </div>
    );
  }

  // Render grid of items
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          onClick={() => router.push(`/${moduleType}/${item.id}`)}
        />
      ))}
    </div>
  );
}
