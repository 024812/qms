# 设计文档

## 概述

本文档描述了可扩展通用物品管理框架的技术设计。该框架采用插件化架构，支持动态添加新的物品类型模块（被子、鞋子、球拍、球星卡片等），同时提供共享的核心功能和一致的开发体验。

### 设计目标

- **可扩展性**: 通过插件机制轻松添加新模块
- **代码复用**: 最大化共享代码，最小化重复
- **类型安全**: 利用TypeScript提供完整的类型检查
- **开发效率**: 提供CLI工具和脚手架快速开发新模块
- **性能优化**: 使用缓存、连接池和异步处理
- **平滑迁移**: 支持从现有被子管理系统渐进式迁移

**实施阶段：**

**阶段 1：用户管理系统**

- 用户注册、登录、认证
- 基于角色的访问控制（RBAC）
- 模块订阅管理
- 仪表盘和模块选择器

**阶段 2：被子管理子系统**

- 迁移现有被子管理功能
- 适配新的框架架构
- 数据迁移脚本
- 验证框架的可扩展性

**阶段 3：球星卡管理子系统**

- 球星卡片的CRUD操作
- 卡片评级和价值追踪
- 收藏统计和分析
- 验证多模块共存

**未来扩展：**

- 鞋子管理（球鞋收藏）
- 球拍管理（网球/羽毛球拍）
- 其他收藏品类型

### 技术栈

- **前端**: Next.js 16.1 (App Router), React 19, TypeScript 5
- **后端**: Next.js Server Actions
- **数据库**: Neon PostgreSQL (Serverless)
- **ORM**: Drizzle ORM (类型安全、轻量级)
- **认证**: Auth.js v5 (NextAuth.js v5)
- **UI组件**: shadcn/ui + Tailwind CSS v4
- **表单**: Next.js 16 Form Component (渐进增强) + Zod 验证
- **文件上传**: UploadThing 或 Vercel Blob
- **缓存**: Next.js 16 cacheLife() + cacheTag() + updateTag() API
- **测试**: Vitest + Testing Library + fast-check

**技术栈选择理由：**

- **Next.js 16.1**: 最新版本，支持 Form 组件、cacheLife API 等新特性
- **Auth.js v5**: 最新认证方案，与 Next.js 16 深度集成
- **Drizzle ORM**: 轻量级、类型安全，支持 JSONB 和 .$type<T>() 类型推断
- **Next.js Form**: 提供渐进增强，无需 JavaScript 也能工作
- **Zod**: 运行时验证，与 TypeScript 完美配合

## 架构

### 整体架构

采用**模块化单体架构 (Modular Monolith)** + **单表继承模式**，使用JSONB存储特定字段。

```
┌─────────────────────────────────────────────────────────┐
│              前端层 (Next.js 15 App Router)              │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐  │
│  │  app/(auth)/login                 # 登录页       │  │
│  │  app/(dashboard)/                 # 需鉴权布局   │  │
│  │    ├── page.tsx                   # 聚合仪表盘   │  │
│  │    ├── [category]/                # 动态模块路由 │  │
│  │    │   ├── page.tsx               # 列表页       │  │
│  │    │   └── [id]/page.tsx          # 详情页       │  │
│  │    └── settings/                  # 设置页       │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │         共享组件库 (modules/core/ui)             │  │
│  │  - ItemCard  - ItemList  - StatusBadge           │  │
│  │  - ItemForm  - ImageUpload  - StatsDashboard     │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│              服务层 (Server Actions + Auth)              │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐  │
│  │  Server Actions (app/actions/)                   │  │
│  │    - items.ts      # CRUD 操作                   │  │
│  │    - auth.ts       # 认证操作                    │  │
│  │    - upload.ts     # 文件上传                    │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Auth.js v5 (auth.ts)                            │  │
│  │    - Credentials Provider                        │  │
│  │    - Session Management                          │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│              业务逻辑层 (Module Registry)                │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐  │
│  │  modules/registry.ts (策略模式)                  │  │
│  │    - MODULE_REGISTRY: Record<string, Module>     │  │
│  │    - 动态加载模块配置和UI组件                    │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ modules/     │  │ modules/     │  │ modules/     │  │
│  │ quilts/      │  │ shoes/       │  │ rackets/     │  │
│  │ - schema.ts  │  │ - schema.ts  │  │ - schema.ts  │  │
│  │ - ui/        │  │ - ui/        │  │ - ui/        │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│              数据访问层 (Drizzle ORM)                    │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐  │
│  │  users 表                                        │  │
│  │  - id, name, email, password, role               │  │
│  │  - active_modules: jsonb (订阅的模块列表)       │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  items 表 (单表继承)                            │  │
│  │  - id, type, name, status, owner_id              │  │
│  │  - attributes: jsonb (特定字段)                  │  │
│  │  - images: jsonb (图片URL数组)                   │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  usage_logs 表 (通用日志)                       │  │
│  │  - id, item_id, user_id, action, snapshot        │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                Neon PostgreSQL 数据库                    │
└─────────────────────────────────────────────────────────┘
```

### 模块化设计

采用基于功能的目录结构，将业务逻辑收敛在 modules 中：

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx          # 登录页
│   ├── (dashboard)/                # 需鉴权的布局
│   │   ├── layout.tsx              # 共享布局
│   │   ├── page.tsx                # 聚合仪表盘/模块选择器
│   │   ├── [category]/             # 动态模块路由
│   │   │   ├── page.tsx            # 列表页
│   │   │   ├── new/page.tsx        # 新建页
│   │   │   └── [id]/
│   │   │       ├── page.tsx        # 详情页
│   │   │       └── edit/page.tsx   # 编辑页
│   │   └── settings/
│   │       └── page.tsx            # 设置页
│   └── actions/                    # Server Actions
│       ├── items.ts                # 物品CRUD操作
│       ├── auth.ts                 # 认证操作
│       └── upload.ts               # 文件上传
├── auth.ts                         # Auth.js v5 配置
├── middleware.ts                   # 路由中间件（重定向逻辑）
├── db/
│   ├── schema.ts                   # Drizzle Schema
│   └── index.ts                    # DB 连接
├── lib/                            # 通用工具
│   ├── utils.ts
│   └── validators.ts
├── modules/                        # ★ 核心业务逻辑
│   ├── types.ts                    # ModuleDefinition 接口
│   ├── registry.ts                 # 模块注册表 (Registry Pattern)
│   ├── core/                       # 通用组件和工具
│   │   ├── ui/
│   │   │   ├── ItemCard.tsx
│   │   │   ├── ItemList.tsx
│   │   │   ├── ItemForm.tsx
│   │   │   └── StatusBadge.tsx
│   │   └── utils/
│   │       └── item-helpers.ts
│   ├── quilts/                     # 被子模块
│   │   ├── schema.ts               # Zod Schema
│   │   ├── config.ts               # 模块配置
│   │   └── ui/
│   │       ├── QuiltCard.tsx       # 列表卡片
│   │       └── QuiltDetail.tsx     # 详情视图
│   ├── shoes/                      # 鞋子模块（预留）
│   │   ├── schema.ts
│   │   ├── config.ts
│   │   └── ui/
│   ├── rackets/                    # 球拍模块（预留）
│   └── cards/                      # 球星卡片模块（预留）
└── components/
    └── ui/                         # shadcn/ui 基础组件
```

## 组件和接口

### Auth.js v5 配置

```typescript
// src/auth.ts

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

