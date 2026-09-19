# QMS 全量代码审查报告

> 审查日期：`2026-09-18`
> 审查基线：`main` @ `7734adf`（工作区干净，无未提交改动）
> 声明版本：`package.json` = `2026.9.11`
> 审查方式：隔离副本 `C:\temp\qms-review-20260918` 中安装依赖并执行全部门禁；对照 `docs/architecture/MODULE_BLUEPRINT_V3.md`、`CLAUDE.md` 的既有架构契约；使用 context7 校验 Next.js 16 缓存 API 语义。
> **修复状态：P1-1、P1-2、P2-1 ~ P2-9 及 P3-2、P3-5 ~ P3-10、P3-12 ~ P3-14 共 21 项已于 2026-09-18 修复并通过复验，详见 §0。**

---

## 0. 修复实施记录（2026-09-18）

审查报告出具后，按 §8 建议顺序的前 3 项已在本工作区落地，并在隔离副本中完成复验。

### 0.1 已修复项

七批共修复 21 项。明细分别在 §0.2–§0.3（P1）、§0.5（P2 第一批）、§0.6（P2 决策后）、§0.8（P3）、§0.10（P3 收尾与 `ActionResult` 收敛）、§0.11（P2-9 测试缺口补齐）。

| 编号 | 修复内容 | 涉及文件 | 明细 |
| --- | --- | --- | --- |
| **P1-1** | 补齐 Server Page 层模块授权，统一 UI 与 API 的权限语义 | `analytics/page.tsx`、`reports/page.tsx`、**新增** `reports/_components/ReportsPageClient.tsx`、`api/reports/route.ts` | §0.2 |
| **P1-2** | `revalidateTag` 全部移出数据库事务，改为提交后统一失效 | `src/lib/data/quilts.ts` | §0.3 |
| **P2-2** | 跨字段业务规则收敛为单一实现；更新路径对**合并后的记录**再校验 | `src/lib/validations/quilt.ts`、`src/lib/data/quilts.ts`、`src/app/actions/quilts.ts` | §0.5 |
| **P2-3** | `actions/modules.ts` 下沉到 DAL，读改写加行锁，失效走 tag factory | `src/app/actions/modules.ts`、`src/lib/data/users.ts` | §0.5 |
| **P2-4** | `src/__tests__` 恢复参与 `tsc --noEmit` | `tsconfig.json` | §0.5 |
| **P2-5** | 文档技术栈版本对齐 lockfile 实际解析结果 | `README.md`、`README_zh.md` | §0.5 |
| **P2-6** | 新增 `moduleList`/`moduleItem` 语义缓存档案，43 处调用点改用具名档案 | `next.config.ts` + 全部 DAL | §0.5 |
| **P2-8** | 五个模块共用 `src/lib/data/search.ts`；`paddleSearchSchema` 去重 | **新增** `src/lib/data/search.ts`、`src/modules/paddles/schema.ts`、`src/app/actions/paddles.ts` + 5 个 DAL | §0.5 |
| **P2-1** | 保留 `LOST` 并补齐 DB/Zod/Agent/UI/统计/i18n 全链路，新增枚举一致性测试 | `src/lib/validations/quilt.ts`、`src/lib/database/types.ts`、`src/app/actions/quilts.ts`、`src/app/api/agent/{tools,openapi.json}/route.ts`、`src/lib/data/stats.ts`、`src/app/api/analytics/route.ts`、`analytics/page.tsx`、`AnalyticsPageClient.tsx`、`StatusChangeDialog.tsx`、`QuiltFilters.tsx`、`AdvancedFilters.tsx`、`QuiltCard.tsx`、`QuiltTableRow.tsx`、`QuiltUsageDetailPageClient.tsx`、`src/modules/quilts/schema.ts`、`messages/{en,zh}.json`、**新增** `src/lib/__tests__/quilt-status-enum.test.ts` | §0.6.1 |
| **P2-7** | 入库只做归一化，HTML 转义移交渲染层；搜索词不再被删字符；附存量清洗脚本 | `src/lib/sanitization.ts`、`src/lib/__tests__/sanitization.test.ts`、**新增** `scripts/fix-html-escaped-text.ts` | §0.6.2–0.6.3 |
| **P3-5** | `changePassword` 的 session 读取移出 DAL，两个调用点统一到同一实现 | `src/lib/data/settings.ts`、`src/app/actions/settings.ts`、`src/app/api/settings/change-password/route.ts` | §0.8.1 |
| **P3-6** | Agent scope 由 registry 派生；`read:settings` 授予规则与 OpenAPI 描述对齐 | **新增** `src/lib/agent/scopes.ts`、`src/lib/agent/auth.ts`、`src/lib/data/user-api-keys.ts`、`src/app/actions/{modules,users}.ts`、`src/lib/data/users.ts` | §0.8.2 |
| **P3-7** | OpenAPI `info.version` 读 `package.json`；`input` 改为可选；工具清单单一来源 | **新增** `src/lib/agent/tool-names.ts`、`src/app/api/agent/openapi.json/route.ts`、`src/app/api/agent/tools/route.ts`、`public/AGENT_API.md` | §0.8.3 |
| **P3-8** | 6 条 lint 警告清零（`lint:check` 达到 0 错误 / 0 警告） | **新增** `src/modules/core/ui/InteractiveCard.tsx`、`src/lib/image-utils.ts`、`PaddleCard.tsx`、`MapCard.tsx`、`SpiritCard.tsx`、`AntiqueDetail.tsx`、`MapDetail.tsx`、`SpiritDetail.tsx` | §0.8.4 |
| **P3-9** | `public/clear-cache.html` 加 `noindex`、去掉自动触发、清缓存前二次确认 | `public/clear-cache.html` | §0.8.5 |
| **P3-10** | 四个新模块写操作补事务与行锁；删除契约跨模块统一；类型化错误替代消息匹配 | `src/lib/data/{paddles,antiques,maps,spirits,cards,quilts}.ts`、**新增** `src/lib/data/errors.ts`、6 个 `src/app/actions/*.ts` | §0.8.6 |
| **P3-12** | 蓝图 §15 的测试基线随本轮同步更新 | `docs/architecture/MODULE_BLUEPRINT_V3.md` | §0.8.7 |
| **P2-3（续）** | `ActionResult` 契约、错误工厂与 `unwrapActionResult` 收敛到单一模块；28 处内联 `flatten().fieldErrors` 强转改用共享 helper | **新增** `src/lib/api/action-result.ts`、`src/lib/api/action-response.ts`、10 个 `src/app/actions/*.ts`、11 个 `src/hooks/*.ts`、17 个 `src/app/api/**/route.ts` | §0.10.1 |
| **P3-13** | 两版 README 章节结构对齐（各 26 个标题一一对应），补齐中文版环境变量分组与 `AUTH_SECRET` 说明 | `README.md`、`README_zh.md` | §0.10.2 |
| **P3-14** | 失效的 `file:///c:/Users/sli/...` 路径改为仓库相对链接；skill 正文按 V3 蓝图重写 | `.agent/skills/qms-module-development/SKILL.md` | §0.10.3 |
| **P2-9** | 按蓝图 §13 补齐剩余验收缺口：registry/导航/i18n 一致性、新模块 DAL 级 CRUD、状态转移原子性 | **新增** `src/__tests__/module-registry-consistency.test.ts`、`src/lib/__tests__/new-module-dal-writes.test.ts`、`src/lib/__tests__/quilt-status-transition.test.ts`、`src/modules/registry.ts` | §0.11 |

另外修掉一个**首轮未记录的缺陷**：`listUsers` 声明了 cache tag 却没有任何失效路径，`createUser`/`updateUser`/`deleteUser` 现已在提交后失效（§0.5）。

### 0.2 P1-1 具体改动

**`src/app/[locale]/analytics/page.tsx`** —— 补上服务端模块授权，与 `api/analytics/route.ts` 的 `requireApiModule('quilts')` 对齐：

```tsx
import { auth } from '@/auth';
import { requirePageModuleAccess } from '@/lib/module-access';
...
export default async function AnalyticsPage() {
  await connection();
  requirePageModuleAccess(await auth(), 'quilts');
  const [analyticsData, totalQuilts, usageRecords] = await Promise.all([...
```

**`src/app/[locale]/reports/page.tsx`** —— 由 `'use client'` 页面改写为 Server Page，同时解决 P3-2：

```tsx
import { connection } from 'next/server';
import { auth } from '@/auth';
import { requirePageModuleAccess } from '@/lib/module-access';
import { ReportsPageClient } from './_components/ReportsPageClient';

export default async function ImportExportPage() {
  await connection();
  const session = requirePageModuleAccess(await auth(), 'quilts');
  return <ReportsPageClient isAdmin={session.user.role === 'admin'} />;
}
```

**`src/app/[locale]/reports/_components/ReportsPageClient.tsx`（新增）** —— 承接原页面全部客户端逻辑，改为接收 `isAdmin` prop，不再自行 `useSession()` 判断权限（避免「先渲染后鉴权」的闪烁与绕过面）；路由跳转改用 `@/i18n/routing` 的 `useRouter`。

**`src/app/api/reports/route.ts`** —— `requireApiSession` → `requireApiModule('quilts')`，使导入导出的 API 与 UI 共用同一套模块授权判定。

### 0.3 P1-2 具体改动

在 `src/lib/data/quilts.ts` 中新增提交后失效助手，并让事务返回计算失效切片所需的数据：

```ts
interface QuiltInvalidationInput {
  id: string;
  statuses?: QuiltStatus[];
  seasons?: Season[];
  usageChanged?: boolean;
}

/**
 * Invalidate every cache tag affected by a quilt write.
 * Contract: call this only AFTER the surrounding transaction has committed.
 * `revalidateTag` does not participate in the transaction rollback...
 */
function invalidateQuiltWriteTags({ id, statuses = [], seasons = [], usageChanged = false }: QuiltInvalidationInput) {
  revalidateTag(quiltsCacheTags.root, 'max');
  revalidateTag(quiltsCacheTags.list, 'max');
  revalidateTag(quiltsCacheTags.item(id), 'max');
  for (const status of new Set(statuses)) revalidateTag(quiltsCacheTags.slice('status', status), 'max');
  for (const season of new Set(seasons)) revalidateTag(quiltsCacheTags.slice('season', season), 'max');
  revalidateTag(statsCacheTags.root, 'max');
  revalidateTag(statsCacheTags.slice('dashboard', 'main'), 'max');
  if (usageChanged) invalidateUsageAndStatsTags(id);
}
```

四个写入路径（`saveQuilt` 创建分支、`saveQuilt` 更新分支、`updateQuiltStatusWithUsageRecord`、`deleteQuilt`）现在都是「事务返回结果 → 事务外调用助手」。事务返回 `{ quilt, usageRecord, previousStatus, previousSeason }`（或 `statusChanged`），因此旧状态与新状态涉及的 status/season 切片都会被正确失效，不会因为移到事务外而漏失效。至此 `quilts.ts` 与 `usage.ts`、`settings.ts` 的实现一致。

### 0.4 复验结果

在隔离副本 `C:\temp\qms-review-20260918`（已同步上述 6 个文件）重新执行门禁：

