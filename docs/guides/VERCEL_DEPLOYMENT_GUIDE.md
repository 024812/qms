# Vercel Deployment Guide

本指南对应当前 `2026.7.17` 版本。

## 部署前本地检查

推送代码前先执行：

```bash
npm run lint:check
npm run type-check
npm test
npm run build
npm audit --omit=optional
```

## 1. 配置 Vercel 环境变量

至少配置：

```env
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
NEXT_PUBLIC_BETTER_AUTH_URL=
```

`DATABASE_URL` 必须指向 Neon Postgres。不要在 Vercel 或本地迁移流程中使用 `localhost:5432`。

如果使用 cards 模块的 AI 或第三方数据源，再补充对应可选变量。详细变量列表见 `VERCEL-ENV-SETUP.md`。

## 2. 应用数据库迁移

部署前或部署窗口内执行：

```bash
npm run db:migrate
```

当前 Neon 数据库已应用到 `0007_gifted_morlocks`。后续迁移继续通过 Drizzle migration 文件推进。

## 3. 触发部署

可以通过以下任一方式：

- 推送到已连接的 Git 分支。
- 使用 Vercel Dashboard 触发 redeploy。
- 使用 Vercel CLI：

```bash
vercel --prod
```

## 4. 部署完成后的核心验证

### 基础访问

- 首页可访问。
- `/login` 可访问。
- `/register` 重定向到 `/login`，不提供公开注册。

### 认证与路由保护

- 未登录访问受保护页面会跳转到 `/login`。
- 登录后可以返回原始目标页。
- 已登录访问 `/login` 会重定向回应用；`/register` 始终不提供注册页面。

### 数据库连接

- 页面可以正常读取 Neon 数据。
- 没有出现 `DATABASE_URL` 缺失或连接失败错误。
- Drizzle migration history 与 `drizzle/meta/_journal.json` 保持一致。

### Agent API

- `/api/agent/openapi.json` 可返回受限 OpenAPI 描述。
- `/api/agent/tools` 对缺失或无效 bearer token 返回鉴权错误。
- 写工具在重复 `idempotencyKey` 下能安全重放结果。

## 5. 当前部署架构注意点

- Next.js 16 路由保护文件是 `src/proxy.ts`。
- 不要再检查 `middleware.ts`。
- 内部 UI 的主读写路径是 `src/app/actions/*.ts` 和 `src/lib/data/*.ts`。
- `/api/**` 是兼容或外部 HTTP surface，新增内部功能时不要默认走 API route。

## 6. 新环境初始化建议

1. 配置 Vercel 环境变量。
2. 对目标 Neon 数据库执行 `npm run db:migrate`。
3. 通过受控的 bootstrap 流程准备至少一个管理员账号。
4. 由管理员在用户管理页面创建其他账号。

公开注册已关闭，不应通过 `/api/auth/sign-up/email` 创建账号。

## 7. 常见问题

### 登录后立即跳回登录页

- 检查 `BETTER_AUTH_SECRET`。
- 检查 `BETTER_AUTH_URL`。
- 检查 `NEXT_PUBLIC_BETTER_AUTH_URL`。
- 清理浏览器 cookies 后重试。

### 受保护页面没有被拦截

- 确认项目中存在 `src/proxy.ts`。
- 确认部署的是最新代码。
- 检查 Vercel build logs 是否使用了最新构建结果。

### 部署成功但页面读取不到数据

- 检查 `DATABASE_URL` 是否指向正确 Neon 数据库或分支。
- 执行 `npm run db:migrate`。
- 查看 Vercel runtime logs。

## 8. 已废弃的旧部署步骤

以下内容不再适用于当前项目：

- 配置 `QMS_PASSWORD_HASH`。
- 配置 `QMS_JWT_SECRET`。
- 配置 `NEXTAUTH_URL` 或 `NEXTAUTH_SECRET`。
- 运行旧的密码初始化脚本。
- 用 `db:push` 直接改生产 schema。
