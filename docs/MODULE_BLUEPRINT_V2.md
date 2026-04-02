# QMS 可复制子模块蓝图 V2

> 生效日期：`2026-04-02`
>
> 首批模板模块：`quilts`
>
> 对齐来源：Context7 中的 `Next.js App Router`、`TanStack Query`、`Drizzle ORM`

## 1. 固定的五条规则

1. 每个子模块只保留一个权威数据层：`src/lib/data/<module>.ts`
2. 每个子模块只保留一个权威 mutation/read 入口：`src/app/actions/<module>.ts`
3. 页面结构固定为：`Server Page + 私有 Client Shell`
4. `Route Handlers` 默认不作为内部读写层，只保留外部 HTTP / Webhook / 兼容面
5. 缓存以 `Next cache tag` 为主，`React Query` 仅作为补充层

## 2. 固定目录模板

```text
src/
├─ modules/
│  └─ <module>/
│     ├─ blueprint.ts
│     ├─ config.ts
│     ├─ schema.ts
│     ├─ types.ts
│     └─ ui/
│
├─ lib/
│  └─ data/
│     └─ <module>.ts
│
├─ app/
│  ├─ actions/
│  │  └─ <module>.ts
│  └─ [locale]/
│     └─ <module>/
│        ├─ page.tsx
│        ├─ _components/
│        │  ├─ <Module>PageClient.tsx
│        │  ├─ <Module>Toolbar.tsx
│        │  ├─ <Module>List.tsx
│        │  ├─ <Module>Filters.tsx
│        │  └─ <Module>FormDialog.tsx
│        └─ [id]/
│           └─ page.tsx
│
└─ hooks/
   └─ use<Module>.ts
      # 仅在确有必要时保留，且只能是 action-backed / compatibility wrapper
```

## 3. 每层职责

### `src/modules/<module>/`

负责：

- 模块配置
- Zod schema
- 模块类型
- 可复用 UI 组件
- 蓝图与迁移文档

禁止：

- 直接访问数据库
- 持有缓存失效逻辑
- 持有页面级 mutation 编排

### `src/lib/data/<module>.ts`

负责：

- 唯一权威 CRUD
- 数据库访问
- 事务
- `use cache` / `cacheTag` / `revalidateTag`
- 服务端筛选、排序、分页

禁止：

- 再包一层 repository / cached repository
- 把同一套筛选逻辑复制到页面或 API

### `src/app/actions/<module>.ts`

负责：

- 页面内部 mutation/read 入口
- 认证与权限判断
- 入参校验、错误映射
- 调用 `lib/data/<module>.ts`

禁止：

- 内部再绕去调本模块自己的 `/api/<module>`
- 复制 DAL 里的数据库逻辑

### `src/app/[locale]/<module>/page.tsx`

负责：

- 作为 server shell
- 解析 `params` / `searchParams`
- 读取首屏数据
- 把可序列化 props 传给 client shell

禁止：

- 承担复杂交互状态
- 再实现一套前端专用的数据过滤

### `src/app/[locale]/<module>/_components/<Module>PageClient.tsx`

负责：

- 工具栏状态
- 弹窗开关
- 选择模式
- `startTransition`
- 纯客户端交互

禁止：

- 直连数据库
- 重复实现服务端筛选逻辑

## 4. 数据层模板

```ts
// src/lib/data/<module>.ts
import { cacheTag, revalidateTag } from 'next/cache'
import { db } from '@/db'

export async function get<Module>List(params: <Module>ListParams) {
  'use cache'
  cacheTag('module:<module>')
  cacheTag('module:<module>:list')
  return db...
}

export async function get<Module>ById(id: string) {
  'use cache'
  cacheTag('module:<module>')
  cacheTag(`module:<module>:item:${id}`)
  return db...
}

export async function save<Module>(input: Save<Module>Input) {
  return db.transaction(async tx => {
    // 所有跨表写入必须在同一事务中
  })
}
```

固定规则：

- 所有列表筛选都在服务端做
- 所有跨表写入必须事务化
- 一个模块只允许一个 DAL 文件长期存在

## 5. Action 模板

```ts
'use server'

import { save<Module> } from '@/lib/data/<module>'

export async function save<Module>Action(input: Save<Module>Input) {
  const result = await save<Module>(input)
  return { ok: true, data: result }
}
```

固定规则：

- 页面内部 mutation 默认走 `Server Actions`
- `Server Actions` 负责认证、校验和错误映射
- `Route Handlers` 只用于外部 HTTP 面

## 6. 页面壳模板

### Server Page

```tsx
import { get<Module>List } from '@/lib/data/<module>'
import { <Module>PageClient } from './_components/<Module>PageClient'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const list = await get<Module>List(parse<Module>ListParams(params))

  return <<Module>PageClient initialList={list} />
}
```

