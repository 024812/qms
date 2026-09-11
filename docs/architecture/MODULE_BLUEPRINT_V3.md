# QMS 可复制子模块蓝图 V3

> 状态：`active`
>
> 发布日期：`2026-09-11`
>
> 适用基线：QMS `2026.7.17`，Next.js 16 App Router、React 19、Drizzle ORM、Better Auth、Zod 4。
>
> 本文是新增子模块的唯一当前蓝图。`MODULE_BLUEPRINT_V2.md` 保留作迁移历史，不再作为新模块模板。

## 1. 目标和非目标

V3 的目标是让新增模块拥有一条可验证的、类型安全的业务路径：

```text
URL -> Server Page -> typed DAL -> database
Client Shell -> Server Action -> typed DAL -> database
External HTTP -> Route Handler -> typed Action/DAL contract
Agent API -> fixed tool dispatcher -> typed Action/DAL contract
```

V3 不要求所有现有模块立即完成迁移。现有代码中的 `items.ts`、旧 repository、通用 `[category]` 页面和旧缓存标签均属于 legacy，不能复制到新模块。

### 1.1 当前迁移阻塞项

以下问题在修复前不得作为新模块模板：

| 阻塞项                    | 当前问题                                         | 新模块规则                        |
| ------------------------- | ------------------------------------------------ | --------------------------------- |
| `items.ts`                | 对 cards 直接执行数据库 CRUD，并存在动态字段写入 | 新模块禁止引用；迁移完成后删除    |
| `[category]` 页面         | 与显式模块路由并行，调用旧 facade                | 新模块只使用显式模块路由          |
| `StatsRepository`         | 与 `lib/data/stats.ts` 重复实现统计查询          | 报表和统计必须收敛到明确的 DAL    |
| usage/stats/settings tags | 读写侧存在旧手写标签或无 `use cache`             | 只能使用统一 tag factory          |
| module authorization      | 部分 Action/API 只检查登录，不检查模块权限       | 每个入口都必须执行模块授权        |
| module ID 白名单          | registry、users、actions 分别维护                | registry 必须成为唯一模块 ID 来源 |

## 2. 固定架构规则

1. 每个业务模块只有一个权威 DAL：`src/lib/data/<module>.ts`。
2. 每个业务模块只有一个 typed Action contract：`src/app/actions/<module>.ts`。
3. 页面使用显式路由：`src/app/[locale]/<module>/...`，不使用通用 `[category]` 作为新模块入口。
4. Server Page 可以直接读取 DAL，但必须执行认证和模块授权；Client Shell 的读取和所有 mutation 必须通过 Server Action。
5. Route Handler 是外部 HTTP、Webhook 或兼容面，不是内部页面和 Hook 的数据库读写层。
6. Agent API 只能调用固定工具，不提供通用表名、SQL、repository 或动态字段写入能力。
7. 只有 DAL 可以直接访问模块业务表；Action、Page、Client、Route Handler 不得自行拼接业务 SQL。
8. 跨表写入必须在同一个 Drizzle transaction 中完成，事务成功后才失效缓存。
9. 服务端负责搜索、筛选、排序和分页；Client Shell 不得对当前页数据重实现主查询。
10. 新模块不得增加 repository、cached repository 或第二套 REST 真相层。

## 3. 目录契约

```text
src/
├─ db/schema.ts                         # pgEnum、pgTable、relations
├─ modules/<module>/
│  ├─ blueprint.ts                       # 静态元数据，不负责运行时缓存
│  ├─ config.ts                          # ModuleDefinition
│  ├─ schema.ts                          # 唯一模块输入/输出 schema 源
│  ├─ types.ts                           # domain types、DTO types
│  └─ ui/                                # 可复用、无数据库访问的 UI
├─ lib/
│  ├─ data/<module>.ts                   # 唯一 DAL、事务、缓存
│  ├─ validations/<module>.ts            # 仅兼容旧模块；新模块不得重复定义 schema
│  └─ module-access.ts                   # 统一 auth + activeModules 检查
├─ app/
│  ├─ actions/<module>.ts                # auth、授权、校验、ActionResult
│  └─ [locale]/<module>/
│     ├─ page.tsx                        # Server Page
│     ├─ _components/<Module>PageClient.tsx
│     ├─ [id]/page.tsx
│     └─ [id]/edit/page.tsx              # 按功能需要增加
└─ hooks/use<Module>.ts                  # 可选，仅包装 typed Action
```

