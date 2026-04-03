# Vercel Deployment Guide

本指南对应当前 `2026.4.2` 版本。

## 部署前本地检查

在推送代码前，先本地执行：

```bash
npm run lint:check
npm run type-check
npm test
npm run build
```

## 1. 配置 Vercel 环境变量

至少配置：

```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

如果使用 cards 模块的 AI 或第三方数据源，再补充对应可选变量。

详细变量列表见 `VERCEL-ENV-SETUP.md`。

## 2. 触发部署

可以通过以下任一方式：

- 推送到已连接的 Git 分支
- 使用 Vercel Dashboard 触发 redeploy
- 使用 Vercel CLI

```bash
vercel --prod
```

## 3. 部署完成后的核心验证

### 基础访问

- 首页可访问
- `/login` 可访问
- `/register` 可访问

### 认证与路由保护

- 未登录访问受保护页面会跳转到 `/login`
- 登录后可以返回原始目标页
- 已登录访问 `/login` 或 `/register` 会被重定向回应用

### 数据库连接

- 页面可以正常读取数据库数据
- 没有出现 `DATABASE_URL` 缺失或连接失败错误

## 4. 当前部署架构注意点

- Next.js 16 路由保护文件是项目根目录 `proxy.ts`
- 不要再检查 `middleware.ts`
- 不要再检查 `src/proxy.ts`
- 内部 UI 的主读写路径是 `src/app/actions/*.ts` + `src/lib/data/*.ts`

## 5. 新环境初始化建议

1. 先完成数据库 schema 部署
2. 确认 Auth.js 环境变量已生效
3. 访问 `/register` 创建首批用户
4. 根据你的 bootstrap 流程准备至少一个管理员账号

普通注册用户默认角色是 `member`。

## 6. 常见问题

### 登录后立刻跳回登录页

- 检查 `NEXTAUTH_SECRET`
- 检查 `NEXTAUTH_URL`
- 清理浏览器 cookies 后重试

### 受保护页面没有被拦截

- 确认项目根目录存在 `proxy.ts`
- 确认部署的是最新代码
- 检查 Vercel build logs 是否使用了新构建结果

### 部署成功但页面读取不到数据

- 检查 `DATABASE_URL`
- 检查数据库 schema 是否已执行 `db:push` 或迁移
- 查看 Vercel runtime logs

## 7. 已废弃的旧部署步骤

以下内容不再适用于当前项目：

- 配置 `QMS_PASSWORD_HASH`
- 配置 `QMS_JWT_SECRET`
- 使用测试密码 `TestPassword123`
- 运行 `npm run setup-password`
- 检查 `src/proxy.ts`
