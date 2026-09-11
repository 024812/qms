# QMS 可复制子模块蓝图 V2

> 生效日期：`2026-04-02`（`2026-07-18` 修订：补齐从零新建模块清单、统一缓存标签规范、补充注册/i18n/DB 触点）
>
> 模板模块：`quilts`（首选 greenfield 模板）、`cards`（完整功能样例，体量更大）
>
> 对齐来源：`Next.js 16 App Router`、`TanStack Query`、`Drizzle ORM`、`MODULE_BLUEPRINT_V2`
>
> **新增模块一律以本文 §11「从零新建模块 Checklist」为准**；§9–10 记录既有模块状态，§11 才是执行清单。

## 1. 固定的五条规则

1. 每个子模块只保留一个权威数据层：`src/lib/data/<module>.ts`
2. 每个子模块只保留一个权威 mutation/read 入口：`src/app/actions/<module>.ts`
3. 页面结构固定为：`Server Page + 私有 Client Shell`
4. `Route Handlers` 默认不作为内部读写层，只保留外部 HTTP / Webhook / 兼容面
5. 缓存以 `Next cache tag` 为主，`React Query` 仅作为补充层

## 2. 固定目录模板

```text
src/
├─ db/
│  └─ schema.ts              # 新模块表 + pgEnum（与 migration 同步）
│
├─ modules/
│  └─ <module>/
│     ├─ blueprint.ts        # 仅元数据；cache tags 从 core/cache-tags 导入
│     ├─ config.ts           # ModuleDefinition（icon/color/formFields/listColumns）
│     ├─ schema.ts           # Zod attributes + re-export validations
│     ├─ types.ts
│     └─ ui/
│        ├─ <Module>Card.tsx
│        └─ <Module>Detail.tsx
│
├─ lib/
│  ├─ data/
│  │  └─ <module>.ts         # 唯一 DAL：CRUD / 事务 / 'use cache' / revalidateTag
│  └─ validations/
│     └─ <module>.ts         # 业务校验源（模块 schema 只做 re-export）
│
├─ app/
│  ├─ actions/
│  │  └─ <module>.ts         # 唯一内部 action 入口
│  └─ [locale]/
│     └─ <module>/
│        ├─ page.tsx         # Server Page
│        ├─ _components/
│        │  └─ <Module>PageClient.tsx
│        └─ [id]/
│           └─ page.tsx
│
└─ hooks/
   └─ use<Module>.ts         # 可选；只能是 action-backed wrapper

# 全局注册触点（缺一不可，见 §11）
src/modules/registry.ts
src/lib/data/users.ts          # UserModule 联合类型 + normalizeModules
src/app/actions/users.ts       # MODULE_IDS 白名单
src/lib/agent/auth.ts          # Agent scopesForUser（若对外暴露）
src/components/layout/AppSidebar.tsx
messages/en.json + messages/zh.json
drizzle/                       # db:generate 产出的 migration
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

import { auth } from '@/auth'
import { save<Module> } from '@/lib/data/<module>'
import { create<Module>Schema } from '@/lib/validations/<module>'

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; fieldErrors?: Record<string, string[]> } }

export async function save<Module>Action(input: unknown): Promise<ActionResult<Saved>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Requires authentication' } }
  }

  const parsed = create<Module>Schema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: 'Invalid input',
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      },
    }
  }

  try {
    const result = await save<Module>(parsed.data)
    return { success: true, data: result }
  } catch {
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Save failed' } }
  }
}
```

固定规则：

- 页面内部 mutation 默认走 `Server Actions`
- `Server Actions` 负责认证、Zod 校验、错误映射，再调用权威 DAL
- **禁止** action 内直接 `db.insert/update/delete`（见违规：`actions/items.ts`）
- **禁止** action 内裸 `throw` 穿透到页面；统一返回 `ActionResult`
- `Route Handlers` 只用于外部 HTTP 面；若 API 路由包装本 action，认证已在 action 内完成

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
- **禁止**在 Client Shell 内对已取回列表再做主筛选/排序（会破坏分页；见已知问题：`QuiltsPageClient`）
- 详情页同样使用 server page

## 7. 缓存策略（新模块强制规范）

### 唯一工厂

**新模块的 DAL 必须使用** `src/modules/core/cache-tags.ts` 的 `createModuleCacheTags`：

```ts
import { createModuleCacheTags } from '@/modules/core/cache-tags';

export const paddlesCacheTags = createModuleCacheTags('paddles');
// root: 'paddles'
// list: 'paddles:list'
// item: 'paddles:item:<id>'
// slice: 'paddles:<dimension>:<value>'
```