`src/modules/<module>` 不得导入 `@/db`、`next/cache`、`auth()` 或执行 mutation。模块配置和 UI 必须保持可测试、可复用。

## 4. Schema、类型和序列化

### 4.1 单一 schema 来源

新模块以 `src/modules/<module>/schema.ts` 作为唯一 Zod 源。Action、DAL 边界和 Route Handler 必须复用它；不得在 Action 或 API 中复制字段约束。

必须分别命名并明确转换：

- `Create<Module>Input`、`Update<Module>Input`：外部输入。
- `<Module>Row`：Drizzle 数据库行类型。
- `<Module>`：领域对象。
- `<Module>ListItem`、`<Module>Detail`：页面/API 输出 DTO。

日期统一使用 ISO 字符串作为 Server-to-Client/API 边界格式；数据库 `numeric` 必须在 DAL 中转换为明确的 `number` 或 decimal 字符串，禁止把驱动返回值直接泄露到 Client Component。

### 4.2 数据库不变量

每个模块设计必须在 blueprint 或 migration note 中写明：

- 独立表、主键、外键、删除策略和索引。
- DB enum、Zod enum、UI option、统计维度的完整对应关系。
- 唯一约束和可空字段的业务含义。
- 状态转移矩阵及每个转移产生的关联写入。
- 跨表写入的 transaction 边界。
- 生产只使用 `db:generate` + `db:migrate`；`db:push` 仅限明确的本地原型。

## 5. 授权模型

QMS 的库存业务数据按项目设计为家庭共享，不按 `userId` 隔离。`userId` 只能用于审计、记录来源、Agent key 归属和账户管理数据。

### 5.1 四层入口必须都授权

每个模块必须在以下入口检查：

| 入口          | 必须检查                                                        |
| ------------- | --------------------------------------------------------------- |
| Server Page   | session + `canAccessModule(session.user, moduleId)`             |
| Server Action | session + module access + role-specific permission              |
| Route Handler | session/API auth + module access；不得依赖 proxy                |
| Agent tool    | key validity + fixed scope + module access + write confirmation |

管理员可以绕过模块订阅限制，但仍需通过统一授权函数。普通 member 是否可以自行启用模块必须在产品策略中明确；可见性偏好不得自动等同于 Agent 写权限。

### 5.2 禁止事项

- 不得只用导航隐藏代替授权。
- 不得在旧 facade 中添加 `userId` 过滤来改变家庭共享语义。
- 不得将任意 `attributes`、表名、列名或 SQL 作为模块输入。
- 账号、密码、session、API key 和系统凭据必须始终按用户或管理员权限隔离。

## 6. DAL 和 Server Action

### 6.1 DAL

`src/lib/data/<module>.ts` 是唯一业务表访问层，负责：

- 服务端筛选、排序、分页和稳定的默认排序。
- domain/DTO 转换。
- 跨表事务。
- 运行时 cache tags、cache lifetime 和成功写入后的失效。
- 资源不存在、唯一冲突和状态冲突的领域错误。

DAL 不负责读取 session，也不接受未经 schema 解析的 `unknown`。

### 6.2 Action

Action 必须按以下顺序执行：

1. 获取 session。
2. 使用统一模块授权函数。
3. 使用模块 schema `safeParse`。
4. 调用 DAL。
5. 将已知领域错误映射为稳定的 `ActionResult`。
6. 不向客户端返回堆栈、SQL、凭据或内部异常文本。

Action 禁止直接调用 `db.insert/update/delete/select`。Action 不得复制 DAL 的筛选、排序、分页或缓存失效逻辑。

## 7. 页面、URL 和客户端状态

### 7.1 Server Page

Server Page 解析 `params`、`searchParams`，校验 query 参数，执行认证/授权，并直接调用 canonical DAL 获取首屏数据。对于需要统一错误 envelope 的客户端读取，Action-backed read 可以作为明确记录的例外。

### 7.2 Client Shell

Client Shell 只负责：

- dialog、selection、view mode、form draft 和 transition 状态。
- 将搜索、筛选、排序、页码写入 URL。
- 调用 typed Action 完成 mutation。

主查询参数必须有明确格式，例如：

```text
?page=1&pageSize=24&search=&status=IN_USE&sort=updatedAt.desc
```

不能对当前页数据再次执行主搜索、主筛选或跨页排序。React Query 仅用于无限滚动、虚拟列表、轮询或多个 client island 共享状态，并且 query key 必须由同一 query parameter parser 生成。

