# QMS

开发环境使用 Node.js 22.13+（推荐 Node.js 24 LTS），通过 `npm ci` 复现 lockfile。最新审查、兼容性例外和待办见 [2026-09-25 审查报告](docs/reports/CODE_REVIEW_2026_09_25.md)。

QMS 是一个模块化的家庭物品管理系统，基于 Next.js 16、React 19、Better Auth、Neon Serverless PostgreSQL、Drizzle ORM 和 Vercel 构建。

当前版本：`2026.9.11`

## 当前标准

- `quilts` 和 `cards` 是第一批可复制的业务模块蓝图。
- 每个模块保留一个 canonical data layer：`src/lib/data/<module>.ts`。
- 每个模块保留一个 canonical server action surface：`src/app/actions/<module>.ts`。
- 每个模块同时提供正式 API 和 Web UI；Web UI 位于 `src/app/[locale]/<module>`，采用 `Server Page -> private client shell` 结构。
- API 与 Web UI 共享同一套 schema、授权、DAL、事务、缓存标签和响应契约。
- Route Handlers 是模块数据的正式外部 API 表面，但不得包含第二套数据访问实现。
- 路由保护遵循 Next.js 16 的 `src/proxy.ts` 约定，同时要求 Page、Action、API、Agent 入口显式鉴权。
- 外部 AI agent 使用受限 Agent OpenAPI，不直接访问数据库通用接口。

模块蓝图规则见 `docs/architecture/MODULE_BLUEPRINT_V3.md`。

## 当前模块

### Quilts

- 家庭被子和床品库存管理。
- 状态切换与使用记录同步。
- 服务端筛选、分页和 cache tag 失效。

### Cards

- 球星卡收藏管理，包含列表、详情、总览、售出和设置流程。
- 支持 Azure OpenAI 兼容提供商以及外部市场/搜索数据源。
- 结构已经对齐 quilts 的标准模块模式。

### Paddles

- 乒乓球底板与胶皮配置管理。
- 支持底板参数（重量、握拍方式、速度/控制评分）、正反手胶皮及厚度、买入估值追踪。
- 提供完整 Web UI CRUD、REST API 与 Agent API 工具。

### Antiques

- 古董与文玩收藏管理。
- 支持多品类（玉器、木器、陶瓷、金属、石器、纸品等）、尺寸、年代/朝代、鉴定记录与价值追踪。
- 提供完整 Web UI CRUD、REST API 与 Agent API 工具。

### Maps

- 历史地图与现代地图收藏管理。
- 支持地图类型（地形图、道路图、城市图、历史地图等）、材质、出版年份、比例尺、地区与尺寸。
- 提供完整 Web UI CRUD、REST API 与 Agent API 工具。

### Spirits

- 珍藏烈酒、葡萄酒与其他酒类收藏管理。
- 支持酒类分类（威士忌、干邑、白酒、葡萄酒等）、产区/国家、年份/陈年、酒精度、桶型、封瓶状态与品鉴笔记。
- 提供完整 Web UI CRUD、REST API 与 Agent API 工具。

### 共享区域

Settings、dashboard、users、admin、analytics、reports、authentication 等区域都位于同一个 App Router 外壳内，并尽量复用 server-first 组织方式。

## REST API

每个业务模块均提供统一格式的外部 REST API，遵循规范的 JSON envelope、参数校验与错误码。完整参考见 [docs/API_REFERENCE.md](docs/API_REFERENCE.md)。

- `GET /api/<module>` — 列表查询（支持 search、筛选、排序、分页）
- `POST /api/<module>` — 创建记录
- `GET /api/<module>/:id` — 查询单条详情
- `PATCH /api/<module>/:id` — 部分更新（传 `null` 清空可空字段）
- `DELETE /api/<module>/:id` — 删除记录

支持模块：`quilts`、`cards`、`paddles`、`antiques`、`maps`、`spirits`。

## 技术栈

下列版本为 **`package-lock.json` 实际解析版本**（括号内为 `package.json` 声明的 caret 范围）。按 `docs/architecture/MODULE_BLUEPRINT_V3.md` §15，依赖版本以 `package.json` + `package-lock.json` 为准，本列表仅作速览。

- Next.js `16.3.6`（`^16.2.10`）
- React / React DOM `19.3.0`（`^19.2.7`）
- TypeScript `6.0.3`
- next-intl `4.14.7`（`^4.13.2`）
- Better Auth `1.7.6`（`^1.6.23`）
- Neon Serverless PostgreSQL（`@neondatabase/serverless` `1.1.0`）
- Drizzle ORM `0.45.3`
- Zod `4.6.5`（`^4.4.3`）
- Tailwind CSS `4.3.3`
- TanStack React Query `5.103.2`（`^5.101.2`）
- lucide-react `1.48.0`（`^1.24.0`）
- Vercel 部署

