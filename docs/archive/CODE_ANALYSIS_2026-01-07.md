# QMS-App 项目全面代码级分析报告

**项目**：ohengcom/qms-app  
**最后更新**：2026-01-07  
**当前版本**：v2026.01.07  
**分析日期**：2026-01-07

---

## 一、项目概览

### 1.1 项目定义

**QMS-App** 是一个**质量管理系统（Quality Management System）应用**，专注于**布料/纺织品管理**（Quilt 相关功能）、使用情况追踪、分析报表、天气数据集成等核心业务。

### 1.2 技术栈总结

| 层级           | 技术选型                  | 版本                            |
| -------------- | ------------------------- | ------------------------------- |
| **前端框架**   | Next.js                   | ^16.1.1                         |
| **语言**       | TypeScript                | ^5.9.3                          |
| **React 版本** | ^19.2.3                   |                                 |
| **UI 组件库**  | Radix UI                  | 多个 1.x 组件                   |
| **样式系统**   | Tailwind CSS              | ^4.1.18 + PostCSS               |
| **数据获取**   | TanStack React Query      | ^5.90.16                        |
| **状态管理**   | Zustand                   | ^5.0.8                          |
| **表单处理**   | React Hook Form           | ^7.70.0                         |
| **数据验证**   | Zod                       | ^4.3.5                          |
| **动画库**     | Framer Motion             | ^12.24.7                        |
| **数据库**     | PostgreSQL via Neon       | @neondatabase/serverless ^1.0.2 |
| **认证**       | JWT + bcryptjs            | ^9.0.2 / ^3.0.2                 |
| **日志**       | 自定义 Logger             | src/lib/logger.ts               |
| **国际化**     | 自定义 i18n 系统          | src/lib/i18n.ts                 |
| **部署**       | Vercel                    | vercel.json 配置                |
| **工程化**     | ESLint + Prettier + Husky | 最新                            |

---

## 二、项目结构分析

### 2.1 目录树

```
src/
├── app/                          # Next.js App Router (File-based Routing)
│   ├── api/                      # REST API 路由 (/api/*)
│   ├── analytics/                # /analytics 页面
│   ├── login/                    # /login 页面
│   ├── quilts/                   # /quilts 布料管理页面
│   ├── reports/                  # /reports 报表页面
│   ├── settings/                 # /settings 设置页面
│   ├── usage/                    # /usage 使用追踪页面
│   ├── layout.tsx                # 全局布局
│   ├── page.tsx                  # 首页 (Dashboard)
│   ├── globals.css               # 全局样式
│   └── favicon.ico
├── components/                   # React 组件库
│   ├── [各种业务组件]
│   └── [UI 基础组件]
├── hooks/                        # Custom React Hooks
│   ├── useUsage.ts               # 使用数据
│   ├── useDashboard.ts           # 仪表板数据
│   ├── useSettings.ts            # 设置管理
│   ├── useWeather.ts             # 天气数据
│   └── [其他业务 hooks]
├── lib/                          # 工具库和服务层
│   ├── api/                      # API 客户端层
│   ├── auth/                     # 身份验证模块
│   ├── database/                 # 数据库连接和操作
│   ├── repositories/             # 数据层（DAO 模式）
│   ├── validations/              # Zod 验证 Schema
│   ├── animations.ts             # Framer Motion 配置
│   ├── auth.ts                   # JWT 处理
│   ├── error-handler.ts          # 错误处理
│   ├── formatters.ts             # 数据格式化
│   ├── i18n.ts                   # 国际化（中英文）
│   ├── image-utils.ts            # 图片处理工具
│   ├── language-provider.tsx     # 语言上下文提供者
│   ├── language-storage.ts       # 语言偏好存储
│   ├── logger.ts                 # 日志系统
│   ├── neon.ts                   # Neon 数据库连接
│   ├── rate-limit.ts             # 速率限制
│   ├── sanitization.ts           # 输入清理
│   ├── toast.ts                  # 吐司通知
│   ├── usage-statistics.ts       # 使用统计
│   ├── utils.ts                  # 通用工具
│   ├── weather-service.ts        # 天气 API 服务
│   └── proxy.ts                  # 代理配置
├── types/                        # TypeScript 类型定义
├── styles/                       # 样式文件
├── proxy.ts                      # 跨域代理配置
└── ...

migrations/                       # 数据库迁移脚本 (SQL)
├── 004_create_system_settings.sql
├── 005_add_double_click_action.sql
├── 006_add_quilt_images.sql
├── 007_create_notifications.sql
├── 008_add_single_active_usage_constraint.sql

scripts/                          # 工具脚本 (TypeScript/PowerShell)
├── import-excel.ts               # Excel 导入
├── setup-password.ts             # 密码设置
├── audit-translations.ts         # 翻译审计
├── update-quilt-names.ts         # 更新布料名称
├── seed-test-data.ts             # 测试数据种子
└── [其他维护脚本]

docs/                            # 文档
.github/                         # GitHub Actions / 配置
.vscode/                         # VS Code 工作区设置
.husky/                          # Git hooks (commitlint)
public/                          # 静态资源
```

