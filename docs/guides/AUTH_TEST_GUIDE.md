# 认证系统测试指南 / Authentication Testing Guide

本文对应当前 Better Auth 实现（QMS `2026.9.11`）。公开注册已关闭；测试账号必须由受控 bootstrap 流程准备，或由管理员在用户管理页面创建。

## 测试前提

- 使用 Neon Postgres 的 `DATABASE_URL`，不要连接本地 `localhost:5432`。
- 配置 `BETTER_AUTH_SECRET`，长度至少 32 个字符。
- 显式配置受信任的 `BETTER_AUTH_URL`，本地通常为 `http://localhost:3000`；同时配置 `NEXT_PUBLIC_BETTER_AUTH_URL`。
- 在 `C:\temp\<project>` 副本中安装依赖、运行测试、构建或启动服务，不要在 OneDrive 工作区执行这些命令。
- 用户密码最少 12 个字符。

## 1. 管理员创建账户

1. 使用管理员账号登录。
2. 打开用户管理页面 `/users`。
3. 创建一个普通 `member` 账号，填写姓名、邮箱和至少 12 个字符的密码。
4. 分别创建一个只授权 `quilts` 的 member 和一个只授权 `cards` 的 member，供模块授权测试使用。

预期结果：

- 未登录用户不能访问用户管理页面。
- 只有管理员能创建、修改或删除账户。
- `/register` 不提供公开注册，访问时重定向到 `/login`。
- 少于 12 个字符的密码被拒绝。

## 2. 登录和错误凭据

访问 `http://localhost:3000/login`，使用管理员或已创建的测试账号登录。

正确密码应登录成功并进入应用；刷新页面后 session 仍有效。错误密码应显示通用错误、留在登录页，且不能读取受保护内容。

不要测试或记录不存在的“记住我”复选框、密码眼睛图标或独立的 7 天 session。当前实现没有这些产品约定。

## 3. Session 生命周期

Better Auth 当前配置为：

- session 有效期：30 天（`expiresIn = 60 * 60 * 24 * 30`）。
- 每 24 小时更新一次 session（`updateAge`）。
- cookie cache 最长 5 分钟；它不是 session 有效期。

验证方式：登录后检查服务端返回的 session 过期时间，或在测试环境检查 `auth_session.expiresAt` 约为 30 天后。不要等待 30 天作为自动化测试步骤，也不要以“7 天后过期”作为验收标准。

## 4. 路由保护和登出

未登录时访问 `/quilts`、`/cards`、`/usage`、`/settings`、`/analytics`、`/reports` 和 `/users`，预期均被重定向到登录页。

登录后登出，预期 session 被清除、回到登录页，且原受保护页面不能继续读取数据。直接清除 cookie 后访问受保护页面也应得到相同的未认证结果。

## 5. 模块授权

使用只授权 `quilts` 的 member：

- 可以访问 `/quilts` 并执行产品允许的操作。
- 访问 `/cards`、cards 相关 usage/Agent 能力时被拒绝或不可用。
- 不能仅通过隐藏导航、直接 URL、Route Handler 或 Server Action 绕过授权。

使用只授权 `cards` 的 member 重复上述测试，验证反向边界。使用管理员账号验证管理员可以按统一授权函数访问所有已启用模块。QMS 业务数据是家庭共享数据，不按登录用户做行级隔离；本测试验证的是模块入口授权，不是 userId 数据过滤。

同时验证模块授权覆盖四类入口：Server Page、Server Action、Route Handler 和 Agent tool。Agent key 继承创建者的角色与 active modules；写操作还必须提供确认和幂等 key。

## 6. 双语和基础回归

- 切换 `en`/`zh`，登录、错误、登出、用户管理和模块访问提示均有对应文案。
- 浏览器刷新和多个标签页不会让未授权用户获得模块访问权。
- 检查认证 cookie 为 HTTP-only，并确认生产环境使用 HTTPS。

## 测试完成标准

- [ ] 管理员可以创建 member，公开注册被禁用
- [ ] 12 位密码边界和错误密码处理正确
- [ ] Better Auth 30 天 session 配置符合预期
- [ ] 登出和未认证路由保护正常
- [ ] member/admin 的模块授权边界正常
- [ ] Page、Action、API、Agent 入口不能绕过授权
- [ ] 中英文认证相关文案正常

## 相关配置

- `src/auth.ts`：Better Auth、30 天 session、12 位密码和禁用注册
- `src/proxy.ts`：路由保护
- `src/lib/module-access.ts`：模块授权
- `src/app/[locale]/users/_components/UsersPageClient.tsx`：管理员用户管理界面
