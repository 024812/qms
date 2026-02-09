# QMS 模块开发标准规范

> 版本: 1.1 | 最后更新: 2026-02-09 | 技术栈: Next.js 16, React 19, TypeScript 5.9, Drizzle ORM, TailwindCSS 4
>
> ✅ 已通过 Context7 验证符合最新最佳实践

---

## 目录结构标准

```
src/
├── modules/{module-name}/           # 模块定义层
│   ├── config.ts                    # 模块配置（表单字段、列表列、统计）
│   ├── schema.ts                    # Zod 验证 schema
│   ├── types.ts                     # 模块特定类型
│   ├── utils.ts                     # 模块工具函数
│   ├── services/                    # 外部服务集成
│   │   ├── {service}-client.ts      # API 客户端
│   │   └── ai-{module}-service.ts   # AI 分析服务
│   ├── ui/                          # 模块专用组件
│   │   ├── {Module}Card.tsx         # 列表卡片组件
│   │   └── {Module}Details.tsx      # 详情展示组件
│   └── __tests__/                   # 模块测试
│       └── {module}.test.ts
│
├── lib/repositories/                # 数据访问层
│   ├── {module}.repository.ts       # Repository 类
│   └── cached-{module}.repository.ts # 缓存层
│
├── db/                              # 数据库层
│   └── schema.ts                    # Drizzle schema（添加新表）
│
├── app/
│   └── [locale]/{module}/           # 页面层
│       ├── page.tsx                 # 列表页
│       ├── layout.tsx               # 模块布局
│       ├── [id]/                    # 动态路由
│       │   └── page.tsx             # 详情页
│       ├── components/              # 页面组件
│       │   ├── {Module}ListView.tsx
│       │   ├── {Module}Form.tsx
│       │   ├── {Module}Dashboard.tsx
│       │   ├── form-parts/          # 表单分区
│       │   │   ├── SectionBasic.tsx
│       │   │   └── SectionValue.tsx
│       │   └── analysis/            # 分析组件
│       │       └── MarketAnalysisTab.tsx
│       ├── settings/                # 模块设置
│       │   └── page.tsx
│       ├── overview/                # 概览/统计
│       │   └── page.tsx
│       └── sold/                    # 已售/已处理
│           └── page.tsx
│
├── app/actions/                     # Server Actions
│   └── {module}-actions.ts
│
└── hooks/                           # 自定义 Hooks
    └── use{Module}.ts
```

---

## 核心架构模式

### 1. Repository 模式 (必须)

```typescript
// src/lib/repositories/{module}.repository.ts
import { BaseRepositoryImpl } from './base.repository';
import { db, Tx } from '@/db';
import { {module}s } from '@/db/schema';
import { updateTag } from 'next/cache';

export interface {Module}Filters {
  // 家庭共享模式：无需 userId 隔离
  status?: string;
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class {Module}Repository extends BaseRepositoryImpl<{Module}Row, {Module}> {
  protected tableName = '{module}s';

  // 必须实现的方法 (家庭共享模式，无需 userId)
  async findById(id: string, tx?: Tx): Promise<{Module} | null>
  async findAll(filters: {Module}Filters, tx?: Tx): Promise<{Module}[]>
  async create(data: Create{Module}Data, tx?: Tx): Promise<{Module}>
  async update(id: string, data: Partial<Create{Module}Data>, tx?: Tx): Promise<{Module} | null>
  async delete(id: string, tx?: Tx): Promise<boolean>
  async count(filters: {Module}Filters, tx?: Tx): Promise<number>

  // 推荐：状态更新带关联记录 (参考 QuiltRepository)
  async updateStatusWithRecord(id: string, newStatus: string, notes?: string): Promise<{
    item: {Module};
    record?: {...};
  }>
}

export const {module}Repository = new {Module}Repository();
```

### 2. 缓存层 (必须)

```typescript
// src/lib/repositories/cached-{module}.repository.ts
import { cache } from 'react';
import { cacheLife, cacheTag } from 'next/cache';

// 家庭共享数据使用 'use cache' (非 private)
export async function getCached{Module}ById(id: string): Promise<{Module} | null> {
  'use cache';
  // 推荐使用自定义对象格式
  cacheLife({
    stale: 60,       // 1 分钟过期警告
    revalidate: 300, // 5 分钟重新验证
    expire: 3600,    // 1 小时完全过期
  });
  cacheTag('{module}s', `{module}-${id}`);
  return {module}Repository.findById(id);
}

// 共享数据使用 'use cache: remote'
export async function getCached{Module}Categories(): Promise<Category[]> {
  'use cache: remote';
  cacheLife({ expire: 3600 }); // 1 小时
  cacheTag('{module}s-categories');
  return {module}Repository.getCategories();
}

// 请求去重包装
export const get{Module}ByIdWithDedup = cache(getCached{Module}ById);
```

