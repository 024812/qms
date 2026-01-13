# Implementation Plan - QMS 项目架构简化

## Phase 1: 版本号统一

- [x] 1. 统一版本号为 1.1.0
  - [x] 1.1 更新 package.json 版本号
    - 将 version 从 "1.0.1" 更新为 "1.1.0"
    - 运行 npm install 更新 package-lock.json
    - _Requirements: 6.1_

  - [x] 1.2 更新 README 文件版本号
    - 更新 README.md 中的版本号为 1.1.0
    - 更新 README_zh.md 中的版本号为 1.1.0
    - _Requirements: 6.1_

  - [x] 1.3 创建系统信息 API 路由
    - 创建 `src/app/api/settings/system-info/route.ts`
    - 从 package.json 读取版本号
    - 返回版本号、框架、部署信息
    - _Requirements: 6.2_

  - [x] 1.4 更新设置页面版本显示
    - 修改 `src/app/settings/page.tsx`
    - 从 /api/settings/system-info 获取版本号
    - 移除硬编码的 fallback "0.5.0"
    - _Requirements: 6.2_

  - [x] 1.5 更新 CHANGELOG.md
    - 添加 [1.1.0] 版本记录
    - 记录架构简化变更
    - _Requirements: 6.4_

  - [ ]\* 1.6 编写属性测试验证版本一致性
    - **Property 2: Version Consistency**
    - **Validates: Requirements 6.2**

## Phase 2: 创建 REST API 路由

- [x] 2. 创建被子 REST API
  - [x] 2.1 创建被子列表和创建 API
    - 创建 `src/app/api/quilts/route.ts`
    - 实现 GET 方法（列表查询，支持过滤和分页）
    - 实现 POST 方法（创建被子）
    - _Requirements: 1.2, 1.3_

  - [x] 2.2 创建被子详情 API
    - 创建 `src/app/api/quilts/[id]/route.ts`
    - 实现 GET 方法（获取单个被子）
    - 实现 PUT 方法（更新被子）
    - 实现 DELETE 方法（删除被子）
    - _Requirements: 1.2, 1.3_

  - [x] 2.3 创建被子状态变更 API
    - 创建 `src/app/api/quilts/[id]/status/route.ts`
    - 实现 PUT 方法（更新状态，自动管理使用记录）
    - _Requirements: 1.2, 1.3_

- [x] 3. 创建使用记录 REST API
  - [x] 3.1 创建使用记录列表和创建 API
    - 创建 `src/app/api/usage/route.ts`
    - 实现 GET 方法（列表查询）
    - 实现 POST 方法（创建使用记录）
    - _Requirements: 1.2, 1.3_

  - [x] 3.2 创建使用记录详情 API
    - 创建 `src/app/api/usage/[id]/route.ts`
    - 实现 GET 方法（获取单个记录）
    - 实现 PUT 方法（更新记录）
    - 实现 DELETE 方法（删除记录）
    - _Requirements: 1.2, 1.3_

  - [x] 3.3 创建活跃使用记录 API
    - 创建 `src/app/api/usage/active/route.ts`
    - 实现 GET 方法（获取所有活跃记录）
    - _Requirements: 1.2, 1.3_

  - [x] 3.4 创建被子使用记录 API
    - 创建 `src/app/api/usage/by-quilt/[quiltId]/route.ts`
    - 实现 GET 方法（获取指定被子的使用记录）
    - _Requirements: 1.2, 1.3_

- [x] 4. 创建仪表板和设置 REST API
  - [x] 4.1 创建仪表板统计 API
    - 创建 `src/app/api/dashboard/route.ts`
    - 实现 GET 方法（获取统计数据）
    - _Requirements: 1.2, 1.3_

  - [ ] 4.2 更新设置 API
    - 更新 `src/app/api/settings/route.ts`（如果存在）或创建新的
    - 实现 GET 方法（获取应用设置）
    - 实现 PUT 方法（更新应用设置）
    - _Requirements: 1.2, 1.3_

- [x] 5. Checkpoint - 确保 API 路由正常工作
  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: 重构 Hooks

- [x] 6. 重构被子相关 Hooks
  - [x] 6.1 重构 useQuilts Hook
    - 修改 `src/hooks/useQuilts.ts`
    - 使用 fetch + React Query 替代 tRPC
    - 保持相同的接口和功能
    - _Requirements: 1.2, 1.3_

  - [ ]\* 6.2 编写属性测试验证 API 功能
    - **Property 1: API Functionality Preservation**
    - **Validates: Requirements 1.3**

- [x] 7. 重构使用记录相关 Hooks
  - [x] 7.1 重构 useUsage Hook
    - 修改 `src/hooks/useUsage.ts`
    - 使用 fetch + React Query 替代 tRPC
    - 保持相同的接口和功能
    - _Requirements: 1.2, 1.3_

- [x] 8. 重构仪表板和设置 Hooks
  - [x] 8.1 重构 useDashboard Hook
    - 修改 `src/hooks/useDashboard.ts`
    - 使用 fetch + React Query 替代 tRPC
    - _Requirements: 1.2, 1.3_

  - [x] 8.2 重构 useSettings Hook
    - 修改 `src/hooks/useSettings.ts`
    - 使用 fetch + React Query 替代 tRPC
    - _Requirements: 1.2, 1.3_

- [x] 9. 更新应用布局
  - [x] 9.1 移除 TRPCProvider
    - 修改 `src/app/layout.tsx`
    - 移除 TRPCProvider 包装
    - 保留 QueryClientProvider（React Query）
    - _Requirements: 1.1_

