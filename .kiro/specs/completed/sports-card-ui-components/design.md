# 设计文档

## 1. 架构概述

### 1.1 系统架构

球星卡管理子模块采用模块化架构，与被子管理模块保持一致的设计模式：

```
src/modules/cards/
├── config.ts              # 模块配置（已完成）
├── schema.ts              # 数据模型和验证（已完成）
├── ui/                    # UI组件目录
│   ├── CardCard.tsx       # 列表卡片组件（待实现）
│   ├── CardDetail.tsx     # 详情页组件（待实现）
│   └── __tests__/         # 组件测试
│       ├── CardCard.test.tsx
│       └── CardDetail.test.tsx
└── __tests__/             # 模块测试
    └── schema.test.ts     # Schema测试（已完成）
```

### 1.2 数据库架构

**采用独立表方案**（基于Drizzle ORM + Neon Postgres最佳实践）：

```sql
-- cards表（独立表）
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  item_number SERIAL UNIQUE,

  -- 球员信息
  player_name TEXT NOT NULL,
  sport sport_type NOT NULL,
  team TEXT,
  position TEXT,

  -- 卡片信息
  year INTEGER NOT NULL,
  brand TEXT NOT NULL,
  series TEXT,
  card_number TEXT,

  -- 评级信息
  grading_company grading_company_type DEFAULT 'UNGRADED',
  grade NUMERIC(3,1),
  certification_number TEXT,

  -- 价值信息
  purchase_price NUMERIC(10,2),
  purchase_date DATE,
  current_value NUMERIC(10,2),
  estimated_value NUMERIC(10,2),

  -- 物理特征
  parallel TEXT,
  serial_number TEXT,
  is_autographed BOOLEAN DEFAULT false,
  has_memorabilia BOOLEAN DEFAULT false,
  memorabilia_type TEXT,

  -- 存储信息
  status card_status_type DEFAULT 'COLLECTION',
  location TEXT,
  storage_type TEXT,
  condition TEXT,
  notes TEXT,

  -- 图片
  main_image TEXT,
  attachment_images TEXT[],

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 高效索引
CREATE INDEX idx_cards_user ON cards(user_id);
CREATE INDEX idx_cards_sport ON cards(sport);
CREATE INDEX idx_cards_grade ON cards(grade);
CREATE INDEX idx_cards_value ON cards(current_value);
CREATE INDEX idx_cards_status ON cards(status);
CREATE INDEX idx_cards_sport_grade ON cards(sport, grade);
```

**优势：**

- ✅ 类型安全：Drizzle ORM完全类型推导
- ✅ 查询性能：原生列查询比JSONB快2-10倍
- ✅ 索引效率：标准B-tree索引，不需要GIN
- ✅ 数据完整性：数据库级约束和验证
- ✅ 易于维护：Schema变更清晰，迁移安全

### 1.3 技术栈

- **Next.js 16.1.1**: App Router, Server Components
- **React 19.2.3**: Server Components优先
- **TypeScript 5.9+**: 严格类型检查
- **Zod 4.3+**: Schema验证和类型推导
- **Drizzle ORM 0.45+**: 类型安全的数据库ORM
- **Neon Serverless**: Serverless Postgres数据库
- **Tailwind CSS 4.1+**: 原子化CSS框架
- **Shadcn/ui**: 基于Radix UI的组件库

## 2. 组件设计

### 2.1 CardCard组件（列表卡片）

**职责**: 在列表视图中显示球星卡的关键信息

**组件类型**: Server Component（无交互）

**Props接口**:

```typescript
interface CardCardProps {
  item: CardItem;
}
```

**布局结构**:

```
┌─────────────────────────────┐
│  [主图片 - 如果有]          │
│  (h-40, aspect-ratio)       │
├─────────────────────────────┤
│  🏀 #123                    │
│  Michael Jordan             │
├─────────────────────────────┤
│  [篮球] [PSA 9.5] [收藏中] │
├─────────────────────────────┤
│  1986 • Fleer               │
│  $500.00 • ✓签名 • ✓实物   │
└─────────────────────────────┘
```

**关键信息显示**:

1. 主图片（如果有）
2. 物品编号 + 图标
3. 球员姓名（主标题）
4. 徽章组：运动类型、评级、状态
5. 年份 + 品牌
6. 当前价值 + 签名标记 + 实物标记

**徽章颜色系统**:

```typescript
// 运动类型颜色
BASKETBALL: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
SOCCER: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
OTHER: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';

// 状态颜色
COLLECTION: 'bg-blue-100 text-blue-800';
FOR_SALE: 'bg-yellow-100 text-yellow-800';
SOLD: 'bg-gray-100 text-gray-800';
GRADING: 'bg-purple-100 text-purple-800';
DISPLAY: 'bg-green-100 text-green-800';
```

**响应式设计**:

- 移动端（<640px）：单列，图片高度h-32
- 平板（640-1024px）：双列，图片高度h-36
- 桌面（>1024px）：三列，图片高度h-40

### 2.2 CardDetail组件（详情页）

