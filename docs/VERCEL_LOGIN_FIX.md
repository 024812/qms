# Vercel 登录问题修复指南

## 问题描述
登录在本地正常工作，但在 Vercel 部署后失败。

## 根本原因
Vercel 环境变量未正确配置，导致 NextAuth.js 无法正常工作。

## 解决步骤

### 第 1 步：运行诊断脚本（本地）

在本地运行诊断脚本，确认数据库和用户配置正确：

```bash
npm run diagnose-auth
```

这会检查：
- ✅ 环境变量配置
- ✅ 数据库连接
- ✅ 用户是否存在
- ✅ 密码是否正确

如果本地诊断通过，继续下一步。

### 第 2 步：配置 Vercel 环境变量

1. **访问 Vercel Dashboard**
   - 打开 https://vercel.com
   - 进入你的项目
   - 点击 "Settings" -> "Environment Variables"

2. **设置必需的环境变量**

   **DATABASE_URL** (必需)
   ```
   变量名: DATABASE_URL
   值: postgresql://[user]:[password]@[host]/[database]?sslmode=require
   应用到: Production, Preview, Development
   ```
   
   **NEXTAUTH_SECRET** (必需)
   ```
   变量名: NEXTAUTH_SECRET
   值: [生成的密钥 - 见下方]
   应用到: Production, Preview, Development
   ```
   
   生成 NEXTAUTH_SECRET：
   ```bash
   # Windows PowerShell
   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
   
   # Linux/Mac
   openssl rand -base64 32
   ```
   
   **NEXTAUTH_URL** (推荐)
   ```
   变量名: NEXTAUTH_URL
   值: https://your-app-name.vercel.app
   应用到: Production
   ```
   
   注意：将 `your-app-name.vercel.app` 替换为你的实际 Vercel 域名。

3. **保存环境变量**
   - 点击 "Save" 保存每个变量
   - 确认所有变量都已添加

### 第 3 步：重新部署

环境变量更改后，必须重新部署：

**方法 1：通过 Vercel Dashboard**
1. 进入 "Deployments" 标签
2. 点击最新部署右侧的 "..." 菜单
3. 选择 "Redeploy"
4. 确认重新部署

**方法 2：推送新 Commit**
```bash
git commit --allow-empty -m "Trigger redeploy for env vars"
git push
```

### 第 4 步：验证修复

1. **等待部署完成**
   - 在 Vercel Dashboard 查看部署状态
   - 等待显示 "Ready"

2. **清除浏览器缓存**
   - Chrome: Ctrl+Shift+Delete -> 清除 Cookies 和缓存
   - 或使用无痕模式测试

3. **测试登录**
   - 访问 `https://your-app.vercel.app/login`
   - 使用以下凭据登录：
     - 邮箱: `lixi@oheng.com`
     - 密码: `passwd12`

4. **验证 Session**
   - 登录成功后，访问 `/debug-session`
   - 确认显示：
     - Status: `authenticated`
     - Role: `admin`
     - Active Modules: `["quilt", "card"]`

### 第 5 步：查看日志（如果仍然失败）

如果登录仍然失败，查看 Vercel 日志：

1. **访问 Function Logs**
   - Vercel Dashboard -> Deployments
   - 点击最新部署
   - 点击 "Functions" 标签
   - 查找 `/api/auth/callback/credentials`

2. **查找关键日志**
   - `[AUTH]` - 认证流程
   - `[LOGIN]` - 登录操作
   - `[AUTH ERROR]` - 错误详情

3. **常见错误及解决方案**

   **错误：hasSecret: false**
   ```
   [AUTH] Environment check: { hasSecret: false, ... }
   ```
   解决：NEXTAUTH_SECRET 未设置或未生效，重新部署

   **错误：Database connection failed**
   ```
   Error: getaddrinfo ENOTFOUND
   ```
   解决：DATABASE_URL 不正确，检查连接字符串

   **错误：User not found**
   ```
   [AUTH] User not found: lixi@oheng.com
   ```
   解决：用户不存在，运行 `npm run add-oheng-user`

   **错误：Invalid password**
   ```
   [AUTH] Invalid password for user
   ```
   解决：密码不匹配，运行 `npm run setup-password`

## 快速检查清单

在 Vercel 上：
- [ ] DATABASE_URL 已设置
- [ ] NEXTAUTH_SECRET 已设置（32+ 字符）
- [ ] NEXTAUTH_URL 已设置（生产环境 URL）
- [ ] 环境变量应用到 Production
- [ ] 已重新部署应用

在浏览器：
- [ ] 已清除缓存和 Cookies
- [ ] 可以访问登录页面
- [ ] 登录成功并跳转到首页
- [ ] /debug-session 显示 authenticated

## 额外资源

- **详细环境变量说明**: `docs/VERCEL_ENV_CHECK.md`
- **诊断脚本**: `npm run diagnose-auth`
- **测试登录**: `npm run test-login`
- **NextAuth.js 文档**: https://authjs.dev/getting-started/deployment

## 需要帮助？

如果按照以上步骤仍无法解决，请提供：
1. 诊断脚本输出（`npm run diagnose-auth`）
2. Vercel Function Logs 截图
3. `/debug-session` 页面截图
4. 浏览器控制台错误信息

---

**最后更新**: 2026-01-19
**适用版本**: Next.js 16.1.1, NextAuth.js 5.0.0-beta.30
