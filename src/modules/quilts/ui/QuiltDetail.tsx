/**
 * QuiltDetail Component for Module System
 * 
 * This component displays comprehensive quilt information in the detail view.
 * It preserves the existing design and functionality while being compatible
 * with the module registry system.
 * 
 * Key features:
 * - Displays all 24+ quilt fields in an organized layout
 * - Shows image carousel/gallery for main and attachment images
 * - Displays usage history (if available)
 * - Compatible with both module system and existing routes
 * - Responsive design with grid layout
 * 
 * Requirements: 4.1
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Calendar, Ruler, Weight, Palette, MapPin, Box } from 'lucide-react';
import Image from 'next/image';
import type { QuiltItem } from '../schema';

interface QuiltDetailProps {
  item: QuiltItem;
}

/**
 * Get season badge color based on season type
 */
function getSeasonColor(season: string) {
  switch (season) {
    case 'WINTER':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'SUMMER':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'SPRING_AUTUMN':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

/**
 * Get status badge color based on status type
 */
function getStatusColor(status: string) {
  switch (status) {
    case 'IN_USE':
      return 'bg-green-100 text-green-800';
    case 'STORAGE':
      return 'bg-gray-100 text-gray-800';
    case 'MAINTENANCE':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get localized season label
 */
function getSeasonLabel(season: string): string {
  const seasonMap: Record<string, string> = {
    WINTER: '冬季',
    SPRING_AUTUMN: '春秋',
    SUMMER: '夏季',
  };
  return seasonMap[season] || season;
}

/**
 * Get localized status label
 */
function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    IN_USE: '使用中',
    STORAGE: '存储中',
    MAINTENANCE: '维护中',
  };
  return statusMap[status] || status;
}

/**
 * Format date to localized string
 */
function formatDate(date: Date | null | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Detail field component for consistent styling
 */
function DetailField({
  icon: Icon,
  label,
  value,
  fullWidth = false,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? 'col-span-2' : ''}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
        {Icon && <Icon className="w-4 h-4" />}
        <span>{label}</span>
      </div>
      <div className="font-medium text-foreground">{value}</div>
    </div>
  );
}

/**
 * QuiltDetail Component
 * 
 * Displays comprehensive quilt information including:
 * - Image gallery (main image + attachment images)
 * - Basic information (item number, name, season, status)
 * - Dimensions and physical properties
 * - Material information
 * - Purchase and storage information
 * - Additional notes
 * 
 * Layout:
 * - Top: Image gallery
 * - Middle: Information cards organized by category
 * - Bottom: Usage history (if available)
 */
export function QuiltDetail({ item }: QuiltDetailProps) {
  // Collect all images (main + attachments)
  const allImages: string[] = [];
  if (item.mainImage) {
    allImages.push(item.mainImage);
  }
  if (item.attachmentImages && item.attachmentImages.length > 0) {
    allImages.push(...item.attachmentImages);
  }

  return (
    <div className="space-y-6">
      {/* Image Gallery */}
      {allImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>图片</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allImages.map((imageUrl, index) => (
                <div
                  key={index}
                  className="relative aspect-square bg-muted rounded-lg overflow-hidden"
                >
                  <Image
                    src={imageUrl}
                    alt={`${item.name} - 图片 ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  {index === 0 && (
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="text-xs">
                        主图
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailField
              icon={Package}
              label="物品编号"
              value={`#${item.itemNumber}`}
            />
            <DetailField
              label="名称"
              value={item.name}
            />
            <DetailField
              label="适用季节"
              value={
                <Badge variant="outline" className={getSeasonColor(item.season)}>
                  {getSeasonLabel(item.season)}
                </Badge>
              }
            />
            <DetailField
              label="当前状态"
              value={
                <Badge className={getStatusColor(item.currentStatus)}>
                  {getStatusLabel(item.currentStatus)}
                </Badge>
              }
            />
            {item.groupId && (
              <DetailField
                label="分组ID"
                value={item.groupId}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dimensions and Physical Properties */}
      <Card>
        <CardHeader>
          <CardTitle>尺寸与重量</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailField
              icon={Ruler}
              label="长度"
              value={item.lengthCm ? `${item.lengthCm} 厘米` : '-'}
            />
            <DetailField
              icon={Ruler}
              label="宽度"
              value={item.widthCm ? `${item.widthCm} 厘米` : '-'}
            />
            <DetailField
              icon={Weight}
              label="重量"
              value={item.weightGrams ? `${item.weightGrams} 克 (${(item.weightGrams / 1000).toFixed(2)} 千克)` : '-'}
            />
            {(item.lengthCm && item.widthCm) && (
              <DetailField
                label="总尺寸"
                value={`${item.lengthCm} × ${item.widthCm} 厘米`}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Material Information */}
      <Card>
        <CardHeader>
          <CardTitle>材料信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailField
              label="填充材料"
              value={item.fillMaterial}
            />
            <DetailField
              icon={Palette}
              label="颜色"
              value={item.color}
            />
            {item.materialDetails && (
              <DetailField
                label="材料详情"
                value={item.materialDetails}
                fullWidth
              />
            )}
            {item.brand && (
              <DetailField
                label="品牌"
                value={item.brand}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Purchase and Storage Information */}
      <Card>
        <CardHeader>
          <CardTitle>购买与存储</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailField
              icon={Calendar}
              label="购买日期"
              value={formatDate(item.purchaseDate)}
            />
            <DetailField
              icon={MapPin}
              label="存放位置"
              value={item.location}
            />
            {item.packagingInfo && (
              <DetailField
                icon={Box}
                label="包装信息"
                value={item.packagingInfo}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      {item.notes && (
        <Card>
          <CardHeader>
            <CardTitle>备注</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground whitespace-pre-wrap">{item.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Timestamps */}
      <Card>
        <CardHeader>
          <CardTitle>记录信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailField
              icon={Calendar}
              label="创建时间"
              value={formatDate(item.createdAt)}
            />
            <DetailField
              icon={Calendar}
              label="更新时间"
              value={formatDate(item.updatedAt)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