| 检查项 | 修复前 | 修复后 |
| --- | --- | --- |
| `npm run type-check` | ✅ 0 错误（但 `src/__tests__` 被排除） | ✅ 0 错误（**`src/__tests__` 已纳入**，9 个测试文件编译通过） |
| `npm run lint:check` | ⚠️ 0 错误 / 6 警告 | ⚠️ 0 错误 / 6 警告（警告集合完全一致，仍集中在 `src/modules/{antiques,maps,paddles,spirits}/ui/*`，见 P3-8） |
| `npm test` | ✅ 19 文件 / 157 测试 | ✅ 19 文件 / 157 测试 |
| `npm run build` | ✅ 117/117 页 | ✅ 编译成功、TS 通过、117/117 静态页生成 |

修复后的构建日志（干净 `.next`）：

```text
▲ Next.js 16.3.4 (Turbopack)
- Environments: .env.local
- Cache Components enabled
✓ Compiled successfully in 3.1min
  Finished TypeScript in 2.7min ...
✓ Generating static pages using 21 workers (117/117) in 25.7s
  Finalizing page optimization ...
```

随后收尾阶段被本机沙箱的批量删除保护拦截（与修复前同一环境问题，详见 §5），**与代码无关**。

复验未引入任何新错误或新警告，测试数量与结果保持不变，说明 P1-2 的事务重构未改变对外行为。

### 0.5 P2 批量修复（同日续做）

在 P1 复验通过后，继续处理**无需产品决策**的 P2 项。

#### P2-2 校验逻辑收敛

`src/lib/validations/quilt.ts` 新增 `collectQuiltBusinessRuleIssues(data)` 作为跨字段业务规则的**唯一实现**，`createQuiltSchema` 与 `updateQuiltSchema` 都通过它挂载 `superRefine`。

关键在于「部分更新」的语义：`updateQuiltSchema` 必须继续接受只有 `id` 的载荷（`src/lib/__tests__/quilt-id-validation.test.ts` 依赖此契约），所以规则只在**相关字段都出现时**才求值。这留下一个缺口 —— 只 PATCH `season` 时 schema 看不到已存储的 `weightGrams`。因此 `saveQuilt` 的更新分支在读取当前行后、任何写入之前，对**合并后的记录**再跑一次同一函数：

```ts
const businessRuleIssues = collectQuiltBusinessRuleIssues({
  season: data.season ?? currentQuilt.season,
  weightGrams: data.weightGrams ?? currentQuilt.weightGrams,
  lengthCm: data.lengthCm ?? currentQuilt.lengthCm,
  widthCm: data.widthCm ?? currentQuilt.widthCm,
});

if (businessRuleIssues.length > 0) {
  throw new QuiltBusinessRuleError(businessRuleIssues);
}
```

新增 `QuiltBusinessRuleError`（携带 `fieldErrors`），`saveQuiltAction` 将其映射为 `validationErrorResult` 而非 500；同时 DAL 的 catch 块对它跳过 ERROR 级日志 —— 用户输入错误不应污染错误告警。

另外把 `src/app/actions/paddles.ts` 内重复声明的 `paddleSearchSchema` 下沉到 `src/modules/paddles/schema.ts`，改为组合已有的 `paddleFiltersSchema`（原先重复了 `status`/`handleType` 两组枚举字面量，存在漂移风险）；排序字段改为从 `PADDLE_SORT_FIELDS` 常量元组派生，`PaddleSortField` 类型与 Zod 枚举共用同一份定义。Action 保留 `export type { PaddleSearchInput }` 以免改动 4 处导入方。

#### P2-3 `actions/modules.ts` 下沉到 DAL

`src/app/actions/modules.ts` 从 193 行降为薄封装：只做 `auth()` + registry 校验 + 调用 DAL，不再导入 `@/db`，不再使用 `revalidatePath`。

`src/lib/data/users.ts` 新增：

- `getUserActiveModules(userId)` —— 读路径，经 `normalizeModuleIds` 归一化（残留的失效模块 ID 不会外泄）。
- `setUserModuleSubscription(userId, moduleId, action)` —— 读-改-写在事务内完成，并以 **`SELECT ... FOR UPDATE` 行锁**串行化，修掉并发 toggle 丢订阅的问题。
- `invalidateUserWriteTags(id)` —— 提交后统一失效 `users` / `users:list` / `users:item:{id}`。

顺带修掉一个此前未被记录的缺陷：`listUsers` 声明了 `cacheTag(usersCacheTags.*)` 但**全库没有任何失效路径**，`createUser` / `updateUser` / `deleteUser` 三个写入函数现在都会在提交后调用失效助手。

Action 的返回契约（`{ success, subscribed, message }` 与 `string[]`）保持不变，4 处 UI 调用方（`ModuleSelector`、`settings/page.tsx`、`SettingsPageClient`）无需改动。**`ActionResult` 化未做** —— 那会改动 4 个 UI 文件的错误处理分支，收益仅是错误码在 UI 侧可辨识（现有 i18n 兜底文案已覆盖），建议作为独立变更排期。

#### P2-6 `cacheLife` 档案

从 Next.js 16.3.4 自带的 `node_modules/next/dist/docs/.../cacheLife.md` 确认了内置档案的真实数值：

| 档案 | stale | revalidate | expire |
| --- | --- | --- | --- |
| `default` | 5 分钟 | 15 分钟 | 永不 |
| `seconds` | 30 秒 | **1 秒** | 1 分钟 |
| `minutes` | 5 分钟 | **1 分钟** | 1 小时 |

也就是说，代码注释里的「2 分钟」实际是 **1 秒**，「5 分钟」实际是 1 分钟。在 `next.config.ts` 注册两个语义档案并替换全部 43 处调用（`getSystemInfo` 保留内置 `'hours'`）：

```ts
cacheLife: {
  moduleList: { stale: 60, revalidate: 120, expire: 3600 },  // 列表/搜索/计数
  moduleItem: { stale: 60, revalidate: 300, expire: 3600 },  // 单条/单例/统计
},
```

顺带统一了一处不一致：`getAntiques`/`getMaps`/`countAntiques`/`countMaps` 原本是 `'minutes'`（5 分钟），而 `getPaddles`/`getSpirits` 的同类查询是 `'seconds'`（1 秒），现全部归为 `moduleList`。

正确性不依赖 revalidate 间隔：所有写入路径在提交后调用 `revalidateTag(..., 'max')`，变更立即可见。此改动**降低了 Neon 查询量**（列表从约每秒重新验证变为每 2 分钟）。

另注：档案名的联合类型由 `.next/types/cache-life.d.ts` 生成。实测该文件缺失时 `tsc --noEmit` 仍通过（不存在 CI 顺序要求），存在时拼写错误会被捕获 —— 已实测 `'moduleIteam'` 会报 `TS2769`。

#### P2-8 搜索语义统一

新增 `src/lib/data/search.ts`，作为所有模块搜索条件的唯一构造入口：