/**
 * Auth.js v5 配置
 *
 * 最佳实践：
 * - 使用 Credentials Provider 进行用户名/密码认证
 * - 在 authorize 函数中验证用户凭据
 * - 使用 bcrypt 进行密码哈希验证
 * - 在 callbacks 中扩展 session 和 JWT
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async credentials => {
        // 验证输入
        const parsedCredentials = z
          .object({
            email: z.string().email(),
            password: z.string().min(6),
          })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          throw new Error('Invalid credentials');
        }

        const { email, password } = parsedCredentials.data;

        // 查询用户
        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

        if (!user) {
          throw new Error('Invalid credentials');
        }

        // 验证密码
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
          throw new Error('Invalid credentials');
        }

        // 返回用户对象（不包含密码）
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          activeModules: user.activeModules,
        };
      },
    }),
  ],
  callbacks: {
    // 扩展 JWT token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.activeModules = user.activeModules;
      }
      return token;
    },
    // 扩展 session
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.activeModules = token.activeModules as string[];
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
});
```

```typescript
// src/middleware.ts

import { auth } from '@/auth';

/**
 * Next.js Middleware with Auth.js v5
 *
 * 最佳实践：
 * - 使用 auth() 作为 middleware 包装器
 * - 在 middleware 中访问 req.auth
 * - 使用 matcher 配置排除静态资源
 * - 实现基于用户模块的重定向逻辑
 */
export default auth(req => {
  const { auth } = req;
  const { pathname } = req.nextUrl;

  // 公开路径
  const publicPaths = ['/login', '/register'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // 未认证用户访问受保护路径
  if (!auth && !isPublicPath) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return Response.redirect(loginUrl);
  }

  // 已认证用户访问登录页
  if (auth && isPublicPath) {
    return Response.redirect(new URL('/', req.url));
  }

  // 仪表盘重定向逻辑
  if (auth && pathname === '/') {
    const activeModules = auth.user.activeModules || [];

    // 单模块用户直接跳转到模块页面
    if (activeModules.length === 1) {
      return Response.redirect(new URL(`/${activeModules[0]}`, req.url));
    }

    // 多模块用户显示模块选择器（保持在 / 路径）
  }
});

// 配置 matcher 排除静态资源
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### 核心接口定义

```typescript
// src/core/types/module.ts

/**
 * 模块配置接口
 * 定义每个物品模块必须提供的配置信息
 */
export interface ModuleConfig {
  /** 模块唯一标识符 (kebab-case) */
  id: string;
  /** 模块显示名称 */
  name: string;
  /** 模块描述 */
  description: string;
  /** 模块图标 (lucide-react图标名称) */
  icon: string;
  /** 模块版本 */
  version: string;
  /** 字段定义 */
  fields: FieldDefinition[];
  /** 路由配置 */
  routes: RouteConfig;
  /** 权限配置 */
  permissions?: PermissionConfig;
}

/**
 * 字段定义接口
 * 定义模块特定字段的结构和验证规则
 */
export interface FieldDefinition {
  /** 字段名称 */
  name: string;
  /** 字段标签 */
  label: string;
  /** 字段类型 */
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum' | 'json';
  /** 是否必填 */
  required: boolean;
  /** 默认值 */
  defaultValue?: any;
  /** 验证规则 (Zod schema) */
  validation?: ZodSchema;
  /** 枚举选项 (当type为enum时) */
  options?: Array<{ label: string; value: string }>;
  /** 是否在列表中显示 */
  showInList?: boolean;
  /** 是否可搜索 */
  searchable?: boolean;
  /** 字段描述 */
  description?: string;
}

/**
 * 基础实体接口
 * 所有物品类型共享的通用字段
 */
export interface BaseItem {
  id: string;
  moduleType: string;
  userId: string;
  status: 'active' | 'inactive' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

/**
 * 模块服务接口
 * 定义每个模块必须实现的CRUD操作
 */
export interface ModuleService<T extends BaseItem> {
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  findById(id: string): Promise<T | null>;
  findMany(filter: FilterOptions): Promise<PaginatedResult<T>>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
  count(filter?: FilterOptions): Promise<number>;
}
```

### 模块注册表（策略模式）

```typescript
// src/modules/types.ts

import { z } from 'zod';
import { ReactNode } from 'react';

/**
 * 模块定义接口
 * 每个物品模块必须实现此接口
 */
export interface ModuleDefinition {
  /** 模块唯一标识符 */
  id: string;

  /** 模块显示名称 */
  name: string;

  /** 模块描述 */
  description: string;

  /** 模块图标（lucide-react 图标名称） */
  icon: string;

  /** 模块颜色主题 */
  color: string;

  /** Attributes 的 Zod Schema */
  attributesSchema: z.ZodObject<any>;

  /** 列表卡片组件 */
  CardComponent: React.ComponentType<{ item: any }>;

  /** 详情视图组件 */
  DetailComponent: React.ComponentType<{ item: any }>;

  /** 表单字段配置 */
  formFields: FormFieldConfig[];

  /** 列表显示的列配置 */
  listColumns: ColumnConfig[];

  /** 统计指标配置（可选） */
  statsConfig?: StatsConfig;
}

/**
 * 表单字段配置
 */
export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'textarea';
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
  required?: boolean;
  description?: string;
}

/**
 * 列配置
 */
export interface ColumnConfig {
  key: string;
  label: string;
  render?: (value: any, item: any) => ReactNode;
}

/**
 * 统计配置
 */
export interface StatsConfig {
  metrics: Array<{
    key: string;
    label: string;
    calculate: (items: any[]) => number | string;
  }>;
}
```

```typescript
// src/modules/registry.ts

import { ModuleDefinition } from './types';
import { quiltModule } from './quilts/config';
// import { shoeModule } from './shoes/config';
// import { racketModule } from './rackets/config';
// import { cardModule } from './cards/config';

/**
 * 全局模块注册表
 * 使用策略模式，通过 type 字段动态选择模块配置
 */
export const MODULE_REGISTRY: Record<string, ModuleDefinition> = {
  quilt: quiltModule,
  // 未来添加其他模块：
  // shoe: shoeModule,
  // racket: racketModule,
  // card: cardModule,
};

/**
 * 获取模块配置
 */
export function getModule(type: string): ModuleDefinition | undefined {
  return MODULE_REGISTRY[type];
}

/**
 * 获取所有已注册模块
 */
export function getAllModules(): ModuleDefinition[] {
  return Object.values(MODULE_REGISTRY);
}

/**
 * 检查模块是否存在
 */
export function hasModule(type: string): boolean {
  return type in MODULE_REGISTRY;
}
```