**职责**: 显示球星卡的完整信息

**组件类型**: Server Component（无交互）

**Props接口**:

```typescript
interface CardDetailProps {
  item: CardItem;
}
```

**布局结构**:

```
┌─────────────────────────────────────────┐
│  图片画廊                                │
│  [主图] [附图1] [附图2] ...             │
├─────────────────────────────────────────┤
│  球员信息                                │
│  球员姓名 | 运动类型                     │
│  球队     | 位置                         │
├─────────────────────────────────────────┤
│  卡片详情                                │
│  年份 | 品牌                             │
│  系列 | 卡号                             │
├─────────────────────────────────────────┤
│  评级信息                                │
│  评级公司 | 评级分数                     │
│  认证编号                                │
├─────────────────────────────────────────┤
│  价值信息                                │
│  购买价格 | 购买日期                     │
│  当前价值 | 估计价值                     │
│  投资回报率: +25.50%                     │
├─────────────────────────────────────────┤
│  物理特征                                │
│  平行版本 | 序列号                       │
│  签名: 是 | 实物: 是                     │
│  实物类型                                │
├─────────────────────────────────────────┤
│  存储信息                                │
│  状态 | 位置                             │
│  存储方式 | 品相描述                     │
├─────────────────────────────────────────┤
│  备注信息（如果有）                      │
│  备注内容...                             │
├─────────────────────────────────────────┤
│  记录信息                                │
│  创建时间 | 更新时间                     │
└─────────────────────────────────────────┘
```

**DetailField组件**:

```typescript
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
```

**响应式网格**:

- 移动端：`grid-cols-1`（单列）
- 平板/桌面：`grid-cols-2`（双列）
- fullWidth字段：`col-span-2`（跨两列）

## 3. 数据流设计

### 3.1 数据获取流程

```
用户请求
  ↓
Server Component (Page)
  ↓
Repository Layer (Drizzle ORM)
  ↓
Neon Postgres (cards表)
  ↓
数据转换 (DB Row → CardItem)
  ↓
组件渲染 (CardCard / CardDetail)
```

### 3.2 Repository模式

```typescript
// src/lib/repositories/card.repository.ts
export class CardRepository {
  async findAll(userId: string): Promise<CardItem[]> {
    const rows = await db
      .select()
      .from(cards)
      .where(eq(cards.userId, userId))
      .orderBy(desc(cards.itemNumber));

    return rows.map(rowToCardItem);
  }

  async findById(id: string): Promise<CardItem | null> {
    const [row] = await db.select().from(cards).where(eq(cards.id, id)).limit(1);

    return row ? rowToCardItem(row) : null;
  }

  async findBySport(userId: string, sport: SportType): Promise<CardItem[]> {
    const rows = await db
      .select()
      .from(cards)
      .where(and(eq(cards.userId, userId), eq(cards.sport, sport)))
      .orderBy(desc(cards.grade));

    return rows.map(rowToCardItem);
  }
}
```

### 3.3 类型转换

```typescript
// src/lib/database/types.ts
export interface CardRow {
  id: string;
  user_id: string;
  item_number: number;
  player_name: string;
  sport: string;
  // ... 其他字段（snake_case）
}

export function rowToCardItem(row: CardRow): CardItem {
  return {
    id: row.id,
    type: 'card',
    itemNumber: row.item_number,
    playerName: row.player_name,
    sport: row.sport as SportType,
    // ... 其他字段转换（camelCase）
  };
}
```

## 4. 辅助函数设计

### 4.1 格式化函数

```typescript
// 日期格式化
function formatDate(date: Date | null | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// 货币格式化
function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// 投资回报率计算
function calculateROI(currentValue: number | null, purchasePrice: number | null): string {
  if (!currentValue || !purchasePrice || purchasePrice === 0) {
    return '无数据';
  }
  const roi = ((currentValue - purchasePrice) / purchasePrice) * 100;
  return `${roi > 0 ? '+' : ''}${roi.toFixed(2)}%`;
}
```

### 4.2 本地化函数

```typescript
// 运动类型本地化
function getSportLabel(sport: SportType): string {
  const sportMap: Record<SportType, string> = {
    BASKETBALL: '篮球',
    SOCCER: '足球',
    OTHER: '其他',
  };
  return sportMap[sport] || sport;
}

// 评级公司本地化
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

// 状态本地化
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
```

### 4.3 徽章颜色函数

```typescript
// 运动类型徽章颜色
function getSportBadgeColor(sport: SportType): string {
  const colorMap: Record<SportType, string> = {
    BASKETBALL: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    SOCCER: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    OTHER: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  };
  return colorMap[sport] || colorMap.OTHER;
}

// 状态徽章颜色
function getStatusBadgeColor(status: CardStatus): string {
  const colorMap: Record<CardStatus, string> = {
    COLLECTION: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    FOR_SALE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    SOLD: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    GRADING: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    DISPLAY: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  };
  return colorMap[status] || colorMap.COLLECTION;
}
```

## 5. 性能优化

### 5.1 图片优化

