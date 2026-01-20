# 子模块开发标准文档

## 概述

本文档定义了系统中所有子模块（如被子管理、球星卡管理等）的开发标准和最佳实践。所有新增子模块必须遵循此标准，以确保代码一致性、可维护性和用户体验的统一。

**版本**: v2026.01.20  
**基于**: Next.js 16.1.1 + React 19.2.3

## 技术栈

- **Next.js 16.1.1** - App Router 架构，支持 Turbopack 和 Cache Components
- **React 19.2.3** - Server Components 优先，支持 React Compiler
- **TypeScript 5.9+** - 严格类型检查
- **Zod 4.3+** - Schema 验证和类型推导
- **Tailwind CSS 4.1+** - 原子化 CSS 框架
- **Shadcn/ui** - 基于 Radix UI 的组件库
- **TanStack Query 5.90+** - 数据获取和缓存
- **Drizzle ORM 0.45+** - 类型安全的数据库 ORM
- **Neon Serverless** - Serverless Postgres 数据库
- **NextAuth.js 5.0** - 身份认证

## 目录结构

每个子模块必须遵循以下目录结构：

```
src/modules/{module-name}/
├── config.ts              # 模块配置（必需）
├── schema.ts              # 数据模型和验证（必需）
├── ui/                    # UI 组件目录（必需）
│   ├── {Module}Card.tsx   # 列表卡片组件
│   ├── {Module}Detail.tsx # 详情页组件
│   └── __tests__/         # 组件测试
│       ├── {Module}Card.test.tsx
│       └── {Module}Detail.test.tsx
└── __tests__/             # 模块测试
    └── schema.test.ts
```

## 1. 模块配置 (config.ts)

### 1.1 基本结构

```typescript
/**
 * {Module} Module Configuration
 *
 * Comprehensive configuration for managing {module description}.
 *
 * Requirements: [列出相关需求编号]
 */

import { ModuleDefinition } from '../types';
import { {module}AttributesSchema } from './schema';
import { {Module}Card } from './ui/{Module}Card';
import { {Module}Detail } from './ui/{Module}Detail';

export const {module}Module: ModuleDefinition = {
  id: '{module}',                    // 唯一标识符（kebab-case）
  name: '{模块中文名称}',             // 显示名称
  description: '{模块描述}',          // 简短描述
  icon: 'IconName',                  // Lucide 图标名称
  color: 'blue',                     // 主题颜色

  attributesSchema: {module}AttributesSchema,
  CardComponent: {Module}Card,
  DetailComponent: {Module}Detail,

  formFields: [/* 表单字段配置 */],
  listColumns: [/* 列表列配置 */],
  statsConfig: {/* 统计配置 */},
};
```

### 1.2 表单字段配置 (formFields)

表单字段必须按逻辑分组，每个字段包含：

```typescript
formFields: [
  {
    name: 'fieldName', // 字段名（camelCase）
    label: '字段标签', // 中文标签
    type: 'text', // 字段类型
    placeholder: '例如：示例值', // 占位符
    required: true, // 是否必填
    description: '字段说明', // 帮助文本
    options: [
      // select 类型的选项
      { label: '选项1', value: 'VALUE1' },
      { label: '选项2', value: 'VALUE2' },
    ],
  },
];
```

**支持的字段类型：**

- `text` - 单行文本
- `textarea` - 多行文本
- `number` - 数字
- `date` - 日期选择器
- `select` - 下拉选择
- `checkbox` - 复选框
- `radio` - 单选按钮

**字段分组建议：**

1. 基本信息（必填字段优先）
2. 详细信息
3. 附加属性
4. 图片和附件
5. 备注和标签

### 1.3 列表列配置 (listColumns)

```typescript
listColumns: [
  {
    key: 'itemNumber',
    label: '编号',
    render: value => `#${value}`, // 可选的自定义渲染函数
  },
  {
    key: 'name',
    label: '名称',
  },
  {
    key: 'status',
    label: '状态',
    render: (value, item) => {
      // 可访问完整 item 对象
      const statusMap: Record<string, string> = {
        ACTIVE: '活跃',
        INACTIVE: '非活跃',
      };
      return statusMap[value as string] || value;
    },
  },
];
```

**列配置原则：**

- 第一列通常是编号或主要标识
- 包含 5-10 个最重要的字段
- 使用 render 函数进行本地化和格式化
- 保持列宽合理，避免过度拥挤

### 1.4 统计配置 (statsConfig)

```typescript
statsConfig: {
  metrics: [
    {
      key: 'total',
      label: '总数量',
      calculate: (items) => items.length,
    },
    {
      key: 'byCategory',
      label: '按类别统计',
      calculate: (items) => {
        const counts: Record<string, number> = {};
        items.forEach((item) => {
          const category = item.category || 'OTHER';
          counts[category] = (counts[category] || 0) + 1;
        });
        return Object.entries(counts)
          .map(([cat, count]) => `${cat}:${count}`)
          .join(' ');
      },
    },
    {
      key: 'average',
      label: '平均值',
      calculate: (items) => {
        const itemsWithValue = items.filter((i) => i.value);
        if (itemsWithValue.length === 0) return '无数据';
        const sum = itemsWithValue.reduce((acc, i) => acc + (i.value || 0), 0);
        return (sum / itemsWithValue.length).toFixed(2);
      },
    },
  ],
}
```

**统计指标类型：**

1. 计数统计（总数、分类统计）
2. 平均值统计
3. 分布统计
4. 覆盖率统计（如有图片的比例）

## 2. 数据模型 (schema.ts)

### 2.1 基本结构

```typescript
/**
 * {Module} Module Schema
 *
 * This module schema defines the structure for managing {module description}.
 *
 * Requirements: [列出相关需求编号]
 */