```typescript
// src/modules/quilts/config.ts

import { ModuleDefinition } from '../types';
import { quiltAttributesSchema } from './schema';
import { QuiltCard } from './ui/QuiltCard';
import { QuiltDetail } from './ui/QuiltDetail';

/**
 * 被子模块配置
 */
export const quiltModule: ModuleDefinition = {
  id: 'quilt',
  name: '被子管理',
  description: '管理家中的被子，记录使用情况和保养信息',
  icon: 'Bed',
  color: 'blue',

  attributesSchema: quiltAttributesSchema,

  CardComponent: QuiltCard,
  DetailComponent: QuiltDetail,

  formFields: [
    {
      name: 'brand',
      label: '品牌',
      type: 'text',
      placeholder: '例如：无印良品',
    },
    {
      name: 'size',
      label: '尺寸',
      type: 'select',
      required: true,
      options: [
        { label: '单人', value: 'single' },
        { label: '双人', value: 'double' },
        { label: '大号', value: 'queen' },
        { label: '特大号', value: 'king' },
      ],
    },
    {
      name: 'material',
      label: '材质',
      type: 'text',
      required: true,
      placeholder: '例如：纯棉、羽绒',
    },
    {
      name: 'weight',
      label: '重量（kg）',
      type: 'number',
      placeholder: '例如：2.5',
    },
    {
      name: 'warmthLevel',
      label: '保暖等级',
      type: 'select',
      required: true,
      options: [
        { label: '1级（夏凉被）', value: '1' },
        { label: '2级（春秋被）', value: '2' },
        { label: '3级（冬被）', value: '3' },
        { label: '4级（加厚冬被）', value: '4' },
        { label: '5级（极寒被）', value: '5' },
      ],
    },
    {
      name: 'season',
      label: '适用季节',
      type: 'select',
      required: true,
      options: [
        { label: '春季', value: 'spring' },
        { label: '夏季', value: 'summer' },
        { label: '秋季', value: 'autumn' },
        { label: '冬季', value: 'winter' },
        { label: '四季通用', value: 'all_season' },
      ],
    },
    {
      name: 'purchaseDate',
      label: '购买日期',
      type: 'date',
    },
    {
      name: 'purchasePrice',
      label: '购买价格',
      type: 'number',
      placeholder: '例如：299',
    },
    {
      name: 'condition',
      label: '状态',
      type: 'select',
      options: [
        { label: '全新', value: 'new' },
        { label: '良好', value: 'good' },
        { label: '一般', value: 'fair' },
        { label: '较差', value: 'poor' },
      ],
    },
    {
      name: 'notes',
      label: '备注',
      type: 'textarea',
      placeholder: '其他说明信息',
    },
  ],

  listColumns: [
    {
      key: 'name',
      label: '名称',
    },
    {
      key: 'attributes.size',
      label: '尺寸',
      render: value => {
        const sizeMap = {
          single: '单人',
          double: '双人',
          queen: '大号',
          king: '特大号',
        };
        return sizeMap[value as keyof typeof sizeMap] || value;
      },
    },
    {
      key: 'attributes.warmthLevel',
      label: '保暖等级',
      render: value => `${value}级`,
    },
    {
      key: 'status',
      label: '状态',
    },
  ],

  statsConfig: {
    metrics: [
      {
        key: 'total',
        label: '总数量',
        calculate: items => items.length,
      },
      {
        key: 'inUse',
        label: '使用中',
        calculate: items => items.filter(i => i.status === 'in_use').length,
      },
      {
        key: 'avgWarmth',
        label: '平均保暖等级',
        calculate: items => {
          const sum = items.reduce((acc, i) => acc + (i.attributes.warmthLevel || 0), 0);
          return (sum / items.length).toFixed(1);
        },
      },
    ],
  },
};
```

### 通用组件库

```typescript
// src/modules/core/ui/ItemCard.tsx

import { Item } from '@/db/schema';
import { getModule } from '@/modules/registry';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * 通用物品卡片组件
 * 根据模块类型动态渲染特定的卡片组件
 */
interface ItemCardProps {
  item: Item;
  onClick?: () => void;
}

export function ItemCard({ item, onClick }: ItemCardProps) {
  const module = getModule(item.type);

  if (!module) {
    return <div>Unknown module type: {item.type}</div>;
  }

  // 使用模块特定的卡片组件
  const { CardComponent } = module;

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
      <CardContent className="p-4">
        <CardComponent item={item} />
      </CardContent>
    </Card>
  );
}
```

```typescript
// src/modules/core/ui/ItemList.tsx

import { Item } from '@/db/schema';
import { ItemCard } from './ItemCard';
import { useRouter } from 'next/navigation';

/**
 * 通用列表组件
 * 使用网格布局显示物品卡片
 */
interface ItemListProps {
  items: Item[];
  moduleType: string;
}

export function ItemList({ items, moduleType }: ItemListProps) {
  const router = useRouter();

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>暂无数据</p>
        <p className="text-sm mt-2">点击右上角的"添加"按钮创建第一个物品</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
```

```typescript
// src/modules/core/ui/ItemForm.tsx

import Form from 'next/form';
import { getModule } from '@/modules/registry';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

/**
 * 通用表单组件
 * 基于模块配置动态生成表单字段
 *
 * Next.js 16 最佳实践：
 * - 使用 <Form> 组件实现渐进增强（无需 JavaScript 也能工作）
 * - 直接传递 Server Action 到 action 属性
 * - 使用原生 HTML 表单验证（required, type 等）
 * - Server Action 中使用 Zod 进行服务端验证
 */
interface ItemFormProps {
  moduleType: string;
  initialData?: any;
  action: (formData: FormData) => Promise<void>;
  onCancel?: () => void;
}

export function ItemForm({ moduleType, initialData, action, onCancel }: ItemFormProps) {
  const module = getModule(moduleType);

  if (!module) {
    throw new Error(`Module ${moduleType} not found`);
  }

  return (
    <Form action={action} className="space-y-6">
      {/* 通用名称字段 */}
      <div className="space-y-2">
        <Label htmlFor="name">名称 *</Label>
        <Input
          id="name"
          name="name"
          defaultValue={initialData?.name}
          placeholder="请输入物品名称"
          required
        />
      </div>

      {/* 动态渲染模块特定字段 */}
      {module.formFields.map((fieldConfig) => (
        <div key={fieldConfig.name} className="space-y-2">
          <Label htmlFor={fieldConfig.name}>
            {fieldConfig.label}
            {fieldConfig.required && ' *'}
          </Label>
          {renderFormInput(fieldConfig, initialData?.attributes?.[fieldConfig.name])}
          {fieldConfig.description && (
            <p className="text-sm text-muted-foreground">{fieldConfig.description}</p>
          )}
        </div>
      ))}

      <div className="flex gap-2">
        <Button type="submit">保存</Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            取消
          </Button>
        )}
      </div>
    </Form>
  );
}

/**
 * 根据字段类型渲染对应的表单输入组件
 */
function renderFormInput(config: FormFieldConfig, defaultValue?: any) {
  const fieldName = `attributes.${config.name}`;

  switch (config.type) {
    case 'text':
      return (
        <Input
          id={config.name}
          name={fieldName}
          defaultValue={defaultValue}
          placeholder={config.placeholder}
          required={config.required}
        />
      );

    case 'number':
      return (
        <Input
          id={config.name}
          name={fieldName}
          type="number"
          defaultValue={defaultValue}
          placeholder={config.placeholder}
          required={config.required}
        />
      );

    case 'select':
      return (
        <select
          id={config.name}
          name={fieldName}
          defaultValue={defaultValue}
          required={config.required}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">{config.placeholder || '请选择'}</option>
          {config.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );

    case 'date':
      return (
        <Input
          id={config.name}
          name={fieldName}
          type="date"
          defaultValue={defaultValue}
          required={config.required}
        />
      );

    case 'textarea':
      return (
        <Textarea
          id={config.name}
          name={fieldName}
          defaultValue={defaultValue}
          placeholder={config.placeholder}
          required={config.required}
          rows={4}
        />
      );

    default:
      return (
        <Input
          id={config.name}
          name={fieldName}
          defaultValue={defaultValue}
          required={config.required}
        />
      );
  }
}
```

**使用 Next.js 16 Form 组件的简化版本：**

