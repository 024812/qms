# QMS Project Summary

当前版本：`2026.7.17`

## 当前定位

QMS 是一个面向家庭共享使用的物品管理系统。系统刻意采用家庭级共享数据模型，不按登录用户隔离业务数据；认证用于保护访问入口、角色权限、模块开关和外部 Agent API key。

> **Review 决策记录：家庭业务数据不做用户级隔离。** `quilts`、`cards`、`usage`、统计和报表属于同一家庭的共享数据集。查询没有按 `userId` 过滤是明确的产品设计，不应在后续 review 中作为越权漏洞重复提交。只有账户私有数据（会话、密码、个人 API key）必须按用户隔离；角色、模块权限和外部入口仍必须鉴权。

项目当前的重点是保持模块可复制、数据入口清晰、部署流程可验证。`quilts` 和 `cards` 是第一批标准化模块。

## 当前架构

### 页面结构

- 页面位于 `src/app/[locale]/**`。
- 首屏数据优先在 Server Component 中获取。
- 交互状态下沉到模块私有 `_components/*`。
- 内部 UI 主要通过 Server Actions 和 canonical data layer 读写数据。

### 数据真相源

- 每个模块只保留一个 canonical data layer：`src/lib/data/<module>.ts`。
- 每个模块只保留一个 canonical server action surface：`src/app/actions/<module>.ts`。
- `/api/**` 主要用于兼容、外部集成、健康检查或明确的 HTTP surface，不作为内部 UI 的默认读写路径。

### 数据库与迁移

- 生产和开发迁移目标均为 Neon Postgres。
- 不使用本地 `localhost:5432` 数据库作为本项目迁移目标。
- Drizzle schema 位于 `src/db/schema.ts`，SQL migrations 位于 `drizzle/`。
- 当前 Neon 迁移历史已应用到 `0007_gifted_morlocks`；该迁移校正 Quilt 编号序列、清理重复活跃使用记录，并建立单 Quilt 单活跃记录唯一索引。
- 标准迁移命令是 `npm run db:migrate`。

### 缓存策略

- 服务端共享数据使用 Next.js 16 的 cache primitives、cache tags 和显式失效。
- 客户端保留 TanStack React Query 包装层，主要负责交互态、局部同步和用户体验。

### 路由与认证

- Next.js 16 路由保护使用 `src/proxy.ts`。
- Better Auth 负责登录、会话和认证表；公开注册已关闭，账号只能由管理员创建。
- 用户角色和启用模块保存在 `users.preferences`。
- 家庭共享业务数据不按用户隔离，这是产品设计，不是待修复问题。

### Agent API

- 外部 AI agent 使用 `/api/agent/openapi.json` 获取受限 OpenAPI 描述。
- 所有 agent 工具调用集中到 `/api/agent/tools`。
- 写入操作必须提供 `confirm=true` 和 `idempotencyKey`，也可以使用 `dryRun=true` 预览计划。
- 已成功写入的 `idempotencyKey` 会记录到 `agent_idempotency_keys`，重复请求可以安全重放。
- Agent API keys 存为数据库哈希，继承创建者的角色和模块权限，不暴露通用数据库访问能力。
- 每次 Agent 调用都绑定 API key 所属 `userId`；审计日志的 `userId` 和 metadata 中的 `actorUserId` 用于追踪责任主体。该绑定用于权限继承和审计，不改变家庭业务数据共享模型。

## 2026.7.17 收口重点

- 关闭公开注册页面、Server Action 和 `/api/auth/sign-up/*` 服务端入口，仅保留管理员创建账号。
- 为 AI、天气、旧 items actions 和兼容 API 补齐会话校验、限流、输入边界与错误脱敏。
- 将 Quilt 状态与使用记录变更收敛到事务路径，并在数据库层限制每个 Quilt 只能有一条活跃记录。
- 增加管理员专用 `.xlsx` 导入预览与确认流程，限制文件大小并检测重复数据。
- 删除被追踪的生产环境文件，统一图片、附件、日期和请求体校验。
- 补齐 PWA manifest 与安全的静态资源 Service Worker，修复 i18n 和移动端缩放问题。
- 整理文档目录，将架构、指南、报告和历史资料分开维护。

## 新模块复制时的最小模板

1. 在 `src/modules/<module>/` 放入 `blueprint.ts`、`schema.ts`、`types.ts`。
2. 在 `src/lib/data/<module>.ts` 实现唯一的数据读写与缓存失效。
3. 在 `src/app/actions/<module>.ts` 暴露唯一的内部 action 入口。
4. 在 `src/app/[locale]/<module>/page.tsx` 建立 server page shell。
5. 在 `src/app/[locale]/<module>/_components/*` 放置 client shell 和交互组件。
6. 为模块定义清晰的 cache tags 和 query keys。

## 持续约束

- 不新增第二套并行 repository 或 cached repository。
- 不让页面重新直接拼装数据库查询。
- 不让内部 UI 重新依赖 `/api/**` 作为主路径。
- 数据库迁移默认指向 Neon，不指向本地 PostgreSQL。
- 文档更新必须和 `package.json` 版本、根 README、`docs/README.md`、`CHANGELOG.md` 同步。