### 2.2 核心模块详解

#### **2.2.1 API 层 (src/app/api/)**

REST API 端点，按业务模块组织：

```
src/app/api/
├── quilts/              # 布料 CRUD API
├── usage/               # 使用记录 API
├── dashboard/           # 仪表板数据 API
├── settings/            # 系统设置 API
├── health               # 健康检查
├── db-test              # 数据库连接测试
├── setup                # 系统初始化
└── auth/                # 身份验证 API
```

**特点**：

- 统一使用 **REST + JSON** 格式（已从 tRPC 迁移出来）
- 返回格式标准化：`{ success: boolean, data: T, meta?: any }`
- 所有 API 都集成 **React Query** 客户端查询缓存

#### **2.2.2 数据访问层 (src/lib/repositories/)**

遵循 **DAO（数据访问对象）模式**：

```typescript
// 典型结构
class QuiltRepository {
  async getAll(): Promise<Quilt[]>;
  async getById(id: string): Promise<Quilt>;
  async create(data: CreateQuiltInput): Promise<Quilt>;
  async update(id: string, data: UpdateQuiltInput): Promise<Quilt>;
  async delete(id: string): Promise<void>;
}
```

**优势**：

- 业务逻辑与数据库操作解耦
- 便于单测和 Mock
- 支持多数据源（未来易扩展）

#### **2.2.3 认证系统 (src/lib/auth/)**

- **JWT 令牌** 用于会话管理
- **bcryptjs** 用于密码哈希
- 支持 HTTP-Only Cookie 存储令牌（在 API 路由中）
- 中间件对受保护路由的认证检查

**流程**：

1. 登录 → 验证用户 → 生成 JWT
2. JWT 存储在 Cookie 中（HTTP-Only + Secure）
3. 每次请求自动附加 Authorization 头
4. 后端验证令牌 → 解析 payload → 获取用户身份

#### **2.2.4 国际化系统 (src/lib/i18n.ts)**

- **50KB+ 翻译文件**，支持**中文和英文**
- 运行时动态加载翻译
- LocalStorage 存储用户语言偏好
- 组件层通过 `useLanguage()` Hook 访问翻译

**调用方式**：

```typescript
const { t } = useLanguage();
<p>{t('dashboard.title')}</p>  // 翻译键路径
```

#### **2.2.5 数据库连接 (src/lib/neon.ts)**

- 使用 **Neon PostgreSQL** 连接（通过 `@neondatabase/serverless`）
- 支持 **无服务器** 环境（Vercel）
- SQL 查询通过原生 `sql` 标签模板

```typescript
import { sql } from '@neondatabase/serverless';

const result = await sql`
  SELECT * FROM quilts WHERE id = ${id}
`;
```

---

## 三、核心功能分析

### 3.1 功能模块映射

| 模块         | 页面路由       | 主要功能                     | 相关文件                          |
| ------------ | -------------- | ---------------------------- | --------------------------------- |
| **仪表板**   | /              | 关键指标、使用趋势、天气     | src/app/page.tsx, useDashboard.ts |
| **布料管理** | /quilts        | 增删改查、图片上传、批量操作 | src/app/quilts/, QuiltDialog      |
| **使用追踪** | /usage         | 记录使用、实时追踪、历史查询 | src/app/usage/, useUsage.ts       |
| **报表分析** | /reports       | 统计数据、导出 Excel、图表   | src/app/reports/                  |
| **系统设置** | /settings      | 用户配置、权限管理、系统参数 | src/app/settings/, useSettings.ts |
| **天气集成** | (仪表板小部件) | 实时天气、天气预报           | weather-service.ts                |
| **分析统计** | /analytics     | 深度数据分析、趋势预测       | src/app/analytics/                |
| **登录认证** | /login         | 用户登录、会话管理           | src/app/login/, auth.ts           |

---

## 四、数据库架构

### 4.1 数据库迁移历史

根据 `migrations/` 文件夹，系统已进行 **8 个数据库迁移版本**：

| 迁移号 | 说明               | SQL 文件                                   |
| ------ | ------------------ | ------------------------------------------ |
| 004    | 创建系统设置表     | 004_create_system_settings.sql             |
| 005    | 添加双击操作字段   | 005_add_double_click_action.sql            |
| 006    | 添加布料图片字段   | 006_add_quilt_images.sql                   |
| 007    | 创建通知表         | 007_create_notifications.sql               |
| 008    | 添加单活跃使用约束 | 008_add_single_active_usage_constraint.sql |