```typescript
// src/app/[category]/new/page.tsx

import Form from 'next/form';
import { redirect } from 'next/navigation';
import { createItem } from '@/app/actions/items';
import { getModule } from '@/modules/registry';

/**
 * 新建物品页面
 * 使用 Next.js 16 Form 组件实现渐进增强
 */
export default function NewItemPage({ params }: { params: { category: string } }) {
  const module = getModule(params.category);

  if (!module) {
    return <div>模块未找到</div>;
  }

  async function handleSubmit(formData: FormData) {
    'use server';

    const name = formData.get('name') as string;

    // 收集 attributes
    const attributes: Record<string, any> = {};
    for (const field of module.formFields) {
      const value = formData.get(`attributes.${field.name}`);
      if (value) {
        attributes[field.name] = value;
      }
    }

    const item = await createItem({
      type: params.category,
      name,
      attributes,
    });

    redirect(`/${params.category}/${item.id}`);
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">新建{module.name}</h1>

      <Form action={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            名称 *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        {module.formFields.map((field) => (
          <div key={field.name}>
            <label htmlFor={field.name} className="block text-sm font-medium mb-2">
              {field.label} {field.required && '*'}
            </label>
            {field.type === 'select' ? (
              <select
                id={field.name}
                name={`attributes.${field.name}`}
                required={field.required}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">请选择</option>
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : field.type === 'textarea' ? (
              <textarea
                id={field.name}
                name={`attributes.${field.name}`}
                required={field.required}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 border rounded-md"
                rows={4}
              />
            ) : (
              <input
                type={field.type}
                id={field.name}
                name={`attributes.${field.name}`}
                required={field.required}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 border rounded-md"
              />
            )}
            {field.description && (
              <p className="text-sm text-gray-500 mt-1">{field.description}</p>
            )}
          </div>
        ))}

        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            保存
          </button>
          <a
            href={`/${params.category}`}
            className="px-4 py-2 border rounded-md hover:bg-gray-50"
          >
            取消
          </a>
        </div>
      </Form>
    </div>
  );
}
```

```typescript
// src/modules/core/ui/StatusBadge.tsx

import { Badge } from '@/components/ui/badge';

/**
 * 状态徽章组件
 */
interface StatusBadgeProps {
  status: 'in_use' | 'storage' | 'maintenance' | 'lost';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig = {
    in_use: { label: '使用中', variant: 'default' as const },
    storage: { label: '存储中', variant: 'secondary' as const },
    maintenance: { label: '维护中', variant: 'outline' as const },
    lost: { label: '丢失', variant: 'destructive' as const },
  };

  const config = statusConfig[status];

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
```

## 数据模型

### 数据库表结构（单表继承模式）

使用 PostgreSQL 的 JSONB 特性实现单表继承，所有物品类型存储在同一张表中。

```typescript
// src/db/schema.ts

import { pgTable, text, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';

/**
 * 用户角色枚举
 */
export const userRoleEnum = pgEnum('user_role', ['admin', 'member']);

/**
 * 物品状态枚举
 */
export const itemStatusEnum = pgEnum('item_status', [
  'in_use', // 使用中
  'storage', // 存储中
  'maintenance', // 维护中
  'lost', // 丢失
]);

/**
 * 物品类型枚举
 */
export const itemTypeEnum = pgEnum('item_type', [
  'quilt', // 被子
  'shoe', // 鞋子
  'racket', // 球拍
  'card', // 球星卡片
]);

/**
 * 用户表
 */
export const users = pgTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(), // Bcrypt hash
  role: userRoleEnum('role').notNull().default('member'),
  // 使用 .$type<T>() 进行类型推断（Drizzle ORM 最佳实践）
  activeModules: jsonb('active_modules').$type<string[]>().notNull().default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * 物品表（单表继承）
 * 所有物品类型存储在同一张表中，特定字段存储在 attributes JSONB 字段
 */
export const items = pgTable('items', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  type: itemTypeEnum('type').notNull(),
  name: text('name').notNull(),
  status: itemStatusEnum('status').notNull().default('storage'),
  ownerId: text('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  // ★ 核心：存储特定字段的 JSONB 列
  // 使用 .$type<T>() 提供编译时类型检查
  attributes: jsonb('attributes').$type<Record<string, any>>().notNull().default({}),

  // 图片 URL 数组
  images: jsonb('images').$type<string[]>().notNull().default([]),

  // 元数据（可选）
  metadata: jsonb('metadata').$type<Record<string, any>>(),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * 使用日志表（通用）
 * 记录所有物品的操作历史
 */
export const usageLogs = pgTable('usage_logs', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  itemId: text('item_id')
    .notNull()
    .references(() => items.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  action: text('action').notNull(), // 'created', 'updated', 'status_changed', 'used', etc.
  snapshot: jsonb('snapshot').$type<Record<string, any>>(), // 操作时的关键属性快照
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// TypeScript 类型推导
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
export type UsageLog = typeof usageLogs.$inferSelect;
export type NewUsageLog = typeof usageLogs.$inferInsert;
```

### 模块特定的 Attributes Schema

每个模块定义自己的 attributes 结构：

```typescript
// src/modules/quilts/schema.ts

import { z } from 'zod';

/**
 * 被子模块的 attributes Schema
 */
export const quiltAttributesSchema = z.object({
  brand: z.string().optional(),
  size: z.enum(['single', 'double', 'queen', 'king']),
  material: z.string(),
  weight: z.number().positive().optional(),
  warmthLevel: z.number().int().min(1).max(5), // 1-5级保暖
  season: z.enum(['spring', 'summer', 'autumn', 'winter', 'all_season']),
  purchaseDate: z.string().datetime().optional(),
  purchasePrice: z.number().positive().optional(),
  condition: z.enum(['new', 'good', 'fair', 'poor']).default('good'),
  notes: z.string().optional(),
});

export type QuiltAttributes = z.infer<typeof quiltAttributesSchema>;

/**
 * 完整的被子类型（包含基础字段 + 特定字段）
 */
export type Quilt = Omit<Item, 'attributes'> & {
  type: 'quilt';
  attributes: QuiltAttributes;
};
```

```typescript
// src/modules/shoes/schema.ts

import { z } from 'zod';

/**
 * 鞋子模块的 attributes Schema
 */
export const shoeAttributesSchema = z.object({
  brand: z.string(),
  model: z.string(),
  size: z.string(), // 例如: "US 10", "EU 43"
  colorway: z.string(),
  releaseDate: z.string().datetime().optional(),
  purchasePrice: z.number().positive().optional(),
  condition: z.enum(['deadstock', 'new', 'used', 'worn']).default('new'),
  retailPrice: z.number().positive().optional(),
  sku: z.string().optional(),
  notes: z.string().optional(),
});

export type ShoeAttributes = z.infer<typeof shoeAttributesSchema>;

export type Shoe = Omit<Item, 'attributes'> & {
  type: 'shoe';
  attributes: ShoeAttributes;
};
```

### 数据访问层（Server Actions）

使用 Next.js 15 的 Server Actions 进行数据操作：

