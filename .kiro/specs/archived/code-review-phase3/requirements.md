# Requirements Document - QMS 项目第三阶段代码审查报告

## Introduction

本文档是对 QMS（被子管理系统）项目进行第三阶段全面代码审查后的分析报告。项目已经完成了 tRPC 移除和 REST API 迁移，当前版本为 v1.1.0。本次审查旨在识别剩余的代码、文档和架构问题，并提出改进建议。

**审查范围**：

- 全部 src 目录代码
- API 路由
- 文档目录
- 配置文件
- 依赖包

## Glossary

- **QMS**: Quilt Management System，被子管理系统
- **REST API**: Representational State Transfer API
- **Repository Pattern**: 仓储模式，数据访问层的设计模式
- **React Query**: 数据获取和缓存库

---

## 审查发现

### 一、过时文档需要清理 🔴 高优先级

#### Requirement 1: 删除过时的 tRPC 迁移文档

**User Story:** As a developer, I want documentation that reflects the current architecture, so that I am not confused by outdated information.

##### 问题描述

项目已经从 tRPC 迁移到纯 REST API，但 `docs/guides/` 目录中仍有 tRPC 相关的迁移文档：

**需要删除的文档**：

- `docs/guides/FRONTEND-TRPC-MIGRATION.md` - 前端 tRPC 迁移指南（已过时）
- `docs/guides/TRPC-MUTATION-FIX.md` - tRPC Mutation 修复指南（已过时）

**问题**：

1. 这些文档描述的是已经被移除的 tRPC 架构
2. 新开发者可能会被这些过时文档误导
3. 文档中引用的文件（如 `src/lib/trpc.ts`）已不存在

##### Acceptance Criteria

1. WHEN reviewing the docs/guides directory THEN the system SHALL not contain tRPC-related migration documents
2. WHEN a developer reads the documentation THEN the system SHALL provide information that matches the current REST API architecture

---

#### Requirement 2: 代码注释中的 tRPC 引用需要更新

**User Story:** As a developer, I want code comments that accurately describe the current implementation.

##### 问题描述

代码中仍有一些注释引用 tRPC，虽然实际代码已经使用 REST API：

**涉及文件**：

- `src/components/usage/EditUsageRecordDialog.tsx` - 注释 "Use tRPC mutations"
- `src/components/quilts/QuiltDialog.tsx` - 注释 "Extract detailed error message from tRPC error"
- `src/app/usage/page.tsx` - 注释 "Use tRPC hooks"
- `src/app/quilts/page.tsx` - 注释 "Extract error message from tRPC error"

##### Acceptance Criteria

1. WHEN reading code comments THEN the system SHALL have comments that accurately describe the REST API implementation
2. WHEN the comments are updated THEN the system SHALL reference "React Query hooks" instead of "tRPC"

---

### 二、README 文档不一致 🟡 中优先级

#### Requirement 3: README 中的技术栈描述需要更新

**User Story:** As a developer, I want accurate project documentation, so that I understand the actual technology stack.

##### 问题描述

`README.md` 和 `README_zh.md` 中的技术栈描述仍然提到 tRPC：

**README.md 中的问题**：

```markdown
### Backend

- **API**: tRPC + Next.js API Routes ← 应该只是 "Next.js API Routes"
```

**README_zh.md 中的问题**：

```markdown
### 后端

- **API**: Next.js API Routes ← 这个是正确的
```

两个 README 文件的技术栈描述不一致。

##### Acceptance Criteria

1. WHEN reading README.md THEN the Backend API section SHALL state "Next.js API Routes (REST API)" without mentioning tRPC
2. WHEN comparing README.md and README_zh.md THEN the technology stack descriptions SHALL be consistent

---

### 三、node_modules 中残留 tRPC 包 🟡 中优先级

#### Requirement 4: 清理 tRPC 相关依赖

**User Story:** As a developer, I want a clean dependency tree without unused packages.

##### 问题描述

`node_modules` 目录中仍然存在 `@trpc/` 相关包，但 `package.json` 中已经没有这些依赖。这可能是因为：

1. 某些依赖间接引用了 tRPC
2. 或者 `node_modules` 需要清理重建

**发现的 tRPC 包**：

- `node_modules/@trpc/` 目录存在

##### Acceptance Criteria

1. WHEN running npm install THEN the node_modules directory SHALL not contain @trpc packages unless they are indirect dependencies
2. IF @trpc packages are indirect dependencies THEN the system SHALL document which package requires them

---

### 四、项目结构优化 🟢 低优先级

#### Requirement 5: src/server 目录可以简化

**User Story:** As a developer, I want a clean project structure that reflects the actual architecture.

##### 问题描述

`src/server/` 目录目前只包含 `services/CacheService.ts`，原来的 tRPC 相关代码已被删除。

**当前结构**：

```
src/server/
└── services/
    └── CacheService.ts
```

**建议**：

1. 检查 `CacheService.ts` 是否被使用
2. 如果未使用，可以删除整个 `src/server/` 目录
3. 如果使用，考虑将其移动到 `src/lib/services/`