### 3. Server Actions (必须)

```typescript
// src/app/actions/{module}-actions.ts
'use server';

import { auth } from '@/auth';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';

// 输入验证 Schema
const {module}InputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  // ...其他字段
});

// 必须检查授权 (只要求登录，数据家庭共享)
export async function save{Module}(prevState: FormState, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { errors: { _form: ['Unauthorized'] } };
  }

  const validated = {module}InputSchema.safeParse({
    name: formData.get('name'),
    // ...其他字段
  });

  // ✅ 正确的验证错误返回格式
  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
    };
  }

  // 使用 Repository (无需传入 userId，家庭共享)
  const result = await {module}Repository.create(validated.data);

  // ✅ 失效全局缓存即可
  revalidateTag('{module}s', 'max');
  return { success: true, data: result };
}
```

## 数据库架构标准

QMS 采用**家庭共享数据模式**，所有家庭成员共同管理物品数据。

### 架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                        共享表 (Shared Tables)                    │
├─────────────────────────────────────────────────────────────────┤
│  users           │ 用户账户，所有模块共用                       │
│  audit_logs      │ 系统审计日志，跨模块共用                     │
│  system_settings │ 系统设置，跨模块共用                         │
│  notifications   │ 通知消息，跨模块共用                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              模块独立表 (Module-Specific Tables)                 │
├─────────────────────────────────────────────────────────────────┤
│  quilts          │ 被子管理独立表 (家庭共享)                    │
│  usage_records   │ 被子使用记录关联表                           │
├─────────────────────────────────────────────────────────────────┤
│  cards           │ 球星卡管理独立表 (家庭共享)                  │
│  (已从用户隔离改为家庭共享模式)                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 数据隔离模式选择

> [!IMPORTANT]
> QMS 默认采用**家庭共享模式**。在创建新模块前，请根据业务需求选择数据模式。

| 模式                | 适用场景                   | 缓存指令               | 示例模块                 |
| ------------------- | -------------------------- | ---------------------- | ------------------------ |
| **家庭共享** (默认) | 家庭成员共同管理的物品     | `'use cache'`          | 被子、球星卡、家具、家电 |
| **用户隔离**        | 个人私密数据或 SaaS 多租户 | `'use cache: private'` | 个人日记、财务记录       |

**家庭共享模式特点：**

- 数据表无 userId 字段（或 userId 为可选）
- 所有登录用户可查看和编辑所有数据
- 使用 `'use cache'` 进行共享缓存
- 适合家庭物品管理场景

**用户隔离模式特点：**

- 数据表必须有 userId 字段
- 每个用户只能访问自己的数据
- 使用 `'use cache: private'` 进行私有缓存
- Repository 方法需要 userId 参数

### 主表 Schema 模板

```typescript
// src/db/schema.ts

import {
  pgTable, pgEnum, text, timestamp, jsonb, uuid,
  index, integer, numeric, serial
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. 模块状态枚举
export const {module}StatusEnum = pgEnum('{module}_status', [
  'ACTIVE', 'STORAGE', 'MAINTENANCE', 'DISPOSED'
]);

// 2. 主表 (默认家庭共享，userId 可选用于未来扩展)
export const {module}s = pgTable('{module}s', {
  // 主键
  id: uuid('id').defaultRandom().primaryKey(),
  itemNumber: serial('item_number').notNull().unique(),

  // 可选：用户归属 (未来多用户/权限扩展预留)
  // 默认为 null 表示家庭共享，设置后表示个人物品
  userId: text('user_id').references(() => users.id),

  // 核心字段
  name: text('name').notNull(),
  status: {module}StatusEnum('status').notNull().default('ACTIVE'),
  category: text('category'),
  brand: text('brand'),
  location: text('location'),

  // 价值追踪
  purchasePrice: numeric('purchase_price', { precision: 10, scale: 2 }),
  currentValue: numeric('current_value', { precision: 10, scale: 2 }),
  purchaseDate: timestamp('purchase_date'),

  // 图片
  mainImage: text('main_image'),
  attachmentImages: jsonb('attachment_images').$type<string[]>().default([]),

  // 备注 & 时间戳
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, table => ({
  statusIdx: index('{module}s_status_idx').on(table.status),
  categoryIdx: index('{module}s_category_idx').on(table.category),
  // 可选：启用多用户模式时取消注释
  // userIdIdx: index('{module}s_user_id_idx').on(table.userId),
}));

// 3. 关联记录表
export const {module}Records = pgTable('{module}_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  {module}Id: uuid('{module}_id')
    .notNull()
    .references(() => {module}s.id, { onDelete: 'cascade' }),
  recordType: text('record_type').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, table => ({
  {module}Idx: index('{module}_records_idx').on(table.{module}Id),
}));

// 4. Drizzle Relations
export const {module}sRelations = relations({module}s, ({ many }) => ({
  records: many({module}Records),
}));

export const {module}RecordsRelations = relations({module}Records, ({ one }) => ({
  {module}: one({module}s, {
    fields: [{module}Records.{module}Id],
    references: [{module}s.id],
  }),
}));

// 5. 类型导出
export type {Module} = typeof {module}s.$inferSelect;
export type New{Module} = typeof {module}s.$inferInsert;
```