```typescript
// src/app/actions/items.ts
'use server';

import { revalidatePath } from 'next/cache';
import { cacheLife, cacheTag, updateTag } from 'next/cache';
import { db } from '@/db';
import { items, usageLogs } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { auth } from '@/auth';
import { MODULE_REGISTRY } from '@/modules/registry';

/**
 * 创建物品
 *
 * 最佳实践：
 * - 在 Server Action 开始时验证认证状态
 * - 使用 Zod schema 验证输入数据
 * - 使用 revalidatePath 更新缓存
 */
export async function createItem(data: {
  type: string;
  name: string;
  attributes: Record<string, any>;
  images?: string[];
}) {
  // 验证认证（Auth.js v5 最佳实践）
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('You must be signed in to perform this action');
  }

  // 获取模块配置
  const module = MODULE_REGISTRY[data.type];
  if (!module) {
    throw new Error(`Module ${data.type} not found`);
  }

  // 验证 attributes（使用模块的 Zod schema）
  const validatedAttributes = module.attributesSchema.parse(data.attributes);

  // 插入数据库
  const [item] = await db
    .insert(items)
    .values({
      type: data.type as any,
      name: data.name,
      ownerId: session.user.id,
      attributes: validatedAttributes,
      images: data.images || [],
      status: 'storage',
    })
    .returning();

  // 记录日志
  await db.insert(usageLogs).values({
    itemId: item.id,
    userId: session.user.id,
    action: 'created',
    snapshot: { name: item.name, status: item.status },
  });

  // 重新验证路径以更新缓存（Next.js 16 最佳实践）
  revalidatePath(`/${data.type}`);

  // 更新缓存标签（Next.js 16 新特性）
  updateTag('items');
  updateTag(`items-${data.type}`);

  return item;
}

/**
 * 获取物品列表
 *
 * Next.js 16 最佳实践：
 * - 使用 "use cache" 指令启用缓存
 * - 使用 cacheLife() 定义缓存策略
 * - 使用 cacheTag() 添加缓存标签
 * - 使用 Drizzle ORM 的类型安全查询
 * - 实现分页以提高性能
 * - 使用 sql 模板标签进行聚合查询
 */
export async function getItems(
  type: string,
  options?: {
    page?: number;
    pageSize?: number;
    status?: string;
  }
) {
  'use cache';
  cacheLife('minutes'); // 缓存 5 分钟
  cacheTag('items', `items-${type}`);

  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('You must be signed in to perform this action');
  }

  const { page = 1, pageSize = 20, status } = options || {};
  const offset = (page - 1) * pageSize;

  const conditions = [eq(items.type, type as any), eq(items.ownerId, session.user.id)];

  if (status) {
    conditions.push(eq(items.status, status as any));
  }

  const results = await db
    .select()
    .from(items)
    .where(and(...conditions))
    .orderBy(desc(items.createdAt))
    .limit(pageSize)
    .offset(offset);

  // 使用 sql 模板标签进行计数（Drizzle ORM 最佳实践）
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(items)
    .where(and(...conditions));

  return {
    data: results,
    total: count,
    page,
    pageSize,
    totalPages: Math.ceil(count / pageSize),
  };
}

/**
 * 获取单个物品
 */
export async function getItemById(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('You must be signed in to perform this action');
  }

  const [item] = await db
    .select()
    .from(items)
    .where(and(eq(items.id, id), eq(items.ownerId, session.user.id)))
    .limit(1);

  if (!item) {
    throw new Error('Item not found');
  }

  return item;
}

/**
 * 更新物品
 */
export async function updateItem(
  id: string,
  data: {
    name?: string;
    status?: string;
    attributes?: Record<string, any>;
    images?: string[];
  }
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('You must be signed in to perform this action');
  }

  // 获取现有物品
  const item = await getItemById(id);

  // 验证 attributes（如果提供）
  if (data.attributes) {
    const module = MODULE_REGISTRY[item.type];
    data.attributes = module.attributesSchema.parse(data.attributes);
  }

  // 更新数据库
  const [updated] = await db
    .update(items)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(items.id, id))
    .returning();

  // 记录日志
  await db.insert(usageLogs).values({
    itemId: id,
    userId: session.user.id,
    action: 'updated',
    snapshot: { name: updated.name, status: updated.status },
  });

  // 重新验证多个路径
  revalidatePath(`/${item.type}`);
  revalidatePath(`/${item.type}/${id}`);

  // 更新缓存标签
  updateTag('items');
  updateTag(`items-${item.type}`);

  return updated;
}

/**
 * 删除物品
 */
export async function deleteItem(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('You must be signed in to perform this action');
  }

  const item = await getItemById(id);

  await db.delete(items).where(eq(items.id, id));

  revalidatePath(`/${item.type}`);

  // 更新缓存标签
  updateTag('items');
  updateTag(`items-${item.type}`);
}

/**
 * 获取使用日志
 */
export async function getUsageLogs(itemId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('You must be signed in to perform this action');
  }

  // 验证物品所有权
  await getItemById(itemId);

  return await db
    .select()
    .from(usageLogs)
    .where(eq(usageLogs.itemId, itemId))
    .orderBy(desc(usageLogs.createdAt));
}
```

## 正确性属性

_属性是一个特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的形式化陈述。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。_

### 属性 1: 模块注册和检索一致性

*对于任意*有效的模块配置，注册后应该能够通过模块ID检索到相同的配置信息。

**验证需求: 1.1, 2.3**

### 属性 2: 模块配置验证

*对于任意*模块配置，如果配置缺少必需字段（id、name、version、fields）或字段格式不正确，注册应该被拒绝并抛出错误。

**验证需求: 1.3, 5.4**

### 属性 3: 模块依赖解析

*对于任意*具有依赖关系的模块集合，如果所有依赖都已注册，则模块应该成功加载；如果存在未满足的依赖，则应该失败。

**验证需求: 1.5**

### 属性 4: 数据库表关联完整性

*对于任意*物品记录，查询时返回的数据应该同时包含基础表字段（id、userId、status等）和扩展表字段（模块特定字段）。

**验证需求: 2.4**

### 属性 5: JSONB 元数据往返一致性

*对于任意*有效的JSON对象，存储到metadata字段后再检索，应该得到等价的JSON对象。

**验证需求: 2.5**

### 属性 6: CRUD 操作完整性

*对于任意*已注册的模块，应该能够执行完整的CRUD操作（创建、读取、更新、删除），且每个操作都返回正确的结果。

**验证需求: 3.2**

### 属性 7: 自定义路由注册

*对于任意*带有自定义路由配置的模块，注册后这些自定义路由应该可以被访问和调用。

**验证需求: 3.3**

### 属性 8: 错误响应格式一致性

*对于任意*导致错误的API请求，返回的错误响应应该包含统一的字段结构（code、message、details）和正确的HTTP状态码。

**验证需求: 3.5**

### 属性 9: 动态表单渲染完整性

*对于任意*模块的字段配置，动态生成的表单应该包含所有定义的字段，且每个字段的类型和验证规则与配置一致。

**验证需求: 4.2**

### 属性 10: 自定义组件覆盖

*对于任意*提供了自定义组件的模块，渲染时应该使用自定义组件而不是默认组件。

**验证需求: 4.3**

### 属性 11: 配置文件解析正确性

*对于任意*有效的模块配置文件，解析后的模块对象应该包含配置文件中定义的所有字段和值。

**验证需求: 5.1, 5.2**

### 属性 12: 配置热重载

*对于任意*已注册的模块，更新其配置文件后，下次访问应该使用新的配置而不是旧配置。

**验证需求: 5.3**

### 属性 13: 配置版本回滚

*对于任意*模块配置，创建新版本后回滚到旧版本，应该恢复到旧版本的所有配置值。

**验证需求: 5.5**

### 属性 14: 图片上传往返一致性

*对于任意*有效的图片文件，上传后获取的URL应该能够访问到相同的图片内容。

**验证需求: 6.1**

### 属性 15: 统计计算正确性

*对于任意*数据集和统计指标定义，计算的统计结果应该与手动计算的结果一致。

**验证需求: 6.2**

### 属性 16: 数据导出格式正确性

*对于任意*数据集，导出为CSV/Excel/PDF后，文件应该包含所有记录和字段，且格式符合相应标准。

**验证需求: 6.3**

### 属性 17: 搜索结果准确性

*对于任意*搜索条件，返回的所有结果都应该满足搜索条件，且不应该遗漏满足条件的记录。

**验证需求: 6.4**

### 属性 18: 通知发送可靠性

*对于任意*通知请求，如果发送成功，接收方应该能够收到包含正确内容的通知。

**验证需求: 6.5**

### 属性 19: API 向后兼容性

*对于任意*旧版本的API端点调用，在迁移后应该仍然返回正确的响应，保持相同的接口契约。

