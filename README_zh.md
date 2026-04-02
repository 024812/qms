# QMS

QMS 是一个模块化的家庭物品管理系统，基于 Next.js App Router、Auth.js v5、Neon Serverless Postgres、Drizzle ORM 和 Vercel 构建。当前生产架构已经收敛为 server-first：每个子模块都有唯一数据层、唯一 server actions，以及一个 server page shell 再配合私有 client shell 处理交互。

当前版本：`2026.4.2`

## 2026.4.2 版本摘要

- 把 `quilts` 和 `cards` 固化为第一批“可复制子模块模板”。
- 子模块架构统一为：
  - `src/lib/data/<module>.ts` 作为 canonical data layer
  - `src/app/actions/<module>.ts` 作为 canonical server action surface
  - `src/app/[locale]/<module>/page.tsx` 作为 server page shell
  - `src/app/[locale]/<module>/_components/*` 作为 client shell 和交互层
- 内部读写不再以 legacy repository-first 或 REST-first 路径为主。
- 稳定了 settings 和 dashboard 的数据流。
- README 已同步为当前真实技术栈和发布状态。

完整发布历史见 [CHANGELOG.md](CHANGELOG.md)。

## 子模块

### Quilts

- 家庭被子/床品库存管理。
- 状态切换与使用记录联动，按事务边界统一处理。
- 服务端筛选、排序、分页和 cache tag 失效策略。
- 模块蓝图：`src/modules/quilts/blueprint.ts`

### Cards

- 球星卡收藏管理，覆盖列表、详情、overview、sold、settings 等页面。
- 支持 Azure OpenAI 兼容部署和多数据源配置的 AI 分析能力。
- 已对齐 quilts 的标准化子模块结构。
- 模块蓝图：`src/modules/cards/blueprint.ts`

### 共享区域

- settings、dashboard、users、admin、analytics、reports、auth 等区域，也都在同一个 App Router 壳内，并尽量遵循同样的 server-first 组织方式。

## 当前架构

### 1. Server-first 页面

- 页面位于 `src/app/[locale]`。
- 首屏数据由服务端读取。
- 交互状态放到 `_components` 下的 client shell。
- 对数据库和鉴权状态敏感的动态页面，会显式用 `connection()` 进入运行时渲染。

### 2. Canonical 数据层

- 模块级读写收敛到 `src/lib/data/quilts.ts`、`src/lib/data/cards.ts`、`src/lib/data/usage.ts`、`src/lib/data/stats.ts`、`src/lib/data/settings.ts`。
- 内部应用流程不再把 route handlers 当成主真相源。
- 旧的 route handlers 主要保留给兼容或外部 HTTP 访问。

### 3. Canonical server actions

- 内部 UI 的 mutation 和内部读取，统一暴露在 `src/app/actions/*.ts`。
- actions 负责鉴权、校验、错误映射和缓存失效。
- 内部页面优先走 server actions，而不是直接调 `/api/**`。

### 4. 缓存策略

- 共享服务端数据使用 Next.js 16 的缓存原语，例如 `'use cache'`、`cacheLife`、`cacheTag`、`revalidateTag`。
- 缓存失效按模块和切片标签统一管理。
- React Query 继续保留，但定位为交互页面的客户端包装层，不再承担主真相层。

### 5. 可复制子模块模板

- 每个标准化模块都会定义：
  - 模块标识和路由段
  - 唯一数据层和唯一 actions 文件
  - page shell 边界
  - cache tag 和 query key 约定
  - legacy 边界和迁移规则
- 参考文件：
  - `src/modules/core/blueprint.ts`
  - `src/modules/quilts/blueprint.ts`
  - `src/modules/cards/blueprint.ts`

## 技术栈

### 应用层

- Next.js `16.2.2`
- React `19.2.4`
- TypeScript `5.9.3`
- next-intl `4.8.4`

### 数据与鉴权

- Auth.js / NextAuth.js v5（`next-auth@5.0.0-beta.30`）
- Neon Serverless PostgreSQL
- Drizzle ORM `0.45.2`
- Zod `4.3.6`
- bcryptjs `3.0.2`

### 前端状态与 UI

- Tailwind CSS `4.2.2`
- Radix UI
- TanStack React Query `5.96.0`
- Zustand `5.0.12`
- Framer Motion `12.24.7`
- Sonner `2.0.7`
- Recharts `3.7.0`

### AI 与集成

- OpenAI SDK `6.33.0`
- Azure OpenAI 兼容部署支持
- Perplexity、Tavily、eBay、RapidAPI 等球星卡数据源集成

### 工具链与部署

- ESLint `9.39.4`
- Prettier `3.8.1`
- Vitest `4.1.2`
- Vercel 部署

## 仓库结构

```text
src/
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
scripts/
```

## 环境变量

从 `.env.example` 复制为 `.env.local`，只填写你实际启用的配置。

### 必需项

```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

### 可选兼容/基础设施

```env
QMS_JWT_SECRET=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
REDIS_URL=
VERCEL_URL=
NODE_ENV=development
```

### 可选球星卡 AI 与数据源

```env
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_DEPLOYMENT=gpt-5-mini
PERPLEXITY_API_KEY=
RAPID_API_KEY=
```

部分球星卡提供商设置也可以在系统设置页中维护，并存入数据库。

## 本地开发

```bash
npm install
cp .env.example .env.local
npm run dev
```

打开 `http://localhost:3000`。

## 常用脚本

```bash
# 质量检查
npm run lint:check
npm run type-check
npm run build

# 本地开发
npm run dev
npm run dev:turbo

# 数据库
npm run db:generate
npm run db:push
npm run db:studio

# 项目工具
npm run audit-translations
npm run init-system-settings
npm run diagnose-auth
```

## 发布流程

项目版本号使用 npm 兼容的日期型格式：`YYYY.M.D`。

每次发布都执行：

1. 更新 `package.json` 和 `package-lock.json`
2. 更新 `README.md`、`README_zh.md`、`CHANGELOG.md`
3. 跑 lint、type-check、build
4. commit、tag、push
5. 检查 Vercel 部署状态

## 2026.4.2 验证基线

本次发布已按以下命令验证：

- `npm run lint:check`
- `npm run type-check`
- `npm run build`

## 许可证

MIT，详见 [LICENSE](LICENSE)。