### 迁移命令

```bash
npm run db:generate   # 生成迁移
npm run db:migrate    # 应用迁移
npm run db:push       # 开发环境推送
```

---

## 模块配置标准

```typescript
// src/modules/{module}/config.ts
import { ModuleDefinition } from '../types';
import { {module}AttributesSchema } from './schema';

export const {module}Module: ModuleDefinition = {
  id: '{module}s',
  name: '模块名称',
  description: '模块描述',
  icon: 'IconName',  // Lucide icon
  color: 'purple',

  attributesSchema: {module}AttributesSchema,
  CardComponent: {Module}Card,  // 列表卡片

  // 表单字段定义
  formFields: [
    {
      name: 'fieldName',
      label: '字段标签',
      type: 'text' | 'number' | 'select' | 'date' | 'textarea',
      placeholder: '...',
      required: true,
      description: '字段说明',
      options: [{ label: '...', value: '...' }],  // select 类型
    },
  ],

  // 列表列定义
  listColumns: [
    {
      key: 'fieldName',
      label: '列标签',
      render: (value, item) => { /* 自定义渲染 */ },
    },
  ],

  // 统计配置
  statsConfig: {
    metrics: [
      {
        key: 'total',
        label: '总数量',
        calculate: items => items.length,
      },
      {
        key: 'totalValue',
        label: '总价值',
        calculate: items => {
          const sum = items.reduce((acc, i) => acc + (i.currentValue || 0), 0);
          return `$${sum.toLocaleString()}`;
        },
      },
    ],
  },
};
```

---

## 外部服务集成标准

```typescript
// src/modules/{module}/services/{service}-client.ts
import { systemSettingsRepository } from '@/lib/repositories/system-settings.repository';

// 自定义错误类
export class {Service}ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = '{Service}ConfigError';
  }
}

export class {Service}ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = '{Service}ApiError';
  }
}

export class {Service}ApiClient {
  private baseUrl: string;
  private apiKey: string | null = null;

  constructor(config?: { baseUrl?: string; apiKey?: string }) {
    this.baseUrl = config?.baseUrl || process.env.{SERVICE}_API_URL || '';
    this.apiKey = config?.apiKey || null;
  }

  // 从系统设置或环境变量获取配置
  private async getApiKey(): Promise<string> {
    if (this.apiKey) return this.apiKey;

    const dbKey = await systemSettingsRepository.getSetting('{service}_api_key');
    if (dbKey) return dbKey;

    const envKey = process.env.{SERVICE}_API_KEY;
    if (envKey) return envKey;

    throw new {Service}ConfigError('API key not configured');
  }

  async search(params: SearchParams): Promise<SearchResult[]> {
    const apiKey = await this.getApiKey();
    // 实现搜索逻辑，包含重试机制
  }
}

export const {service}ApiClient = new {Service}ApiClient();
```

---

## UI 组件标准

### 表单分区模式

```typescript
// 将大表单拆分为逻辑分区
// src/app/[locale]/{module}/components/form-parts/SectionBasic.tsx
'use client';

import { UseFormReturn } from 'react-hook-form';
import { {Module}FormValues } from '../../schema';

interface SectionBasicProps {
  form: UseFormReturn<{Module}FormValues>;
  t: (key: string) => string;
}

export function SectionBasic({ form, t }: SectionBasicProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('section.basic')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 表单字段 */}
      </CardContent>
    </Card>
  );
}
```