**验证需求: 7.2**

### 属性 20: 迁移数据完整性

*对于任意*迁移操作，迁移前后的记录总数应该相等，且每条记录的关键字段值应该保持一致。

**验证需求: 7.3**

### 属性 21: 迁移回滚一致性

*对于任意*迁移操作，执行迁移后立即回滚，数据库状态应该与迁移前完全一致。

**验证需求: 7.5**

### 属性 22: 基于角色的访问控制

*对于任意*用户和资源，如果用户的角色没有访问该资源的权限，访问请求应该被拒绝。

**验证需求: 8.1, 8.3**

### 属性 23: 权限粒度控制

*对于任意*模块级或资源级的权限设置，权限检查应该在相应的粒度级别生效。

**验证需求: 8.2**

### 属性 24: 多租户数据隔离

*对于任意*两个不同的用户，用户A不应该能够访问或修改用户B的数据。

**验证需求: 8.4**

### 属性 25: 权限操作审计

*对于任意*权限相关的操作（授权、拒绝访问等），应该在日志中记录操作的时间、用户和资源信息。

**验证需求: 8.5**

### 属性 26: 缓存一致性

*对于任意*数据查询，第一次查询从数据库获取，第二次相同查询应该从缓存获取，且两次结果应该一致。

**验证需求: 9.2**

### 属性 27: 异步任务非阻塞

*对于任意*异步任务提交，提交操作应该立即返回，不应该等待任务完成。

**验证需求: 9.4**

## 错误处理

### 错误分类

框架定义了以下错误类别：

```typescript
// src/core/errors/types.ts

export enum ErrorCode {
  // 验证错误 (400)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_CONFIG = 'INVALID_CONFIG',
  INVALID_INPUT = 'INVALID_INPUT',

  // 认证错误 (401)
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',

  // 授权错误 (403)
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // 资源错误 (404)
  NOT_FOUND = 'NOT_FOUND',
  MODULE_NOT_FOUND = 'MODULE_NOT_FOUND',

  // 冲突错误 (409)
  CONFLICT = 'CONFLICT',
  DUPLICATE_MODULE = 'DUPLICATE_MODULE',

  // 服务器错误 (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}
```

### 错误处理策略

1. **API层错误处理**: 所有API错误通过tRPC的错误处理机制统一处理
2. **数据库错误**: 捕获并转换为应用层错误，避免暴露数据库细节
3. **验证错误**: 使用Zod进行输入验证，返回详细的字段级错误信息
4. **外部服务错误**: 实现重试机制和降级策略
5. **日志记录**: 所有错误都记录到日志系统，包含上下文信息

### 错误响应格式

```typescript
interface ErrorResponse {
  code: ErrorCode;
  message: string;
  details?: {
    field?: string;
    constraint?: string;
    [key: string]: any;
  };
  timestamp: string;
  path: string;
}
```

## 测试策略

### 双重测试方法

本框架采用单元测试和基于属性的测试相结合的方法：

- **单元测试**: 验证特定示例、边缘情况和错误条件
- **属性测试**: 验证跨所有输入的通用属性
- 两者互补，共同提供全面的测试覆盖

### 单元测试

单元测试专注于：

- 特定示例，展示正确行为
- 组件之间的集成点
- 边缘情况和错误条件

**示例**:

```typescript
// src/modules/quilts/__tests__/quilt-service.test.ts

describe('QuiltService', () => {
  it('should create a quilt with valid data', async () => {
    const data = {
      userId: 'user-1',
      brand: 'TestBrand',
      size: 'Queen',
      material: 'Cotton',
    };

    const quilt = await quiltService.create(data);

    expect(quilt.id).toBeDefined();
    expect(quilt.brand).toBe('TestBrand');
    expect(quilt.status).toBe('active');
  });

  it('should reject creation with missing required fields', async () => {
    const data = { userId: 'user-1' }; // missing required fields

    await expect(quiltService.create(data)).rejects.toThrow(ValidationError);
  });
});
```

### 基于属性的测试

属性测试通过随机化实现全面的输入覆盖：

- 每个属性测试最少运行100次迭代
- 每个测试必须引用其设计文档属性
- 标签格式: **Feature: extensible-item-management-framework, Property {number}: {property_text}**

**配置**:

```typescript
// vitest.config.ts

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
});
```

**示例**:

```typescript
// src/modules/__tests__/registry.property.test.ts

import { describe, it, expect } from 'vitest';
import { fc } from '@fast-check/vitest';
import { MODULE_REGISTRY, getModule } from '../registry';
import { z } from 'zod';

/**
 * Feature: extensible-item-management-framework
 * Property 1: 模块注册和检索一致性
 */
describe('Module Registry Properties', () => {
  it('should retrieve registered modules consistently', () => {
    fc.assert(
      fc.property(fc.constantFrom(...Object.keys(MODULE_REGISTRY)), moduleId => {
        const module = getModule(moduleId);
        expect(module).toBeDefined();
        expect(module?.id).toBe(moduleId);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: extensible-item-management-framework
   * Property 2: 模块配置验证
   */
  it('should validate attributes according to module schema', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(MODULE_REGISTRY)),
        fc.record({
          brand: fc.string(),
          size: fc.constantFrom('single', 'double', 'queen', 'king'),
          material: fc.string({ minLength: 1 }),
          warmthLevel: fc.integer({ min: 1, max: 5 }),
          season: fc.constantFrom('spring', 'summer', 'autumn', 'winter', 'all_season'),
          condition: fc.constantFrom('new', 'good', 'fair', 'poor'),
        }),
        (moduleId, attributes) => {
          const module = getModule(moduleId);
          if (module) {
            const result = module.attributesSchema.safeParse(attributes);
            // 如果解析成功，结果应该包含所有必需字段
            if (result.success) {
              expect(result.data).toHaveProperty('size');
              expect(result.data).toHaveProperty('material');
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

```typescript
// src/app/actions/__tests__/items.property.test.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { fc } from '@fast-check/vitest';
import { createItem, getItemById, updateItem, deleteItem } from '../items';
import { db } from '@/db';
import { items } from '@/db/schema';

/**
 * Feature: extensible-item-management-framework
 * Property 5: JSONB 元数据往返一致性
 */