```typescript
// Next.js Image组件配置
<Image
  src={imageUrl}
  alt={`${item.playerName} - ${item.year} ${item.brand}`}
  fill
  className="object-cover"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  loading="lazy"
  priority={false}
/>
```

### 5.2 数据库查询优化

```typescript
// 使用索引优化查询
const cards = await db
  .select()
  .from(cards)
  .where(
    and(
      eq(cards.userId, userId),
      eq(cards.sport, 'BASKETBALL'), // 使用sport索引
      gte(cards.grade, 9.0) // 使用grade索引
    )
  )
  .orderBy(desc(cards.currentValue)) // 使用value索引
  .limit(20);
```

### 5.3 Server Component优先

- CardCard和CardDetail都是Server Component
- 无客户端JavaScript
- 服务器端渲染，首屏加载快

## 6. 错误处理

### 6.1 数据缺失处理

```typescript
// 安全的字段访问
const displayValue = item.currentValue
  ? formatCurrency(item.currentValue)
  : '-';

// 条件渲染
{item.mainImage && (
  <div className="relative h-40">
    <Image src={item.mainImage} alt={item.playerName} fill />
  </div>
)}
```

### 6.2 图片加载错误

```typescript
<Image
  src={imageUrl}
  alt={altText}
  fill
  onError={(e) => {
    // 隐藏图片或显示占位符
    e.currentTarget.style.display = 'none';
  }}
/>
```

## 7. 可访问性

### 7.1 语义化HTML

```typescript
// 使用语义化标签
<article>  {/* 卡片容器 */}
  <header>  {/* 标题区域 */}
    <h3>{item.playerName}</h3>
  </header>
  <section>  {/* 内容区域 */}
    {/* 详细信息 */}
  </section>
</article>
```

### 7.2 图片alt文本

```typescript
// 描述性alt文本
alt={`${item.playerName} - ${item.year} ${item.brand} ${item.series || ''} 球星卡`}
```

### 7.3 颜色对比度

- 所有徽章颜色符合WCAG AA标准
- 暗色模式下使用适配的颜色

## 8. 测试策略

### 8.1 单元测试

```typescript
// CardCard.test.tsx
describe('CardCard', () => {
  it('should render player name', () => {
    const item = createMockCardItem();
    render(<CardCard item={item} />);
    expect(screen.getByText(item.playerName)).toBeInTheDocument();
  });

  it('should render sport badge', () => {
    const item = createMockCardItem({ sport: 'BASKETBALL' });
    render(<CardCard item={item} />);
    expect(screen.getByText('篮球')).toBeInTheDocument();
  });

  it('should render grading info when graded', () => {
    const item = createMockCardItem({
      gradingCompany: 'PSA',
      grade: 9.5,
    });
    render(<CardCard item={item} />);
    expect(screen.getByText(/PSA 9.5/)).toBeInTheDocument();
  });
});
```

### 8.2 集成测试

```typescript
// 测试数据流
describe('Card Data Flow', () => {
  it('should fetch and display cards', async () => {
    const cards = await cardRepository.findAll(userId);
    expect(cards).toHaveLength(3);
    expect(cards[0].playerName).toBe('Michael Jordan');
  });
});
```

## 9. 文档要求

### 9.1 JSDoc注释

```typescript
/**
 * CardCard Component for Module System
 *
 * This component displays a sports card in the module system's list view.
 *
 * Key features:
 * - Displays player name, sport, year, and brand
 * - Shows grading information if available
 * - Displays current value and special features (autograph, memorabilia)
 * - Responsive design with image optimization
 *
 * Requirements: 1.1, 1.2, 2.1, 2.2
 *
 * @param {CardCardProps} props - Component props
 * @param {CardItem} props.item - Card item to display
 * @returns {JSX.Element} Card component
 */
export function CardCard({ item }: CardCardProps) {
  // ...
}
```

### 9.2 行内注释

```typescript
// 计算投资回报率
const roi = calculateROI(item.currentValue, item.purchasePrice);

// 格式化评级信息为"公司名 分数"格式
const gradingInfo =
  item.gradingCompany !== 'UNGRADED'
    ? `${getGradingCompanyLabel(item.gradingCompany)} ${item.grade || ''}`
    : '未评级';
```

## 10. 部署考虑

### 10.1 环境变量

```bash
# .env.local
DATABASE_URL=postgresql://user:pass@host.neon.tech/dbname
NEXT_PUBLIC_APP_URL=https://your-app.com
```

### 10.2 数据库迁移

```bash
# 生成迁移
npm run db:generate

# 推送到Neon
npm run db:push

# 或使用Neon分支测试
neon branches create feature-cards-table
npm run db:push -- --branch=feature-cards-table
```

### 10.3 性能监控

- 使用Neon Console监控查询性能
- 检查索引使用情况
- 监控数据库连接数

---

**设计版本**: v1.0  
**最后更新**: 2026-01-20  
**基于**: Next.js 16.1.1 + React 19.2.3 + Drizzle ORM 0.45+ + Neon Serverless