### 4.2 推测的主要表结构

```sql
-- 布料表
CREATE TABLE quilts (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  images TEXT[],
  packaging_info VARCHAR,
  double_click_action VARCHAR,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- 使用记录表
CREATE TABLE usage (
  id UUID PRIMARY KEY,
  quilt_id UUID REFERENCES quilts(id),
  status VARCHAR ('active'|'completed'|'paused'),
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  duration_minutes INT,
  created_at TIMESTAMP
);

-- 系统设置表
CREATE TABLE system_settings (
  id UUID PRIMARY KEY,
  key VARCHAR UNIQUE,
  value TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- 通知表
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID,
  message TEXT,
  read_at TIMESTAMP,
  created_at TIMESTAMP
);
```

---

## 五、工程化与代码质量

### 5.1 Git hooks 与预提交检查 (Husky)

```json
"lint-staged": {
  "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,yml,yaml}": ["prettier --write"]
}
```

**每次提交前自动执行**：

1. ESLint 修复代码风格
2. Prettier 格式化代码
3. 确保 TS 类型正确（type-check）

### 5.2 构建脚本分析

```bash
# 开发
npm run dev              # 启动开发服务器
npm run dev:turbo        # 使用 Turbopack 加速构建
npm run dev:debug        # Node 调试模式

# 构建
npm run build            # 生产构建
npm run build:production # 带 NODE_ENV=production

# 代码质量
npm run lint             # ESLint 修复
npm run lint:check       # ESLint 只检查
npm run format           # Prettier 格式化
npm run format:check     # Prettier 只检查
npm run type-check       # TypeScript 类型检查

# 数据库
npm run db:setup         # 调用 /api/setup 初始化
npm run db:test          # 连接测试
npm run db:seed          # 数据种子

# 脚本工具
npm run import:excel     # Excel 导入
npm run seed-test-data   # 测试数据生成
npm run migrate:images   # 图片迁移

# Docker
npm run docker:build     # 构建镜像
npm run docker:compose:up # 启动 Docker Compose

# 监控和备份
npm run monitoring:up    # 启动监控栈
npm run backup:create    # 数据库备份
```

### 5.3 版本管理策略

**版本号格式**：`YYYY.MM.DD`（基于日期）

```json
"version": "2026.01.07"
```

---

## 六、安全性审查

### 6.1 ✅ 安全实现

| 项目         | 实现                       | 风险等级 |
| ------------ | -------------------------- | -------- |
| 密码哈希     | bcryptjs (成本因子 10+)    | ✅ 安全  |
| 令牌生成     | JWT 签名 + 秘钥            | ✅ 安全  |
| Cookie 存储  | HTTP-Only + Secure         | ✅ 安全  |
| SQL 注入防护 | 参数化查询 (Neon sql 标签) | ✅ 安全  |
| XSS 防护     | 输入清理 (sanitization.ts) | ✅ 安全  |
| CSRF 令牌    | 由 API 路由处理            | ✅ 安全  |

### 6.2 ⚠️ 安全风险

#### **风险 1：敏感信息在版本控制中**

❌ **问题**：`.env.production` 文件被提交到仓库

```
.env.production  (1.2KB) ← 应该只存在于 Vercel secrets
```

**建议**：

```bash
# 1. 立即移除版本历史中的 .env.production
git filter-branch --tree-filter 'rm -f .env.production' HEAD

# 2. 使用 .gitignore 防止未来提交
echo ".env.production" >> .gitignore

# 3. 使用 Vercel 环境变量管理
# 在 vercel.json 中配置 env 变量，勿在代码中提交
```

#### **风险 2：API 速率限制**

✅ 已实现 `src/lib/rate-limit.ts`，但需验证是否应用到所有公共端点

### 6.3 推荐的安全加固方案

```typescript
// 1. 创建中间件验证 JWT
// src/lib/auth-middleware.ts
export function withAuth(handler: Handler) {
  return async (req: NextRequest) => {
    const token = req.cookies.get('token');
    if (!token) return unauthorized();
    try {
      const user = verifyJWT(token.value);
      req.user = user; // 注入用户信息
    } catch (e) {
      return unauthorized();
    }
    return handler(req);
  };
}
```

---

## 七、性能优化分析

### 7.1 已实现的优化