## 8. 缓存协议

### 8.1 唯一工厂

运行时只允许使用 `src/modules/core/cache-tags.ts` 的 `createModuleCacheTags`。`src/modules/core/blueprint.ts` 中的旧工厂不得被 DAL 导入；迁移完成后删除。

标签格式固定为：

| 类型  | 格式                           |
| ----- | ------------------------------ |
| root  | `<module>`                     |
| list  | `<module>:list`                |
| item  | `<module>:item:<id>`           |
| slice | `<module>:<dimension>:<value>` |

### 8.2 读取和写入

缓存读取函数必须在 `'use cache'` scope 中调用 `cacheLife(...)` 和 `cacheTag(...)`。写入使用 Next.js 16 的 `revalidateTag(tag, 'max')`，并且只在事务成功后调用。

缓存失效只由 DAL 负责。Action 不得重复失效标签，不得手写 `'usage'`、`usage-${id}`、`quilts-list` 等字符串。

| 操作              | 必须失效                                                      |
| ----------------- | ------------------------------------------------------------- |
| create            | root + list + 受影响的 slice                                  |
| update            | root + list + item + 新旧 slice                               |
| delete            | root + list + item + 旧 slice                                 |
| status transition | 以上规则 + 旧/新 status slice                                 |
| usage 变更        | usage tags + 受影响资源 root/list/item + stats/dashboard tags |

Cache tag 与 React Query key 是两套不同的标识，不得互相拼接或以其中一套替代另一套。

## 9. Registry、导航和 i18n

`src/modules/registry.ts` 是模块 ID、模块元数据和模块能力声明的唯一来源。新增模块时必须由 registry 派生：

- `RegisteredModuleId` 和 `UserModule` 类型。
- `normalizeModules` 白名单。
- users Action 的 Zod enum。
- Sidebar 导航和 settings 链接。
- Agent scope 映射。
- 通用路由静态参数（仅用于兼容性扫描，不作为新模块正式路由）。

同时更新：

- `messages/en.json`。
- `messages/zh.json`。
- 模块 blueprint/config。
- 权限测试和 OpenAPI/Agent 工具文档（若开放）。

不得在四个文件中手写相同的 `'quilts' | 'cards'` 白名单。

## 10. API、兼容层和 Agent API

### 10.1 Route Handler

Route Handler 必须声明其性质：external、webhook 或 compatibility。必须复用模块 schema、response envelope、统一认证、`no-store` 策略和错误码。

Route Handler 不得成为内部 Client Hook、Page 或 Action 的调用目标。不得重新实现 DAL 查询或通过旧 repository 绕过 canonical DAL。

### 10.2 Agent tool

Agent tool 必须是固定的 typed dispatcher：

- 工具名固定白名单。
- 输入使用工具专属 schema，未知字段不得写入审计日志。
- 写操作需要 `confirm=true` 和幂等 key。
- 审计输入统一递归脱敏 `password`、`secret`、`apiKey`、`accessToken`、`refreshToken` 等敏感字段。
- API key 必须有按 key/user/IP 的限流和幂等记录清理策略。
- 审计日志读取必须按管理员或记录所有者授权，不得使用可猜测的 resource ID 读取全局日志。

## 11. Legacy 迁移规则

| Legacy                                 | 当前替代                        | 新代码引用 | 删除条件                         |
| -------------------------------------- | ------------------------------- | ---------- | -------------------------------- |
| `src/app/actions/items.ts`             | typed module Action/DAL         | 禁止       | 无内部调用方且 generic 页面移除  |
| `src/lib/repositories/*`               | module DAL 或明确的基础设施 DAL | 禁止新增   | reports/settings 调用方收敛      |
| `[category]` 页面                      | `src/app/[locale]/<module>/...` | 禁止新增   | 当前模块显式路由覆盖并完成重定向 |
| `modules/core/blueprint` cache factory | `modules/core/cache-tags`       | DAL 禁止   | 所有 DAL 迁移完成                |
| `hooks/use<Module>` REST wrapper       | Action-backed wrapper           | 仅兼容     | 无 client 调用方或改为 Action    |

每次删除 legacy 前必须执行调用方扫描，并在变更中记录替代路径。CI 应逐步加入禁止规则，至少阻止新文件导入 `items.ts`、旧 cache factory 和已废弃 repository。

## 12. 新模块执行清单

