# 子模块开发标准 - 快速参考

## 📋 核心技术栈

| 技术           | 版本   | 用途                     |
| -------------- | ------ | ------------------------ |
| Next.js        | 16.1.1 | App Router、SSR、缓存    |
| React          | 19.2.3 | Server Components、Hooks |
| TypeScript     | 5.9+   | 类型安全                 |
| Zod            | 4.3+   | Schema 验证              |
| Tailwind CSS   | 4.1+   | 样式系统                 |
| TanStack Query | 5.90+  | 数据获取和缓存           |
| Drizzle ORM    | 0.45+  | 数据库 ORM               |
| NextAuth.js    | 5.0    | 身份认证                 |

## 🎯 关键原则

### 1. Server Components 优先

```typescript
// ✅ 默认使用 Server Component
export default async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}

// ✅ 仅在需要交互时使用 Client Component
'use client'
export function Interactive() {
  const [state, setState] = useState(false);
  return <button onClick={() => setState(!state)}>Toggle</button>;
}
```

### 2. 类型安全

```typescript
// ✅ 使用 type import
import type { ModuleItem } from '../schema';

// ✅ 利用 Zod 类型推导
const schema = z.object({ name: z.string() });
type Data = z.infer<typeof schema>;
```

### 3. 性能优化

```typescript
// ✅ 图片优化
<Image src={url} alt="..." fill sizes="..." loading="lazy" />

// ✅ 代码分割
const Heavy = dynamic(() => import('./Heavy'), { ssr: false });

// ✅ 数据缓存
const data = await fetch(url, { next: { revalidate: 60 } });
```

## 📁 必需文件结构

```
src/modules/{module-name}/
├── config.ts              # 模块配置
├── schema.ts              # 数据模型
├── ui/
│   ├── {Module}Card.tsx   # 列表卡片
│   └── {Module}Detail.tsx # 详情页
└── __tests__/
    └── schema.test.ts     # 测试
```

## 🔧 快速开始

### 1. 创建 Schema

```typescript
export const {module}AttributesSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.enum(['TYPE1', 'TYPE2']),
});
```

### 2. 创建 Config

```typescript
export const {module}Module: ModuleDefinition = {
  id: '{module}',
  name: '{模块名称}',
  attributesSchema: {module}AttributesSchema,
  CardComponent: {Module}Card,
  DetailComponent: {Module}Detail,
  formFields: [/* ... */],
  listColumns: [/* ... */],
};
```

### 3. 注册模块

```typescript
// src/modules/registry.ts
export const MODULE_REGISTRY = {
  {module}: {module}Module,
};
```

## 🎨 样式规范

```typescript
// ✅ 使用 Tailwind 语义化颜色
<div className="bg-background text-foreground">

// ✅ 响应式设计
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// ✅ 使用 cn 工具函数
<div className={cn("base", isActive && "active")}>
```

## 🚀 Next.js 16 新特性

### Cache Components

```javascript
// next.config.js
module.exports = {
  cacheComponents: true, // 启用 PPR
};
```

### 数据缓存策略

```typescript
// 静态缓存
fetch(url, { cache: 'force-cache' });

// 动态数据
fetch(url, { cache: 'no-store' });

// 时间重新验证
fetch(url, { next: { revalidate: 60 } });

// 标签重新验证
fetch(url, { next: { tags: ['products'] } });
```

## 📊 API 路由模板

```typescript
// src/app/api/{module}s/route.ts
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return createErrorResponse('未授权', 401);

  const items = await fetchItems();
  return createSuccessResponse({ items });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = schema.safeParse(body);

  if (!result.success) {
    return createValidationErrorResponse('验证失败', result.error);
  }

  const item = await createItem(result.data);
  return createSuccessResponse({ item }, undefined, 201);
}
```

## ✅ 提交前检查清单

- [ ] TypeScript 编译通过
- [ ] ESLint 检查通过
- [ ] 所有测试通过
- [ ] 组件响应式设计
- [ ] 图片使用 Next.js Image
- [ ] 正确使用 Server/Client Components
- [ ] API 路由有认证检查
- [ ] 数据验证使用 Zod
- [ ] 代码有适当注释
- [ ] README.md 已更新

## 📚 参考资源

- [完整标准文档](./MODULE_STANDARD.md)
- [被子管理模块](../src/modules/quilts/)
- [球星卡管理模块](../src/modules/cards/)
- [Next.js 16 文档](https://nextjs.org/docs)
- [React 19 文档](https://react.dev)

## 🆘 常见问题

**Q: 何时使用 Server Component?**  
A: 默认使用。只有需要交互（状态、事件）时才用 Client Component。

**Q: 如何优化性能?**  
A: 使用 Image 组件、代码分割、数据缓存、Suspense 流式渲染。

**Q: 如何处理认证?**  
A: Server Components 用 `auth()`，Client Components 用 `useSession()`。

**Q: 如何测试?**  
A: 使用 Vitest + Testing Library，覆盖 Schema 和组件测试。

---

**版本**: v2.0 (2026-01-20)  
**基于**: Next.js 16.1.1 + React 19.2.3