- [x] 10. Checkpoint - 确保应用功能正常
  - Ensure all tests pass, ask the user if questions arise.

## Phase 4: 删除 tRPC 相关代码

- [x] 11. 删除 tRPC 服务端代码
  - [x] 11.1 删除 tRPC 路由文件
    - 删除 `src/server/api/routers/quilts.ts`
    - 删除 `src/server/api/routers/usage.ts`
    - 删除 `src/server/api/routers/dashboard.ts`
    - 删除 `src/server/api/routers/settings.ts`
    - 删除 `src/server/api/routers/notifications.ts`
    - 删除 `src/server/api/routers/import-export.ts`
    - _Requirements: 1.1_

  - [x] 11.2 删除 tRPC 核心文件
    - 删除 `src/server/api/trpc.ts`
    - 删除 `src/server/api/root.ts`
    - 删除 `src/app/api/trpc/[trpc]/route.ts`
    - 删除 `src/app/api/trpc/` 目录
    - _Requirements: 1.1_

- [x] 12. 删除 tRPC 客户端代码
  - [x] 12.1 删除 tRPC 客户端文件
    - 删除 `src/lib/trpc.ts`
    - 删除 `src/lib/trpc-provider.tsx`
    - 删除 `src/components/providers/TRPCProvider.tsx`
    - _Requirements: 1.1_

## Phase 5: 清理依赖和代码

- [x] 13. 移除 tRPC 依赖
  - [x] 13.1 更新 package.json
    - 移除 `@trpc/client`
    - 移除 `@trpc/next`
    - 移除 `@trpc/react-query`
    - 移除 `@trpc/server`
    - 移除 `superjson`
    - 运行 npm install 更新 lock 文件
    - _Requirements: 1.4_

- [x] 14. 移除安全风险代码
  - [x] 14.1 移除 executeQuery 函数
    - 修改 `src/lib/neon.ts`
    - 删除 deprecated 的 executeQuery 函数
    - 确保没有代码使用该函数
    - _Requirements: 3.1, 3.2_

- [x] 15. 删除通知系统代码
  - [x] 15.1 删除通知相关文件
    - 删除 `src/lib/notification-store.ts`
    - 删除 `src/lib/repositories/notification.repository.ts`
    - 删除 `src/components/NotificationPanel.tsx`
    - _Requirements: 4.1_

  - [x] 15.2 清理通知相关引用
    - 检查并移除所有导入通知相关模块的代码
    - _Requirements: 4.1_

- [x] 16. 检查并清理未使用的代码
  - [x] 16.1 检查未使用的 Hooks
    - 检查 `src/hooks/useOptimisticUpdates.ts` 是否使用
    - 检查 `src/hooks/useQuiltsOptimized.ts` 是否使用
    - 删除未使用的 Hooks
    - _Requirements: 5.1, 5.2_

  - [x] 16.2 检查未使用的组件
    - 检查 `src/components/import/` 目录使用情况
    - 检查 `src/components/export/` 目录使用情况
    - 检查 `src/components/layout/` 目录使用情况
    - 删除未使用的组件
    - _Requirements: 5.1, 5.2_

  - [x] 16.3 检查未使用的工具函数
    - 检查 `src/lib/excel-analyzer.ts` 是否使用
    - 检查 `src/lib/usage-statistics.ts` 是否使用
    - 删除未使用的工具函数
    - _Requirements: 5.1, 5.2_

- [x] 17. Checkpoint - 确保清理后应用正常
  - Ensure all tests pass, ask the user if questions arise.

## Phase 6: 文档清理

- [x] 18. 删除临时文档
  - [x] 18.1 删除临时和过时文档
    - 删除 `docs/ANALYSIS_COMPLETE.md`
    - 删除 `docs/CLEANUP_COMPLETE_SUMMARY.md`
    - 删除 `docs/CLEANUP_EXECUTION_PLAN.md`
    - 删除 `docs/CONSOLE_LOG_CLEANUP_FINAL.md`
    - 删除 `docs/CONSOLE_LOG_CLEANUP_PROGRESS.md`
    - 删除 `docs/PROJECT_CLEANUP_SUMMARY.md`
    - 删除 `docs/PROJECT_OPTIMIZATION_ANALYSIS.md`
    - 删除 `docs/TODO_ANALYSIS.md`
    - 删除 `docs/TODO_CLEANUP_SUMMARY.md`
    - 删除 `docs/OPTIMIZATION_README.md`
    - 删除 `docs/OPTIMIZATION_UPDATE.md`
    - 删除 `docs/README_OPTIMIZATION.md`
    - 删除 `docs/TEST_RESULTS.md`
    - 删除 `docs/NOTIFICATION_SYSTEM_TESTING.md`
    - 删除 `docs/WEATHER_API_CHANGE.md`
    - 删除 `docs/项目优化分析报告_中文.md`
    - _Requirements: 2.1, 2.3_

  - [x] 18.2 更新文档索引
    - 更新 `docs/INDEX.md`
    - 移除已删除文档的链接
    - 添加新的架构说明
    - _Requirements: 2.2_

- [x] 19. 清理 scripts 目录
  - [x] 19.1 删除归档脚本
    - 删除 `scripts/archive/` 目录
    - _Requirements: 7.1_

  - [x] 19.2 删除已执行的迁移脚本
    - 删除 `scripts/migrations/` 目录
    - _Requirements: 7.2_

- [x] 20. Final Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.