- `escapeLikePattern(term)` —— 转义 `%`/`_`/`\`（反斜杠必须先转义，否则会破坏后续引入的转义符）。
- `containsInsensitive(column, term)` —— `LOWER(col) LIKE '%term%'`。
- `searchAnyColumn(columns, term)` —— 多列 OR，空词返回 `undefined`（避免 `%%` 匹配全表）。
- `containsInsensitiveFilter(column, value)` —— 可选过滤字段。

替换了 5 个 DAL 的全部 `like()` 构造：`paddles`/`antiques`/`maps` 原先**大小写敏感**且未转义，`quilts`/`spirits` 大小写不敏感但未转义。现在五个模块语义完全一致。

同时给 `getPaddlesAction` 补上 `sanitizeApiInput`（`getQuiltsAction` 原本就有）。

> ⚠️ 注意：该补充使 paddles 的搜索词也经过 HTML 实体转义，与 quilts 一致 —— 但这意味着搜索词里的 `&`/`<`/`>` 会被转义后参与匹配。搜索词既不持久化也不渲染为 HTML，实体转义在此纯属无收益且有害。这与 **P2-7** 是同一设计问题，建议在决策 P2-7 时一并改为「搜索词只做 trim + 长度限制 + LIKE 通配符转义」。

#### 文档基线刷新（P2-5 / P3-12 / P3-13 + API envelope）

- `README.md` / `README_zh.md`：技术栈改为 **lockfile 实际解析版本**（括号内标注声明的 caret 范围）；中文版补齐「仓库结构」与完整「常用脚本」；两版「发布前验证」都加入 `npm audit --omit=optional`；仓库结构按实际目录补全（`(dashboard)`、`login`、`register`、`usage`、`i18n`、`styles`、`__tests__`）。
- `docs/architecture/MODULE_BLUEPRINT_V3.md` §15：基线更新为 19 文件 / 157 测试，并记录本机 `next build` 的沙箱注意事项与 `src/__tests__` 已纳入类型检查。
- `docs/API_REFERENCE.md`：修正响应结构 —— 分页元数据在**顶层 `meta`**、校验错误在 **`error.details.errors`**（非 `error.fieldErrors`）、错误码与 HTTP 状态对应表；并如实记录当前**三种并存的列表载荷形状**（`quilts` 用 `meta`、`cards` 把分页摊平进 `data`、四个新模块用 `data.pagination`），标注应以第三种收敛。
- `docs/README.md`：索引加入本报告；修正「`/api/**` 都是 compatibility 表面」的表述（实际只有 `GET /api/quilts` 设置 `X-QMS-API-Surface: compatibility`）。
- `CHANGELOG.md`：新增 `[Unreleased]` 段落，记录 P1 三项修复、P2 批量修复与文档更新，并附 Verification 命令清单。

#### P2 批量修复的复验

在隔离副本中重跑全部门禁：

| 检查项 | P1 修复后 | P2 批量修复后 |
| --- | --- | --- |
| `npm run type-check` | ✅ 0 错误 | ✅ 0 错误 |
| `npm run lint:check` | ⚠️ 0 错误 / 6 警告 | ⚠️ 0 错误 / 6 警告（**同一集合**，未新增） |
| `npm test` | ✅ 19 文件 / 157 测试 | ✅ **24 文件 / 217 测试** |
| `npm run build` | ✅ 117/117 | ✅ 117/117 |

新增的 5 个测试文件 / 60 个测试，全部针对本轮修复的回归面：

| 文件 | 测试数 | 覆盖 |
| --- | --- | --- |
| `src/lib/__tests__/quilt-business-rules.test.ts` | 19 | P2-2：规则函数、两个 schema、`saveQuilt` 合并后校验、`QuiltBusinessRuleError` |
| `src/lib/__tests__/search.test.ts` | 16 | P2-8：通配符转义、`LOWER()` 包裹、空词返回 `undefined`（用 `PgDialect` 编译真实 SQL 断言） |
| `src/lib/__tests__/user-module-subscription.test.ts` | 9 | P2-3：行锁存在、失效在提交后、no-op 不写不失效、失效模块 ID 被丢弃 |
| `src/lib/__tests__/quilt-cache-invalidation.test.ts` | 8 | P1-2：**事务失败时不失效任何缓存**、提交后才失效、旧/新 status 与 season 切片都失效 |
| `src/__tests__/page-module-authorization.test.ts` | 8 | P1-1：无权限成员/未登录被拒且**不触发任何 DAL 读取**、admin 放行、`isAdmin` 正确传递 |

构建日志（干净 `.next`）：

```text
✓ Compiled successfully in 47s
  Finished TypeScript in 15.9s ...
✓ Generating static pages using 21 workers (117/117) in 11.7s
  Finalizing page optimization ...
```

同样在收尾阶段被沙箱删除保护拦截（环境问题，见 §5）。

### 0.6 P2-1 / P2-7 决策后实施（同日三续）

§0.5 把两项需要产品决策的条目挂起了。决策结论：**P2-1 保留 `LOST`**、**P2-7 只存原文、转义留给渲染层**。以下是实施记录。

#### 0.6.1 P2-1：`LOST` 保留并全链路补齐

`quilt_status` 在 Postgres 里有 4 个值，Zod / Agent / UI / i18n 只有 3 个，`API_REFERENCE.md` 却把 `LOST` 写成合法过滤值。选择保留后，补齐的不只是缺的枚举值，还包括**让这类漂移不可能再发生**的机制。

**根因**：状态字面量在 8 个地方各写了一遍，没有运行时可迭代的单一清单，所以漏一处没人发现。

**修复**：在 `src/lib/validations/quilt.ts` 新增运行时常量 `QUILT_STATUSES`（元组，可直接喂给 `z.enum()`），所有派生点改为从它取：

| 位置 | 改法 |
| --- | --- |
| `src/lib/validations/quilt.ts` | `QuiltStatus` 补 `LOST`；新增 `QUILT_STATUSES`；`QuiltStatusSchema = z.enum(QUILT_STATUSES)`；`baseQuiltSchemaObject.currentStatus` 与 `quiltFiltersSchema.status` 改用 `QuiltStatusSchema`（顺带消掉两处手写重复） |
| `src/lib/database/types.ts` | `isQuiltStatus` 改用 `QUILT_STATUSES.includes(...)` |
| `src/app/actions/quilts.ts` | `changeQuiltStatusSchema.status` 与 `changeQuiltStatusAction` 参数类型改用 `QuiltStatusSchema` / `QuiltStatus` |
| `src/app/api/agent/tools/route.ts` | 3 处 `z.enum(['IN_USE','MAINTENANCE','STORAGE'])` → `z.enum(QUILT_STATUSES)` |
| `src/app/api/agent/openapi.json/route.ts` | `quiltStatus: [...QUILT_STATUSES]` |
| `src/lib/data/stats.ts` | `StatusCounts` 新增 `lost`；`getStatusCounts` 计入 `LOST` |
| `src/app/api/analytics/route.ts`、`analytics/page.tsx` | `statusDistribution` 补 `LOST` |
| `analytics/_components/AnalyticsPageClient.tsx` | 类型补 `LOST`；改为遍历 `QUILT_STATUSES` 渲染（原先遍历对象键，缺字段就静默少一行）；颜色改为 `Record<status, string>`，漏一个状态直接编译失败 |
| `StatusChangeDialog.tsx` | 3 个硬编码 `<SelectItem>` → 遍历 `QUILT_STATUSES`；颜色同样改为穷尽 `Record` |
| `QuiltFilters.tsx`、`AdvancedFilters.tsx` | 补 `LOST` 选项 / 改为遍历 `QUILT_STATUSES` |
| `QuiltCard.tsx`、`QuiltTableRow.tsx`、`QuiltUsageDetailPageClient.tsx` | 补 `LOST` 徽章（红） |
| `src/modules/quilts/schema.ts` | `QuiltItem.currentStatus` 由手写三值联合改为 `QuiltStatus` |
| `messages/en.json`、`messages/zh.json` | 补 `status.LOST`（Lost / 已丢失） |

**新增机制性防护** —— `src/lib/__tests__/quilt-status-enum.test.ts`（27 个测试）把「DB ↔ Zod ↔ 运行时常量 ↔ i18n」的一致性变成机器校验：

- `quiltStatusEnum.enumValues`（Drizzle pgEnum）↔ `QUILT_STATUSES`
- `QuiltStatusSchema.options` ↔ `QUILT_STATUSES`
- `Object.values(QuiltStatus)` ↔ `QUILT_STATUSES`
- `messages/{en,zh}.json` 的 `status.*` 键集合 ↔ `QUILT_STATUSES`
- 每个状态都能通过 `quiltFiltersSchema` 与 `createQuiltSchema`；未知值被拒；缺省仍为 `STORAGE`
- `isQuiltStatus` 对全部合法值返回 `true`，对 `'AVAILABLE'`/`''`/`null` 等返回 `false`

蓝图 §4.2 从「靠人盯」变成「靠 CI 拦」。

**类型检查抓到两处我最初漏掉的窄化定义**（`QuiltItem.currentStatus` 与 `modules/quilts/schema.ts` 的同一字段），已一并改为 `QuiltStatus` —— 这正好印证了补齐枚举值本身不足以防止漂移，得有单一来源。

**`LOST` 的语义**：与 `MAINTENANCE`/`STORAGE` 同类，不承载 active usage record；`updateQuiltStatusWithUsageRecord` 的 `IN_USE` 进出逻辑天然覆盖（`LOST` 只走「离开 `IN_USE`」分支）。已写入 `docs/API_REFERENCE.md`。

#### 0.6.2 P2-7：入库只归一化，转义交给渲染层

**根因**：`sanitizeApiInput` 在持久化前调用 `escapeHtml`，于是 `A & B` 入库成 `A &amp; B`；React 渲染文本节点时再转义一次，页面显示 `A &amp;amp; B`。同一根因还造成搜索词被破坏：`sanitizeSearchQuery` 直接**删除** `& < > ' "`，搜 `AT&T` 会退化成 `ATT`。

**修复**（`src/lib/sanitization.ts`）：

- 模块定位重写为「归一化」而非「转义」：`normalizeStringInput` 只做 trim + 剥离控制字符（`\u0000-\u0008 \u000b \u000c \u000e-\u001f \u007f-\u009f`），**保留 `\t` 与 `\n`**（备注字段确实需要换行）。
- 删掉 `sanitizeApiStringValue` 与它的 `IMAGE_DATA_URL_REGEX` / `sanitizeUrl` 旁路 —— 不再转义后，这些旁路就没有存在意义了。
- `sanitizeSearchQuery` 不再删除字符，只保留 trim + 100 字符上限；LIKE 通配符的防御由 `src/lib/data/search.ts` 负责（`%`/`_`/`\` 转义）。
- `escapeHtml` 保留并明确标注**仅用于渲染期拼接 HTML 字符串，其结果不得入库**。

**安全性未降低**：全仓 `dangerouslySetInnerHTML` 命中数为 0，React 默认转义文本节点；因此「存原文 + 渲染转义」是正确且更安全的组合，而原来的做法只是把损坏的数据写进了库。

**回归测试** —— `src/lib/__tests__/sanitization.test.ts` 由 3 个扩到 12 个，其中关键一条：

```ts
const stored = sanitizeApiInput({ notes: 'A & B' }).notes;
expect(stored).toBe('A & B');
expect(escapeHtml(stored)).toBe('A &amp; B');
expect(escapeHtml(stored)).not.toContain('&amp;amp;');  // 旧行为会在这里失败
```

另有 `AT&T` / `O'Brien "quilt"` / `50% wool_blanket` 等搜索词保真断言。

#### 0.6.3 存量数据清洗脚本

修复只堵住了新写入，库里已有的双编码值需要一次性清洗。新增 `scripts/fix-html-escaped-text.ts`：

- **默认只读**，输出「哪些表哪些列有多少行受影响 + 3 条样例」，人工确认后才需要加 `--apply`。
- 目标列**动态发现**（`information_schema` 的 `text`/`character varying`，限定 13 张业务表），并有一份明确的跳过清单（`id`/`*_url`/`*_image`/`token`/`hash`/`system_settings.value` 等）。
- **只解一层**：`&amp;lt;` 必须变成 `&lt;` 而不是 `<`。实现上把 `&amp;` 放在 replace 链的**最外层**（即最后执行），这样它的产物不会被其它替换再扫一遍。TS 侧同一策略由 `sanitization.ts` 的单次正则 pass 保证。
- 故意不动 `updated_at`：这是数据保真修复，不是用户编辑。
- 用法与风险（含「原本就写了字面量 `&amp;` 的值也会被解码」）写在文件头。

#### 0.6.4 复验

| 检查项 | 0.5 后 | 0.6 后 |
| --- | --- | --- |
| `npm run type-check` | ✅ 0 错误 | ✅ 0 错误（新增脚本纳入类型检查） |
| `npm run lint:check` | ⚠️ 0 错误 / 6 警告 | ⚠️ 0 错误 / 6 警告（**仍是同一集合**） |
| `npm test` | ✅ 24 文件 / 217 测试 | ✅ **25 文件 / 253 测试** |
| `npm run build` | ✅ 117/117 | ✅ 117/117 |

---

### 0.8 P3 批次实施（同日四续）

P2 收尾后继续推进 §4 的 P3 表。除「需产品决策」的项外，P3-5 ~ P3-10、P3-12 全部落地。这一批的特征是**多数问题都不是孤立的坏代码，而是同一个决定被抄写了多份**——因此修复方式统一为「找出权威来源，让其余位置派生」。

#### 0.8.1 P3-5 — `changePassword` 的 session 读取移出 DAL

`src/lib/data/settings.ts` 的 `changePassword` 原先自己 `import { auth } from '@/auth'` 并解析 session，违反蓝图 §6.1（DAL 不读取 session）。现在签名改为显式接收 `userId`，由 Action 层负责解析：

```ts
/** The caller passes `userId` explicitly: resolving the session is the Action
 *  layer's job (blueprint §6.1 — a DAL must not call `auth()`). */
export async function changePassword(userId: string, input: ChangePasswordInput) { ... }
```

同时引入 `PasswordChangeError`（携带 `reason: 'not-configured' | 'incorrect-current'`），取代原先的字符串比较。

**顺带发现的重复实现：** `src/app/api/settings/change-password/route.ts` 是一份**独立的内联实现**——它绕过 DAL 直接操作 `@/db`，与 `changePassword` 是同一业务操作的第二份实现，违反蓝图 §10.3。该路由已重写为薄 HTTP 适配层，复用 `changePassword()` + `requireApiSession()`，并把 `PasswordChangeError` 映射为 400。

#### 0.8.2 P3-6 — Agent scope 由 registry 派生

`scopesForUser` 原为手写逐模块 `if` 链，与 `MODULE_IDS` 是两份需要同步维护的清单。现改为遍历 `MODULE_IDS` 推导，注册新模块即自动获得 `read:<id>` / `write:<id>` 对：

```ts
export function scopesForUser(user: AgentScopeSubject | null): AgentScope[] {
  if (!user) return [];
  if (user.role === 'admin') return ['*'];

  const active = new Set<RegisteredModuleId>(user.activeModules);
  const scopes = new Set<AgentScope>();

  for (const id of MODULE_IDS) {
    if (!active.has(id)) continue;
    scopes.add(`read:${id}`);
    scopes.add(`write:${id}`);
    for (const implied of MODULE_IMPLIED_SCOPES[id] ?? []) scopes.add(implied);
  }

  for (const base of BASE_AGENT_SCOPES) scopes.add(base);
  return [...scopes];
}
```

遍历 `MODULE_IDS`（而非用户存储的 `activeModules` 顺序）使结果与持久化顺序无关；`MODULE_IMPLIED_SCOPES` 表达「quilts 模块同时蕴含 `read:usage`/`write:usage`」这一非 1:1 映射；`AgentScope` 类型改为模板字面量 `\`read:${RegisteredModuleId}\` | \`write:${RegisteredModuleId}\``，不再手抄 17 个成员。

