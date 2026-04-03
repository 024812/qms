# Vercel Environment Setup

本指南对应当前 `2026.4.2` 版本的真实环境变量需求。

## 必填环境变量

在 Vercel Dashboard 中进入 `Project -> Settings -> Environment Variables`，至少配置以下变量：

```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

说明：

- `DATABASE_URL`
  Neon PostgreSQL 连接串
- `NEXTAUTH_SECRET`
  Auth.js 会话签名密钥
- `NEXTAUTH_URL`
  当前环境实际访问域名，例如 `https://your-app.vercel.app`

## 推荐可选变量

```env
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
REDIS_URL=
WEBHOOK_ERROR_URL=
VERCEL_URL=
NODE_ENV=production
```

## 卡片模块可选变量

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

说明：

- 某些卡片提供商配置也可以在应用设置页写入数据库
- 环境变量仍然适合做初始化值或服务端兜底

## 生成 `NEXTAUTH_SECRET`

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 配置建议

- Production、Preview、Development 三个环境分开配置
- `NEXTAUTH_URL` 应该与对应环境的真实域名一致
- 修改环境变量后，需要重新部署才会生效

## 已废弃变量

以下变量不应再加入 Vercel：

- `QMS_PASSWORD_HASH`
- `QMS_JWT_SECRET`
- `NEXT_PUBLIC_APP_VERSION`

版本号已经直接从 `package.json` 读取。

## 配置完成后的检查

- 应用可以正常连接数据库
- `/login` 和 `/register` 可访问
- 受保护页面会被 `proxy.ts` 正确拦截
- 登录后 session 正常建立