### Client Shell

```tsx
'use client'

export function <Module>PageClient(props: {
  initialList: <Module>ListResult
}) {
  // 本地 UI 状态
  // dialog
  // selection
  // transition
}
```

固定规则：

- 首屏数据由 server page 获取
- client shell 只接收准备好的 props
- 详情页同样使用 server page

## 7. 缓存策略

### Tag 命名

- 根标签：`module:<module>`
- 列表标签：`module:<module>:list`
- 详情标签：`module:<module>:item:<id>`
- 切片标签：`module:<module>:<dimension>:<value>`

### 失效规则

- 创建：失效 `root + list`
- 更新：失效 `root + list + detail`
- 删除：失效 `root + list + detail`
- 状态变更：额外失效新旧状态切片

## 8. React Query 的定位

React Query 不是模块默认层。

只在以下场景保留：

- 无限滚动
- 虚拟列表
- 多个 client island 共享同一份客户端态数据
- 必须在客户端持续轮询或重试的高交互界面

如果保留：

- query key 必须统一
- optimistic update 的 key 必须和读取 key 完全一致
- hooks 只能是 DAL / actions 的包装，不允许自己再定义内部 REST 真相层

## 9. Quilts 当前状态

`quilts` 已经是第一批标准模板模块，当前收敛为：

- 权威 DAL：`src/lib/data/quilts.ts`
- 权威 actions：`src/app/actions/quilts.ts`
- 列表页：`src/app/[locale]/quilts/page.tsx` + `_components/QuiltsPageClient.tsx`
- 详情 / usage / analytics 页面逐步收敛为同样的 server-first 结构

### quilts 已移除的旧层

- `src/lib/repositories/quilt.repository.ts`
- `src/lib/repositories/cached-quilt.repository.ts`

### quilts 仍保留但已降级的层

- `src/hooks/useQuilts.ts`
  - 仅作为少量 client consumer 的 action-backed read wrapper
- `src/app/api/quilts/**`
  - 仅作为外部 HTTP compatibility surface

## 10. Cards 当前复制方式

`cards` 不再发明第二套模式，直接复制 quilts。

### 当前已完成

- `src/lib/data/cards.ts`
  - 已作为 cards 唯一 DAL 落地
- `src/app/actions/cards.ts`
  - 已成为 cards 模块唯一内部 action 入口
- `src/app/[locale]/cards/page.tsx`
  - 已改为 server shell
- `src/app/[locale]/cards/_components/CardsPageClient.tsx`
  - 承接 cards 主列表页客户端交互
- `src/app/[locale]/cards/[id]/page.tsx`
  - 已改为 server-first detail page
- `src/app/[locale]/cards/[id]/edit/page.tsx`
  - 已改为 server-first edit page
- `src/app/[locale]/cards/sold/page.tsx`
  - 已改为 canonical action + canonical DAL 读取
- `src/app/[locale]/cards/overview/page.tsx`
  - 已改为 canonical action + canonical DAL 读取
- `src/app/[locale]/cards/settings/page.tsx`
  - 已改为 server shell
- `src/app/[locale]/cards/settings/_components/CardSettingsPageClient.tsx`
  - 承接 settings 页客户端交互
- `src/hooks/useCardSettings.ts`
  - 已改为 action-backed wrapper，不再依赖 `/api/cards/settings`

### cards 已移除的旧层

- `src/app/actions/card-actions.ts`
- `src/app/actions/card-stats.ts`
- `src/app/actions/card-overview-data.ts`

### cards 仍保留但已降级的层

- `src/app/api/cards/settings/route.ts`
  - 仅作为外部 HTTP compatibility surface

## 11. 后续复制顺序

下一个子模块继续按同一顺序推进：

1. 先建立 `src/modules/<module>/blueprint.ts`
2. 落地 `src/lib/data/<module>.ts`
3. 收敛 `src/app/actions/<module>.ts`
4. 把 `page.tsx` 改成 `Server Page + Client Shell`
5. 把详情页、统计页、设置页按同一模式切片
6. 删除模块内不再被引用的 legacy actions / repositories

## 12. 代码级参考

后续新增模块直接参考：

- [src/modules/core/blueprint.ts](/c:/Users/sli/OneDrive/Projects/qms/src/modules/core/blueprint.ts)
- [src/modules/quilts/blueprint.ts](/c:/Users/sli/OneDrive/Projects/qms/src/modules/quilts/blueprint.ts)
- [src/modules/cards/blueprint.ts](/c:/Users/sli/OneDrive/Projects/qms/src/modules/cards/blueprint.ts)