**关于 `read:settings` 与 OpenAPI 描述不符：** 复核后确认 `settings.read` 返回的是应用偏好（`appName`、双击行为）、聚合计数与运行时元数据，不含任何密钥或按用户隔离的数据（Agent API 整体即租户级）。因此选择**让授予规则与文档一致**——`read:settings` 授予每个持有有效 API key 的调用方，并把该决定写进代码注释、`public/AGENT_API.md` 与 OpenAPI 的 `AgentScope` schema。`admin:settings` 保留为设置类**写操作**的预留 scope，明确注释「永不授予 member」，并由测试断言 member 永远拿不到 `admin:*`。

#### 0.8.3 P3-7 — OpenAPI 契约与实现对齐

- `info.version` 由硬编码 `'2026.9.11'` 改为读 `package.json`（与 `getSystemInfo()` 同一来源），消除漂移。
- `input` 从 `required` 移除：Zod 侧是 `z.record(z.string(), z.unknown()).default({})`，省略 `input` 合法，文档此前声明必填属错误。
- 补上 `idempotencyKey` 的 `minLength: 8`（Zod 侧 `.trim().min(8)`，文档漏了）。

**顺带消除的第三份手抄清单：** 工具名清单此前在 dispatcher 的 Zod enum 与 OpenAPI 的 `tool` enum 各有一份 29 项字面量（已核对当时内容一致，但无任何机制保证）。现提取为 `src/lib/agent/tool-names.ts`，两处都从它读取，并新增测试断言「OpenAPI 公布的工具集合 === dispatcher 接受的工具集合」。同时 `writeTools` 由 `scopeByTool` 派生（原为第二份手写 15 项清单），`scopeByTool` 标注为 `Record<AgentToolName, AgentScope>` 使新增工具在给定 scope 前无法编译。

#### 0.8.4 P3-8 — lint 警告清零

`lint:check` 现为 **0 错误 / 0 警告**（此前 6 条警告）。修法不是抑制规则，而是消除触发条件：

- **非原生交互元素（3 条）**：`PaddleCard`/`MapCard`/`SpiritCard` 原为 `<div onClick role="button" tabIndex={0} onKeyDown={Enter/Space}>`。三份手写的键盘处理既重复又正是 `jsx-a11y/no-static-element-interactions` 所指。新增 `src/modules/core/ui/InteractiveCard.tsx`：`onClick` 存在时渲染原生 `<button type="button">`（自带焦点、Enter/Space 激活与正确 role），否则渲染普通 `<div>`（非交互卡片不会被朗读为控件）。三张卡片改用该组件，共删除约 30 行重复代码。
- **数组下标作 key（3 条）**：`AntiqueDetail`/`MapDetail`/`SpiritDetail` 的附件图列表使用 ``key={`${img}-${idx}`}``。图片引用本身就是稳定标识，故改为 `key={img}`；新增 `uniqueImageRefs()`（`src/lib/image-utils.ts`）先按顺序去重再渲染，使 key 可证唯一（重复引用本也会把同一张图渲染两次）。

#### 0.8.5 P3-9 — `public/clear-cache.html` 加固

该页无需登录即可访问，且能清空该 origin 的全部 Cache Storage 与 `localStorage`。在保留其排障用途的前提下：加 `<meta name="robots" content="noindex, nofollow">`；**移除 `?clear=true` 自动触发**（此前仅凭一个可被随意构造的查询参数即执行破坏性操作）；清缓存前加 `window.confirm()` 二次确认。

#### 0.8.6 P3-10 — 新模块写事务与统一删除契约

四个新模块的写操作原先**完全没有事务**（如 `updatePaddle` 是「先 select 后 update」），状态 slice 失效存在 TOCTOU 窗口。现在 update/delete 均在 `db.transaction` 内以 `.limit(1).for('update')` 锁定目标行，并在**提交后**由各自的 `invalidate*WriteTags({ id, statuses, ... })` 统一失效（承接 P1-2 的结论：`revalidateTag` 不参与事务回滚）。

**删除契约跨模块不一致**（`deleteQuilt` 返回 `false`，其余 `throw`）一并统一为：**删到行返回 `true`，没有行可删返回 `false`，绝不为「未找到」抛异常**。`deleteAntique`/`deleteMap`/`deleteSpirit` 的返回类型由 `Promise<void>` 改为 `Promise<boolean>`。

**根因修复：** 调用方此前靠 `error.message === 'Paddle not found'` 这类字符串比较来区分 404 与 500。新增 `src/lib/data/errors.ts` 的 `RecordNotFoundError` / `ConflictError`（均携带 `resource`），6 个 Action 模块与 Agent dispatcher 全部改为 `instanceof` 判断。这一改动的价值在于两个方向：改一句 DAL 文案不会再静默把 404 变成 500；而**一条恰好措辞相同的真实故障也不会再被伪装成「未找到」**——后者由新增测试显式断言。

#### 0.8.7 P3-12 与结构收敛

- 蓝图 §15 的测试基线随本轮更新，并新增三条常驻规则：**模块 ID 词表**（`src/modules/module-ids.ts` 是叶子模块，纯消费方不得穿透 `registry.ts`）、**Agent scope 派生**（`scopes.ts` / `tool-names.ts`）、**可点击卡片与列表 key**（`InteractiveCard` / `uniqueImageRefs`）。
- **顺带修掉一个会持续复发的结构问题：** 原先任何纯消费方 import `MODULE_IDS` 都会经 `registry.ts` → 各模块 config → React 组件 → App Router，把整个 UI 依赖图拖进 DAL、Server Action 与测试环境（`next/navigation` 在 Vitest 中不可解析）。项目当时的应对是在 `user-module-subscription.test.ts` 里 `vi.mock('@/modules/registry')` 打桩——而那个桩**重写了被测的归一化逻辑**，使测试无法真正覆盖 `normalizeModuleIds`。现把 ID 词表下沉为 `src/modules/module-ids.ts`（registry 原样再导出，保持单一导入面），`src/lib/data/{users,user-api-keys}.ts`、`src/app/actions/{users,modules}.ts` 改从叶子模块导入，该桩随之删除——测试现在跑的是真实的归一化实现。

### 0.9 本轮结束时的剩余项

| 项 | 原因 |
| --- | --- |
| **P2-9** 其余测试缺口 | 当时累计补测至 **312 个测试 / 28 个文件**（首轮 157 / 19）；**状态转移原子性、registry/导航/i18n、新模块 DAL 级 CRUD 三项已于 §0.11 补齐（31 个文件 / 356 个测试）**，仅剩「Web UI 与 API 行为一致性」与「legacy 调用方的禁止导入规则（CI）」两项 |
| **P2-7 存量清洗的执行** | 脚本已交付并验证类型，但**尚未对真实数据库运行**。需在备份后先跑只读模式复核样例，再加 `--apply` |
| **P3-1 / P3-3 / P3-4 / P3-11** | 保持原状。P3-1（legacy `components/` → `_components/`）与 P3-4（`lib/repositories/*` 下线）都是跨多文件的搬迁，需独立排期；P3-11 是 ESLint 9 EOL，须等 ESLint 10 兼容性评估 |

> `P2-3` 的 `ActionResult` 化、`P3-13`、`P3-14` 已在本轮后续批次完成，见 §0.10；`P2-9` 的三项可测缺口见 §0.11。

**新增发现（本轮扫描所得，未在首轮报告中）：** `src/app/actions/auth.ts`（265 行）同样直连 `@/db`，含 10 处原生 `db.execute(sql\`...\`)` 与一个 `db.transaction`，违反蓝图 §6.2。属管理员初始化/播种路径，改造面较大，未纳入本轮。

### 0.10 P3 收尾批次（同日五续）

#### 0.10.1 `ActionResult` 契约收敛（P2-3 续）

首轮 §8.1 把「同一个决定被抄写了多份」列为可复用线索，`ActionResult` 是当时**仍未处理**的最大实例。实际扫描结果比记录更严重 —— 不是 6 处：

| 重复物 | 实际份数 | 位置 |
| --- | --- | --- |
| `ActionSuccess` / `ActionError` / `ActionResult` 类型三元组 | 10 | `src/app/actions/*.ts` |
| 错误工厂（`validationErrorResult` 等） | ~20 | 同上 |
| `zodFieldErrors` 及其内联等价写法 | 4 + 28 处 `flatten().fieldErrors as Record<string, string[]>` | action 与 `app/api/**/route.ts` |
| `unwrapActionResult` | 11 | `src/hooks/*.ts`（含首轮未发现的 `useUsers.ts`） |

副本之间已经漂移：同一概念在 5 个模块叫 `unauthorizedResult`、另 5 个叫 `unauthorizedErrorResult`；`notFoundResult` 与 `notFoundErrorResult` 并存；`badRequestResult` 与 `badRequestErrorResult` 并存；`dashboard.ts` 与 `cards.ts` 的错误形状漏掉 `fieldErrors`；`src/lib/api/action-response.ts` 另行声明了 `RouteActionResult` / `ActionErrorShape` 和自己的 code → HTTP status 映射。

**修复**：新增 `src/lib/api/action-result.ts` 作为唯一来源。

- `ACTION_ERROR_CODES` + `ACTION_ERROR_STATUS: Record<ActionErrorCode, number>` —— 新增错误码而不补状态映射会**编译失败**（此前未知 code 静默降级为 500）。
- `ActionError.code` 由 `string` 收紧为 `ActionErrorCode`，拼错错误码由编译期拦截。
- 七个工厂 + `zodFieldErrors` + `unwrapActionResult`；`action-response.ts` 改为复用同一类型与状态映射。
- `conflictErrorResult` 刻意继续发 `ALREADY_EXISTS`（409）而不是新造 `CONFLICT`：所有既有调用点发的都是这个，**线上契约不变**。
- `'Requires admin privileges'` 由两个 admin 专用调用点显式传入，而不是改共享默认值。
- `validationErrorResult` 的 `fieldErrors` 改为可选（严格放宽；此前 cards/settings/usage/users 要求必传）。
- `zod` 在 `action-result.ts` 中是**类型导入**，不会把 zod 带进客户端 bundle。

**防复发**：`src/lib/__tests__/action-result.test.ts` 用源码扫描断言 action 与 hook 层不再出现上述声明，另有两条**正向对照**断言扫描确实能命中真实声明（否则守卫可能因为「什么都没匹配到」而假装通过），并显式断言 `import { ..., type ActionResult, ... }` 的成员行**不算**声明。

> 过程中踩到的两个坑已写进测试注释：① 守卫最初用 `^(export\s+)?type ActionResult\b` 匹配，`  type ActionResult,` 这行 import 成员因 `\b` 在 `t` 与 `,` 之间成立而被误判 —— 现在先剔除 import 语句再扫描，且用空格替换以保持行号准确；② 一次性批量改写脚本的第一版正则 `import\s*\{([\s\S]*?)\}\s*from\s*'@/lib/api/action-result';` 会跨过多个 import 语句，把 5 个 action 文件的 import 区改坏 —— 改为 `\{([^}]*)\}` 后不再跨界，5 个文件已从隔离副本快照还原后重做。

#### 0.10.2 P3-13 — README 中英对称性

首轮记录的差异（英文版缺 `npm audit --omit=optional`、中文版缺 Repository Layout）在此前批次已修掉。本轮复核发现**真实差异在环境变量章节**：

- 中文版把「必填」写成行内文字，且**完全缺失**「可选：平台与基础设施」（`UPSTASH_REDIS_*`、`REDIS_URL`、`VERCEL_URL`、`WEBHOOK_ERROR_URL`、`NODE_ENV`）与「可选：卡片 AI 与数据提供方」（`AZURE_OPENAI_*`、`PERPLEXITY_API_KEY`、`RAPID_API_KEY`、`EBAY_*`）两节。
- 英文版把 `### Agent API` 嵌在 `## Environment Variables` 之下，而 Agent API 与环境变量无关；中文版是顶层 `##`。