import { z } from 'zod';

// ============================================================================
// Enum Definitions
// ============================================================================

export const CategoryType = {
  TYPE1: 'TYPE1',
  TYPE2: 'TYPE2',
} as const;

export type CategoryType = (typeof CategoryType)[keyof typeof CategoryType];

export const CategoryTypeSchema = z.enum(['TYPE1', 'TYPE2']);

// ============================================================================
// Attributes Schema
// ============================================================================

export const {module}AttributesSchema = z.object({
  // 必填字段
  name: z.string().min(1, '名称不能为空').max(100, '名称过长').trim(),
  category: CategoryTypeSchema,

  // 可选字段
  description: z.string().max(500, '描述过长').optional(),

  // 数字字段（带验证）
  quantity: z.number().int('必须是整数').min(0, '不能为负数').optional(),

  // 日期字段
  purchaseDate: z.date().max(new Date(), '日期不能在未来').optional(),

  // 数组字段
  tags: z.array(z.string().max(50)).optional(),

  // 布尔字段
  isActive: z.boolean().optional().default(true),
});

export type {Module}Attributes = z.infer<typeof {module}AttributesSchema>;

// ============================================================================
// Complete Schema
// ============================================================================

export const {Module}Schema = z.object({
  id: z.string().uuid(),
  itemNumber: z.number().int().positive(),
  ...{module}AttributesSchema.shape,
  mainImage: z.string().nullable(),
  attachmentImages: z.array(z.string()).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type {Module} = z.infer<typeof {Module}Schema>;

// ============================================================================
// Item Interface
// ============================================================================

export interface {Module}Item {
  id: string;
  type: '{module}';
  createdAt: Date;
  updatedAt: Date;
  itemNumber: number;
  // ... 其他字段
}

// ============================================================================
// Helper Functions
// ============================================================================

export function {module}To{Module}Item({module}: {Module}): {Module}Item {
  return {
    id: {module}.id,
    type: '{module}',
    // ... 映射其他字段
  };
}

export function {module}ItemTo{Module}(item: {Module}Item): {Module} {
  return {
    id: item.id,
    // ... 映射其他字段
  };
}
```

### 2.2 Schema 验证规则

**字符串验证：**

- 使用 `.min()` 和 `.max()` 限制长度
- 使用 `.trim()` 去除首尾空格
- 使用 `.email()` 验证邮箱
- 使用 `.url()` 验证 URL

**数字验证：**

- 使用 `.int()` 确保整数
- 使用 `.min()` 和 `.max()` 限制范围
- 使用 `.positive()` 确保正数
- 使用 `.nonnegative()` 确保非负数

**日期验证：**

- 使用 `.max(new Date())` 防止未来日期
- 使用 `.min()` 设置最早日期

**枚举验证：**

- 定义 TypeScript const 对象
- 导出类型和 Zod schema
- 提供辅助函数获取显示名称

## 3. UI 组件

### 3.1 卡片组件 ({Module}Card.tsx)

```typescript
/**
 * {Module}Card Component for Module System
 *
 * This component displays a {module} in the module system's list view.
 *
 * Key features:
 * - Displays key information
 * - Shows status badges
 * - Displays main image if available
 * - Compatible with module registry system
 *
 * Requirements: 4.1
 */

import { Badge } from '@/components/ui/badge';
import { Icon } from 'lucide-react';
import Image from 'next/image';
import type { {Module}Item } from '../schema';

interface {Module}CardProps {
  item: {Module}Item;
}

/**
 * 获取状态徽章颜色
 */
function getStatusColor(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800';
    case 'INACTIVE':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * 获取本地化标签
 */
function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    ACTIVE: '活跃',
    INACTIVE: '非活跃',
  };
  return statusMap[status] || status;
}

/**
 * {Module}Card Component
 *
 * 注意：此组件不包含 Card 包装器 - 由父组件 ItemCard 处理
 */
export function {Module}Card({ item }: {Module}CardProps) {
  return (
    <>
      {/* 主图片 */}
      {item.mainImage && (
        <div className="mb-3 relative h-40 bg-muted rounded-md overflow-hidden">
          <Image
            src={item.mainImage}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy"
          />
        </div>
      )}

      <div className="space-y-2">
        {/* 标题：编号和名称 */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                #{item.itemNumber}
              </span>
            </div>
            <h3 className="font-semibold text-foreground">{item.name}</h3>
          </div>
        </div>

        {/* 徽章：类别和状态 */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            {item.category}
          </Badge>
          <Badge className={getStatusColor(item.status)}>
            {getStatusLabel(item.status)}
          </Badge>
        </div>

        {/* 详细信息 */}
        <div className="text-sm text-muted-foreground space-y-1">
          {/* 根据模块显示关键信息 */}
        </div>
      </div>
    </>
  );
}
```

**卡片组件设计原则：**

1. **不包含 Card 包装器** - 由父组件 ItemCard 统一处理
2. **图片优先** - 如果有主图片，放在最上方
3. **信息层次** - 编号 → 名称 → 徽章 → 详细信息
4. **响应式图片** - 使用 Next.js Image 组件，设置合适的 sizes
5. **懒加载** - 图片使用 `loading="lazy"`
6. **颜色一致性** - 使用统一的徽章颜色系统
7. **图标使用** - 使用 Lucide React 图标

### 3.2 详情组件 ({Module}Detail.tsx)

```typescript
/**
 * {Module}Detail Component for Module System
 *
 * This component displays comprehensive {module} information in the detail view.
 *
 * Key features:
 * - Displays all fields in an organized layout
 * - Shows image carousel/gallery
 * - Responsive design with grid layout
 *
 * Requirements: 4.1
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icon, Calendar } from 'lucide-react';
import Image from 'next/image';
import type { {Module}Item } from '../schema';

interface {Module}DetailProps {
  item: {Module}Item;
}

/**
 * 格式化日期
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
 * 详情字段组件 - 统一样式
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
 * {Module}Detail Component
 */
export function {Module}Detail({ item }: {Module}DetailProps) {
  // 收集所有图片
  const allImages: string[] = [];
  if (item.mainImage) {
    allImages.push(item.mainImage);
  }
  if (item.attachmentImages && item.attachmentImages.length > 0) {
    allImages.push(...item.attachmentImages);
  }

  return (
    <div className="space-y-6">
      {/* 图片画廊 */}
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

      {/* 基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailField
              icon={Icon}
              label="物品编号"
              value={`#${item.itemNumber}`}
            />
            <DetailField
              label="名称"
              value={item.name}
            />
            {/* 更多字段... */}
          </div>
        </CardContent>
      </Card>

      {/* 时间戳 */}
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
```

**详情组件设计原则：**

1. **卡片分组** - 按逻辑将信息分组到不同的 Card 中
2. **图片画廊优先** - 如果有图片，放在最上方
3. **响应式网格** - 使用 `grid-cols-1 md:grid-cols-2` 布局
4. **统一字段组件** - 使用 DetailField 组件保持一致性
5. **图标使用** - 为重要字段添加图标
6. **fullWidth 选项** - 长文本字段使用 fullWidth
7. **时间戳放最后** - 创建和更新时间放在最后一个卡片

## 4. 组件开发最佳实践 (Next.js 16 + React 19)

### 4.1 Server vs Client Components

**默认使用 Server Components（React 19 新特性）：**

- 页面组件 (page.tsx) - 始终是 Server Component
- 布局组件 (layout.tsx) - 始终是 Server Component
- 静态展示组件 - 无交互的展示组件
- 数据获取组件 - 直接在组件中使用 async/await

**Server Component 优势：**

```typescript
// ✅ Server Component - 直接数据获取（Next.js 16）
export default async function Page() {
  // 直接在组件中获取数据
  const data = await fetch('https://api.example.com/data', {
    cache: 'force-cache',        // 静态缓存（默认）
    // cache: 'no-store',        // 动态获取，每次请求都重新获取
    // next: { revalidate: 60 }, // 时间重新验证（60秒）
  });

  const json = await data.json();

  return (
    <div>
      <h1>Server Rendered</h1>
      <p>{json.message}</p>
    </div>
  );
}
```

**使用 Client Components 的场景：**

- 需要使用 React hooks (useState, useEffect, useRef 等)
- 需要事件处理 (onClick, onChange, onSubmit 等)
- 需要使用浏览器 API (localStorage, window, document 等)
- 需要使用 Context (除了 Server Context)
- 需要使用第三方库（如 TanStack Query、Framer Motion）

**Client Component 标记（React 19）：**

```typescript
'use client'  // 必须在文件顶部，所有 import 之前

import { useState } from 'react';

export function InteractiveComponent() {
  const [state, setState] = useState(false);

  return (
    <button onClick={() => setState(!state)}>
      {state ? 'On' : 'Off'}
    </button>
  );
}
```

**组件组合模式（推荐）：**

```typescript
// app/page.tsx (Server Component)
import { ClientComponent } from './ClientComponent';

export default async function Page() {
  // Server 端获取数据
  const data = await fetchData();

  return (
    <div>
      <h1>Server Rendered Title</h1>
      {/* 将数据作为 props 传递给 Client Component */}
      <ClientComponent data={data} />
    </div>
  );
}

// ClientComponent.tsx (Client Component)
'use client'

import { useState } from 'react';

export function ClientComponent({ data }: { data: Data }) {
  const [selected, setSelected] = useState(null);

  return (
    <div onClick={() => setSelected(data.id)}>
      {/* 交互逻辑 */}
    </div>
  );
}
```

**避免的反模式：**

```typescript
// ❌ 不要在 Client Component 中导入 Server Component
'use client'

import { ServerComponent } from './ServerComponent'; // 错误！

// ✅ 正确：通过 children 或 props 传递
'use client'

export function ClientWrapper({ children }: { children: React.ReactNode }) {
  return <div className="wrapper">{children}</div>;
}

// 使用：
<ClientWrapper>
  <ServerComponent /> {/* Server Component 作为 children */}
</ClientWrapper>
```

**数据获取策略（Next.js 16）：**

```typescript
// 1. 静态数据（构建时获取）
const staticData = await fetch('https://...', {
  cache: 'force-cache', // 默认值
});

// 2. 动态数据（每次请求获取）
const dynamicData = await fetch('https://...', {
  cache: 'no-store',
});

// 3. 时间重新验证（ISR）
const revalidatedData = await fetch('https://...', {
  next: { revalidate: 60 }, // 60秒后重新验证
});

// 4. 标签重新验证（Next.js 16 新特性）
const taggedData = await fetch('https://...', {
  next: { tags: ['products'] },
});
// 使用 revalidateTag('products') 手动重新验证
```

### 4.2 类型安全（TypeScript 5.9+）

**严格类型定义：**

```typescript
// ✅ 好的做法 - 明确的接口定义
interface Props {
  item: ModuleItem;
  onUpdate?: (id: string) => void;
  children?: React.ReactNode;
}

// ✅ 使用泛型提高复用性
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

// ❌ 避免使用 any
interface Props {
  item: any; // 不要这样做
  data: any; // 不要这样做
}
```

**类型导入（推荐）：**

```typescript
// ✅ 使用 type import（更好的 tree-shaking）
import type { ModuleItem } from '../schema';
import type { FC, ReactNode } from 'react';

// ✅ 混合导入
import { useState, type Dispatch, type SetStateAction } from 'react';
```

**类型推导：**

```typescript
// ✅ 利用 Zod 的类型推导
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});

// 自动推导类型
type User = z.infer<typeof UserSchema>;

// ✅ 使用 satisfies 确保类型正确（TypeScript 5.0+）
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
} satisfies Config;
```

**函数类型：**

```typescript
// ✅ 明确的函数签名
type OnUpdate = (id: string, data: Partial<Item>) => Promise<void>;

// ✅ 使用 Parameters 和 ReturnType 工具类型
type UpdateParams = Parameters<typeof updateItem>;
type UpdateResult = ReturnType<typeof updateItem>;
```

### 4.3 样式规范（Tailwind CSS 4.1+）

**使用 Tailwind CSS：**

```typescript
// ✅ 使用 Tailwind 原子类
<div className="flex items-center gap-2 p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors">

// ✅ 响应式设计
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// ✅ 使用 clsx 或 cn 工具函数处理条件类名
import { cn } from '@/lib/utils';

<div className={cn(
  "base-class",
  isActive && "active-class",
  isDisabled && "disabled-class"
)}>

// ❌ 避免内联样式
<div style={{ display: 'flex', padding: '16px' }}>
```

**颜色系统（语义化）：**

```typescript
// ✅ 使用语义化颜色变量
<div className="bg-background text-foreground">
<p className="text-muted-foreground">
<button className="bg-primary text-primary-foreground hover:bg-primary/90">

// ✅ 状态颜色
<span className="text-destructive">错误</span>
<span className="text-success">成功</span>
<span className="text-warning">警告</span>

// ❌ 避免硬编码颜色
<div className="bg-blue-500 text-white"> // 不推荐
```

**响应式断点：**

```typescript
// Tailwind 默认断点
// sm: 640px
// md: 768px
// lg: 1024px
// xl: 1280px
// 2xl: 1536px

<div className="
  w-full           // 移动端全宽
  md:w-1/2         // 平板半宽
  lg:w-1/3         // 桌面三分之一
  xl:w-1/4         // 大屏四分之一
">
```

**动画和过渡：**

```typescript
// ✅ 使用 Tailwind 动画类
<div className="transition-all duration-300 ease-in-out">
<div className="animate-pulse">
<div className="animate-spin">

// ✅ 使用 Framer Motion 处理复杂动画
'use client'

import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
```

**暗色模式支持：**

```typescript
// ✅ 使用 dark: 前缀
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">

// ✅ 使用语义化颜色自动适配
<div className="bg-background text-foreground"> // 自动适配暗色模式
```

### 4.4 图片处理（Next.js 16 Image 优化）

**使用 Next.js Image 组件：**

```typescript
import Image from 'next/image';

// ✅ 响应式图片（推荐）
<Image
  src={imageUrl}
  alt="描述性文本"
  fill                    // 填充父容器
  className="object-cover"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  loading="lazy"          // 懒加载（非首屏图片）
  priority={false}        // 非关键图片不优先加载
/>

// ✅ 固定尺寸图片
<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={100}
  priority={true}         // 首屏关键图片优先加载
/>

// ✅ 使用 placeholder 提升体验
<Image
  src={imageUrl}
  alt="Product"
  fill
  placeholder="blur"      // 模糊占位符
  blurDataURL={blurData}  // 自定义模糊数据
/>
```

**图片优化配置（next.config.js）：**

```javascript
module.exports = {
  images: {
    // 支持的图片格式（Next.js 16 默认支持 WebP 和 AVIF）
    formats: ['image/webp', 'image/avif'],

    // 设备尺寸
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],

    // 图片尺寸
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // 最小缓存 TTL
    minimumCacheTTL: 60,

    // 远程图片域名
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.example.com',
        pathname: '/**',
      },
    ],
  },
};
```

**图片最佳实践：**

```typescript
// ✅ 为不同视口提供合适的尺寸
sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"