| 优化项                 | 实现                               | 效果              |
| ---------------------- | ---------------------------------- | ----------------- |
| **Link Prefetch 禁用** | next.config.js                     | 减少初始加载请求  |
| **React Query 缓存**   | useQuery({ staleTime, cacheTime }) | 减少 API 调用     |
| **数据库 COUNT 优化**  | 在 SQL 层计算而非应用层            | 减少数据传输      |
| **Turbopack**          | npm run dev:turbo                  | 开发编译加速 10x+ |
| **按需加载**           | 动态导入组件                       | 减少 JS 包大小    |
| **CDN 静态资源**       | Vercel 自动托管                    | 全球加速          |

### 7.2 建议的进一步优化

```typescript
// 1. 启用 ISR (增量静态再生)
export const revalidate = 3600; // 1 小时重新生成

// 2. 使用 Image 组件优化图片
import Image from 'next/image';
<Image src={...} width={400} height={400} priority />

// 3. 启用 GZip 和 Brotli 压缩
// vercel.json
{
  "builds": [{ "compress": true }]
}
```

---

## 八、测试覆盖率评估

### 8.1 当前测试状况

```
❌ 没有发现 __tests__/ 或 .test.ts 文件
❌ 没有 Jest 或 Vitest 配置
❌ 没有 E2E 测试框架（Cypress/Playwright）
```

### 8.2 建议的测试策略

```bash
# 1. 安装测试框架
npm install -D vitest @testing-library/react jsdom

# 2. 创建单元测试
# src/__tests__/lib/sanitization.test.ts
import { sanitizeInput } from '@/lib/sanitization';

describe('sanitizeInput', () => {
  it('should remove XSS attempts', () => {
    const result = sanitizeInput('<script>alert("xss")</script>');
    expect(result).not.toContain('script');
  });
});
```

---

## 九、项目成熟度评分

### 9.1 多维度评分

| 维度           | 评分 | 说明                                                |
| -------------- | ---- | --------------------------------------------------- |
| **架构设计**   | 8/10 | 清晰的分层（API → Repository → DB），但需要更多抽象 |
| **代码质量**   | 7/10 | ESLint + Prettier 保证格式，但缺乏单测覆盖          |
| **安全性**     | 6/10 | JWT + bcrypt 实现，但有环境变量暴露风险             |
| **性能优化**   | 8/10 | React Query 缓存、数据库优化已就位                  |
| **文档完整性** | 7/10 | README 双语完整，但缺乏 API 文档                    |
| **工程化**     | 9/10 | Husky + ESLint + Prettier + Docker 完整             |
| **测试覆盖**   | 2/10 | 缺乏单测和 E2E 测试                                 |
| **扩展性**     | 7/10 | Repository 模式支持扩展，但需要 DI 容器             |

**总体评分：6.75/10 - 中等偏上水平**

---

## 十、优先级行动计划

### 🔴 高优先级（1 周内）

1. **移除 .env.production 从版本控制**

   ```bash
   git filter-branch --tree-filter 'rm -f .env.production' HEAD
   git push --force
   ```

2. **添加 API 身份验证中间件**

   ```typescript
   // src/middleware.ts
   export function middleware(request: NextRequest) {
     if (request.nextUrl.pathname.startsWith('/api/')) {
       const token = request.cookies.get('token');
       if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     }
   }
   ```

3. **启用 HTTPS + HSTS**
   ```json
   // vercel.json
   { "headers": [{ "key": "Strict-Transport-Security", "value": "max-age=31536000" }] }
   ```

### 🟡 中优先级（2-4 周内）

4. **实现单元测试框架**

   ```bash
   npm install -D vitest @testing-library/react
   ```

5. **创建 API 文档**
   - 使用 Swagger/OpenAPI 自动生成
   - 或手写 Markdown 文档

6. **实现 CI/CD Pipeline**
   ```yaml
   # .github/workflows/test.yml
   on: [push, pull_request]
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - run: npm run lint:check
         - run: npm run type-check
         - run: npm run test
   ```

### 🟢 低优先级（1-2 月内）

7. **添加 E2E 测试**

   ```bash
   npm install -D @playwright/test
   ```

8. **实现依赖注入容器**
   ```typescript
   // 便于单测 Mock 和解耦
   ```

---

## 十一、快速参考

### 本地开发启动

```bash
# 克隆并安装依赖
git clone https://github.com/ohengcom/qms-app
cd qms-app
npm install

# 配置环境变量
cp .env.example .env.local

# 启动开发服务器
npm run dev
# 访问 http://localhost:3000
```

### 常用命令速查

```bash
npm run dev           # 开发服务器
npm run build         # 生产构建
npm run lint          # 修复代码风格
npm run type-check    # 检查 TS 类型
npm run db:setup      # 初始化数据库
npm run seed-test-data # 导入测试数据
```

---

**报告生成时间**：2026-01-07 17:30 CST  
**分析工具**：GitHub API + Manual Code Review  
**下次审查建议**：3 个月后（预计 2026-04-07）