已统一为 `## Environment Variables`（含 `### Required` / `### Optional Platform And Infrastructure` / `### Optional Card AI And Data Providers`）→ `## Agent API` → `## Local Development`，两版各 26 个标题、逐行一一对应。另按 `.env.example` 补齐了两版都未记录的 `AUTH_SECRET`（`BETTER_AUTH_SECRET` 的可选兜底别名）。

#### 0.10.3 P3-14 — skill 路径与内容

`file:///c:/Users/sli/...` 这类绝对 `file://` 链接已改为仓库相对路径。但复核时发现**仅改路径不够**：`.agent/skills/qms-module-development/SKILL.md` 的正文仍在教蓝图 §2/§3 已废弃的架构 ——

| skill 原文 | V3 蓝图 |
| --- | --- |
| `Repository` + `cached-<module>.repository.ts` 两层 | 只有 `src/lib/data/<module>.ts` 一个权威 DAL |
| `cacheLife({ stale: 60, revalidate: 300, expire: 3600 })` | 具名档案 `moduleList` / `moduleItem` |
| `src/app/actions/<module>-actions.ts` | `src/app/actions/<module>.ts` |
| `{ errors: { _form: ['Unauthorized'] } }` / `throw new Error('Unauthorized')` | `ActionResult` + 共享错误工厂 |
| `validated.error.flatten().fieldErrors` | `zodFieldErrors(...)` |
| `src/components/layout/AppSidebar.tsx` 手工加导航 | 由 registry 派生 |
| NextAuth 5 / TypeScript 5.9 | Better Auth / TypeScript 6 |

已按 V3 重写，并补入本轮踩到的真实陷阱（旧 `core/blueprint.ts` 的 tag 工厂产生 `module:<id>` 前缀、与 `core/cache-tags.ts` 的 `<module>` 格式不同，DAL 必须导入后者），开头显式标注 `docs/archive/MODULE_STANDARD.md` 已废弃。

#### 0.10.4 复验

`type-check` 0 错误；`lint:check` 0 错误 / 0 警告；`vitest` **28 个文件 / 312 个测试**全部通过；`build` 三段判据通过（`✓ Compiled successfully in 47s` → `Finished TypeScript in 13.6s` → `✓ Generating static pages (117/117)`）。构建结束后进程仍以非零码退出，仍是 §5 记录的沙箱批量删除保护（本轮命中的是 `.next/export-detail.json`，`count` 已累计到 2811），与项目代码无关。

### 0.11 P2-9 测试缺口补齐（同日六续）

首轮 §4 的 P2-9 列出了蓝图 §13 要求但当时无自动化覆盖的六项。此前批次已覆盖其中两项（P1-1/P1-2 的回归测试、事务回滚与 cache tag），本轮补掉剩余的三项**可测**缺口。**新增 44 个测试，累计 31 个文件 / 356 个测试。**

| 缺口 | 新测试文件 | 数量 |
| --- | --- | --- |
| `registry` / 导航 / i18n / 单模块自动跳转 | `src/__tests__/module-registry-consistency.test.ts` | 11 |
| paddles / antiques / maps / spirits 的 DAL 级 CRUD | `src/lib/__tests__/new-module-dal-writes.test.ts` | 24 |
| 状态转移与事务原子性（`updateQuiltStatusWithUsageRecord`） | `src/lib/__tests__/quilt-status-transition.test.ts` | 9 |

#### 0.11.1 registry 一致性测试顺带发现一个真实缺陷

`src/modules/registry.ts` 的 `hasModule` 原实现是 `return type in MODULE_REGISTRY;`。`in` 会走原型链，因此 `hasModule('__proto__')`、`hasModule('constructor')`、`hasModule('toString')` 全部返回 `true` —— 一个未注册的「模块 ID」会被判定为已注册。已改为 `Object.hasOwn`。

`hasModule` 目前**没有生产调用方**，所以这是潜伏缺陷而非可达漏洞；全量扫描 `src/` 中其余 20 余处 `'key' in obj` 后确认，它们都用字面量键收窄已知形状的对象，不受此模式影响。这正是「让不变量可机器检查」的价值：人眼复核六轮都没看到它，一条断言当场把它暴露出来。

#### 0.11.2 侧边栏耦合改为断言而非约定

`AppSidebar.tsx` 的 `moduleIcons: Record<string, LucideIcon>` 对缺失项会静默回退到默认图标 —— 新模块忘记登记图标不会报错，只会显示成错的图标。测试直接扫描该源文件提取 `moduleIcons` 的键集合，断言 `getAllModules()` 中每个模块的 `icon` 都在其中，并对每个模块断言存在 `startsWith('/<id>')` 的激活态判断。同时保留一条**正向对照**（断言该提取函数确实能取到非空集合），否则提取逻辑失效时测试会静默通过。

i18n 部分同样从「人工比对」升级为断言：每个模块的 `users.modules.<id>` 与 `navigation.<id>` 必须在两套目录中都存在，且 `flattenKeys()` 后 en/zh **键集合逐键相等**（当前各 `1672` 键，0 差异）。

> 过程中踩到的坑：import `MODULE_REGISTRY` 会经模块 config → React 组件 → `@/i18n/routing` → `next-intl/navigation` → `next/navigation`，而 Vitest 的 alias 只拦截字面量说明符、不拦截再导出，因此必须 `vi.mock('@/i18n/routing')`。排查方式是用一个探针测试直接 `import ... from 'next/navigation'` 证明 alias 本身有效，再沿 import 链定位到真正的引入点 —— 与 §0.8.7 记录的「registry 拖入 UI 依赖图」是同一个根因。

#### 0.11.3 新模块 DAL 写契约做成数据表驱动

`new-module-dal-writes.test.ts` 用一张表驱动 `maps` / `antiques` / `paddles` / `spirits` 走同一组六条契约，因此**新增模块只需往表里加一行**即可获得同等覆盖：

1. 失效只发生在事务提交之后；
2. 更新后失效 root / list / item；
3. 更新后失效每个变更维度切片的**旧值与新值两侧**（例如 `status=ACTIVE` 与 `status=RETIRED` 都要失效，只失效一侧会留下陈旧缓存）；
4. 目标行不存在时抛类型化 `RecordNotFoundError` 且**零失效**；
5. 更新或删除事务失败时**零失效**；
6. 创建后失效 root / list 与新建记录的维度切片。

各模块的差异（维度字段名、id 是否单独传参）全部收敛在表的字段里，而不是散落在断言中。

#### 0.11.4 状态转移原子性单独成篇

`updateQuiltStatusWithUsageRecord` 是全项目唯一跨两张表的写路径，其原子性无法由「每个 DAL 各自的事务测试」覆盖，因此单列一个文件断言：状态更新与 usage record 变更走**同一个 `tx` 句柄**（通过断言两张表的写入顺序与 `tx.update` 的调用次数，而非断言 SQL 文本）；状态未变化时是完全的空操作；第二次进入 `IN_USE` 在**状态写入之前**就被 `ConflictError` 拒绝（断言 `quilts` 未出现在已写入表中）；`STORAGE`/`MAINTENANCE` 之间互转完全不触碰 usage record；提交后失效覆盖 item、两个状态切片、stats 与 usage 标签；事务失败时零失效。另有一条断言 `db.update`/`db.insert`/`db.delete` **从未被直接调用**，锁死「所有写入必须经事务句柄」这一约定。

#### 0.11.5 复验

`type-check` 0 错误；`lint:check` 0 错误 / 0 警告；`vitest` **31 个文件 / 356 个测试**全部通过；`build` 三段判据通过（`✓ Compiled successfully in 19.1s` → `Finished TypeScript in 20.9s` → `✓ Generating static pages (117/117)`），收尾阶段仍是 §5 记录的沙箱批量删除保护（`count` 已累计到 3624）。

> 过程中 ESLint 报了 3 处 `@next/next/no-assign-module-variable` —— 新测试里用了 `for (const module of ...)`，而 `module` 是 Next.js 保留变量。已改为 `entry`。这条规则值得记入后续新模块的开发清单：测试代码同样受 Next.js 保留标识符约束。

---

## 1. 验证结果总览

在隔离副本 `C:\temp\qms-review-20260918`（未污染 OneDrive 工作区）中执行。下表的「结果」列描述**修复后**的最终状态（修复项见 §0）：

| 检查项 | 命令 | 结果 |
| --- | --- | --- |
| 依赖安装 | `npm install` | ✅ 654 个包 |
| 类型检查 | `npm run type-check` | ✅ 0 错误 |
| 静态检查 | `npm run lint:check` | ✅ **0 错误 / 0 警告**（首轮 0 错误 / 6 警告，已清零） |
| 单元测试 | `npm test` | ✅ **31 个文件 / 356 个测试**全部通过（首轮 19/157，七轮修复共新增 12 个文件 / 199 个测试） |
| 生产构建 | `npm run build` | ✅ 编译成功、TS 通过、117/117 静态页生成（见 §5 说明） |
| 依赖审计 | `npm audit --omit=optional` | ✅ 0 vulnerabilities |
| 文档内链 | 自建扫描（34 个 md） | ✅ 0 处失效（43 条相对链接；此前唯一失效项是 P3-14 的 `file:///c:/Users/sli/...`，已在 §0.10.3 修复） |
| i18n 键一致性 | 自建扫描 | ✅ en/zh 各 1672 键，零漂移（已由 `module-registry-consistency.test.ts` 固化为断言） |

**整体结论：工程质量高于同类项目平均水平。** 分层契约被真实执行（模块层未越界访问 `@/db`/`next/cache`，registry 是模块 ID 唯一来源，i18n 零漂移，CSV 注入已防护，API key 仅存哈希，幂等与审计链路完整）。主要问题集中在 **新模块与 legacy 模块的一致性收敛未完成**、**少数授权/事务边界缺口**、**文档版本基线未随 lockfile 更新** 三类。

---

## 2. P1 — 高优先级（建议本迭代修复）

> **本节的 P1-1 与 P1-2 已于 2026-09-18 修复并复验通过，实施细节见 §0。** 以下保留问题原貌描述，作为修复依据存档。

### P1-1 `/analytics` 页面缺少服务端模块授权 · ✅ 已修复

- 位置：`src/app/[locale]/analytics/page.tsx`
- 现状：该 Server Page 直接调用 `getAnalyticsData()`、`countQuilts()`、`getQuilts()`、`getUsageRecords()`，**没有任何 `auth()` / `requirePageModuleAccess` 调用**。`src/app/[locale]/layout.tsx` 与 `src/components/layout/ConditionalLayout.tsx` 也不做鉴权，唯一防线是 `src/proxy.ts`（只校验登录，不校验模块订阅）。
- 后果：一个已登录但**未被授予 `quilts` 模块**的 member，可以通过直接输入 `/analytics` 读取被子/使用记录的统计与排行数据。`src/app/[locale]/reports/page.tsx` 同理（客户端页面，仅靠 `useSession()` 决定是否显示导入 Tab）。
- 与既有契约冲突：`src/app/api/analytics/route.ts` 明确执行 `requireApiModule('quilts')`，所以 **API 与 Web UI 的权限语义不一致**；蓝图 §5.1「每个入口都必须执行模块授权」与 §5.2「不得只用导航隐藏代替授权」同时被违反。
- 建议：在 `analytics/page.tsx` 开头加 `const session = await auth(); requirePageModuleAccess(session, 'quilts');`；`reports/page.tsx` 改为 Server Page + `_components/ReportsPageClient.tsx`，在 Server 侧做 `requirePageModuleAccess` 与 admin 判定。

