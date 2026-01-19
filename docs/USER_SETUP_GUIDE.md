# 用户设置指南

## 问题：如何登录系统？

系统现在使用基于用户表的认证系统，需要**邮箱**和**密码**来登录。

## 解决方案：创建初始用户

### 方法 1：使用 create-user 脚本（推荐）

这是最简单的方法，脚本会交互式地引导你创建用户。

```bash
npm run create-user
```

脚本会询问：
1. **Name**（姓名）：输入你的名字，例如 `Admin`
2. **Email**（邮箱）：输入你的邮箱，例如 `admin@example.com`
3. **Password**（密码）：输入密码（至少 6 个字符）

示例输出：
```
👤 Create New User

Name: Admin
Email: admin@example.com
Password (min 6 characters): ******

⏳ Hashing password...
⏳ Creating user...

✅ User created successfully!

User Details:
  ID: 123e4567-e89b-12d3-a456-426614174000
  Name: Admin
  Email: admin@example.com
  Role: admin
  Active Modules: quilts

🔐 You can now login with:
  Email: admin@example.com
  Password: (the password you entered)
```

### 方法 2：直接在数据库中创建

如果你有数据库访问权限，可以直接运行 SQL：

```sql
-- 1. 首先生成密码哈希（使用 bcrypt，rounds=12）
-- 例如密码 "password123" 的哈希值

-- 2. 插入用户
INSERT INTO users (name, email, password, role, active_modules)
VALUES (
  'Admin',
  'admin@example.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIiIiIiIiI', -- 替换为实际的哈希值
  'admin',
  '["quilts"]'::jsonb
);
```

### 方法 3：使用 Neon 控制台

1. 登录 [Neon Console](https://console.neon.tech)
2. 选择你的项目
3. 进入 SQL Editor
4. 运行上面的 SQL 语句

## 登录信息

创建用户后，你可以使用以下信息登录：

- **邮箱**：你创建时输入的邮箱
- **密码**：你创建时输入的密码

## 默认设置

使用 `create-user` 脚本创建的用户会有以下默认设置：

- **角色（Role）**：`admin` - 管理员权限
- **激活模块（Active Modules）**：`["quilts"]` - 被子管理模块已激活

## 常见问题

### Q: 我忘记了密码怎么办？

A: 运行以下命令重置密码：

```bash
# 方法 1：删除旧用户，创建新用户
npm run create-user

# 方法 2：直接在数据库中更新密码哈希
# 使用 Neon Console 或其他数据库工具
```

### Q: 邮箱已存在怎么办？

A: 脚本会检测邮箱是否已存在。如果已存在，你需要：
1. 使用不同的邮箱
2. 或者删除现有用户后重新创建

删除现有用户（在数据库中）：
```sql
DELETE FROM users WHERE email = 'admin@example.com';
```

### Q: 可以创建多个用户吗？

A: 可以！多次运行 `npm run create-user` 即可创建多个用户，每个用户使用不同的邮箱。

### Q: 如何查看现有用户？

A: 在数据库中运行：
```sql
SELECT id, name, email, role, active_modules, created_at 
FROM users 
ORDER BY created_at DESC;
```

## 迁移说明

如果你之前使用的是简单密码认证（只需要密码，不需要邮箱），现在系统已升级为完整的用户管理系统。你需要：

1. 运行 `npm run create-user` 创建新用户
2. 使用新创建的邮箱和密码登录
3. 你的所有被子数据仍然保留在数据库中

## 技术细节

- **密码加密**：使用 bcrypt，12 rounds
- **用户表结构**：
  - `id`: UUID（主键）
  - `name`: 用户名
  - `email`: 邮箱（唯一）
  - `password`: 加密后的密码
  - `role`: 角色（admin/member）
  - `active_modules`: 激活的模块列表（JSON）
  - `created_at`: 创建时间
  - `updated_at`: 更新时间

## 需要帮助？

如果遇到问题，请检查：
1. 数据库连接是否正常（`npm run db:check`）
2. 环境变量是否配置正确（`.env.local` 中的 `DATABASE_URL`）
3. 用户表是否存在（运行 `npm run db:push` 创建表）
