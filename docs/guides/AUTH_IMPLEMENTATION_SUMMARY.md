# Authentication Implementation Summary

当前认证方案已经统一到 Auth.js v5 + Credentials Provider。

## 当前认证入口

- `src/auth.ts`
  Auth.js 配置、Credentials Provider、JWT/session 回调、`auth()`/`signIn()`/`signOut()` 导出
- `src/app/actions/auth.ts`
  登录和注册的 server actions
- `src/app/api/auth/[...nextauth]/route.ts`
  Auth.js handler 暴露
- `src/app/[locale]/login/page.tsx`
  本地化登录页
- `src/app/[locale]/register/page.tsx`
  本地化注册页
- `proxy.ts`
  Next.js 16 路由保护入口

## 当前实现方式

### 1. 用户存储

- 用户记录保存在 `users` 表
- 密码哈希保存在 `users.hashed_password`
- 角色和已启用模块保存在 `users.preferences`

### 2. 登录方式

- 使用 Auth.js v5 Credentials Provider
- 登录时在 `src/auth.ts` 中校验邮箱和密码
- 密码使用 `bcryptjs` 校验
- session 采用 JWT strategy

### 3. 注册方式

- 注册通过 `src/app/actions/auth.ts` 中的 `registerUser()` 完成
- 创建用户后会自动调用 `signIn('credentials')`
- 默认新注册用户角色为 `member`

### 4. 权限与会话

- `jwt` 回调把 `id`、`role`、`activeModules` 写入 token
- `session` 回调把这些字段同步到 `session.user`
- 需要管理员权限的 action 会显式检查 `session.user.role === 'admin'`

### 5. 路由保护

- Next.js 16 官方约定使用项目根目录 `proxy.ts`
- `proxy.ts` 负责：
  - `next-intl` locale 路由处理
  - 未登录用户重定向到 `/login`
  - 已登录用户访问 `/login` 或 `/register` 时重定向回应用首页
  - 单模块用户进入根路由时自动跳转到对应模块

## 必需环境变量

```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

说明：

- `DATABASE_URL` 用于读取用户与业务数据
- `NEXTAUTH_SECRET` 用于 Auth.js 会话签名
- `NEXTAUTH_URL` 在部署环境应设置为实际站点 URL

## 运维说明

### 新环境初始化

1. 配置数据库与 Auth.js 环境变量
2. 执行 `npm run db:push`
3. 启动应用并访问 `/register`
4. 根据你的启动流程创建或提升至少一个管理员账号

### 管理员账号

- 普通注册用户默认是 `member`
- 需要访问用户管理、卡片设置等管理员功能时，必须确保对应用户角色为 `admin`

## 已废弃的旧方案

以下内容不再属于当前认证实现：

- `QMS_PASSWORD_HASH`
- `QMS_JWT_SECRET`
- `scripts/setup-password.ts`
- `npm run setup-password`
- `src/proxy.ts`
- `middleware.ts`

## 推荐验证项

- 访问未登录受保护页面时会跳转到 `/login`
- 注册后能自动登录
- 正确密码可以登录，错误密码会被拒绝
- `session.user` 中包含 `id`、`role`、`activeModules`
- 管理员页面对非 admin 用户会拒绝访问
