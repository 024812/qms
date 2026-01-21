/**
 * Dynamic Module Item Detail Page
 * 
 * This page displays detailed information about a specific item.
 * It uses the module's DetailComponent if available, or falls back to a generic view.
 * 
 * Requirements: 3.1, 3.3
 */

import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { getModule } from '@/modules/registry';
import { getItemById, getUsageLogs } from '@/app/actions/items';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit } from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from '@/modules/core/ui/StatusBadge';

interface PageProps {
  params: Promise<{
    category: string;
    id: string;
  }>;
}

export default async function ItemDetailPage(props: PageProps) {
  // Await params (Next.js 15+ requirement)
  const params = await props.params;
  
  // Verify authentication
  const session = await auth();
  if (!session?.user) {
    return notFound();
  }

  // Get module configuration
  const moduleConfig = getModule(params.category);
  if (!moduleConfig) {
    return notFound();
  }

  // Fetch item
  let item;
  try {
    item = await getItemById(params.category, params.id);
  } catch (error) {
    return notFound();
  }

  // Verify item exists
  if (!item) {
    return notFound();
  }

  // Normalize item for view
  const anyItem = item as any;
  const itemName = anyItem.name || anyItem.playerName || 'Item';
  const itemStatus = anyItem.status || anyItem.currentStatus || 'UNKNOWN';
  const itemImages = anyItem.images || [anyItem.mainImage, ...(anyItem.attachmentImages || [])].filter(Boolean);
  const itemCreatedAt = anyItem.createdAt ? new Date(anyItem.createdAt) : new Date();
  const itemUpdatedAt = anyItem.updatedAt ? new Date(anyItem.updatedAt) : new Date();

  // Fetch usage logs
  const logs = await getUsageLogs(params.id);

  return (
    <div className="container mx-auto py-8 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${params.category}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回列表
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{itemName}</h1>
            <div className="flex items-center gap-2 mt-2">
              <StatusBadge status={itemStatus} />
              <Badge variant="outline">{moduleConfig.name}</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/${params.category}/${params.id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              编辑
            </Button>
          </Link>
        </div>
      </div>

      {/* Detail View */}
      {moduleConfig.DetailComponent ? (
        <moduleConfig.DetailComponent item={item} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>详细信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">名称</div>
                <div className="font-medium">{itemName}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">状态</div>
                <div className="font-medium">
                  <StatusBadge status={itemStatus} />
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">创建时间</div>
                <div className="font-medium">
                  {itemCreatedAt.toLocaleDateString('zh-CN')}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">更新时间</div>
                <div className="font-medium">
                  {itemUpdatedAt.toLocaleDateString('zh-CN')}
                </div>
              </div>
            </div>

            {/* Attributes */}
            {anyItem.attributes && Object.keys(anyItem.attributes).length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">属性</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(anyItem.attributes).map(([key, value]) => {
                    const field = moduleConfig.formFields.find((f: any) => f.name === key);
                    return (
                      <div key={key}>
                        <div className="text-sm text-muted-foreground">
                          {field?.label || key}
                        </div>
                        <div className="font-medium">
                          {field?.type === 'select' && field.options
                            ? field.options.find((opt: any) => opt.value === value)?.label || String(value)
                            : String(value)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Images */}
            {itemImages.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">图片</h3>
                <div className="grid grid-cols-3 gap-4">
                  {itemImages.map((url: string, index: number) => (
                    <img
                      key={index}
                      src={url}
                      alt={`${itemName} - ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Usage Logs */}
      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>操作历史</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <div className="font-medium">{log.action}</div>
                    {log.metadata && (
                      <div className="text-sm text-muted-foreground">
                        {JSON.stringify(log.metadata)}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString('zh-CN')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