describe('Item CRUD Properties', () => {
  it('should preserve attributes through create and retrieve', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          type: fc.constant('quilt'),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          attributes: fc.record({
            brand: fc.string(),
            size: fc.constantFrom('single', 'double', 'queen', 'king'),
            material: fc.string({ minLength: 1 }),
            warmthLevel: fc.integer({ min: 1, max: 5 }),
            season: fc.constantFrom('spring', 'summer', 'autumn', 'winter', 'all_season'),
            condition: fc.constantFrom('new', 'good', 'fair', 'poor'),
          }),
        }),
        async itemData => {
          // 创建物品
          const created = await createItem(itemData);

          // 检索物品
          const retrieved = await getItemById(created.id);

          // 验证 attributes 往返一致性
          expect(retrieved.attributes).toEqual(created.attributes);

          // 清理
          await deleteItem(created.id);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: extensible-item-management-framework
   * Property 6: CRUD 操作完整性
   */
  it('should support full CRUD lifecycle', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          type: fc.constant('quilt'),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          attributes: fc.record({
            size: fc.constantFrom('single', 'double', 'queen', 'king'),
            material: fc.string({ minLength: 1 }),
            warmthLevel: fc.integer({ min: 1, max: 5 }),
            season: fc.constantFrom('spring', 'summer', 'autumn', 'winter', 'all_season'),
            condition: fc.constantFrom('new', 'good', 'fair', 'poor'),
          }),
        }),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (itemData, newName) => {
          // Create
          const created = await createItem(itemData);
          expect(created.id).toBeDefined();

          // Read
          const read = await getItemById(created.id);
          expect(read.name).toBe(itemData.name);

          // Update
          const updated = await updateItem(created.id, { name: newName });
          expect(updated.name).toBe(newName);

          // Delete
          await deleteItem(created.id);
          await expect(getItemById(created.id)).rejects.toThrow();
        }
      ),
      { numRuns: 50 } // 减少迭代次数因为涉及数据库操作
    );
  });
});
```

### 测试工具和库

- **单元测试**: Vitest + Testing Library
- **属性测试**: fast-check (JavaScript的QuickCheck实现)
- **E2E测试**: Playwright
- **API测试**: Supertest
- **数据库测试**: 使用测试数据库或内存数据库

### 测试覆盖率目标

- 核心框架代码: 90%以上
- 模块特定代码: 80%以上
- 关键路径: 100%
- 所有正确性属性必须有对应的属性测试

### 持续集成

- 所有测试在PR时自动运行
- 属性测试失败时，保存失败的输入用例
- 定期运行更长时间的属性测试（1000+迭代）
- 性能回归测试

## 迁移策略

### 阶段1: 准备阶段

1. **数据审计**: 分析现有被子管理系统的数据结构和数量
2. **依赖分析**: 识别所有依赖现有API的客户端
3. **测试环境**: 搭建与生产环境一致的测试环境
4. **备份策略**: 建立完整的数据备份和恢复流程

### 阶段2: 框架搭建

1. **核心框架开发**: 实现模块注册表、基础仓储、API网关
2. **共享服务迁移**: 将认证、上传、统计等服务迁移到核心系统
3. **组件库开发**: 创建可复用的UI组件库
4. **测试覆盖**: 确保核心框架有完整的测试覆盖

### 阶段3: 被子模块迁移

1. **模块配置**: 创建被子模块的配置文件和字段定义
2. **数据迁移脚本**: 开发将现有数据迁移到新表结构的脚本
3. **API适配层**: 创建适配层保持旧API端点的兼容性
4. **并行运行**: 新旧系统并行运行，逐步切换流量

### 阶段4: 验证和切换

1. **数据验证**: 验证迁移后的数据完整性和一致性
2. **功能测试**: 全面测试所有功能是否正常工作
3. **性能测试**: 确保新系统性能不低于旧系统
4. **灰度发布**: 逐步将用户流量切换到新系统

### 阶段5: 清理和优化

1. **移除旧代码**: 在确认新系统稳定后移除旧代码
2. **性能优化**: 基于实际使用情况进行性能优化
3. **文档更新**: 更新所有相关文档
4. **培训支持**: 为开发团队提供新框架的培训

### 数据迁移脚本示例

```typescript
// scripts/migrate-quilts.ts