### 12.1 设计和数据库

- [ ] 确定复数 kebab-case module ID、路由段和双语文案。
- [ ] 在 registry 注册模块元数据和能力。
- [ ] 在 `src/modules/<module>/schema.ts` 定义唯一 schema。
- [ ] 在 `src/db/schema.ts` 定义独立表、enum、relations、索引和约束。
- [ ] 生成并检查 Drizzle migration。
- [ ] 记录状态转移、删除策略和 transaction 不变量。

### 12.2 运行时实现

- [ ] 创建 `src/lib/data/<module>.ts`，只让它访问模块业务表。
- [ ] 使用统一 `cache-tags.ts`，实现读 cache 和写失效。
- [ ] 创建 `src/app/actions/<module>.ts`，统一 auth、授权、schema 和 ActionResult。
- [ ] 创建显式 Server Page、Client Shell、detail/edit 页面。
- [ ] 让 URL 驱动搜索、筛选、排序和分页。
- [ ] 仅在规定场景使用 React Query。

### 12.3 全局触点

- [ ] registry、用户模块类型、normalize、订阅 Action。
- [ ] Sidebar、单模块自动跳转和 settings 链接。
- [ ] `messages/en.json`、`messages/zh.json`。
- [ ] Agent scope 和 OpenAPI（若开放）。
- [ ] 外部 API 仅作为明确声明的 compatibility surface。

## 13. 验收矩阵

每个新模块在 `C:\temp\<project>` 副本中验证，不在 OneDrive 工作区安装依赖、构建或运行测试：

```text
npm run lint:check
npm run type-check
npm test
npm run build
```

必须有自动化测试覆盖：

- 未登录、无模块 member、普通 member、admin 的 Page/Action/API 权限。
- schema 边界、未知字段拒绝、DTO 序列化。
- 列表 URL 筛选、排序、分页和详情。
- create/update/delete、状态转移、事务回滚。
- cache tags 的读绑定和写失效。
- registry、导航、i18n、单模块自动跳转。
- Route Handler envelope、限流和 Agent 幂等/审计。
- legacy 调用方扫描和禁止导入规则。

数据库 migration 只能在确认过的 Neon 环境执行；本地验证使用 staging 或专用测试数据库，不得连接 `localhost:5432`。

## 14. 参考实现和官方依据

### 14.1 仓库参考

- `src/lib/data/quilts.ts`：当前最接近 canonical DAL 的模块。
- `src/app/actions/quilts.ts`：ActionResult、校验和错误映射参考。
- `src/modules/core/cache-tags.ts`：运行时唯一 cache tag factory。
- `src/modules/registry.ts`：模块注册目标位置。
- `src/lib/module-access.ts`：应集中实现模块授权；若不存在，新增模块前先补齐。

### 14.2 技术依据

- Next.js 16 `use cache`、`cacheTag`、`cacheLife` 和 `revalidateTag(tag, 'max')`。
- Better Auth session cookie cache；敏感操作应绕过缓存或要求 fresh/authoritative session。
- Drizzle `generate` + `migrate` 版本化迁移；`push` 只用于本地原型。

## 15. 依赖与版本策略

依赖版本以 `package.json` 和 `package-lock.json` 的可复现安装结果为准，不以“全部升级到 latest”为目标。升级必须同时检查：

- Node.js engine、Next.js、React、TypeScript、ESLint、Vite/Vitest 的 peer dependency 和最低 Node 版本。
- Next.js、Better Auth、Drizzle、Zod 的 breaking changes 和官方迁移说明。
- `npm ci`、lint、type-check、test、build 的完整结果。
- lockfile 的审计结果和生产运行时兼容性。

本次基线验证记录：隔离副本 `C:\temp\qms-review` 中 `npm ci` 成功且 `0 vulnerabilities`；`lint:check`、`type-check`、16 个测试文件/139 个测试和 `build` 均通过。`npm outdated` 显示仍可在后续独立变更中升级 `openai`、`zod`，而 ESLint 10、TypeScript 7 等 major 升级必须先完成兼容性评估，不能作为新模块开发的隐含前置条件。

构建仍报告 Better Auth 未设置显式 `BETTER_AUTH_URL`/`baseURL`，生产部署必须配置受信任的 canonical origin。Vitest 还报告未来将默认使用 native config loader；升级 Vite/Vitest 时应将配置迁移到 ESM（或显式设置 package module type）并补充 CI 验证。