// ✅ 首屏关键图片使用 priority
<Image src="/hero.jpg" alt="Hero" priority />

// ✅ 非首屏图片使用 lazy loading
<Image src="/product.jpg" alt="Product" loading="lazy" />

// ✅ 使用 aspect-ratio 保持比例
<div className="relative aspect-square">
  <Image src={url} alt="Square" fill className="object-cover" />
</div>

// ✅ 处理图片加载错误
<Image
  src={imageUrl}
  alt="Product"
  fill
  onError={(e) => {
    e.currentTarget.src = '/fallback.jpg';
  }}
/>
```

### 4.5 国际化

**所有用户可见文本使用中文：**

```typescript
// ✅ 好的做法
label: '名称';
placeholder: '请输入名称';
description: '物品的名称或描述';

// ❌ 避免英文
label: 'Name';
```

**枚举值本地化：**

```typescript
function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    ACTIVE: '活跃',
    INACTIVE: '非活跃',
  };
  return statusMap[status] || status;
}
```

## 5. 测试标准

### 5.1 Schema 测试

```typescript
// src/modules/{module}/__tests__/schema.test.ts

import { describe, it, expect } from 'vitest';
import { {module}AttributesSchema } from '../schema';

describe('{Module} Schema', () => {
  it('should validate valid data', () => {
    const validData = {
      name: 'Test Item',
      category: 'TYPE1',
      // ... 其他必填字段
    };

    const result = {module}AttributesSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject invalid data', () => {
    const invalidData = {
      name: '',  // 空名称应该失败
    };

    const result = {module}AttributesSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should validate optional fields', () => {
    const dataWithOptional = {
      name: 'Test Item',
      category: 'TYPE1',
      description: 'Optional description',
    };

    const result = {module}AttributesSchema.safeParse(dataWithOptional);
    expect(result.success).toBe(true);
  });
});
```

### 5.2 组件测试

```typescript
// src/modules/{module}/ui/__tests__/{Module}Card.test.tsx

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { {Module}Card } from '../{Module}Card';

