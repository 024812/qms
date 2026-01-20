/**
 * CardDetail Component for Module System
 *
 * This component displays comprehensive sports card information in the detail view.
 * It shows all card fields in an organized layout with image gallery.
 *
 * Key features:
 * - Displays all 30+ card fields in organized cards
 * - Shows image carousel/gallery for main and attachment images
 * - Calculates and displays investment ROI
 * - Compatible with module registry system
 * - Responsive design with grid layout
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  User,
  Calendar,
  Award,
  DollarSign,
  Package,
  MapPin,
  FileText,
  CreditCard,
  ExternalLink,
  TrendingUp,
} from 'lucide-react';
import Image from 'next/image';
import type { CardItem, SportType, GradingCompany, CardStatus } from '../schema';
import {
  generateCardSearchQuery,
  getEbaySearchUrl,
  getPSACardFactsUrl,
  getBeckettSearchUrl,
  get130PointUrl,
  estimateCardValue,
} from '@/lib/services/card-market';

interface CardDetailProps {
  item: CardItem;
}

/**
 * Get localized sport label
 */
function getSportLabel(sport: SportType): string {
  const sportMap: Record<SportType, string> = {
    BASKETBALL: '篮球',
    SOCCER: '足球',
    OTHER: '其他',
  };
  return sportMap[sport] || sport;
}

/**
 * Get localized grading company label
 */
function getGradingCompanyLabel(company: GradingCompany): string {
  const companyMap: Record<GradingCompany, string> = {
    PSA: 'PSA',
    BGS: 'BGS (Beckett)',
    SGC: 'SGC',
    CGC: 'CGC',
    UNGRADED: '未评级',
  };
  return companyMap[company] || company;
}

/**
 * Get localized status label
 */
