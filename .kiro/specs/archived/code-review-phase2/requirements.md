# Requirements Document - QMS 项目架构简化

## Introduction

本文档是对 QMS（被子管理系统）项目的架构简化方案。基于用户反馈，决定移除 tRPC 框架，改用更简单直接的纯 REST API 架构。

**核心目标**：

1. 移除 tRPC，改用纯 Next.js API Routes + fetch
2. 简化项目架构，降低复杂度
3. 清理冗余文档和代码
4. 修复安全问题

## Glossary

- **QMS**: Quilt Management System，被子管理系统
- **REST API**: Representational State Transfer，表述性状态转移 API
- **Repository Pattern**: 仓储模式，数据访问层的设计模式
- **React Query**: 数据获取和缓存库

---

## 审查发现

### 一、移除 tRPC 🔴 高优先级

#### Requirement 1: 移除 tRPC，改用纯 REST API

**User Story:** As a developer, I want a simpler API architecture, so that the codebase is easier to understand and maintain.

##### 问题描述

当前项目使用 tRPC 作为 API 层，但对于单用户家庭应用来说过于复杂：

**需要移除的 tRPC 相关文件**：

- `src/server/api/trpc.ts` - tRPC 初始化
- `src/server/api/root.ts` - tRPC 路由聚合
- `src/server/api/routers/quilts.ts` - 被子 tRPC 路由
- `src/server/api/routers/usage.ts` - 使用记录 tRPC 路由
- `src/server/api/routers/dashboard.ts` - 仪表板 tRPC 路由
- `src/server/api/routers/settings.ts` - 设置 tRPC 路由
- `src/server/api/routers/notifications.ts` - 通知 tRPC 路由
- `src/server/api/routers/import-export.ts` - 导入导出 tRPC 路由
- `src/app/api/trpc/[trpc]/route.ts` - tRPC API 路由
- `src/lib/trpc.ts` - tRPC 客户端
- `src/lib/trpc-provider.tsx` - tRPC Provider
- `src/components/providers/TRPCProvider.tsx` - tRPC Provider 组件

**需要重构的 Hooks**：

- `src/hooks/useQuilts.ts` - 改用 fetch + React Query
- `src/hooks/useUsage.ts` - 改用 fetch + React Query
- `src/hooks/useDashboard.ts` - 改用 fetch + React Query
- `src/hooks/useSettings.ts` - 改用 fetch + React Query

**需要创建的 REST API 路由**：

- `src/app/api/quilts/route.ts` - GET (list), POST (create)
- `src/app/api/quilts/[id]/route.ts` - GET, PUT, DELETE
- `src/app/api/usage/route.ts` - GET (list), POST (create)
- `src/app/api/usage/[id]/route.ts` - GET, PUT, DELETE
- `src/app/api/dashboard/route.ts` - GET (stats)
- `src/app/api/settings/route.ts` - GET, PUT

**需要移除的依赖**：

- `@trpc/client`
- `@trpc/next`
- `@trpc/react-query`
- `@trpc/server`
- `superjson`

##### Acceptance Criteria

1. WHEN the tRPC migration is complete THEN the system SHALL not contain any tRPC-related code
2. WHEN making API calls THEN the system SHALL use standard fetch with React Query for caching
3. WHEN the migration is complete THEN all existing functionality SHALL continue to work
4. WHEN the dependencies are updated THEN the package.json SHALL not contain tRPC packages

---

### 二、文档清理 🟡 中优先级

#### Requirement 2: docs 目录文档过多需要清理

**User Story:** As a developer, I want minimal but useful documentation, so that I can quickly find relevant information.

##### 问题描述

`docs/` 目录仍有 25 个文档文件，很多是开发过程中的临时记录或已过时的内容：

**建议删除的文档**：

