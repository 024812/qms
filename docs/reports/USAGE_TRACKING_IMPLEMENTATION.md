# Usage Tracking Implementation

> 文档状态：`historical`（实现记录，当前架构说明已按 QMS `2026.9.11` / MODULE_BLUEPRINT_V3 校正）。本文不是独立的当前 API 规范。

## 当前架构

- 权威数据表是 `usage_records`，同时保存 active 和 completed usage records；active 记录通过 `endDate IS NULL` 判断。
- 唯一业务数据访问层是 `src/lib/data/usage.ts`，负责查询、事务、Quilt 状态同步和 cache tag 失效。
- 应用内页面通过 typed Server Actions `src/app/actions/usage.ts` 读取和修改 usage 数据；Action 负责 session、`quilts` 模块授权、Zod 校验和稳定错误结果。
- `current_usage` 和 `usage_periods` 不是当前实现，不能作为当前表名、数据流或 API 合约引用。
- 跨表 usage/Quilt 状态变更在同一个 Drizzle transaction 中完成；数据库约束确保每个 Quilt 至多一个 active usage record。

## 当前能力

`usage.ts` 提供按 Quilt、active 状态和列表读取 usage records，支持关联 Quilt 信息、时长与统计，以及 create/update/end/delete。usage 变更会失效 usage、受影响 Quilt、stats、analytics 和 dashboard 的相关 cache tags。

`actions/usage.ts` 提供列表、详情、按 Quilt 查询、active 查询、统计和写操作的 typed Action contract。所有入口需要登录并具备 `quilts` 模块访问权；业务数据按产品设计为家庭共享，不按登录用户做行级隔离。

## 外部 HTTP 兼容面

仓库中仍可能存在 `/api/usage` 兼容或外部 HTTP route，但它不是内部页面和 Hook 的数据库真相层。新增内部读写应遵循 V3：Server Page/Client Shell -> typed Action/DAL；Route Handler 仅作为明确声明的 external/compatibility surface。

## 历史差异

旧实现记录曾描述 `current_usage` 与 `usage_periods` 的拆分、移动数据的 POST endpoint，以及“完整部署”的状态。这些描述已不适用于当前仓库。后续实现或测试应覆盖 Page、Action、Route Handler 的认证/模块授权、schema 边界、事务回滚、状态同步和 cache tags。

## 参考

- [MODULE_BLUEPRINT_V3.md](../architecture/MODULE_BLUEPRINT_V3.md)
- `src/db/schema.ts`
- `src/lib/data/usage.ts`
- `src/app/actions/usage.ts`