## 仓库结构

```text
src/
  proxy.ts
  auth.ts
  app/
    [locale]/
      (dashboard)/
      quilts/
      cards/
      paddles/
      antiques/
      maps/
      spirits/
      settings/
      users/
      admin/
      analytics/
      reports/
      usage/
      login/
      register/
    actions/
    api/
  components/
  db/
  hooks/
  i18n/
  lib/
    data/          # 每个模块唯一的 DAL
    repositories/  # legacy，正在退役
  modules/
    core/
    quilts/
    cards/
    paddles/
    antiques/
    maps/
    spirits/
  styles/
  types/
  __tests__/       # API / 鉴权 / proxy 测试套件，已纳入类型检查
docs/
scripts/           # 一次性数据导入与修复脚本（用 tsx 运行，用法见各文件头部）
```

## 环境变量

复制 `.env.example` 到 `.env.local`，只填写当前部署实际需要的值。

### 必填

```env
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
NEXT_PUBLIC_BETTER_AUTH_URL=
```

`BETTER_AUTH_URL` 在部署环境必填，本地也建议设置。`AUTH_SECRET` 是 `BETTER_AUTH_SECRET` 的可选兜底别名，只设置后者即可。`DATABASE_URL` 必须指向 Neon Postgres；这个项目不使用 `localhost:5432` 本地数据库做迁移目标。

### 可选：平台与基础设施

```env
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
REDIS_URL=
VERCEL_URL=
WEBHOOK_ERROR_URL=
NODE_ENV=development
```

### 可选：卡片 AI 与数据提供方

```env
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_DEPLOYMENT=gpt-5-mini
PERPLEXITY_API_KEY=
RAPID_API_KEY=
EBAY_APP_ID=
EBAY_CERT_ID=
EBAY_DEV_ID=
EBAY_ENVIRONMENT=production
```

部分卡片提供方配置也可以在应用设置界面中管理并存入数据库；环境变量适合作为引导值，以及仅服务端的兜底。

## Agent API

用户在 **Settings -> Agent API Keys** 中创建自己的 API key。Key 继承创建用户的模块访问权限。公开 Agent 指南位于 `/AGENT_API.md`，OpenAPI 描述位于 `/api/agent/openapi.json`，工具入口为 `/api/agent/tools`。

QMS 采用家庭共享业务数据模型：模块记录由已认证的家庭成员共享，不按登录用户隔离。记录或 Agent 的 `userId` 用于来源追踪和审计归属。完整 review 决策和安全边界见 `docs/PROJECT_SUMMARY.md`。

写入工具必须提供 `confirm=true` 和 `idempotencyKey`；成功写入会记录到 `agent_idempotency_keys`，重复请求可以安全重放。

## 本地开发

> **环境铁律**：由于本仓库位于通过 OneDrive 实时跨设备双向同步的目录中，**严禁在 OneDrive 目录下直接执行 `npm install`、`npm test`、`npm run build`**，以免生成 `node_modules` 与 `.next` 导致碎文件风暴与云同步冲突。安装依赖、本地调试和测试**必须在 `C:\temp\<project>`（例如 `C:\temp\qms`）下进行**。

```powershell
# 在 C:\temp\qms 中执行：
npm install
Copy-Item .env.example .env.local
npm run db:migrate
npm run dev
```

打开 `http://localhost:3000`。如果使用 macOS 或 Linux，把 `Copy-Item` 换成 `cp` 即可。

## 常用脚本

```bash
# 开发
npm run dev
npm run dev:turbo

# 质量
npm run lint
npm run lint:check
npm run format
npm run format:check
npm run type-check
npm test
npm run build

# 数据库
npm run db:generate
npm run db:migrate
npm run db:studio
npm run db:drop
```

Neon schema 变更统一使用 `npm run db:migrate`。`db:push` 只保留给明确的开发实验，不用于生产数据库。

`npm run db:setup` 和 `npm run health:check` 是面向本地已启动服务的便捷命令。

## 发布前验证

```bash
npm run lint:check
npm run type-check
npm test
npm run build
npm audit --omit=optional
```

`npm audit --omit=optional` 用于守住依赖面。注意 `type-check` 已覆盖 `src/__tests__`，因此 API/鉴权/proxy 测试套件既参与执行也参与类型检查。

## 文档入口

- 文档目录：`docs/README.md`
- 模块蓝图：`docs/architecture/MODULE_BLUEPRINT_V3.md`
- 数据库迁移：`docs/guides/DATABASE_MIGRATIONS.md`
- 认证实现：`docs/architecture/AUTH_IMPLEMENTATION_SUMMARY.md`
- 部署环境变量：`docs/guides/VERCEL-ENV-SETUP.md`
- 变更历史：`CHANGELOG.md`

## License

MIT，详见 `LICENSE`。
