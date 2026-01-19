# Vercel 环境变量检查清单

## 问题症状
- 登录失败，显示 "failed login"
- Session 状态始终是 `unauthenticated`
- 本地测试密码正确，但 Vercel 上登录失败
- 日志显示 "Unauthorized access attempt"

## 快速诊断

在本地运行诊断脚本：
```bash
npx tsx scripts/diagnose-vercel-auth.ts
```

这个脚本会检查：
- ✅ 环境变量是否设置
- ✅ 数据库连接是否正常
- ✅ 测试用户是否存在
- ✅ 密码是否正确

## 必需的环境变量

### 1. DATABASE_URL
数据库连接字符串（Neon PostgreSQL）

**检查方法：**
1. 登录 Vercel Dashboard
2. 进入项目 Settings -> Environment Variables
3. 确认 `DATABASE_URL` 存在且值正确

**正确格式：**
```
postgres://[user]:[password]@[host]/[database]?sslmode=require
```

### 2. NEXTAUTH_SECRET
NextAuth.js 用于加密 JWT token 的密钥

**检查方法：**
1. 在 Vercel Environment Variables 中查找 `NEXTAUTH_SECRET`
2. 如果不存在，需要生成一个

**生成方法：**
```bash
# 在本地运行
openssl rand -base64 32
```

**设置位置：**
- Vercel Dashboard -> Settings -> Environment Variables
- 添加 `NEXTAUTH_SECRET` = [生成的密钥]
- 应用到：Production, Preview, Development

### 3. NEXTAUTH_URL
应用的完整 URL

**检查方法：**
1. 在 Vercel Environment Variables 中查找 `NEXTAUTH_URL`
2. 确认值是您的 Vercel 部署 URL

**正确格式：**
```
https://your-app-name.vercel.app
```

**注意：**
- 必须是 HTTPS
- 不要在末尾加斜杠
- 应用到：Production, Preview, Development

## 检查步骤

### 步骤 1：查看当前环境变量
1. 访问：https://vercel.com/[your-username]/[project-name]/settings/environment-variables
2. 检查以下变量是否存在：
   - ✅ DATABASE_URL
   - ✅ NEXTAUTH_SECRET
   - ✅ NEXTAUTH_URL

### 步骤 2：验证 DATABASE_URL
运行本地脚本测试数据库连接：
```bash
npm run check-user-role
```

如果成功，说明 DATABASE_URL 正确。

### 步骤 3：生成并设置 NEXTAUTH_SECRET
如果没有 NEXTAUTH_SECRET：

**Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Linux/Mac:**
```bash
openssl rand -base64 32
```

复制生成的字符串，在 Vercel 中添加为 `NEXTAUTH_SECRET`。

### 步骤 4：设置 NEXTAUTH_URL
在 Vercel Environment Variables 中添加：
```
NEXTAUTH_URL=https://your-actual-domain.vercel.app
```

### 步骤 5：重新部署
设置完环境变量后：
1. 在 Vercel Dashboard 点击 "Redeploy"
2. 或者推送一个新的 commit 触发部署

## 验证修复

部署完成后：
1. 清除浏览器缓存和 cookies
2. 访问 `/login`
3. 使用邮箱 `lixi@oheng.com` 和密码 `passwd12` 登录
4. 登录后访问 `/debug-session` 查看 session 状态

**期望结果：**
- Session Status: `authenticated`
- Session Data 包含用户信息
- User Role: `admin`
- Active Modules: `["quilt", "card"]`

## 查看 Vercel 部署日志

如果登录仍然失败，查看详细日志：

### 方法 1：Vercel Dashboard
1. 访问 https://vercel.com/[your-username]/[project-name]
2. 点击 "Deployments" 标签
3. 点击最新的部署
4. 点击 "Functions" 标签
5. 找到并点击失败的函数（通常是 `/api/auth/callback/credentials`）
6. 查看日志输出

### 方法 2：Vercel CLI
```bash
# 安装 Vercel CLI（如果还没有）
npm i -g vercel

# 登录
vercel login

# 查看实时日志
vercel logs [deployment-url] --follow
```

### 关键日志标识
查找以下日志前缀：
- `[AUTH]` - 认证流程日志
- `[LOGIN]` - 登录操作日志
- `[AUTH ERROR]` - 认证错误
- `Authorization error:` - 授权失败详情

### 常见错误日志及解决方案

**错误 1: "NEXTAUTH_SECRET is not set"**
```
[AUTH] Environment check: { hasSecret: false, ... }
```
解决：在 Vercel 设置 NEXTAUTH_SECRET

**错误 2: "Database connection failed"**
```
Error: getaddrinfo ENOTFOUND ...
```
解决：检查 DATABASE_URL 是否正确

**错误 3: "User not found"**
```
[AUTH] User not found: lixi@oheng.com
```
解决：运行 `npx tsx scripts/add-oheng-user.ts` 创建用户

**错误 4: "Invalid password"**
```
[AUTH] Invalid password for user: lixi@oheng.com
```
解决：运行 `npx tsx scripts/setup-password.ts` 重置密码

## 常见问题

### Q: 设置了环境变量但还是不工作？
A: 确保重新部署了应用。环境变量更改不会自动应用到现有部署。

### Q: 本地可以登录，Vercel 上不行？
A: 检查 `.env.local` 和 Vercel 环境变量是否一致，特别是 DATABASE_URL。

### Q: 如何查看 Vercel 部署日志？
A: Vercel Dashboard -> Deployments -> 点击最新部署 -> 查看 Function Logs

## 需要帮助？

如果按照以上步骤仍然无法解决问题，请提供：
1. Vercel 部署日志截图
2. `/debug-session` 页面截图
3. 浏览器控制台错误信息
