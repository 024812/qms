# QMS

QMS 是一个模块化的家庭物品管理系统，基于 Next.js 16、React 19、Better Auth、Neon Serverless PostgreSQL、Drizzle ORM 和 Vercel 构建。

当前版本：`2026.6.11`

## 当前已经标准化的内容

- `quilts` 和 `cards` 是第一批可复制的子模块模板。
- 每个子模块只保留一个 canonical data layer：`src/lib/data/<module>.ts`
- 每个子模块只保留一个 canonical server actions 入口：`src/app/actions/<module>.ts`
- 页面统一采用 `Server Page -> 私有 Client Shell` 结构，位于 `src/app/[locale]/<module>`
- Route Handlers 主要保留给兼容层、外部 HTTP 访问或第三方集成，不再作为内部主真相源
- 路由保护统一遵循 Next.js 16 的 `src/proxy.ts` 约定
- 外部 AI agent 使用受限的 Agent OpenAPI 表面，不直接获得数据库通用访问权。

子模块蓝图规则请查看 `docs/MODULE_BLUEPRINT_V2.md`。

## 当前模块

### Quilts

- 家庭被子与床品库存管理
- 状态切换与使用记录联动，按事务边界统一处理
- 服务端筛选、分页与缓存标签失效

### Cards

- 球星卡收藏管理，覆盖列表、详情、总览、售出与设置流
- 支持 Azure OpenAI 兼容部署以及外部市场/搜索数据源
- 结构已经对齐 quilts 的标准子模块模式

### 共用区域

- settings、dashboard、users、admin、analytics、reports、authentication 等区域都位于同一个 App Router 外壳内，并尽量复用同一套 server-first 组织方式

## 技术栈

- Next.js `16.2.7`
- React `19.2.7`
- TypeScript `6.0.3`
- next-intl `4.13.0`
- Better Auth `1.6.13`
- Neon Serverless PostgreSQL
- Drizzle ORM `0.45.2`
- Zod `4.4.3`
- Tailwind CSS `4.3.0`
- TanStack React Query `5.100.14`
- Vercel 部署

## 仓库结构

```text
src/
  proxy.ts
  app/
    [locale]/
      quilts/
      cards/
      settings/
      users/
      admin/
      analytics/
      reports/
    actions/
    api/
  components/
  db/
  hooks/
  lib/
    data/
    repositories/
  modules/
    core/
    quilts/
    cards/
  types/
docs/
```

## 环境变量

从 `.env.example` 复制为 `.env.local`，只填写当前部署实际会用到的配置。

### 必填

```env
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
NEXT_PUBLIC_BETTER_AUTH_URL=
```

`BETTER_AUTH_URL` 在部署环境中必填，本地开发也建议显式配置。

### 可选的平台与基础设施配置

```env
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
REDIS_URL=
VERCEL_URL=
WEBHOOK_ERROR_URL=
NODE_ENV=development
```

### 可选的卡片 AI 与数据源配置

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

部分卡片提供商设置也可以在应用内设置页维护并存入数据库。环境变量主要用于初始化和服务端兜底。

### Agent API

用户在 **设置 -> Agent API Keys** 中创建自己的 API key。key 继承创建用户的子系统访问权限，AI agent 只能操作该用户可访问的模块。

公开 Agent 指南位于 `/AGENT_API.md`。Agent API 的 OpenAPI 描述位于 `/api/agent/openapi.json`，工具调用入口为 `/api/agent/tools`。写入工具必须提供 `confirm=true` 和 `idempotencyKey`；使用 `dryRun=true` 可以预览写入计划。

## 本地开发

```powershell
npm install
Copy-Item .env.example .env.local
npm run db:push
npm run dev
```

打开 `http://localhost:3000`。

如果你使用 macOS 或 Linux，把 `Copy-Item` 换成 `cp` 即可。

## 常用脚本

```bash
# 开发
npm run dev
npm run dev:turbo

# 质量检查
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
npm run db:push
npm run db:studio
npm run db:drop
```

`npm run db:setup` 和 `npm run health:check` 是面向本地运行中服务的便捷命令。

## 推荐发布前验证

发布前建议执行：

```bash
npm run lint:check
npm run type-check
npm test
npm run build
```

## 文档入口

- 文档目录：`docs/README.md`
- 模块旧标准说明：`docs/MODULE_STANDARD.md`
- 当前生效的模块蓝图：`docs/MODULE_BLUEPRINT_V2.md`
- 认证实现总结：`docs/guides/AUTH_IMPLEMENTATION_SUMMARY.md`
- 部署环境变量：`docs/guides/VERCEL-ENV-SETUP.md`
- 变更历史：`CHANGELOG.md`

## License

MIT，详见 `LICENSE`。