async function migrateQuilts() {
  console.log('Starting quilt data migration...');

  // 1. 读取旧表数据
  const oldQuilts = await db.select().from(oldQuiltsTable);
  console.log(`Found ${oldQuilts.length} quilts to migrate`);

  // 2. 转换数据格式
  const migratedCount = 0;

  for (const oldQuilt of oldQuilts) {
    try {
      await db.transaction(async tx => {
        // 插入基础表
        const [baseItem] = await tx
          .insert(baseItems)
          .values({
            id: oldQuilt.id,
            moduleType: 'quilts',
            userId: oldQuilt.user_id,
            status: oldQuilt.status || 'active',
            createdAt: oldQuilt.created_at,
            updatedAt: oldQuilt.updated_at,
          })
          .returning();

        // 插入扩展表
        await tx.insert(quilts).values({
          id: baseItem.id,
          brand: oldQuilt.brand,
          size: oldQuilt.size,
          material: oldQuilt.material,
          weight: oldQuilt.weight,
          warmthLevel: oldQuilt.warmth_level,
          purchaseDate: oldQuilt.purchase_date,
          purchasePrice: oldQuilt.purchase_price,
          condition: oldQuilt.condition,
          notes: oldQuilt.notes,
          imageUrls: oldQuilt.image_urls,
          usageCount: oldQuilt.usage_count || 0,
          lastUsedAt: oldQuilt.last_used_at,
        });

        migratedCount++;
      });
    } catch (error) {
      console.error(`Failed to migrate quilt ${oldQuilt.id}:`, error);
      throw error; // 失败时回滚整个迁移
    }
  }

  // 3. 验证数据完整性
  const newCount = await db
    .select({ count: sql`count(*)` })
    .from(baseItems)
    .where(eq(baseItems.moduleType, 'quilts'));

  if (newCount[0].count !== oldQuilts.length) {
    throw new Error('Data integrity check failed: record count mismatch');
  }

  console.log(`Successfully migrated ${migratedCount} quilts`);
}
```

### 回滚计划

如果迁移过程中出现问题，执行以下回滚步骤：

1. **停止新系统**: 立即停止新系统的流量
2. **恢复路由**: 将所有流量路由回旧系统
3. **数据回滚**: 如果已经修改了数据，从备份恢复
4. **问题分析**: 分析失败原因，修复后重新尝试
5. **通知用户**: 如果影响用户，及时通知并说明情况

## 性能考虑

### 数据库优化

1. **索引策略**: 为常用查询字段创建索引
2. **连接池**: 使用Neon的连接池功能
3. **查询优化**: 避免N+1查询，使用JOIN优化
4. **分页**: 所有列表查询都实现分页

### 缓存策略

1. **Redis缓存**: 缓存频繁访问的数据
2. **缓存失效**: 实现智能的缓存失效策略
3. **本地缓存**: 使用React Query进行客户端缓存

### 前端优化

1. **代码分割**: 按模块进行代码分割
2. **懒加载**: 组件和路由懒加载
3. **图片优化**: 使用Next.js Image组件
4. **SSR/SSG**: 合理使用服务端渲染和静态生成

## 安全考虑

### 认证和授权

1. **NextAuth.js**: 使用NextAuth.js v5进行认证
2. **JWT令牌**: 使用JWT进行会话管理
3. **RBAC**: 实现基于角色的访问控制
4. **资源级权限**: 支持细粒度的资源级权限控制

### 数据安全

1. **SQL注入防护**: 使用Drizzle ORM的参数化查询
2. **XSS防护**: React自动转义，额外使用DOMPurify
3. **CSRF防护**: 使用CSRF令牌
4. **数据加密**: 敏感数据加密存储

### API安全

1. **速率限制**: 实现API速率限制
2. **输入验证**: 使用Zod进行严格的输入验证
3. **输出过滤**: 避免泄露敏感信息
4. **HTTPS**: 强制使用HTTPS

## 可扩展性路线图

### 短期 (1-3个月)

1. 完成核心框架开发
2. 迁移被子管理模块
3. 添加鞋子管理模块
4. 完善文档和测试

### 中期 (3-6个月)

1. 添加球拍管理模块
2. 添加球星卡片管理模块
3. 实现高级统计和分析功能
4. 优化性能和用户体验

### 长期 (6-12个月)

1. 支持第三方模块开发
2. 建立模块市场
3. 提供SaaS服务
4. 移动应用开发

### 最佳实践总结

基于 Context7 查询的最新技术栈最佳实践：

### Next.js 16 最佳实践

1. **Server Actions**
   - 在函数开始时验证认证状态
   - 使用 `'use server'` 指令标记 Server Actions
   - 使用 `revalidatePath()` 更新缓存
   - 抛出简单的 Error 对象而不是自定义错误类
   - 使用 `redirect()` 进行服务端重定向

2. **Form Component（Next.js 16 新特性）**
   - 使用 `<Form>` 组件实现渐进增强（无需 JavaScript 也能工作）
   - 直接传递 Server Action 到 `action` 属性
   - 自动处理表单提交和加载状态
   - 使用原生 HTML 表单验证（required, type, pattern 等）
   - 在 Server Action 中使用 Zod 进行服务端验证
   - 提供更好的用户体验和性能

3. **缓存管理（Next.js 16 新特性）**
   - 使用 `cacheLife()` API 进行声明式缓存控制
   - 使用预定义的缓存配置文件：seconds, minutes, hours, days, weeks, max
   - 使用 `cacheTag()` 为缓存数据添加标签
   - 使用 `updateTag()` 进行细粒度的缓存更新（替代 revalidateTag）
   - 在数据获取函数中使用 `"use cache"` 指令

4. **数据获取**
   - 在 Server Components 中直接使用 `fetch()` 或数据库查询
   - 使用 `cache: 'force-cache'` 进行静态数据获取
   - 使用 `cache: 'no-store'` 进行动态数据获取
   - 使用 `next: { revalidate: 10 }` 进行时间基础的重新验证
   - 使用 `"use cache"` 指令配合 cacheLife() 进行更精细的缓存控制

5. **Middleware**
   - 使用 `auth()` 作为 middleware 包装器（Auth.js v5）
   - 在 middleware 中访问 `req.auth`
   - 使用 `matcher` 配置排除静态资源
   - 保持 middleware 逻辑简单和高效
   - 实现基于用户状态的重定向逻辑

### Auth.js v5 最佳实践

1. **Credentials Provider**
   - 在 `authorize` 函数中验证用户凭据
   - 使用 Zod 验证输入
   - 使用 bcrypt 进行密码哈希验证
   - 不要在返回的用户对象中包含敏感信息（如密码）
   - 返回 null 表示认证失败

2. **Callbacks**
   - 使用 `jwt` callback 扩展 JWT token
   - 使用 `session` callback 扩展 session
   - 在 session 中包含必要的用户信息（id, role, activeModules）
   - 使用 `authorized` callback 进行路由级别的权限控制

3. **Session 管理**
   - 在 Server Actions 中使用 `await auth()` 获取 session
   - 在 Server Components 中使用 `await auth()` 获取 session
   - 在 Client Components 中使用 `useSession()` hook
   - 在 Middleware 中通过 `req.auth` 访问 session

4. **路由保护**
   - 使用 Middleware 保护整个路由组
   - 使用 `authorized` callback 进行细粒度控制
   - 在 Server Components 中检查 session 进行页面级保护
   - 在 Server Actions 中验证权限进行操作级保护

### Drizzle ORM 最佳实践

1. **Schema 定义**
   - 使用 `.$type<T>()` 为 JSONB 列提供类型推断
   - 使用 `.$defaultFn()` 生成默认值（如 UUID）
   - 使用 `pgEnum` 定义枚举类型
   - 使用 `references()` 定义外键关系
   - 使用 `.notNull()` 标记必填字段
   - 使用 `.default()` 设置默认值

2. **查询**
   - 使用类型安全的查询构建器
   - 使用 `sql` 模板标签进行聚合查询和复杂表达式
   - 使用 `eq()`, `and()`, `or()` 等辅助函数构建条件
   - 使用 `.returning()` 获取插入/更新后的数据
   - 使用 `.limit()` 和 `.offset()` 实现分页
   - 使用 `.orderBy()` 进行排序

3. **事务**
   - 使用 `db.transaction()` 进行多步骤操作
   - 在事务中抛出错误会自动回滚
   - 保持事务简短和高效
   - 避免在事务中进行外部 API 调用

4. **类型推断**
   - 使用 `typeof table.$inferSelect` 推断查询结果类型
   - 使用 `typeof table.$inferInsert` 推断插入数据类型
   - 为 JSONB 字段使用 `.$type<T>()` 提供精确类型

### TypeScript 最佳实践

1. **类型安全**
   - 使用 Zod 进行运行时验证
   - 使用 TypeScript 进行编译时类型检查
   - 为 JSONB 字段定义明确的类型
   - 使用类型推断而不是显式类型注解
   - 使用 `z.infer<typeof schema>` 从 Zod schema 推断类型

2. **模块化**
   - 使用策略模式实现模块注册表
   - 每个模块定义自己的 Schema 和配置
   - 使用接口定义模块契约
   - 保持模块之间的松耦合
   - 使用 TypeScript 的 namespace 或 module 组织代码

3. **错误处理**
   - 使用简单的 Error 对象而不是自定义错误类
   - 在 Server Actions 中抛出错误会自动传递到客户端
   - 使用 try-catch 捕获和处理错误
   - 提供有意义的错误消息

### 表单处理最佳实践

1. **渐进增强**
   - 使用 Next.js 16 Form 组件实现无 JavaScript 表单提交
   - 使用原生 HTML 验证属性（required, type, pattern, min, max）
   - 在 Server Action 中使用 Zod 进行服务端验证
   - 提供清晰的错误消息

2. **数据验证**
   - 客户端：使用 HTML5 验证属性
   - 服务端：使用 Zod schema 验证
   - 双重验证确保数据安全性
   - 使用 `safeParse()` 进行安全解析

3. **用户体验**
   - 使用 `useFormStatus()` hook 显示提交状态
   - 提供即时反馈
   - 使用 `useFormState()` 处理表单状态
   - 在提交后重定向到合适的页面

### 性能最佳实践

1. **缓存**
   - 使用 Next.js 16 的 cacheLife() API
   - 使用 cacheTag() 和 updateTag() 进行精细控制
   - 使用 `"use cache"` 指令标记可缓存函数
   - 考虑使用 Redis 进行应用级缓存

2. **数据库**
   - 为常用查询字段创建索引
   - 使用分页避免大量数据查询
   - 使用 Neon 的连接池功能
   - 避免 N+1 查询问题
   - 使用 `sql` 模板标签进行高效的聚合查询

3. **前端**
   - 使用 Server Components 减少客户端 JavaScript
   - 使用动态导入进行代码分割
   - 使用 Next.js Image 组件优化图片
   - 使用 Suspense 进行流式渲染
   - 最小化客户端状态管理

4. **代码组织**
   - 将数据获取逻辑放在 Server Components 中
   - 将交互逻辑放在 Client Components 中
   - 使用 Server Actions 处理表单提交和数据变更
   - 保持组件小而专注

### 安全最佳实践

1. **认证和授权**
   - 在所有 Server Actions 开始时验证认证状态
   - 实现基于角色的访问控制（RBAC）
   - 使用 Middleware 保护路由
   - 验证用户对资源的所有权

2. **输入验证**
   - 使用 Zod 验证所有用户输入
   - 在客户端和服务端都进行验证
   - 使用白名单而不是黑名单
   - 防止 SQL 注入（Drizzle ORM 自动处理）

3. **数据保护**
   - 使用 bcrypt 哈希密码
   - 不要在客户端暴露敏感信息
   - 使用 HTTPS
   - 实现 CSRF 保护（Next.js 自动处理）

### 测试最佳实践

1. **单元测试**
   - 使用 Vitest 进行快速测试
   - 测试纯函数和业务逻辑
   - 使用 Testing Library 测试组件
   - 保持测试简单和可维护

2. **属性测试**
   - 使用 fast-check 进行属性测试
   - 测试通用属性而不是特定示例
   - 每个属性测试至少运行 100 次迭代
   - 保存失败的测试用例

3. **集成测试**
   - 测试 Server Actions 的完整流程
   - 使用测试数据库
   - 测试认证和授权流程
   - 测试错误处理