describe('{Module}Card', () => {
  const mockItem = {
    id: '1',
    type: '{module}' as const,
    itemNumber: 1,
    name: 'Test Item',
    category: 'TYPE1',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
    mainImage: null,
    attachmentImages: null,
  };

  it('should render item name', () => {
    render(<{Module}Card item={mockItem} />);
    expect(screen.getByText('Test Item')).toBeInTheDocument();
  });

  it('should render item number', () => {
    render(<{Module}Card item={mockItem} />);
    expect(screen.getByText('#1')).toBeInTheDocument();
  });

  it('should render status badge', () => {
    render(<{Module}Card item={mockItem} />);
    expect(screen.getByText('活跃')).toBeInTheDocument();
  });
});
```

## 6. 性能优化（Next.js 16 + React 19）

### 6.1 代码分割和懒加载

**动态导入组件：**

```typescript
// ✅ 动态导入 Client Component
import dynamic from 'next/dynamic';

const DynamicComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>,
  ssr: false, // 禁用 SSR（仅客户端渲染）
});

// ✅ 在 config.ts 中延迟加载
CardComponent: undefined,  // 系统会自动动态加载
DetailComponent: undefined,
```

**React.lazy 和 Suspense（React 19）：**

```typescript
'use client'

import { lazy, Suspense } from 'react';

