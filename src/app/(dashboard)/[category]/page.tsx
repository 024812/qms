/**
 * Dynamic Module List Page
 * 
 * This page displays a list of items for any registered module.
 * It uses the module registry to dynamically render the appropriate UI.
 * 
 * Requirements: 3.1, 3.3
 */

import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { getModule } from '@/modules/registry';
import { getItems } from '@/app/actions/items';
import { ItemList } from '@/modules/core/ui/ItemList';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: {
    category: string;
  };
  searchParams: {
    page?: string;
    status?: string;
  };
}

export default async function CategoryListPage({ params, searchParams }: PageProps) {
  // Verify authentication
  const session = await auth();
  if (!session?.user) {
    return notFound();
  }

  // Get module configuration
  const module = getModule(params.category);
  if (!module) {
    return notFound();
  }

  // Parse query parameters
  const page = parseInt(searchParams.page || '1', 10);
  const status = searchParams.status;

  // Fetch items
  const result = await getItems(params.category, {
    page,
    pageSize: 20,
    status,
  });

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{module.name}</h1>
          <p className="text-muted-foreground mt-1">{module.description}</p>
        </div>
        <Link href={`/${params.category}/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            添加{module.name}
          </Button>
        </Link>
      </div>

      {/* Statistics */}
      {module.statsConfig && result.data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {module.statsConfig.metrics.map((metric) => (
            <div
              key={metric.key}
              className="p-4 border rounded-lg bg-card"
            >
              <div className="text-sm text-muted-foreground">{metric.label}</div>
              <div className="text-2xl font-bold mt-1">
                {metric.calculate(result.data)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Item List */}
      <ItemList items={result.data} moduleType={params.category} />

      {/* Pagination */}
      {result.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link href={`/${params.category}?page=${page - 1}`}>
              <Button variant="outline">上一页</Button>
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            第 {page} 页，共 {result.totalPages} 页
          </span>
          {page < result.totalPages && (
            <Link href={`/${params.category}?page=${page + 1}`}>
              <Button variant="outline">下一页</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
