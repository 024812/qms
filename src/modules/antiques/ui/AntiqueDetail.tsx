/**
 * Antique Detail Component
 *
 * Display component for antique item detail view.
 */

import React from 'react';
import type { AntiqueItem } from '../schema';

interface AntiqueDetailProps {
  item: AntiqueItem;
}

export function AntiqueDetail({ item }: AntiqueDetailProps) {
  const categoryMap: Record<string, string> = {
    JADE: '玉器',
    WOOD: '木器',
    CERAMIC: '陶瓷',
    METAL: '金属',
    STONE: '石器',
    PAPER: '纸品',
    OTHER: '其他',
  };

  const statusMap: Record<string, string> = {
    COLLECTION: '收藏中',
    FOR_SALE: '待售',
    SOLD: '已售出',
    DISPLAY: '展示中',
    APPRAISAL: '鉴定中',
  };

  const formatValue = (value: string | null) => {
    if (!value) return '未记录';
    const num = parseFloat(value);
    return `¥${num.toLocaleString()}`;
  };

  const formatDimension = (value: string | null, unit: string) => {
    if (!value) return null;
    return `${value} ${unit}`;
  };

  const formatDate = (date: string | null) => {
    if (!date) return '未记录';
    return new Date(date).toLocaleDateString('zh-CN');
  };

  return (
    <div className="space-y-6">
      {/* Images */}
      {item.mainImage && (
        <div className="space-y-4">
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
            <img src={item.mainImage} alt={item.name} className="h-full w-full object-contain" />
          </div>

          {item.attachmentImages && item.attachmentImages.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {item.attachmentImages.map((img, idx) => (
                <div key={idx} className="aspect-square overflow-hidden rounded-md bg-muted">
                  <img
                    src={img}
                    alt={`${item.name} - ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Basic Information */}
      <div>
        <h2 className="mb-4 text-xl font-bold">基本信息</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-muted-foreground">编号</span>
            <p className="font-medium">#{item.itemNumber}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">类别</span>
            <p className="font-medium">{categoryMap[item.category]}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">材质</span>
            <p className="font-medium">{item.material || '未记录'}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">状态</span>
            <p className="font-medium">{statusMap[item.status]}</p>
          </div>
          {item.era && (
            <div>
              <span className="text-sm text-muted-foreground">年代</span>
              <p className="font-medium">{item.era}</p>
            </div>
          )}
          {item.dynasty && (
            <div>
              <span className="text-sm text-muted-foreground">朝代</span>
              <p className="font-medium">{item.dynasty}</p>
            </div>
          )}
        </div>
      </div>

      {/* Dimensions */}
      {(item.lengthCm || item.widthCm || item.heightCm || item.weightG) && (
        <div>
          <h2 className="mb-4 text-xl font-bold">尺寸规格</h2>
          <div className="grid grid-cols-2 gap-4">
            {item.lengthCm && (
              <div>
                <span className="text-sm text-muted-foreground">长度</span>
                <p className="font-medium">{formatDimension(item.lengthCm, 'cm')}</p>
              </div>
            )}
            {item.widthCm && (
              <div>
                <span className="text-sm text-muted-foreground">宽度</span>
                <p className="font-medium">{formatDimension(item.widthCm, 'cm')}</p>
              </div>
            )}
            {item.heightCm && (
              <div>
                <span className="text-sm text-muted-foreground">高度</span>
                <p className="font-medium">{formatDimension(item.heightCm, 'cm')}</p>
              </div>
            )}
            {item.weightG && (
              <div>
                <span className="text-sm text-muted-foreground">重量</span>
                <p className="font-medium">{formatDimension(item.weightG, 'g')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Condition & Certification */}
      {(item.condition || item.certificate || item.appraisalBy) && (
        <div>
          <h2 className="mb-4 text-xl font-bold">品相与鉴定</h2>
          <div className="space-y-3">
            {item.condition && (
              <div>
                <span className="text-sm text-muted-foreground">品相</span>
                <p className="mt-1">{item.condition}</p>
              </div>
            )}
            {item.certificate && (
              <div>
                <span className="text-sm text-muted-foreground">证书</span>
                <p className="mt-1">{item.certificate}</p>
              </div>
            )}
            {item.appraisalBy && (
              <div>
                <span className="text-sm text-muted-foreground">鉴定机构/专家</span>
                <p className="mt-1">{item.appraisalBy}</p>
              </div>
            )}
            {item.appraisalDate && (
              <div>
                <span className="text-sm text-muted-foreground">鉴定日期</span>
                <p className="mt-1">{formatDate(item.appraisalDate)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Value Information */}
      <div>
        <h2 className="mb-4 text-xl font-bold">价值信息</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-muted-foreground">购入价格</span>
            <p className="font-medium">{formatValue(item.purchasePrice)}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">当前价值</span>
            <p className="font-medium text-green-600">{formatValue(item.currentValue)}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">估值</span>
            <p className="font-medium">{formatValue(item.estimatedValue)}</p>
          </div>
          {item.acquiredFrom && (
            <div>
              <span className="text-sm text-muted-foreground">来源</span>
              <p className="font-medium">{item.acquiredFrom}</p>
            </div>
          )}
          {item.acquiredDate && (
            <div className="col-span-2">
              <span className="text-sm text-muted-foreground">获得日期</span>
              <p className="font-medium">{formatDate(item.acquiredDate)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Storage & Location */}
      {item.location && (
        <div>
          <h2 className="mb-4 text-xl font-bold">存放信息</h2>
          <div>
            <span className="text-sm text-muted-foreground">存放位置</span>
            <p className="mt-1">{item.location}</p>
          </div>
        </div>
      )}

      {/* Notes */}
      {item.notes && (
        <div>
          <h2 className="mb-4 text-xl font-bold">备注</h2>
          <p className="whitespace-pre-wrap text-muted-foreground">{item.notes}</p>
        </div>
      )}

      {/* Metadata */}
      <div className="border-t pt-4">
        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div>
            <span>创建时间</span>
            <p>{new Date(item.createdAt).toLocaleString('zh-CN')}</p>
          </div>
          <div>
            <span>更新时间</span>
            <p>{new Date(item.updatedAt).toLocaleString('zh-CN')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