### Tag 命名（无 `module:` 前缀）

| 类型 | 格式                           | 示例                    |
| ---- | ------------------------------ | ----------------------- |
| 根   | `<module>`                     | `paddles`               |
| 列表 | `<module>:list`                | `paddles:list`          |
| 详情 | `<module>:item:<id>`           | `paddles:item:abc`      |
| 切片 | `<module>:<dimension>:<value>` | `paddles:status:IN_USE` |

### 禁止事项

- **禁止**在新模块 DAL 中使用 `src/modules/core/blueprint.ts` 的 `createModuleCacheTags`（该工厂产出 `module:<id>` 前缀，与运行时不一致）
- **禁止**手写 tag 字符串字面量（如 `'usage'`、`` `usage-${id}` ``）
- **禁止**只 `revalidateTag` 而读取侧不打 `cacheTag`（会变成空操作）
- 读取函数必须：`'use cache'` + `cacheTag(...)`；写入必须：`revalidateTag(..., 'max')`

### 现状说明（勿模仿）

| 数据层                              | 当前 tag 来源                          | 是否符合新规范     |
| ----------------------------------- | -------------------------------------- | ------------------ |
| `lib/data/quilts.ts`                | `core/cache-tags.ts`                   | 符合               |
| `lib/data/cards.ts`                 | `cards/blueprint.ts`（`module:` 前缀） | 不符，迁移时再统一 |
| `lib/data/usage.ts`                 | 硬编码字面量                           | 不符               |
| `lib/data/settings.ts` / `users.ts` | 本地常量                               | 不符               |

`blueprint.ts` 中的 `createModuleCacheTags`（`core/blueprint.ts`）仅供**蓝图元数据展示**，不得给 DAL 用。

### 失效规则

- 创建：失效 `root + list`
- 更新：失效 `root + list + detail`（及相关切片新旧值）
- 删除：失效 `root + list + detail`（及相关切片）

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

## 11. 从零新建模块 Checklist（执行清单）

适用：`paddles`（乒乓球拍）、`maps`（地图）、`antiques`（文玩）、`spirits`（藏酒）等 greenfield 模块。

**模板选择**：优先复制 `quilts` 结构（体量适中）；需要评级/估值/AI 等复杂切片时再参考 `cards`。

### 11.1 设计约定

| 项       | 约定                                                                                                                                      |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 模块 ID  | 英文复数 kebab/camel，如 `paddles`、`maps`、`antiques`、`spirits`；路由段与 ID 一致                                                       |
| 显示名   | 中英双语：`messages/zh.json` + `en.json`；`config.ts` 的 `name` 用中文（侧边栏/订阅页可逐步切到 i18n）                                    |
| 业务字段 | 详细业务字段放 **独立表**（不共用 quilts/cards 表）；通用字段固定：编号、名称、状态、存放位置、备注、主图、附加图、购入日期、估值（可选） |
| 状态枚举 | 模块自定义 `pgEnum`，推荐至少 `IN_USE / MAINTENANCE / STORAGE`（可按品类扩展，如藏酒 `SEALED/OPENED`）                                    |
| 校验源   | `src/lib/validations/<module>.ts` 为唯一 Zod 源；`modules/<module>/schema.ts` 只 re-export                                                |

### 11.2 数据库

1. 在 `src/db/schema.ts` 增加 `pgEnum` + `pgTable`（独立表，命名 `<module>`）
2. 定义 relations（如需）
3. `npm run db:generate` → 检查 `drizzle/` migration
4. 在 **C:\temp 副本** 或确认后的环境执行 `npm run db:migrate`（禁止在 OneDrive 下直接跑）

### 11.3 模块目录（`src/modules/<module>/`）

```
blueprint.ts   # defineModuleBlueprint；tags 从 @/modules/core/cache-tags 导入
config.ts      # ModuleDefinition：id/name/description/icon/color/attributesSchema/formFields/listColumns/statsConfig
schema.ts      # re-export lib/validations
types.ts
ui/<Module>Card.tsx
ui/<Module>Detail.tsx
```

`config.ts` 的 `formFields.label` 目前为中文硬编码（与 quilts/cards 一致）；后续若统一走 i18n，需同步改 `ModuleDefinition`。

### 11.4 数据层 / Actions / 页面

