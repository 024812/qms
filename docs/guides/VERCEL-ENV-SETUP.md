# Vercel Environment Setup

本指南对应当前 `2026.7.7` 版本的真实环境变量需求。

## 必填环境变量

在 Vercel Dashboard 进入 `Project -> Settings -> Environment Variables`，至少配置：

```env
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
NEXT_PUBLIC_BETTER_AUTH_URL=
```

说明：

- `DATABASE_URL`：Neon Postgres 连接串。生产、预览和开发环境都应指向对应的 Neon 数据库或分支，不要配置成本地 `localhost:5432`。
- `BETTER_AUTH_SECRET`：Better Auth 会话签名密钥。生产环境必须使用独立强随机值。
- `BETTER_AUTH_URL`：当前环境实际访问域名，例如 `https://your-app.vercel.app`。
- `NEXT_PUBLIC_BETTER_AUTH_URL`：浏览器端 Better Auth client URL，通常与 `BETTER_AUTH_URL` 相同。

## 推荐可选变量

```env
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
REDIS_URL=
WEBHOOK_ERROR_URL=
VERCEL_URL=
NODE_ENV=production
```

## Cards 模块可选变量

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

某些 cards provider 设置也可以在应用设置页写入数据库。环境变量仍适合作为初始化值或服务端 fallback。

## Agent API

Agent API keys 在应用的 `Settings -> Agent API Keys` 中创建，并以哈希形式存入数据库。Vercel 不需要为 agent key 配置额外环境变量。

公开说明位于 `/AGENT_API.md`，受限 OpenAPI 描述位于 `/api/agent/openapi.json`。

## 生成 `BETTER_AUTH_SECRET`

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 数据库迁移

部署前确认 Neon 已应用最新 Drizzle 迁移：

```bash
npm run db:migrate
```

本项目不使用本地 PostgreSQL 作为迁移目标。迁移说明见 `DATABASE_MIGRATIONS.md`。

## 配置建议

- Production、Preview、Development 三个环境分开配置。
- `BETTER_AUTH_URL` 和 `NEXT_PUBLIC_BETTER_AUTH_URL` 应与对应环境的真实域名一致。
- 修改环境变量后，需要重新部署才会生效。
- 不要把真实连接串、密钥或 API key 写入仓库。

## 已废弃变量

以下变量不应再加入 Vercel：

- `QMS_PASSWORD_HASH`
- `QMS_JWT_SECRET`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_APP_VERSION`

版本号已直接从 `package.json` 读取。

## 配置完成后的检查

- 应用可以正常连接 Neon 数据库。
- `/login` 和 `/register` 可访问。
- 受保护页面会被 `src/proxy.ts` 正确拦截。
- 登录后 session 正常建立。
- `npm run db:migrate` 在当前 Neon 目标上无待执行迁移或成功执行。