##### Acceptance Criteria

1. WHEN reviewing the src/server directory THEN the system SHALL only contain actively used code
2. IF CacheService is not used THEN the system SHALL remove the src/server directory

---

#### Requirement 6: scripts 目录中的空目录需要清理

**User Story:** As a developer, I want a clean scripts directory without empty folders.

##### 问题描述

`scripts/` 目录中存在空的子目录：

- `scripts/archive/` - 空目录
- `scripts/migrations/` - 空目录

##### Acceptance Criteria

1. WHEN reviewing the scripts directory THEN the system SHALL not contain empty subdirectories

---

### 五、代码质量问题 🟡 中优先级

#### Requirement 7: Dashboard API 效率问题

**User Story:** As a user, I want fast dashboard loading, so that I can quickly see my quilt statistics.

##### 问题描述

`src/app/api/dashboard/route.ts` 中的实现存在效率问题：

```typescript
// 获取所有被子来计算状态计数
const allQuilts = await quiltRepository.findAll({ limit: 1000 });

// 在应用层过滤
const inUseCount = allQuilts.filter(q => q.currentStatus === 'IN_USE').length;
```

**问题**：

1. 获取所有被子数据只是为了计数
2. 应该使用数据库级别的 COUNT 查询
3. 当被子数量超过 1000 时会出现问题

##### Acceptance Criteria

1. WHEN fetching dashboard statistics THEN the system SHALL use database-level COUNT queries for status counts
2. WHEN counting quilts by status THEN the system SHALL not fetch all quilt records into memory

---

#### Requirement 8: 公共 sw.js 文件可能不需要

**User Story:** As a developer, I want to remove unused PWA files.

##### 问题描述

`public/sw.js` 文件仍然存在，但 PWA 功能已在之前的清理中移除。

##### Acceptance Criteria

1. WHEN reviewing the public directory THEN the system SHALL not contain unused service worker files
2. IF PWA functionality is not implemented THEN the system SHALL remove sw.js

---

## 改进建议总结

### 🔴 高优先级

| 问题                   | 建议                                                        |
| ---------------------- | ----------------------------------------------------------- |
| 过时的 tRPC 迁移文档   | 删除 `FRONTEND-TRPC-MIGRATION.md` 和 `TRPC-MUTATION-FIX.md` |
| 代码注释中的 tRPC 引用 | 更新注释为 "React Query hooks"                              |

### 🟡 中优先级

| 问题                    | 建议                                      |
| ----------------------- | ----------------------------------------- |
| README 技术栈描述不一致 | 更新 README.md 移除 tRPC 引用             |
| node_modules 残留包     | 运行 `rm -rf node_modules && npm install` |
| Dashboard API 效率      | 使用数据库级别 COUNT 查询                 |

### 🟢 低优先级

| 问题                | 建议                             |
| ------------------- | -------------------------------- |
| src/server 目录简化 | 检查 CacheService 使用情况       |
| scripts 空目录      | 删除 `archive/` 和 `migrations/` |
| public/sw.js        | 删除未使用的 service worker 文件 |

---

## 预计改进效果

- **文档准确性**: 100% 反映当前架构
- **代码注释**: 准确描述实际实现
- **项目结构**: 更清晰，无冗余目录
- **Dashboard 性能**: 减少不必要的数据传输

---

## 已完成的修复

### ✅ 高优先级

1. **删除过时的 tRPC 文档**
   - 已删除 `docs/guides/FRONTEND-TRPC-MIGRATION.md`
   - 已删除 `docs/guides/TRPC-MUTATION-FIX.md`

2. **更新代码注释**
   - `src/app/usage/page.tsx` - "Use tRPC hooks" → "Use React Query hooks"
   - `src/components/usage/EditUsageRecordDialog.tsx` - "Use tRPC mutations" → "Use React Query mutations"
   - `src/app/quilts/page.tsx` - "Extract error message from tRPC error" → "Extract error message from API error"
   - `src/components/quilts/QuiltDialog.tsx` - "Extract detailed error message from tRPC error" → "Extract detailed error message from API error"

### ✅ 中优先级

3. **更新 README.md**
   - Backend API 描述从 "tRPC + Next.js API Routes" 改为 "Next.js API Routes (REST API)"

4. **优化 Dashboard API**
   - 使用数据库级别 COUNT 查询替代获取所有数据后在应用层计数
   - 提升了性能，减少了数据传输

5. **更新 Service Worker**
   - `public/sw.js` 中的 tRPC 端点改为 REST API 端点

### ⏳ 待手动处理

6. **空目录清理**（权限问题，需手动删除）
   - `scripts/archive/`
   - `scripts/migrations/`

7. **可选清理**
   - `src/server/services/CacheService.ts` - 未被使用，可以删除
   - `public/sw.js` - 如果不需要 PWA 功能，可以删除

---

**文档版本**: 1.0  
**审查日期**: 2025-12-11  
**审查范围**: 全部代码、文档、配置文件
**修复状态**: ✅ 主要问题已修复