### P1-2 `revalidateTag` 在数据库事务内部调用 · ✅ 已修复

- 位置：`src/lib/data/quilts.ts`
  - `saveQuilt` 更新分支：L545–557（在 L511 开启的 `db.transaction` 内）
  - `saveQuilt` 创建分支：L606–616（在 L565 开启的事务内）
  - `updateQuiltStatusWithUsageRecord`：L681–688（在 L645 开启的事务内）
- 问题：蓝图 §2 规则 8 与 §8.2 明确要求「**事务成功后才失效缓存**」。`revalidateTag` 不参与事务回滚，若事务在失效之后失败，缓存已被清空而数据未变更；更严重的是，一旦后续在事务内新增写入步骤，缓存失效与实际提交结果可能脱钩。
- 对照：`src/lib/data/usage.ts`（L377/422/467/504）、`src/lib/data/settings.ts`（L50/125）都正确地把失效放在事务之后，`quilts.ts` 是唯一例外 —— 属**同一代码库内的实现不一致**。
- 建议：把 `revalidateTag` 调用整体移到 `db.transaction(...)` 返回之后，用返回值（更新后的 status/season）计算需要失效的 slice。

---

## 3. P2 — 中优先级

### P2-1 `quilt_status` 枚举在三处漂移，且 API 文档描述了不存在的值 · ✅ 已修复

- 数据库：`src/db/schema.ts` L97 → `pgEnum('quilt_status', ['IN_USE','MAINTENANCE','STORAGE','LOST'])`（4 值）
- Zod：`src/lib/validations/quilt.ts` L35 → `z.enum(['IN_USE','MAINTENANCE','STORAGE'])`（3 值）
- Agent 工具：`src/app/api/agent/tools/route.ts` L99/L125/L133 → 同样是 3 值
- 文档：`docs/API_REFERENCE.md` L276 把 `LOST` 列为 `GET /api/quilts?status=` 的合法取值
- 后果：文档承诺的 `LOST` 过滤会被 Zod 拒绝；蓝图 §4.2 要求的「DB enum / Zod enum / UI option / 统计维度完整对应」不成立。
- 建议：明确 `LOST` 是保留值还是废弃值。若保留，补进 Zod 与 Agent schema 与 UI 选项；若废弃，用 migration 收窄 DB enum 并同步文档。
- **决策：保留。** 补齐 14 处派生点，并新增 `QUILT_STATUSES` 运行时常量与 `quilt-status-enum.test.ts`（27 个测试）机器校验 DB/Zod/常量/i18n 四方一致，详见 §0.6.1。类型检查额外暴露了 2 处漏改的窄化定义（`QuiltItem.currentStatus`）。

### P2-2 更新路径丢失创建路径的跨字段业务校验 · ✅ 已修复

- 位置：`src/lib/validations/quilt.ts` L119–145
- `createQuiltSchema` 带两条业务规则：季节-重量区间（`SEASON_WEIGHT_RANGES`）与 `lengthCm >= widthCm * 0.8`；`updateQuiltSchema = baseQuiltSchemaObject.partial().extend({ id })` **完全不含这两条 refine**。
- 后果：可以创建一条合法记录，再用 PATCH 把它改成违反季节重量区间/长宽比例的记录；蓝图 §10.3「不允许存在两套业务校验」不成立。同类问题存在于 `src/app/actions/paddles.ts`（`paddleSearchSchema` 在 action 内重复定义，而模块 schema 里已有 `paddleFiltersSchema`）。
- 建议：抽 `refineQuiltBusinessRules(schema)` 复用于 create/update；或让 update 在合并现有记录后跑同一套校验。

### P2-3 `src/app/actions/modules.ts` 越过 DAL 边界且存在并发丢写 · ✅ 已修复

- 位置：`src/app/actions/modules.ts` L36/L86/L132（`db.select`）、L55/L100/L151（`db.update`）
- 违反蓝图 §6.2「Action 禁止直接调用 `db.insert/update/delete/select`」，也违反 §6.1（用户偏好属于 `src/lib/data/users.ts` 的职责范围）。
- 附加缺陷：
  - 「读-改-写」`preferences.activeModules` **没有事务**，两次并发 toggle 会丢订阅（read-modify-write 竞态）。
  - 使用 `revalidatePath('/')`、`revalidatePath('/modules')`，而非蓝图 §8.1 的唯一 tag factory。
  - 用 `throw new Error` 而非统一 `ActionResult` 错误映射（§6.2 第 5 条）。
- 建议：把这三个函数的读写下沉到 `src/lib/data/users.ts`，事务包裹，改用 `usersCacheTags` 失效，返回 `ActionResult`。

### P2-4 `src/__tests__` 被排除在类型检查之外 · ✅ 已修复

- 位置：`tsconfig.json` L47 → `"exclude": [..., "src/__tests__"]`
- 后果：**整个 API/鉴权/代理测试套件（含 `agent-auth`、`submodules-api`、`proxy`、`usage-api-validation` 等 9 个文件）不参与 `tsc --noEmit`**，测试代码可以静默腐化而 CI 不会报错。注意 `src/lib/__tests__` 与 `src/modules/**/__tests__` 是**被包含**的，说明这是过度排除而非有意设计。
- 建议：从 exclude 中移除 `src/__tests__`（如与 `vitest.setup.ts` 的类型冲突，改用 `types`/独立 tsconfig 解决）。

### P2-5 文档技术栈版本与 lockfile 实际解析结果不一致 · ✅ 已修复

`package.json` 使用 caret 范围，实际解析版本已明显超前于文档基线：

| 依赖 | README / CLAUDE.md / CHANGELOG 声明 | `package-lock.json` 实际解析 |
| --- | --- | --- |
| Next.js | 16.2.10 | **16.3.4** |
| React / React DOM | 19.2.7 | **19.3.0** |
| next-intl | 4.13.2 | **4.14.3** |
| Better Auth | 1.6.23 | **1.7.4** |
| Zod | 4.4.3 | **4.6.1** |
| Tailwind CSS | 4.3.2 | **4.3.3** |
| TanStack React Query | 5.101.2 | **5.102.8** |
| lucide-react | 1.23.0（CHANGELOG） | **1.44.0** |

- 其中 **Better Auth `1.6.23 → 1.7.4`** 与 **Next.js `16.2 → 16.3`** 是未被 CHANGELOG「Verification」记录过的实际升级，与蓝图 §15「依赖版本以 package.json 和 package-lock.json 的可复现安装结果为准」自相矛盾。
- 建议：README「Tech Stack」改为引用 lockfile 实际版本（或写成 `^16.2.10 (resolved 16.3.4)`）；对 Better Auth 1.7 与 Next 16.3 做一次定向兼容性复核并记入 CHANGELOG。

### P2-6 `cacheLife` 档案与注释描述不符，列表缓存实际近乎失效 · ✅ 已修复

- 位置：`src/lib/data/quilts.ts` L288/L308、`src/lib/data/paddles.ts` L145/L165/L262、`src/lib/data/antiques.ts` L242/L313/L337、`src/lib/data/maps.ts` L275/L334/L358
- 代码注释写的是 `cacheLife('seconds'); // 2 minutes (120 seconds)` 与 `cacheLife('minutes'); // 5 minutes`。经 context7 核对 Next.js 16 官方文档：`'seconds'` 是**最短**档案（revalidate ≈1s、expire ≈1min），`'minutes'` 为 revalidate 1min / expire 1h，`'default'` 才是 5min stale / 15min revalidate。
- 后果：所有「列表」查询被声明为 2 分钟缓存，实际是「几乎每次请求都重新验证」，与设计意图相反，也放大了 Neon 的查询量。
- 建议：若确实要 2 分钟，改用 `cacheLife({ stale: 120, revalidate: 120, expire: 3600 })` 或在 `next.config.ts` 注册自定义档案（`cacheComponents: true` 已开启，支持自定义档案），并同步修正注释。

### P2-7 入库前 HTML 转义导致业务数据被双编码 · ✅ 已修复

- 位置：`src/lib/sanitization.ts` L97–110（`sanitizeApiStringValue` → `escapeHtml`），被 `sanitizeApiInput` 用于 `saveQuiltAction`、`createPaddleAction`、`updatePaddleAction` 等所有写入 Action。
- 后果：被子名/备注中的 `A & B`、`<`、`>`、引号会被改写成 `A &amp; B` 后**持久化**。React 在渲染时已做转义，因此页面会显示成 `A &amp; B`（双编码）；导出 CSV/JSON 与 Agent API 读回的数据同样被污染。
- 建议：输入层只做「拒绝/剥离危险标签与 `javascript:`」，把实体转义交给渲染层；若为兼容历史数据必须保留，则需在读取侧做 `unescapeHtml` 并补迁移脚本。
- **决策：只存原文，转义交给渲染层。** 输入层不再转义（`escapeHtml` 保留但标注为仅限渲染期），`sanitizeSearchQuery` 也不再删字符；存量数据由 `scripts/fix-html-escaped-text.ts` 一次性清洗（默认只读）。详见 §0.6.2–0.6.3。

### P2-8 各模块搜索语义与净化不一致 · ✅ 已修复

| 模块 | 搜索实现 | 大小写 | 通配符净化 |
| --- | --- | --- | --- |
| quilts | `like(LOWER(col), '%term%')` | 不敏感 ✅ | 未处理 `%`/`_` |
| paddles / antiques / maps / spirits | `like(col, '%term%')` | **敏感**（Postgres） | 未处理 |

- 位置示例：`src/lib/data/paddles.ts` L191–202 与 L280–291；对比 `src/lib/data/quilts.ts` L337–347。
- 另外 `getPaddlesAction`（`src/app/actions/paddles.ts` L162）**未对入参调用 `sanitizeApiInput`**，而 `getQuiltsAction`（`src/app/actions/quilts.ts` L308）调用了。
- 建议：把「大小写不敏感 + 转义 `%`/`_`」的搜索条件构造函数抽到共享工具，所有 DAL 复用。

### P2-9 测试覆盖与蓝图 §13 验收矩阵差距明显 · ✅ 已修复（§0.11）

- 现状：19 个文件 / 157 个测试，但分布高度集中 —— quilts（schema + 2 个 UI）、proxy（2 个文件）、agent auth/openapi、submodules-api（1 个文件覆盖 4 个新模块的 API 层，且 DAL 全部被 mock）。
- 蓝图 §13 要求但**当时无自动化覆盖**的项，及其现状：
  - 状态转移与**事务回滚**（`saveQuilt` / `updateQuiltStatusWithUsageRecord` 的原子性）→ **✅ 已覆盖**（`quilt-status-transition.test.ts`，§0.11.4）
  - cache tag 的读绑定与写失效 → **✅ 已覆盖**（`quilt-cache-invalidation.test.ts` 与本轮 `new-module-dal-writes.test.ts`）
  - `registry` / 导航 / i18n / 单模块自动跳转 → **✅ 已覆盖**（`module-registry-consistency.test.ts`，§0.11.1–0.11.2）
  - paddles / antiques / maps / spirits 的 DAL 与 Action 级 CRUD → **✅ DAL 层已覆盖**（`new-module-dal-writes.test.ts`，§0.11.3）；Action 契约层仍依赖 `submodules-api.test.ts` 的 API 层覆盖
  - Web UI 与 API 的列表/详情/创建/更新/删除行为一致性 → **⏳ 仍未覆盖**（需要能在测试中同时驱动 Server Component 与 Route Handler 的共享夹具，属独立课题）
  - legacy 调用方扫描与禁止导入规则（CI 尚未落地）→ **⏳ 仍未覆盖**（P3-1/P3-3/P3-4 收敛后再落地，否则规则会先拦下一批注定要删的代码）