const HeavyChart = lazy(() => import('./HeavyChart'));

export function Dashboard() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <HeavyChart data={data} />
    </Suspense>
  );
}
```

### 6.2 缓存策略（Next.js 16 新特性）

**Cache Components（Next.js 16）：**

```javascript
// next.config.js
module.exports = {
  cacheComponents: true, // 启用组件缓存（Partial Pre-Rendering）
};
```

**数据缓存：**

```typescript
// 1. 静态缓存（默认）
const data = await fetch('https://api.example.com/data', {
  cache: 'force-cache',
});

// 2. 动态数据（不缓存）
const data = await fetch('https://api.example.com/data', {
  cache: 'no-store',
});

// 3. 时间重新验证
const data = await fetch('https://api.example.com/data', {
  next: { revalidate: 60 }, // 60秒后重新验证
});

// 4. 标签重新验证（Next.js 16）
const data = await fetch('https://api.example.com/data', {
  next: { tags: ['products'] },
});

// 手动重新验证
import { revalidateTag } from 'next/cache';
revalidateTag('products');
```

**React Query 缓存配置：**

```typescript
// src/components/providers/QueryProvider.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分钟内数据视为新鲜
      gcTime: 10 * 60 * 1000, // 10分钟后垃圾回收
      retry: 1, // 失败重试1次
      refetchOnWindowFocus: false, // 窗口聚焦不重新获取
      refetchOnReconnect: true, // 重新连接时重新获取
      refetchOnMount: false, // 挂载时不重新获取（如果数据新鲜）
    },
  },
});
```

### 6.3 图片优化

**Next.js 16 图片优化：**

- 自动 WebP/AVIF 转换
- 响应式图片生成
- 懒加载和优先加载
- 模糊占位符

```typescript
// ✅ 完整的图片优化示例
<Image
  src={imageUrl}
  alt="Product"
  fill
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  className="object-cover"
  loading="lazy"
  placeholder="blur"
  blurDataURL={blurData}