- `docs/ANALYSIS_COMPLETE.md` - 分析完成记录（临时）
- `docs/CLEANUP_COMPLETE_SUMMARY.md` - 清理完成总结（临时）
- `docs/CLEANUP_EXECUTION_PLAN.md` - 清理执行计划（已完成）
- `docs/CONSOLE_LOG_CLEANUP_FINAL.md` - console.log 清理（已完成）
- `docs/CONSOLE_LOG_CLEANUP_PROGRESS.md` - 清理进度（临时）
- `docs/PROJECT_CLEANUP_SUMMARY.md` - 项目清理总结（重复）
- `docs/PROJECT_OPTIMIZATION_ANALYSIS.md` - 优化分析（已完成）
- `docs/TODO_ANALYSIS.md` - TODO 分析（临时）
- `docs/TODO_CLEANUP_SUMMARY.md` - TODO 清理总结（临时）
- `docs/OPTIMIZATION_README.md` - 优化说明（可合并）
- `docs/OPTIMIZATION_UPDATE.md` - 优化更新（可合并）
- `docs/README_OPTIMIZATION.md` - README 优化（可合并）
- `docs/TEST_RESULTS.md` - 测试结果（临时）
- `docs/NOTIFICATION_SYSTEM_TESTING.md` - 通知测试（已完成）
- `docs/WEATHER_API_CHANGE.md` - 天气 API 变更（已完成）
- `docs/项目优化分析报告_中文.md` - 中文优化报告（可合并到 INDEX）

**建议保留的核心文档**：

- `docs/INDEX.md` - 文档索引
- `docs/README.md` - 文档说明
- `docs/DEPLOYMENT_SUMMARY.md` - 部署总结
- `docs/PRODUCTION_TESTING_CHECKLIST.md` - 生产测试清单
- `docs/PROJECT_SUMMARY.md` - 项目总结
- `docs/BACKUP_QUICK_START.md` - 备份快速开始
- `docs/BACKUP_RESTORE_GUIDE.md` - 备份恢复指南
- `docs/UI_OPTIMIZATION.md` - UI 优化（已合并）
- `docs/REFACTORING.md` - 重构文档（已合并）
- `docs/guides/` - 实现指南目录

##### Acceptance Criteria

1. WHEN reviewing the docs directory THEN the system SHALL contain only essential documentation files
2. WHEN a developer needs documentation THEN the system SHALL provide a clear INDEX.md with links to relevant guides
3. WHEN temporary or completed task documents exist THEN the system SHALL have them removed

---

### 三、安全性问题 🔴 高优先级

#### Requirement 3: executeQuery 函数存在 SQL 注入风险

**User Story:** As a security-conscious developer, I want safe database queries, so that the system is protected from SQL injection.

##### 问题描述

`src/lib/neon.ts` 中的 `executeQuery` 函数使用字符串替换处理参数，存在 SQL 注入风险：

```typescript
// 当前代码 - 使用字符串替换
params.forEach((param, index) => {
  const placeholder = `${index + 1}`;
  let escapedParam: string;
  // ... 手动转义
  processedQuery = processedQuery.replace(new RegExp(`\\${placeholder}\\b`, 'g'), escapedParam);
});
```

**问题**：

1. 手动转义可能不完整
2. 函数已标记为 `@deprecated` 但仍然存在
3. 应该完全移除

##### Acceptance Criteria

1. WHEN the deprecated executeQuery function is no longer used THEN the system SHALL remove it
2. WHEN executing database queries THEN the system SHALL only use Neon's native tagged template queries

---

### 四、代码清理 🟡 中优先级

#### Requirement 4: 清理通知系统相关代码

**User Story:** As a developer, I want a clean codebase without unused features.

##### 问题描述

通知系统相关代码仍然存在，需要清理：

**需要删除的文件**：

- `src/lib/notification-store.ts`
- `src/lib/repositories/notification.repository.ts`
- `src/components/NotificationPanel.tsx`

##### Acceptance Criteria

1. WHEN the notification system is removed THEN the system SHALL not contain any notification-related code
2. WHEN notifications are needed THEN the system SHALL use simple Toast notifications

---

#### Requirement 5: 检查并清理未使用的代码

**User Story:** As a developer, I want a clean codebase without dead code.

##### 问题描述

需要检查以下可能未使用的代码：

**可能未使用的组件**：

- `src/components/import/` - 导入组件
- `src/components/export/` - 导出组件
- `src/components/layout/` - 布局组件