### Dashboard 布局

```typescript
// src/app/[locale]/{module}/components/{Module}Dashboard.tsx
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function {Module}Dashboard({ item }: { item: {Module} }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 左侧：主要信息 */}
      <div className="lg:col-span-2 space-y-6">
        <ItemHeader item={item} />
        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">详情</TabsTrigger>
            <TabsTrigger value="history">历史</TabsTrigger>
            <TabsTrigger value="analysis">分析</TabsTrigger>
          </TabsList>
          <TabsContent value="details"><DetailsTab /></TabsContent>
          <TabsContent value="history"><HistoryTab /></TabsContent>
          <TabsContent value="analysis"><AnalysisTab /></TabsContent>
        </Tabs>
      </div>

      {/* 右侧：辅助信息 */}
      <div className="space-y-6">
        <QuickActions item={item} />
        <ValueCard item={item} />
        <RelatedItems itemId={item.id} />
      </div>
    </div>
  );
}
```

---

## Hooks 标准

### 表单提交 Hook (使用 useActionState)

```typescript
// src/hooks/use{Module}Form.ts
'use client';

import { useActionState } from 'react';
import { save{Module}, delete{Module} } from '@/app/actions/{module}-actions';

// ✅ React 19 推荐：使用 useActionState 处理 Server Actions
export function use{Module}Form(initialState = {}) {
  const [state, formAction, isPending] = useActionState(save{Module}, initialState);

  return {
    state,      // 包含 errors 或 success
    formAction, // 传给 form action
    isPending,  // 提交中状态
  };
}

// 使用示例
// const { state, formAction, isPending } = use{Module}Form();
// <form action={formAction}>
//   <button disabled={isPending}>保存</button>
//   {state?.errors?.name && <p>{state.errors.name}</p>}
// </form>
```

### 数据查询 Hook (可选，用于客户端筛选)

```typescript
// src/hooks/use{Module}s.ts
'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { get{Module}s } from '@/app/actions/{module}-actions';

// 仅在需要客户端复杂筛选/排序时使用
export function use{Module}s(filters?: {Module}Filters) {
  return useQuery({
    queryKey: ['{module}s', filters],
    queryFn: () => get{Module}s(filters),
  });
}

// 推荐：大多数场景直接在 Server Component 中获取数据
// export default async function Page() {
//   const items = await getCached{Module}s();
//   return <{Module}List items={items} />;
// }
```

### 表单提交按钮组件

```typescript
// src/components/ui/submit-button.tsx
'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';

export function SubmitButton({ children = '保存' }: { children?: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? '处理中...' : children}
    </Button>
  );
}
```

---

## 检查清单

新模块开发时必须完成以下项目：

- [ ] **Schema**: 在 `src/db/schema.ts` 添加表定义
- [ ] **Repository**: 创建 `{module}.repository.ts` 继承 BaseRepositoryImpl
- [ ] **Cached Repository**: 创建 `cached-{module}.repository.ts` 使用 `'use cache'`
- [ ] **Module Config**: 创建 `src/modules/{module}/config.ts`
- [ ] **Validation Schema**: 创建 `src/modules/{module}/schema.ts`
- [ ] **Server Actions**: 创建 `src/app/actions/{module}-actions.ts`
- [ ] **Pages**: 创建 `src/app/[locale]/{module}/` 目录结构
- [ ] **Hooks**: 创建 `src/hooks/use{Module}.ts`
- [ ] **i18n**: 在 `messages/zh.json` 和 `messages/en.json` 添加翻译
- [ ] **Navigation**: 在 `AppSidebar.tsx` 添加模块入口
- [ ] **Tests**: 添加至少基础测试用例
- [ ] **Documentation**: 更新相关文档

---

## 示例：藏酒管理模块

```
src/
├── modules/wines/
│   ├── config.ts           # 酒品信息、产区、年份等配置
│   ├── schema.ts           # 验证: vintage, region, grape, etc.
│   ├── types.ts
│   ├── services/
│   │   └── vivino-client.ts  # Vivino API 集成
│   └── ui/
│       └── WineCard.tsx
├── lib/repositories/
│   ├── wine.repository.ts
│   └── cached-wine.repository.ts
├── app/[locale]/wines/
│   ├── page.tsx
│   ├── [id]/page.tsx
│   ├── components/
│   │   ├── WineListView.tsx
│   │   ├── WineForm.tsx
│   │   └── TastingNotes.tsx
└── app/actions/
    └── wine-actions.ts
```
