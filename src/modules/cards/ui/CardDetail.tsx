/**
 * CardDetail Component for Module System
 * 
 * This component displays comprehensive sports card information in the detail view.
 * It shows all card details including player info, grading, value tracking, and special features.
 * 
 * Key features:
 * - Displays all card fields in an organized layout
 * - Shows image carousel/gallery for main and attachment images
 * - Displays grading and value information
 * - Shows special features (autograph, memorabilia)
 * - Compatible with module registry system
 * - Responsive design with grid layout
 * 
 * Requirements: 4.1
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Calendar, 
  Award, 
  TrendingUp, 
  MapPin, 
  Box,
  Pen,
  Star,
  User,
  Trophy
} from 'lucide-react';
import Image from 'next/image';
import type { CardItem } from '../schema';

interface CardDetailProps {
  item: CardItem;
}

/**
 * Get sport badge color based on sport type
 */
function getSportColor(sport: string) {
  switch (sport) {
    case 'BASKETBALL':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'BASEBALL':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'FOOTBALL':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'SOCCER':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'HOCKEY':
      return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

/**
 * Get status badge color based on status type
 */
function getStatusColor(status: string) {
  switch (status) {
    case 'COLLECTION':
      return 'bg-blue-100 text-blue-800';
    case 'FOR_SALE':
      return 'bg-green-100 text-green-800';
    case 'SOLD':
      return 'bg-gray-100 text-gray-800';
    case 'GRADING':
      return 'bg-yellow-100 text-yellow-800';
    case 'DISPLAY':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get localized sport label
 */
function getSportLabel(sport: string): string {
  const sportMap: Record<string, string> = {
    BASKETBALL: '篮球',
    BASEBALL: '棒球',
    FOOTBALL: '橄榄球',
    SOCCER: '足球',
    HOCKEY: '冰球',
    OTHER: '其他',
  };
  return sportMap[sport] || sport;
}

/**
 * Get localized status label
 */
function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    COLLECTION: '收藏中',
    FOR_SALE: '待售',
    SOLD: '已售出',
    GRADING: '评级中',
    DISPLAY: '展示中',
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
 * Format currency value
 */
function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Calculate value change
 */
function calculateValueChange(currentValue: number | null, purchasePrice: number | null): {
  change: number;
  percentage: number;
  isPositive: boolean;
} | null {
  if (!currentValue || !purchasePrice || purchasePrice === 0) return null;
  
  const change = currentValue - purchasePrice;
  const percentage = (change / purchasePrice) * 100;
  
  return {
    change: Math.round(change * 100) / 100,
    percentage: Math.round(percentage * 100) / 100,
    isPositive: change >= 0,
  };
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
 * CardDetail Component
 * 
 * Displays comprehensive sports card information including:
 * - Image gallery (main image + attachment images)
 * - Player information (name, sport, team, position)
 * - Card details (year, brand, series, card number)
 * - Grading information (company, grade, certification)
 * - Value tracking (purchase price, current value, ROI)
 * - Physical details (parallel, serial number, autograph, memorabilia)
 * - Storage and condition information
 * 
 * Layout:
 * - Top: Image gallery
 * - Middle: Information cards organized by category
 * - Bottom: Timestamps
 */
export function CardDetail({ item }: CardDetailProps) {
  // Collect all images (main + attachments)
  const allImages: string[] = [];
  if (item.mainImage) {
    allImages.push(item.mainImage);
  }
  if (item.attachmentImages && item.attachmentImages.length > 0) {
    allImages.push(...item.attachmentImages);
  }

  // Calculate value change
  const valueChange = calculateValueChange(item.currentValue, item.purchasePrice);

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
                    alt={`${item.playerName} - 图片 ${index + 1}`}
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
              icon={CreditCard}
              label="物品编号"
              value={`#${item.itemNumber}`}
            />
            <DetailField
              icon={User}
              label="球员姓名"
              value={item.playerName}
            />
            <DetailField
              label="运动类型"
              value={
                <Badge variant="outline" className={getSportColor(item.sport)}>
                  {getSportLabel(item.sport)}
                </Badge>
              }
            />
            <DetailField
              label="当前状态"
              value={
                <Badge className={getStatusColor(item.status)}>
                  {getStatusLabel(item.status)}
                </Badge>
              }
            />
            {item.team && (
              <DetailField
                icon={Trophy}
                label="球队"
                value={item.team}
              />
            )}
            {item.position && (
              <DetailField
                label="位置"
                value={item.position}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card Details */}
      <Card>
        <CardHeader>
          <CardTitle>卡片详情</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailField
              icon={Calendar}
              label="年份"
              value={item.year}
            />
            <DetailField
              label="品牌"
              value={item.brand}
            />
            {item.series && (
              <DetailField
                label="系列"
                value={item.series}
              />
            )}
            {item.cardNumber && (
              <DetailField
                label="卡号"
                value={item.cardNumber}
              />
            )}
            {item.parallel && (
              <DetailField
                label="平行版本"
                value={item.parallel}
              />
            )}
            {item.serialNumber && (
              <DetailField
                label="序列号"
                value={item.serialNumber}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grading Information */}
      {item.gradingCompany && item.gradingCompany !== 'UNGRADED' && (
        <Card>
          <CardHeader>
            <CardTitle>评级信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailField
                icon={Award}
                label="评级公司"
                value={item.gradingCompany}
              />
              {item.grade && (
                <DetailField
                  label="评级分数"
                  value={
                    <span className="text-lg font-bold text-blue-600">
                      {item.grade}
                    </span>
                  }
                />
              )}
              {item.certificationNumber && (
                <DetailField
                  label="认证编号"
                  value={item.certificationNumber}
                  fullWidth
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Value Information */}
      <Card>
        <CardHeader>
          <CardTitle>价值信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {item.purchasePrice !== null && (
              <>
                <DetailField
                  icon={TrendingUp}
                  label="购买价格"
                  value={formatCurrency(item.purchasePrice)}
                />
                {item.purchaseDate && (
                  <DetailField
                    icon={Calendar}
                    label="购买日期"
                    value={formatDate(item.purchaseDate)}
                  />
                )}
              </>
            )}
            {item.currentValue !== null && (
              <DetailField
                icon={TrendingUp}
                label="当前价值"
                value={
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(item.currentValue)}
                  </span>
                }
              />
            )}
            {item.estimatedValue !== null && (
              <DetailField
                label="估计价值"
                value={formatCurrency(item.estimatedValue)}
              />
            )}
            {item.lastValueUpdate && (
              <DetailField
                icon={Calendar}
                label="价值更新时间"
                value={formatDate(item.lastValueUpdate)}
              />
            )}
            {valueChange && (
              <DetailField
                label="投资回报"
                value={
                  <div className={valueChange.isPositive ? 'text-green-600' : 'text-red-600'}>
                    <div className="font-bold">
                      {valueChange.isPositive ? '+' : ''}
                      {formatCurrency(valueChange.change)}
                    </div>
                    <div className="text-sm">
                      ({valueChange.isPositive ? '+' : ''}
                      {valueChange.percentage.toFixed(2)}%)
                    </div>
                  </div>
                }
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Special Features */}
      {(item.isAutographed || item.hasMemorabilia) && (
        <Card>
          <CardHeader>
            <CardTitle>特殊功能</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {item.isAutographed && (
                <DetailField
                  icon={Pen}
                  label="签名"
                  value={
                    <Badge className="bg-blue-100 text-blue-800">
                      ✓ 包含球员签名
                    </Badge>
                  }
                />
              )}
              {item.hasMemorabilia && (
                <>
                  <DetailField
                    icon={Star}
                    label="实物"
                    value={
                      <Badge className="bg-purple-100 text-purple-800">
                        ✓ 包含实物
                      </Badge>
                    }
                  />
                  {item.memorabiliaType && (
                    <DetailField
                      label="实物类型"
                      value={item.memorabiliaType}
                    />
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Storage and Condition */}
      <Card>
        <CardHeader>
          <CardTitle>存储与品相</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {item.location && (
              <DetailField
                icon={MapPin}
                label="存放位置"
                value={item.location}
              />
            )}
            {item.storageType && (
              <DetailField
                icon={Box}
                label="存储方式"
                value={item.storageType}
              />
            )}
            {item.condition && (
              <DetailField
                label="品相描述"
                value={item.condition}
                fullWidth
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      {(item.notes || (item.tags && item.tags.length > 0)) && (
        <Card>
          <CardHeader>
            <CardTitle>附加信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {item.tags && item.tags.length > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground mb-2">标签</div>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {item.notes && (
                <div>
                  <div className="text-sm text-muted-foreground mb-2">备注</div>
                  <p className="text-foreground whitespace-pre-wrap">{item.notes}</p>
                </div>
              )}
            </div>
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