/>
```

### 6.4 Bundle 优化

**Webpack 配置（next.config.js）：**

```javascript
module.exports = {
  // 优化包导入（Next.js 16）
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'framer-motion'],
  },

  webpack: (config, { dev, isServer }) => {
    if (!dev) {
      // 生产环境优化
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            priority: 20,
          },
          ui: {
            test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
            name: 'ui',
            priority: 15,
          },
        },
      };
    }
    return config;
  },
};
```

### 6.5 数据获取优化

**并行数据获取：**

```typescript
// ✅ 并行获取多个数据源
export default async function Page() {
  const [users, posts, comments] = await Promise.all([
    fetchUsers(),
    fetchPosts(),
    fetchComments(),
  ]);

  return <Dashboard users={users} posts={posts} comments={comments} />;
}
```

**流式渲染（Streaming）：**

```typescript
// app/page.tsx
import { Suspense } from 'react';

export default function Page() {
  return (
    <div>
      <Header /> {/* 立即渲染 */}

      <Suspense fallback={<Skeleton />}>
        <SlowComponent /> {/* 异步加载 */}
      </Suspense>

      <Footer /> {/* 立即渲染 */}
    </div>
  );
}

async function SlowComponent() {
  const data = await fetchSlowData();
  return <div>{data}</div>;
}
```

### 6.6 性能监控

**使用 Next.js Analytics：**

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

**性能指标：**

- **FCP** (First Contentful Paint) - 首次内容绘制
- **LCP** (Largest Contentful Paint) - 最大内容绘制
- **CLS** (Cumulative Layout Shift) - 累积布局偏移
- **FID** (First Input Delay) - 首次输入延迟
- **TTFB** (Time to First Byte) - 首字节时间

## 7. 文档要求

### 7.1 代码注释

**文件头注释：**

```typescript
/**
 * {Module} Module Configuration
 *
 * Comprehensive configuration for managing {module description}.
 * Supports {key features}.
 *
 * Requirements: 5.1, 5.2
 */
```

**函数注释：**

```typescript
/**
 * 获取状态徽章颜色
 *
 * @param status - 状态值
 * @returns Tailwind CSS 类名
 */
function getStatusColor(status: string): string {
  // ...
}
```

### 7.2 README 文件

每个模块应包含 README.md：

```markdown
# {模块名称}模块

## 概述

简要描述模块的功能和用途。

## 功能特性

- 特性 1
- 特性 2
- 特性 3

## 数据模型

描述主要的数据字段和验证规则。

## 组件

- **{Module}Card**: 列表卡片组件
- **{Module}Detail**: 详情页组件

## 使用示例

提供基本的使用示例。

## 测试

说明如何运行测试。
```

## 8. 模块注册

### 8.1 注册到系统

在 `src/modules/registry.ts` 中注册模块：

```typescript
import { {module}Module } from './{module}/config';

export const MODULE_REGISTRY: Record<string, ModuleDefinition> = {
  quilt: quiltModule,
  card: cardModule,
  {module}: {module}Module,  // 添加新模块
};
```

### 8.2 数据库迁移（Neon Serverless + Drizzle）

**创建数据库 Schema（Drizzle）：**

```typescript
// src/db/schema.ts
import { pgTable, uuid, serial, varchar, timestamp } from 'drizzle-orm/pg-core';