function getStatusLabel(status: CardStatus): string {
  const statusMap: Record<CardStatus, string> = {
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
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Calculate investment ROI
 */
function calculateROI(currentValue: number | null, purchasePrice: number | null): string {
  if (!currentValue || !purchasePrice || purchasePrice === 0) {
    return '无数据';
  }
  const roi = ((currentValue - purchasePrice) / purchasePrice) * 100;
  return `${roi > 0 ? '+' : ''}${roi.toFixed(2)}%`;
}

/**
 * Detail field component for consistent styling
 * Requirements: 9.4 - Icon labels for accessibility
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
        {Icon && <Icon className="w-4 h-4" aria-hidden="true" />}
        <span>{label}</span>
      </div>
      <div className="font-medium text-foreground">{value}</div>
    </div>
  );
}

/**
 * CardDetail Component
 *
 * Displays comprehensive card information including:
 * - Image gallery (main image + attachment images)
 * - Player information (name, sport, team, position)
 * - Card details (year, brand, series, card number)
 * - Grading information (company, grade, certification)
 * - Value information (purchase, current, estimated, ROI)
 * - Physical characteristics (parallel, serial, autograph, memorabilia)
 * - Storage information (status, location, storage type, condition)
 * - Additional notes
 * - Timestamps
 *
 * Layout:
 * - Top: Image gallery
 * - Middle: Information cards organized by category
 * - Bottom: Timestamps
 *
 * Requirements: 3.1-3.15, 9.1-9.5 (Accessibility)
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

  // Generate market data
  const searchQuery = generateCardSearchQuery({
    playerName: item.playerName,
    year: item.year,
    brand: item.brand,
    series: item.series || undefined,
    cardNumber: item.cardNumber || undefined,
    gradingCompany: item.gradingCompany !== 'UNGRADED' ? item.gradingCompany : undefined,
    grade: item.grade || undefined,
  });

  const estimatedRange = estimateCardValue({
    year: item.year,
    gradingCompany: item.gradingCompany,
    grade: item.grade || undefined,
    isAutographed: item.isAutographed,
    hasMemorabilia: item.hasMemorabilia,
  });

  return (
    <article className="space-y-6">
      {/* Image Gallery - Requirements: 9.1, 9.2 (Semantic HTML, descriptive alt text) */}
      {allImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>图片</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              role="list"
              aria-label="球星卡图片画廊"
            >
              {allImages.map(imageUrl => (
                <div
                  key={imageUrl}
                  className="relative aspect-square bg-muted rounded-lg overflow-hidden"
                  role="listitem"
                >
                  <Image
                    src={imageUrl}
                    alt={`${item.playerName} - ${item.year} ${item.brand} ${item.series || ''} 球星卡${imageUrl === item.mainImage ? '主图' : '附加图片'}${item.gradingCompany !== 'UNGRADED' ? ` - ${getGradingCompanyLabel(item.gradingCompany)} ${item.grade}` : ''}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    loading="lazy"
                    priority={false}
                  />
                  {imageUrl === item.mainImage && (
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

      {/* Player Information - Requirements: 9.2 (Semantic HTML) */}
      <Card>
        <CardHeader>
          <CardTitle>球员信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailField icon={User} label="球员姓名" value={item.playerName} />
            <DetailField label="运动类型" value={getSportLabel(item.sport)} />
            <DetailField label="球队" value={item.team || '-'} />
            <DetailField label="位置" value={item.position || '-'} />
          </div>
        </CardContent>
      </Card>

      {/* Card Details - Requirements: 9.2 (Semantic HTML) */}
      <Card>
        <CardHeader>
          <CardTitle>卡片详情</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailField icon={CreditCard} label="年份" value={item.year} />
            <DetailField label="品牌" value={item.brand} />
            <DetailField label="系列" value={item.series || '-'} />
            <DetailField label="卡号" value={item.cardNumber || '-'} />
          </div>
        </CardContent>
      </Card>

      {/* Grading Information - Requirements: 9.2 (Semantic HTML) */}
      <Card>
        <CardHeader>
          <CardTitle>评级信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailField
              icon={Award}
              label="评级公司"
              value={getGradingCompanyLabel(item.gradingCompany)}
            />
            <DetailField
              label="评级分数"
              value={item.grade !== null ? item.grade.toString() : '-'}
            />
            <DetailField label="认证编号" value={item.certificationNumber || '-'} fullWidth />
          </div>
        </CardContent>
      </Card>

      {/* Value Information - Requirements: 9.2 (Semantic HTML) */}
      <Card>
        <CardHeader>
          <CardTitle>价值信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailField
              icon={DollarSign}
              label="购买价格"
              value={formatCurrency(item.purchasePrice)}
            />
            <DetailField icon={Calendar} label="购买日期" value={formatDate(item.purchaseDate)} />
            <DetailField label="当前价值" value={formatCurrency(item.currentValue)} />
            <DetailField label="估计价值" value={formatCurrency(item.estimatedValue)} />
            <DetailField
              label="投资回报率"
              value={
                <span
                  className={
                    calculateROI(item.currentValue, item.purchasePrice).startsWith('+')
                      ? 'text-green-600 dark:text-green-400'
                      : calculateROI(item.currentValue, item.purchasePrice).startsWith('-')
                        ? 'text-red-600 dark:text-red-400'
                        : ''
                  }
                  aria-label={`投资回报率 ${calculateROI(item.currentValue, item.purchasePrice)}`}
                >
                  {calculateROI(item.currentValue, item.purchasePrice)}
                </span>
              }
              fullWidth
            />
          </div>
        </CardContent>
      </Card>

      {/* Market Data - External Links */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" aria-hidden="true" />
            <CardTitle>市场数据</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Estimated Value Range */}
          {estimatedRange && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">估计价值区间</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">
                  ${estimatedRange.low} - ${estimatedRange.high}
                </span>
                <span className="text-sm text-muted-foreground">
                  (预估: ${estimatedRange.estimated})
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                * 基于卡片属性的估算，实际价格可能有所不同
              </p>
            </div>
          )}

          {/* External Market Links */}
          <div>
            <div className="text-sm font-medium mb-3">查看市场价格</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button variant="outline" className="justify-start" asChild>
                <a
                  href={getEbaySearchUrl(searchQuery)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  <span>eBay 已售记录</span>
                </a>
              </Button>

              <Button variant="outline" className="justify-start" asChild>
                <a
                  href={getPSACardFactsUrl({
                    playerName: item.playerName,
                    year: item.year,
                    brand: item.brand,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  <span>PSA CardFacts</span>
                </a>
              </Button>

              <Button variant="outline" className="justify-start" asChild>
                <a
                  href={getBeckettSearchUrl(searchQuery)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  <span>Beckett 价格指南</span>
                </a>
              </Button>

              <Button variant="outline" className="justify-start" asChild>
                <a
                  href={get130PointUrl({
                    playerName: item.playerName,
                    year: item.year,
                    brand: item.brand,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  <span>130Point 销售数据</span>
                </a>
              </Button>
            </div>
          </div>

          {/* Search Query Info */}
          <div className="text-xs text-muted-foreground pt-2 border-t">
            <span className="font-medium">搜索关键词: </span>
            <span className="font-mono">{searchQuery}</span>
          </div>
        </CardContent>
      </Card>

      {/* Physical Characteristics - Requirements: 9.2 (Semantic HTML) */}
      <Card>
        <CardHeader>
          <CardTitle>物理特征</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailField icon={Package} label="平行版本" value={item.parallel || '-'} />
            <DetailField label="序列号" value={item.serialNumber || '-'} />
            <DetailField
              label="签名"
              value={
                item.isAutographed ? (
                  <Badge
                    className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    aria-label="已签名"
                  >
                    是
                  </Badge>
                ) : (
                  <Badge variant="outline" aria-label="未签名">
                    否
                  </Badge>
                )
              }
            />
            <DetailField
              label="实物"
              value={
                item.hasMemorabilia ? (
                  <Badge
                    className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    aria-label="含实物"
                  >
                    是
                  </Badge>
                ) : (
                  <Badge variant="outline" aria-label="不含实物">
                    否
                  </Badge>
                )
              }
            />
            {item.memorabiliaType && (
              <DetailField label="实物类型" value={item.memorabiliaType} fullWidth />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Storage Information - Requirements: 9.2 (Semantic HTML) */}
      <Card>
        <CardHeader>
          <CardTitle>存储信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailField label="状态" value={getStatusLabel(item.status)} />
            <DetailField icon={MapPin} label="位置" value={item.location || '-'} />
            <DetailField label="存储方式" value={item.storageType || '-'} />
            <DetailField label="品相描述" value={item.condition || '-'} fullWidth />
          </div>
        </CardContent>
      </Card>

      {/* Notes (conditional) - Requirements: 9.2 (Semantic HTML) */}
      {item.notes && (
        <Card>
          <CardHeader>
            <CardTitle>备注信息</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailField
              icon={FileText}
              label="备注"
              value={<p className="whitespace-pre-wrap">{item.notes}</p>}
              fullWidth
            />
          </CardContent>
        </Card>
      )}

      {/* Timestamps - Requirements: 9.2 (Semantic HTML) */}
      <Card>
        <CardHeader>
          <CardTitle>记录信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailField icon={Calendar} label="创建时间" value={formatDate(item.createdAt)} />
            <DetailField icon={Calendar} label="更新时间" value={formatDate(item.updatedAt)} />
          </div>
        </CardContent>
      </Card>
    </article>
  );
}