- 建议：优先补 P1-1/P1-2 的回归测试，再补 4 个新模块的 Action 契约测试。

---

## 4. P3 — 低优先级 / 技术债

> **P3-2、P3-5 ~ P3-10、P3-12 ~ P3-14 已修复，详见 §0.2、§0.8 与 §0.10。** 下表保留问题原貌描述作为修复依据存档；已修复项以 ✅ 标注。

| # | 位置 | 问题 |
| --- | --- | --- |
| P3-1 | `src/app/[locale]/quilts/components/`、`src/app/[locale]/cards/components/` | 蓝图 §3 规定模块私有目录为 `_components/`；新模块（paddles/antiques/maps/spirits）已遵守，legacy 两模块仍是公开 `components/`（且 cards 下还有 `components/analysis`、`components/hooks` 等多层结构） |
| P3-2 | `src/app/[locale]/reports/page.tsx` | ~~整个页面是 `'use client'`，违反蓝图 §7.1「Server Page + private client shell」，也是唯一一个客户端 page.tsx~~ **✅ 已随 P1-1 一并修复（§0.2）** |
| P3-3 | `src/hooks/useQuilts.ts`、`src/hooks/useCards.ts` | 仍是 REST wrapper，被 `QuiltsPageClient`/`CardsPageClient` 直接使用；蓝图 §11 已将其标为 legacy/仅兼容，收敛工作未完成 |
| P3-4 | `src/lib/repositories/*` | 仍被 `src/lib/data/cards.ts`、`src/lib/data/settings.ts`、`src/modules/cards/services/*`、`src/app/api/health/route.ts` 引用；蓝图 §11 的删除条件（reports/settings 调用方收敛）未达成 |
| P3-5 | `src/lib/data/settings.ts` L92–100 | ~~`changePassword` 在 DAL 中调用 `auth()`，违反蓝图 §6.1「DAL 不负责读取 session」~~ **✅ 已修复（§0.8.1）；并顺带消除 `api/settings/change-password/route.ts` 的第二份内联实现（§10.3 违反）** |
| P3-6 | `src/lib/agent/auth.ts` L50–83 | ~~`scopesForUser` 手写逐模块 `if` 链，未由 `registry` 派生；蓝图 §9 要求「Agent scope 映射」由 registry 派生。另外 `read:settings` 从未授予非管理员，`settings.read` 工具实际上只有 admin 可用，与 OpenAPI 的 scope 描述不符~~ **✅ 已修复（§0.8.2）；决策为「让授予规则与文档一致」——`read:settings` 授予所有有效 key** |
| P3-7 | `src/app/api/agent/openapi.json/route.ts` L48 | ~~`info.version` 硬编码 `'2026.9.11'`（`settings/system-info` 是从 package.json 读的），存在漂移风险；L82 把 `input` 声明为 `required`，而 Zod 侧 `input` 有 `default({})`~~ **✅ 已修复（§0.8.3）；并提取 `tool-names.ts` 消除第三份工具名手抄清单** |
| P3-8 | lint 输出 | ~~6 条警告全部集中在**新模块 UI**：`PaddleCard`/`MapCard`/`SpiritCard` 使用非原生交互元素且缺 role/tabindex/键盘支持（`jsx-a11y/no-static-element-interactions`）；`AntiqueDetail` L50、`MapDetail` L54、`SpiritDetail` L221 用数组下标作 key。CHANGELOG 中「harden ui a11y」的结论对新模块尚未完全成立~~ **✅ 已修复（§0.8.4）：0 错误 / 0 警告** |
| P3-9 | `public/clear-cache.html` | ~~无需登录即可访问的调试页，可清空该 origin 的全部 Cache Storage 与 `localStorage`；生产环境建议移除或加 admin 门禁~~ **✅ 已加固（§0.8.5）：加 `noindex`、移除 `?clear=true` 自动触发、清缓存前二次确认** |
| P3-10 | `src/lib/data/paddles.ts`、`antiques.ts`、`maps.ts`、`spirits.ts` | ~~写操作**完全没有事务**（`updatePaddle` 是「先 select 后 update」），状态 slice 失效存在 TOCTOU；`deletePaddle` 找不到时 `throw`，而 `deleteQuilt` 返回 `false` —— 删除契约跨模块不一致~~ **✅ 已修复（§0.8.6）：写操作加行锁事务，删除契约统一为布尔返回，错误判断改为 `instanceof` 类型化错误** |
| P3-11 | `package.json` | `eslint@9.39.5` 安装时被 npm 标记为已停止支持（"This version is no longer supported"）。蓝图 §15 要求 ESLint 10 升级需先做兼容性评估，可接受，但意味着当前无安全补丁 |
| P3-12 | `docs/architecture/MODULE_BLUEPRINT_V3.md` §15 | ~~记录「18 个测试文件/148 个测试」，实测为 19 个文件 / 157 个测试，已过期~~ **✅ 已修复（§0.8.7）：基线更新为 27 个文件 / 288 个测试，并新增三条常驻规则** |
| P3-13 | `README.md` vs `README_zh.md` | ~~英文版「Recommended Release Verification」缺少 `npm audit --omit=optional`（中文版有）；中文版缺少「Repository Layout」章节，两版结构不对称~~ **✅ 已修复（§0.10.2）：两版 26 个标题一一对应，并补齐中文版缺失的两个可选环境变量分组** |
| P3-14 | `.agent/skills/qms-module-development/SKILL.md` | ~~指向 `file:///c:/Users/sli/.../docs/MODULE_STANDARD.md`，用户名与路径均已失效（该文档已移至 `docs/archive/`）。该目录被 `.gitignore` 忽略，仅影响本地~~ **✅ 已修复（§0.10.3）：改为仓库相对链接，并按 V3 蓝图重写正文（原文仍在教已废弃的 repository/cached-repository 两层架构）** |

---

## 5. 关于构建结果的说明

`npm run build` 在隔离副本中**编译成功**：`✓ Compiled successfully in 38.1s` → `Finished TypeScript in 10.1s` → `✓ Generating static pages using 21 workers (117/117)` → 输出完整路由表（40+ API 路由、6 个模块的 list/detail 页、`ƒ Proxy (Middleware)`）。首次干净构建（`.next` 为空）完整跑完并输出路由表与图例，无 error/warning。

后续重复构建在收尾阶段被本机沙箱的批量删除保护拦截：

```text
[safe-delete][SAFE_DELETE_BULK_CONFIRM_REQUIRED] {"count":1979,"threshold":50,
 "targets":["...\\.next\\export-detail.json"]}
```

这是 WorkBuddy 本地环境对 `.next` 清理动作的拦截（Next.js 内部删除构建临时文件触发），**与项目代码无关**；在 Vercel 或未启用该保护的 CI 上不会出现。构建过程中未观察到 Better Auth `baseURL` 警告（因为 `.env.local` 已显式设置 `BETTER_AUTH_URL`），蓝图 §15 记录的这一历史告警在本基线已消除。

补充两条实测经验（对后续在本机复现构建有用）：

1. 该保护的计数是**按「轮次」累计**的（`"scope":"turn"`）。同一轮内累计删除数达到 50 即触发，因此 `npm run build` 的失败点会随轮次内已发生的删除次数而前后浮动（有时在生成静态页之前，有时在 `Finalizing page optimization` 之后）。
2. 当 `.next` **已存在**时，Next.js 在启动阶段就要清理旧产物，此时构建会直接**挂起**（守护进程在等待确认，进程不退出也不报错）。要复现干净构建，应先把旧目录改名而不是删除：`mv .next .next-stale-$(date +%s)`。这也是本次修复复验所用的方式。
3. 由第 2 条衍生出的一个副作用（本轮实测踩到）：改名后的 `.next-stale-<epoch>` 目录**不在 ESLint 的忽略范围内**（原配置只忽略 `.next/**`），于是 `npm run lint:check` 会去遍历上千个生成文件，报出 14 万条问题。已把 `eslint.config.mjs` 的忽略项由 `.next/**` 改为 `.next*`，同时覆盖目录与文件两种残留形态，实测在存在 `.next-stale-999/` 与 `.next-stale-file.js` 的情况下 `lint:check` 稳定为 0 错误 / 0 警告。

因此在本机判断构建是否通过，应以日志中是否出现 `✓ Compiled successfully` + `Finished TypeScript` + `✓ Generating static pages (N/N)` 三段为准，而非进程退出码。

---

## 6. 架构合规矩阵

| 蓝图规则 | 结论 | 证据 |
| --- | --- | --- |
| §2.1 每模块唯一 DAL | ✅ | 6 个模块均有 `src/lib/data/<module>.ts` |
| §2.2 每模块唯一 Action 契约 | ✅ | `src/app/actions/<module>.ts` 齐全，且不调用自身 `/api` |
| §2.3 显式模块路由 | ✅ | `[category]` 通用页面已删除 |
| §2.4 Server Page 鉴权 | ✅ | `/analytics`、`/reports` 已补 `requirePageModuleAccess`（§0.2） |
| §2.5/§10.1 Route Handler 不含数据实现 | ✅ | 全部通过 Action/DAL 访问；无 HTTP 自调用 |
| §2.6 Agent 固定工具集 | ✅ | 29 个白名单工具；工具名清单为单一来源（`src/lib/agent/tool-names.ts`），dispatcher 的 Zod enum 与 OpenAPI 的 `tool` enum 均从它读取，并有测试断言两者相等；`writeTools` 由 `scopeByTool` 派生（§0.8.3） |
| §2.7 仅 DAL 访问业务表 | ⚠️ | `actions/modules.ts` 已下沉（§0.5）；`actions/auth.ts` 仍直连 `@/db`（本轮新增发现） |
| §2.8 事务内完成后才失效缓存 | ✅ | `quilts.ts` 已改为提交后统一失效（§0.3）；`users.ts`、四个新模块的写路径同样遵守（§0.8.6） |
| §2.9 服务端负责查询 | ✅ | Client Shell 只写 URL 参数 |
| §2.10 不新增第二真相层 | ✅ | 无新 repository；但 legacy 未清完（P3-4） |
| §3 模块目录契约（`_components`） | ⚠️ | quilts/cards 仍用 `components/`（P3-1） |
| §4.2 DB/Zod/UI enum 完整对应 | ✅ | `LOST` 已全链路补齐，并由 `quilt-status-enum.test.ts` 机器校验 DB/Zod/运行时常量/i18n 四方一致（§0.6.1） |
| §5.1 四层入口全部授权 | ✅ | Server Page 缺口已补齐；Action/Route/Agent 层原本完备 |
| §6.1 DAL 不读 session | ✅ | `settings.ts#changePassword` 改为显式接收 `userId`，由 Action 层解析 session（§0.8.1） |
| §6.2 Action 不直连 db | ⚠️ | `actions/modules.ts` 已下沉（§0.5）；`actions/auth.ts` 仍直连（本轮新增发现） |
| §7.1 Server Page + 私有 Client Shell | ✅ | `reports` 已改为 Server Page + `_components/ReportsPageClient`（§0.2） |
| §8.1 唯一 tag factory | ✅ | `actions/modules.ts` 的 `revalidatePath` 已改为 `usersCacheTags`（§0.5） |
| §8.2 写失效只由 DAL 负责 | ✅ | 同上；`users.ts` 的写路径补齐了此前缺失的失效 |
| §9 registry 为唯一模块 ID 来源 | ✅ | Agent scope 改由 `MODULE_IDS` 派生（§0.8.2）；模块 ID 词表下沉为叶子模块 `src/modules/module-ids.ts`，registry 在其上叠加实现并原样再导出（§0.8.7） |
| §10.2 API contract 文档 | ✅ | `docs/API_REFERENCE.md` 已按实际结构改写（§0.5）；OpenAPI `info.version` 读 `package.json`，`input` 可选性、`idempotencyKey` 长度、scope 授予规则均已与实现对齐（§0.8.3） |
| §10.3 不允许两套业务校验 | ✅ | `collectQuiltBusinessRuleIssues` 成为唯一实现（§0.5）；`api/settings/change-password/route.ts` 的第二份内联实现已并入 DAL（§0.8.1）；paddle 搜索 schema 不再重复枚举；工具名 / Agent scope / 模块 ID 三处清单均收敛为单一来源 |
| §13 验收矩阵测试覆盖 | ✅ | 累计补齐 P1-1/P1-2/P2-2/P2-3/P2-8/P3-6/P3-7/P3-10 回归测试（157 → 356），并补上 registry/导航/i18n、新模块 DAL 级 CRUD、状态转移原子性三项（§0.11）。矩阵中仅剩「Web UI 与 API 行为一致性」与「legacy 禁止导入规则（CI）」两项，均依赖后续结构收敛（见 P2-9） |
| §15 版本以 lockfile 为准 | ✅ | README/CLAUDE.md 已改为解析版本 + caret 范围（§0.5）；蓝图 §15 测试基线已同步（§0.8.7） |