export const {module}s = pgTable('{module}s', {
  id: uuid('id').primaryKey().defaultRandom(),
  itemNumber: serial('item_number').unique().notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  // 其他字段...
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 创建索引
export const {module}CategoryIdx = index('{module}_category_idx').on({module}s.category);
export const {module}CreatedAtIdx = index('{module}_created_at_idx').on({module}s.createdAt);
```

**生成迁移文件：**

```bash
npm run db:generate  # 生成迁移文件
npm run db:push      # 推送到数据库
```

**手动 SQL 迁移（可选）：**

```sql
-- migrations/XXX_create_{module}_table.sql

CREATE TABLE IF NOT EXISTS {module}s (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_number SERIAL UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  -- 其他字段...
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_{module}s_category ON {module}s(category);
CREATE INDEX idx_{module}s_created_at ON {module}s(created_at);

-- 创建更新触发器
CREATE OR REPLACE FUNCTION update_{module}s_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER {module}s_updated_at
BEFORE UPDATE ON {module}s
FOR EACH ROW
EXECUTE FUNCTION update_{module}s_updated_at();
```

### 8.3 API 路由（Next.js 16 App Router）

**创建 REST API：**

```typescript
// src/app/api/{module}s/route.ts
import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import {
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
} from '@/lib/api/response';

/**
 * GET /api/{module}s - 获取列表
 */
export async function GET(request: NextRequest) {
  try {
    // 验证认证
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('未授权', 401);
    }

    // 解析查询参数
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // 获取数据
    const items = await fetch{Module}s({ limit, offset });
    const total = await count{Module}s();

    return createSuccessResponse(
      { items },
      { total, limit, hasMore: offset + items.length < total }
    );
  } catch (error) {
    return createErrorResponse('获取列表失败', 500, error);
  }
}

/**
 * POST /api/{module}s - 创建新项
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return createErrorResponse('未授权', 401);
    }

    const body = await request.json();

    // 验证数据
    const result = {module}Schema.safeParse(body);
    if (!result.success) {
      return createValidationErrorResponse(
        '数据验证失败',
        result.error.flatten().fieldErrors
      );
    }

    // 创建项
    const item = await create{Module}(result.data);

    return createSuccessResponse({ item }, undefined, 201);
  } catch (error) {
    return createErrorResponse('创建失败', 500, error);
  }
}
```

**动态路由：**

```typescript
// src/app/api/{module}s/[id]/route.ts
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  // 处理逻辑...
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  // 更新逻辑...
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  // 删除逻辑...
}
```

### 8.4 Repository 模式

**创建 Repository：**

```typescript
// src/lib/repositories/{module}.repository.ts
import { sql } from '@/lib/neon';
import { BaseRepositoryImpl } from './base.repository';
import type { {Module}, {Module}Row } from '@/lib/database/types';

export class {Module}Repository extends BaseRepositoryImpl<{Module}Row, {Module}> {
  protected tableName = '{module}s';

  protected rowToModel(row: {Module}Row): {Module} {
    return {
      id: row.id,
      itemNumber: row.item_number,
      name: row.name,
      // 映射其他字段...
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  protected modelToRow(model: Partial<{Module}>): Partial<{Module}Row> {
    return {
      name: model.name,
      // 映射其他字段...
    };
  }

  async findAll(filters?: {Module}Filters): Promise<{Module}[]> {
    const rows = await sql`
      SELECT * FROM {module}s
      WHERE 1=1
      ${filters?.category ? sql`AND category = ${filters.category}` : sql``}
      ORDER BY item_number DESC
      LIMIT ${filters?.limit || 20}
      OFFSET ${filters?.offset || 0}
    `;

    return rows.map(row => this.rowToModel(row as {Module}Row));
  }

  async create(data: Create{Module}Input): Promise<{Module}> {
    const [row] = await sql`
      INSERT INTO {module}s (name, category, ...)
      VALUES (${data.name}, ${data.category}, ...)
      RETURNING *
    `;

    return this.rowToModel(row as {Module}Row);
  }
}

// 导出单例
export const {module}Repository = new {Module}Repository();
```

## 9. 检查清单

在提交新模块之前，确保：

### 9.1 代码质量

- [ ] 所有文件都有适当的 TypeScript 类型
- [ ] 没有 `any` 类型（除非绝对必要）
- [ ] 所有组件都有 JSDoc 注释
- [ ] 代码通过 ESLint 检查
- [ ] 代码通过 TypeScript 编译

### 9.2 功能完整性

- [ ] config.ts 包含所有必需配置
- [ ] schema.ts 定义了完整的数据模型
- [ ] CardComponent 正确显示列表项
- [ ] DetailComponent 显示所有字段
- [ ] 表单字段配置完整
- [ ] 列表列配置合理
- [ ] 统计配置有意义

### 9.3 UI/UX

- [ ] 组件响应式设计
- [ ] 图片正确加载和显示
- [ ] 徽章颜色一致
- [ ] 文本全部中文化
- [ ] 布局美观整洁
- [ ] 移动端体验良好

### 9.4 测试

- [ ] Schema 测试覆盖主要场景
- [ ] 组件测试覆盖关键功能
- [ ] 所有测试通过

### 9.5 文档

- [ ] 代码注释完整
- [ ] README.md 文件存在
- [ ] 使用示例清晰

### 9.6 性能

- [ ] 图片使用 Next.js Image 组件
- [ ] 组件使用适当的 Server/Client 标记
- [ ] 没有不必要的客户端 JavaScript

## 10. 参考示例

### 10.1 完整示例：被子管理模块

被子管理模块是一个完整的参考实现，包含：

- 24+ 个字段的完整配置
- 图片管理
- 使用追踪
- 统计分析

路径：`src/modules/quilts/`

### 10.2 完整示例：球星卡管理模块

球星卡管理模块展示了：

- 复杂的分类系统（运动类型、评级公司）
- 价值追踪
- 投资回报计算
- 特殊功能标记（签名、实物）

路径：`src/modules/cards/`

## 11. 常见问题

### Q: 何时使用 Server Component vs Client Component?

A: 默认使用 Server Component。只有在需要交互性（状态、事件处理、浏览器 API）时才使用 Client Component。Server Components 可以直接访问数据库，减少客户端 JavaScript。

### Q: 如何处理图片上传？

A: 使用系统提供的图片上传 API (`/api/upload`)，将返回的 URL 存储在 mainImage 和 attachmentImages 字段中。支持多图片上传和自动压缩。

### Q: 如何添加自定义统计？

A: 在 statsConfig.metrics 中添加新的计算函数，可以访问所有 items 进行计算。支持复杂的聚合和分组统计。

### Q: 如何处理复杂的验证逻辑？

A: 在 schema.ts 中使用 Zod 的 `.refine()` 或 `.superRefine()` 方法添加自定义验证。例如：

```typescript
.refine((data) => data.endDate > data.startDate, {
  message: '结束日期必须晚于开始日期',
  path: ['endDate'],
})
```

### Q: 如何优化大列表性能？

A: 使用以下策略：

1. 服务端分页（limit/offset）
2. 虚拟滚动（react-window）
3. 无限滚动（TanStack Query 的 useInfiniteQuery）
4. 数据库索引优化

### Q: Next.js 16 的 cacheComponents 是什么？

A: cacheComponents 启用 Partial Pre-Rendering (PPR)，允许在同一页面中混合静态和动态内容，提升性能。

### Q: 如何处理认证和授权？

A: 使用 NextAuth.js 5.0：

- 在 Server Components 中使用 `auth()` 获取 session
- 在 Client Components 中使用 `useSession()` hook
- 在 API Routes 中使用 `auth()` 验证请求

### Q: 如何实现实时数据更新？

A: 使用 TanStack Query 的自动重新获取：

```typescript
const { data } = useQuery({
  queryKey: ['items'],
  queryFn: fetchItems,
  refetchInterval: 30000, // 每30秒自动刷新
});
```

### Q: 如何处理错误？

A: 使用统一的错误处理：

1. API 层：使用 `createInternalErrorResponse()` 返回标准错误
2. 组件层：使用 ErrorBoundary 捕获错误
3. 全局：使用 GlobalErrorHandler 处理未捕获错误

### Q: 如何优化 TypeScript 编译速度？

A: 在 tsconfig.json 中：

- 启用 `incremental: true`
- 使用 `skipLibCheck: true`
- 设置 `moduleResolution: "bundler"`（Next.js 16）

### Q: 如何使用 Drizzle ORM？

A: 项目使用 Drizzle ORM 进行类型安全的数据库操作：

```typescript
import { db } from '@/db';
import { items } from '@/db/schema';
import { eq } from 'drizzle-orm';

// 查询
const item = await db.select().from(items).where(eq(items.id, id));

// 插入
await db.insert(items).values(data);

// 更新
await db.update(items).set(data).where(eq(items.id, id));
```

## 12. 更新日志

- **2026-01-20 v2.0**:
  - 更新到 Next.js 16.1.1 + React 19.2.3
  - 添加 Cache Components 和 Partial Pre-Rendering 支持
  - 更新 Server/Client Components 最佳实践
  - 添加 Turbopack 配置说明
  - 增强类型安全指南（TypeScript 5.9+）
  - 更新 Tailwind CSS 4.1+ 样式规范
  - 添加 Next.js 16 图片优化最佳实践
  - 新增 API 路由和 Repository 模式指南
  - 添加 Drizzle ORM 数据库操作示例
  - 增强性能优化章节（缓存策略、Bundle 优化）
  - 扩展常见问题解答

- **2026-01-20 v1.0**: 初始版本，基于被子管理和球星卡管理模块总结

## 13. 联系和支持

如有问题或建议，请：

1. 查看现有模块的实现
2. 参考本文档
3. 联系开发团队

---

**注意**: 本标准文档会随着系统演进持续更新。所有开发者都应该定期查看最新版本。