**可能未使用的 Hooks**：

- `src/hooks/useOptimisticUpdates.ts` - 乐观更新 Hook
- `src/hooks/useQuiltsOptimized.ts` - 优化版 Quilts Hook

**可能未使用的工具**：

- `src/lib/excel-analyzer.ts` - Excel 分析器
- `src/lib/usage-statistics.ts` - 使用统计

##### Acceptance Criteria

1. WHEN a component or function is not used THEN the system SHALL have it removed
2. WHEN duplicate functionality exists THEN the system SHALL consolidate to a single implementation

---

### 五、版本号统一管理 � 高优先级

#### Requirement 6: 版本号需要统一管理

**User Story:** As a user, I want consistent version information across the entire application.

##### 问题描述

版本号在多个地方定义且不一致：

**当前版本号混乱情况**：

- `package.json`: "1.0.1"
- `README.md`: "1.0.2"
- `README_zh.md`: "1.0.2"
- `src/server/api/routers/settings.ts`: "0.5.0" (硬编码)
- `src/app/settings/page.tsx`: fallback "0.5.0"
- `CHANGELOG.md`: 最新是 1.0.1
- 多个旧文档中还有 "0.5.0", "0.2.2" 等旧版本号

**需要修改的文件**：

1. `package.json` - 更新为 "1.1.0"
2. `package-lock.json` - 自动更新
3. `README.md` - 更新为 "1.1.0"
4. `README_zh.md` - 更新为 "1.1.0"
5. `src/server/api/routers/settings.ts` - 从 package.json 读取版本号
6. `src/app/settings/page.tsx` - 移除硬编码的 fallback
7. `CHANGELOG.md` - 添加 1.1.0 版本记录

**建议的版本号管理方案**：

- 单一来源：`package.json` 中的 version 字段
- 设置页面从 API 获取版本号，API 从 package.json 读取
- README 文件手动保持同步（或使用脚本）

##### Acceptance Criteria

1. WHEN displaying version information THEN the system SHALL show "1.1.0" consistently across all files
2. WHEN the settings page loads THEN the system SHALL display the version from package.json
3. WHEN updating the version THEN the developer SHALL only need to update package.json
4. WHEN the version is updated THEN the CHANGELOG.md SHALL be updated with the new version

---

### 六、脚本清理 🟢 低优先级

#### Requirement 7: scripts 目录需要整理

**User Story:** As a developer, I want organized utility scripts.

##### 问题描述

`scripts/archive/` 和 `scripts/migrations/` 目录有不再需要的脚本。

##### Acceptance Criteria

1. WHEN archive scripts are no longer needed THEN the system SHALL have them removed
2. WHEN migration scripts have been executed THEN the system SHALL archive or remove them

---

## 改进建议总结

### 🔴 高优先级

| 问题                      | 建议                                       |
| ------------------------- | ------------------------------------------ |
| tRPC 过于复杂             | 移除 tRPC，改用纯 REST API + React Query   |
| executeQuery SQL 注入风险 | 移除 deprecated 函数                       |
| 版本号混乱                | 统一为 1.1.0，从 package.json 单一来源管理 |

### 🟡 中优先级

| 问题              | 建议                     |
| ----------------- | ------------------------ |
| docs 目录文档过多 | 删除 15+ 个临时/过时文档 |
| 通知系统未清理    | 删除所有通知相关代码     |
| 未使用的代码      | 检查并清理               |

### 🟢 低优先级

| 问题             | 建议                       |
| ---------------- | -------------------------- |
| scripts 目录整理 | 删除归档和已执行的迁移脚本 |

---

## 预计改进效果

- **依赖减少**: 5 个 tRPC 相关包
- **代码减少**: 约 2000-3000 行（tRPC 相关代码）
- **文档减少**: 约 15 个文件
- **架构简化**: 更直接的 REST API 架构
- **版本管理**: 单一来源，统一为 1.1.0
- **维护成本**: 显著降低

---

**文档版本**: 1.0  
**审查日期**: 2025-12-11  
**决策**: 移除 tRPC，改用纯 REST API，版本号统一为 1.1.0
