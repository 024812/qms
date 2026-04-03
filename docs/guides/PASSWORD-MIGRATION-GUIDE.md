# Password Migration Guide

本指南说明如何从历史的“环境变量密码方案”迁移到当前的 Auth.js 用户表方案。

## 当前状态

QMS 当前使用的是：

- `users.hashed_password` 存储 bcrypt 哈希
- Auth.js v5 Credentials Provider 负责登录
- `NEXTAUTH_SECRET` 负责 session 签名

以下旧环境变量已经不再是当前方案的一部分：

- `QMS_PASSWORD_HASH`
- `QMS_JWT_SECRET`

## 需要迁移的场景

如果你的旧部署仍然依赖环境变量密码，而不是 `users` 表中的账号密码，请执行迁移。

## 迁移目标

把旧密码方案迁移为：

1. 在 `users` 表中存在真实用户
2. 用户密码写入 `users.hashed_password`
3. 登录统一走 `/login` + Auth.js
4. 删除旧的密码环境变量

## 推荐迁移步骤

### 1. 确认数据库已初始化

```bash
npm run db:push
```

### 2. 创建或准备目标用户

确保 `users` 表中存在目标账号，并且包含：

- `name`
- `email`
- `hashed_password`
- `preferences`

### 3. 生成新的 bcrypt 哈希

可以用 Node 一次性生成：

```bash
node -e "require('bcryptjs').hash(process.argv[1], 10).then(console.log)" "YourStrongPassword123!"
```

### 4. 写入 `users.hashed_password`

把上一步生成的哈希写入目标用户记录。

### 5. 配置 Auth.js 环境变量

```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

### 6. 删除旧环境变量

迁移完成后，从 Vercel 或其他部署环境中删除：

- `QMS_PASSWORD_HASH`
- `QMS_JWT_SECRET`

### 7. 重启或重新部署

Auth.js 和环境变量更新后需要重新部署或重启服务。

## 迁移完成后的验证

- 访问 `/login`
- 用迁移后的邮箱和密码登录
- 确认不再依赖任何旧密码环境变量
- 确认注册、登录、登出都正常

## 常见问题

### 登录失败但数据库里已经有用户

- 检查 `users.hashed_password` 是否为 bcrypt 哈希
- 检查邮箱是否和登录时输入的一致
- 检查 `NEXTAUTH_SECRET` 和 `NEXTAUTH_URL`

### 需要提升管理员权限

注册用户默认是 `member`。如果要访问管理员功能，需要把对应用户角色设置为 `admin`。

### 能否继续保留旧环境变量兜底

不建议。当前代码路径已经以 Auth.js + `users` 表为准，继续保留旧变量只会增加未来维护成本和文档歧义。