1. `src/lib/data/<module>.ts` — CRUD、服务端筛选分页、事务、`'use cache'` + tags
2. `src/app/actions/<module>.ts` — `auth()`、Zod `safeParse`、错误映射、调用 DAL、`updateTag`
3. `src/app/[locale]/<module>/page.tsx` — Server Page，解析 `searchParams`，传 `initial*` 给 Client Shell
4. `src/app/[locale]/<module>/_components/<Module>PageClient.tsx` — **禁止**在客户端重实现主筛选/排序；筛选条件回传 action 或 URL
5. `src/app/[locale]/<module>/[id]/page.tsx` — Server Page 详情
6. `src/hooks/use<Module>.ts` — 可选，仅 action-backed

### 11.5 全局注册触点（漏一个则模块不可见或不可订阅）

| #   | 文件                                    | 改动                                                                             |
| --- | --------------------------------------- | -------------------------------------------------------------------------------- |
| 1   | `src/modules/registry.ts`               | `MODULE_REGISTRY` 注册；同步扩展 `RegisteredModule` 联合类型                     |
| 2   | `src/lib/data/users.ts`                 | `UserModule` 联合类型 + `normalizeModules` 白名单                                |
| 3   | `src/app/actions/users.ts`              | `MODULE_IDS` 常量（Zod enum 来源）                                               |
| 4   | `src/components/layout/AppSidebar.tsx`  | `getModuleNavigation` + `getCurrentModuleId` + settings 链接（如有）             |
| 5   | `src/lib/agent/auth.ts`                 | `scopesForUser` 增加 `read/write:<module>`（若开放 Agent API）                   |
| 6   | `messages/en.json`                      | `navigation.<id>`、`modules.<id>`、`users.modules.<id>`、`sidebar.*`、模块文案区 |
| 7   | `messages/zh.json`                      | 同上中文                                                                         |
| 8   | （可选）`src/app/api/<module>/route.ts` | 仅外部 HTTP 兼容面；内部读写禁止走此路径                                         |

> `proxy.ts` 单模块自动跳转依赖 `session.user.activeModules`，注册正确后无需改 proxy。

### 11.6 字段设计参考（详细业务）

在通用字段之上按品类扩展（放独立表列，不塞 JSON 除非真动态）：

- **乒乓球拍 `paddles`**：`bladeBrand`、`bladeModel`、`bladeWeightG`、`handleType`、`forehandRubber`、`backhandRubber`、`rubberAgeDays`、`playingStyle`、`glueType`
- **地图 `maps`**：`mapType`、`scale`、`publishedYear`、`publisher`、`material`、`widthCm`、`heightCm`、`region`、`language`
- **文玩 `antiques`**：`category`、`material`、`era`、`lengthCm`、`weightG`、`condition`、`acquiredFrom`、`certificate`
- **藏酒 `spirits`**：`spiritType`、`region`、`vintage`、`abv`、`volumeMl`、`bottleStatus`、`storageCondition`、`estimatedValue`

### 11.7 验证

在 `C:\temp\<project>` 下执行（勿在 OneDrive 内）：

```bash
npm run lint:check
npm run type-check
npm test
npm run build
```

人工检查：管理员可见模块、member 订阅后导航出现、列表 CRUD、缓存失效（改一条后列表刷新）。

---

## 12. 代码级参考

| 用途                                      | 路径                                                                                                                                                                                                 |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 蓝图类型 / query keys                     | [`src/modules/core/blueprint.ts`](../../src/modules/core/blueprint.ts)                                                                                                                               |
| **运行时 cache tags（新模块必须用这个）** | [`src/modules/core/cache-tags.ts`](../../src/modules/core/cache-tags.ts)                                                                                                                             |
| 第一批标准模块（首选模板）                | [`src/modules/quilts/blueprint.ts`](../../src/modules/quilts/blueprint.ts)、[`src/lib/data/quilts.ts`](../../src/lib/data/quilts.ts)、[`src/app/actions/quilts.ts`](../../src/app/actions/quilts.ts) |
| 完整功能样例（估值/设置/AI）              | [`src/modules/cards/blueprint.ts`](../../src/modules/cards/blueprint.ts)、[`src/lib/data/cards.ts`](../../src/lib/data/cards.ts)                                                                     |
| 模块注册                                  | [`src/modules/registry.ts`](../../src/modules/registry.ts)                                                                                                                                           |
| 订阅白名单                                | [`src/app/actions/users.ts`](../../src/app/actions/users.ts)                                                                                                                                         |

**不要**把 `cards/blueprint.ts` 里的 `module:` 前缀 tag 或 `items.ts` 门面当作新模块模板。