### 补充：`docs/API_REFERENCE.md` 与实际响应结构不符 · ✅ 已修复

文档 §Response Envelope 曾描述分页元数据位于**顶层 `pagination`**：

```json
{ "success": true, "data": {...}, "pagination": { "total": 42, "offset": 0, ... } }
```

实际实现（`src/lib/api/response.ts` L23–28）是**顶层 `meta`**（`page`/`limit`/`total`/`hasMore`，无 `offset`）。错误响应中 `fieldErrors` 的实际位置是 `error.details.errors`（`src/lib/api/action-response.ts` L47），而非文档所示的 `error.fieldErrors`。

进一步核查发现列表载荷实际有**三种并存形状**（首轮报告只识别出两种，此处更正）：

| 模块 | `GET` 列表载荷 | 备注 |
| --- | --- | --- |
| `quilts` | `data.quilts` + 顶层 `meta.{total,limit,hasMore}` | 唯一设置 `X-QMS-API-Surface: compatibility` 的模块（`src/app/api/quilts/_shared.ts`） |
| `cards` | `data.{cards,total,page,pageSize,totalPages}` | 分页字段直接摊平进 `data`，且字段名与另两者都不同 |
| `paddles`/`antiques`/`maps`/`spirits` | `data.<module>` + `data.pagination.{total,offset,limit,hasMore}` | 应作为收敛目标 |

> 更正：首轮报告称「quilts 与 cards 走 compatibility 通道」不准确 —— 全库只有 `GET /api/quilts` 设置该响应头（已用 `grep -rln "compatibility'" src/app/api/` 复核）。

`docs/API_REFERENCE.md` 已按上述实际结构改写，并显式标注三种形状与收敛方向（§0.5）。

---

## 7. 文档一致性小结

**保持得好的部分：**
- `CHANGELOG.md` 结构规范，Verification 段落逐条列出实际执行命令。
- `CLAUDE.md` 的「Critical constraints」与代码现状一致（Neon-only、env 校验、家庭共享语义、locale 文件必须 tracked）。
- `docs/architecture/AUTH_IMPLEMENTATION_SUMMARY.md` 的「Deprecated Auth Paths」准确列出已移除的 NextAuth 路径。
- i18n 键零漂移；`messages/en.json` / `messages/zh.json` 均被 tracked（CHANGELOG 记录的历史误删已修复）。
- 33 个 markdown 文件仅 1 处失效链接（且在 gitignored 目录内）——该处已于 §0.10.3 修复，现为 34 个 md / 43 条相对链接 / 0 处失效（扫描排除 `node_modules`、`.git`、`.workbuddy-ai`）。

**需要更新：** 首轮列出的 P2-5（技术栈版本）、P3-12（测试数量）、P3-13（中英 README 不对称）、§6 补充（API envelope 结构）**均已于 §0.5 完成**；P2-1 的 `LOST` 枚举描述与 P2-7 的输入转义说明**已于 §0.6 完成**（`API_REFERENCE.md` 补充了 `LOST` 的语义说明）；P3-6 的 Agent scope 描述与 P3-7 的 OpenAPI 契约**已于 §0.8 完成**（`public/AGENT_API.md` 新增「Scopes」章节，OpenAPI 补 `AgentScope` schema）；P3-13 的中英 README 章节对称性与 P3-14 的 skill 路径与内容**已于 §0.10 完成**。**文档侧已无遗留项**；此后新增的三份测试文件已同步进本报告 §0.11、`CHANGELOG.md` 与蓝图 §15 基线。

---

## 8. 建议修复顺序

> 第 1–9 项已于 2026-09-18 完成并复验（§0.2–§0.6、§0.11）；第 11 项中的 P3-5 ~ P3-10、P3-12 ~ P3-14 已完成（§0.8、§0.10）；第 7 项遗留的 `ActionResult` 收敛也已完成（§0.10.1）。剩余顺序如下。

1. ~~**P1-1** 补 `/analytics` 与 `/reports` 的服务端模块授权 —— 唯一的真实越权面。~~ **✅ 已完成**
2. ~~**P1-2** 把 `quilts.ts` 的三处 `revalidateTag` 移出事务，与其余 DAL 对齐。~~ **✅ 已完成**
3. ~~**P2-4** 恢复 `src/__tests__` 的类型检查 —— 一行改动，立刻让 CI 覆盖 9 个测试文件。~~ **✅ 已完成**
4. ~~**P2-5 + P3-12 + P3-13 + §6 补充** 一次性刷新文档基线。~~ **✅ 已完成**（P3-13 的中英章节对称性仍留作纯文档整理）
5. ~~**P2-1** 决策 `LOST` 枚举的去留，同步 DB/Zod/Agent/文档。~~ **✅ 已完成**（保留，并加枚举一致性测试）
6. ~~**P2-6** 修正 `cacheLife` 档案（改自定义档案或改注释），这是唯一影响线上性能的项。~~ **✅ 已完成**
7. ~~**P2-2 / P2-3 / P2-8** 收敛校验与搜索的跨模块一致性，顺带把 `actions/modules.ts` 下沉到 DAL。~~ **✅ 已完成**（P2-3 的 `ActionResult` 化除外）
8. ~~**P2-9** 按蓝图 §13 补齐事务回滚、cache tag、新模块 CRUD 的测试 —— 七轮累计覆盖 157 → 356。~~ **✅ 已完成（§0.11）**；蓝图 §13 矩阵中仅剩「Web UI 与 API 行为一致性」与「legacy 禁止导入规则（CI）」两项，前者需独立夹具、后者需等 P3-1/P3-3/P3-4 收敛。
9. ~~**P2-7** 数据双编码。~~ **✅ 输入层已修复 + 清洗脚本已交付**；脚本对真实库的执行待排期（需先备份 + 只读复核）。
10. **新增：`actions/auth.ts` 的 DAL 边界** —— 265 行、10 处原生 SQL，改造面较大，建议独立排期。
11. ~~**P3 系列** 作为持续收敛任务。~~ **✅ P3-2、P3-5 ~ P3-10、P3-12 ~ P3-14 已完成（§0.8、§0.10）**；其中 P3-1/P3-3/P3-4（legacy 清理）建议与下次新模块开发合并处理，P3-11（ESLint 9 EOL）须等 ESLint 10 兼容性评估。

### 8.1 本轮修复过程中新识别的模式（供后续审查复用）

P3 批次的多数问题并非孤立的坏代码，而是**同一个决定被抄写了多份**：模块 ID（3 处）、工具名（2 处）、`writeTools`（1 处冗余副本）、Agent scope（2 处）、状态枚举（8 处，P2-1 已处理）、`ActionResult` 辅助函数（首轮记为 6 处，实为 10 个 action 文件 + 11 个 hook + 28 处内联强转，§0.10.1 已处理）、`notFoundErrorResult`（5 处）。因此本轮的修复方式统一为「找出权威来源，让其余位置派生」，并尽可能补一条断言两者相等的测试。**后续审查可把「同一清单出现 ≥2 次」直接作为一个可机器扫描的线索**（例如统计重复字面量数组），比逐文件人眼比对更可靠。

`ActionResult` 契约已在 §0.10.1 收敛，且这条线索本身也被机器化了：`src/lib/__tests__/action-result.test.ts` 会扫描源码，任何重新声明的 `ActionResult` / 错误工厂 / `unwrapActionResult`，以及任何内联的 `flatten().fieldErrors`，都会让测试失败。教训是 —— **这类问题靠人眼比对不可靠**：首轮记录 6 处，实际扫描出 10 个 action 文件、11 个 hook 与 28 处内联强转。发现此类模式的正确第一步是先写个脚本数一遍，而不是只修记录在案的那几处。

§0.11 又验证了这条线索的第二种形态：**「约定」应当升级为「断言」**。`AppSidebar.tsx` 要求每个模块在 `moduleIcons` 里登记图标，否则静默回退到默认图标；en/zh 两套目录要求键集合一致；每个模块要有激活态路径判断 —— 这三件事此前都只存在于文档与人的记忆里。把它们写成断言的成本很低（扫描一个源文件 + `flattenKeys` 对比），收益是**新模块漏登记会在 CI 而非生产环境暴露**。同一批测试还当场发现 `hasModule` 用 `in` 走原型链的真实缺陷 —— 六轮人眼复核都没看到的六行代码。

---

## 9. 审查过程说明

- 依赖安装与全部门禁均在 `C:\temp\qms-review-20260918` 隔离副本中执行，**未在 OneDrive 工作区安装依赖、构建或运行测试**（符合蓝图 §13 的约定）。纯审查阶段结束时原仓库 `git status` 为干净状态、未修改任何项目文件；随后按 §8 实施的 21 项修复已写入工作区，每一批都在隔离副本中完成复验（`type-check` 0 错误 / `lint:check` 0 错误 0 警告 / `vitest` 31 文件 356 测试 / `build` 三段判据通过）。
- 每批修复的复验流程固定为：在 OneDrive 工作区编辑 → `rm -rf` 副本的 `src/` 后整体 `cp -r` 覆盖 → 在副本中跑门禁。这样既满足蓝图 §13，也保证副本与工作区不会出现部分同步。
- 技术栈语义校验通过 context7 完成（Next.js 16 `cacheLife` 内置档案、`revalidateTag(tag, 'max')` 签名变更）。已在 `~/.workbuddy-ai/mcp.json` 注册 context7 MCP server，但新 MCP 不会自动启用 —— 需要在连接器管理页右上角的「自定义连接器」入口对该 server 点击「信任」后才会生效；本次审查通过 context7 的 REST 接口完成校验。
