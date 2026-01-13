# Implementation Plan - QMS 项目代码质量改进

## Phase 1: 删除推荐系统（保留天气功能）

- [x] 1. 删除推荐系统组件和逻辑
  - [x] 1.1 删除推荐相关组件文件
    - 删除 `src/components/seasonal/SeasonalRecommendations.tsx`
    - 删除 `src/components/seasonal/WeatherBasedSuggestions.tsx`
    - 删除 `src/components/seasonal/UsagePatternAnalysis.tsx`
    - 删除 `src/components/dashboard/QuiltRecommendation.tsx`
    - 删除 `src/components/dashboard/QuiltRecommendationContent.tsx`
    - 删除 `src/lib/quilt-recommendation.ts`
    - _Requirements: 1.1, 1.2_

  - [x] 1.2 更新 Dashboard 移除推荐组件引用
    - 修改 `src/app/page.tsx` 移除推荐组件导入和使用
    - 确保天气组件保留并正常显示
    - _Requirements: 1.2, 1.3_

  - [x] 1.3 删除 seasonal 目录（如果为空）
    - 检查 `src/components/seasonal/` 目录是否还有其他文件
    - 如果为空则删除整个目录
    - _Requirements: 1.1_

## Phase 2: 删除 PWA 和移动端专用组件

- [x] 2. 删除 PWA 相关功能
  - [x] 2.1 删除 PWA 组件和服务
    - 删除 `src/lib/serviceWorker.ts`
    - 删除 `src/components/ServiceWorkerRegistration.tsx`
    - 删除 `src/components/mobile/PWAInstallPrompt.tsx`
    - 删除 `src/components/mobile/OfflineIndicator.tsx`
    - _Requirements: 2.1_

  - [x] 2.2 更新布局文件移除 PWA 引用
    - 修改 `src/app/layout.tsx` 移除 ServiceWorkerRegistration 导入
    - 移除 PWA 相关的 meta 标签（如果有）
    - _Requirements: 2.1_

- [x] 3. 删除移动端专用组件
  - [x] 3.1 删除移动端重复组件
    - 删除 `src/components/mobile/MobileDashboard.tsx`
    - 删除 `src/components/mobile/MobileQuiltList.tsx`
    - 删除 `src/hooks/useMobileGestures.ts`
    - _Requirements: 3.1_

  - [x] 3.2 更新引用移动端组件的文件
    - 检查并更新所有导入这些组件的文件
    - 确保响应式设计正常工作
    - _Requirements: 3.1_

  - [x] 3.3 保留必要的移动端支持
    - 保留 `src/components/mobile/MobileAppWrapper.tsx`（如果用于响应式）
    - 保留 `src/hooks/use-mobile.ts`（用于检测移动设备）
    - 保留 `src/styles/mobile.css`（响应式样式）
    - _Requirements: 3.1_

## Phase 3: 删除性能监控和简化通知

- [x] 4. 删除性能监控功能
  - [x] 4.1 删除性能监控组件
    - 删除 `src/components/dashboard/PerformanceMonitor.tsx`
    - 删除 `src/hooks/usePerformance.ts`
    - 删除 `src/components/performance/RoutePreloader.tsx`
    - _Requirements: 4.1_

  - [x] 4.2 删除 metrics API
    - 删除 `src/app/api/metrics/route.ts`
    - _Requirements: 4.1_

  - [x] 4.3 更新引用性能监控的文件
    - 修改 Dashboard 移除 PerformanceMonitor 引用
    - _Requirements: 4.1_

- [x] 5. 简化通知系统
  - [x] 5.1 评估通知系统使用情况
    - 检查 `src/lib/notification-checker.ts` 的实际使用
    - 检查 `src/lib/notification-store.ts` 的实际使用
    - 确定是否可以完全移除或简化
    - _Requirements: 5.1_

  - [x] 5.2 简化或删除复杂通知逻辑
    - 如果通知功能未被使用，删除相关文件
    - 如果需要保留，简化为基于 Toast 的通知
    - _Requirements: 5.1_

## Phase 4: 清理冗余 API 和代码

- [x] 6. 删除冗余 API 路由
  - [x] 6.1 删除 admin API 路由
    - 删除 `src/app/api/admin/check-db-schema/`
    - 删除 `src/app/api/admin/drop-old-usage-tables/`
    - 删除 `src/app/api/admin/init-settings/`
    - 删除 `src/app/api/admin/migrate-status/`
    - 删除 `src/app/api/admin/migrate-usage-records/`
    - 删除 `src/app/api/admin/update-quilt-names/`
    - 删除 `src/app/api/admin/create-usage-table/`（如果存在）
    - _Requirements: 9.1_

  - [x] 6.2 删除测试 API 路由
    - 删除 `src/app/api/test/`
    - 删除 `src/app/api/test-quilts/`
    - 删除 `src/app/api/db-test/`
    - _Requirements: 9.1_

  - [x] 6.3 删除迁移 API 路由
    - 删除 `src/app/api/migrate/`
    - _Requirements: 9.1_

  - [x] 6.4 删除重复的 dashboard stats API
    - 删除 `src/app/api/dashboard/stats/`（与 tRPC 重复）
    - _Requirements: 9.1_

- [x] 7. 删除重复和未使用的组件
  - [x] 7.1 删除重复的 QuiltCard 组件
    - 保留 `src/app/quilts/components/QuiltCard.tsx`
    - 删除 `src/components/quilts/QuiltCard.tsx`（如果重复）
    - 更新所有引用
    - _Requirements: 12.1_
  - [x] 7.2 删除未使用的组件
    - 检查并删除 `src/components/quilts/VirtualizedQuiltList.tsx`（如果未使用）
    - 检查并删除 `src/components/quilts/QuiltList.tsx`（如果未使用）
    - 检查并删除 `src/components/quilts/QuiltDetail.tsx`（如果未使用）
    - 检查并删除 `src/components/quilts/QuiltEmptyState.tsx`（如果与 EmptyState 重复）
    - _Requirements: 12.1_

  - [x] 7.3 清理空目录
    - 删除 `src/components/quilts/__tests__/`（空目录）
    - 删除 `src/app/import-export/`（空目录）
    - 删除 `src/server/db/`（空目录）
    - _Requirements: 12.1_

- [x] 8. Checkpoint - 确保应用正常运行
  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: 优化数据库查询

- [x] 9. 重构 Repository 实现数据库级过滤
  - [x] 9.1 优化 QuiltRepository.findAll 方法
    - 修改 `src/lib/repositories/quilt.repository.ts`
    - 实现动态 WHERE 子句构建
    - 在数据库层面完成过滤，而非应用层
    - _Requirements: 6.1_

  - [ ]\* 9.2 编写属性测试验证数据库级过滤
    - **Property 1: Database-level filtering**
    - **Validates: Requirements 6.1**

  - [x] 9.3 优化 QuiltRepository.count 方法
    - 实现带 WHERE 子句的 COUNT 查询
    - 移除应用层计数逻辑
    - _Requirements: 6.3_

  - [ ]\* 9.4 编写属性测试验证 count 查询优化
    - **Property 3: Optimized count queries**
    - **Validates: Requirements 6.3**

- [x] 10. 移除 neon.ts 中的 db 对象
  - [x] 10.1 识别 db 对象的使用位置
    - 搜索所有导入 `db` 的文件
    - 记录需要更新的文件列表
    - _Requirements: 8.1_
  - [x] 10.2 将 db 调用迁移到 Repository
    - 更新所有使用 `db.getQuilts` 的代码使用 `quiltRepository.findAll`
    - 更新所有使用 `db.createQuilt` 的代码使用 `quiltRepository.create`
    - 更新其他 db 方法调用
    - _Requirements: 8.1_
  - [x] 10.3 删除 neon.ts 中的 db 对象
    - 保留 `sql` 导出和 `executeQuery` 函数
    - 删除 `db` 对象及其所有方法
    - _Requirements: 8.1, 8.2_

- [x] 11. 优化分页和排序
  - [x] 11.1 实现数据库级排序
    - 修改 findAll 方法支持 sortBy 和 sortOrder 参数
    - 在 SQL 中实现 ORDER BY
    - _Requirements: 14.1_

  - [ ]\* 11.2 编写属性测试验证排序后分页
    - **Property 8: Sort-before-paginate**
    - **Validates: Requirements 14.1**

- [x] 12. Checkpoint - 确保数据库操作正常
  - Ensure all tests pass, ask the user if questions arise.

## Phase 6: 统一类型定义

- [x] 13. 以 Zod schema 为单一类型来源
  - [x] 13.1 更新 Zod schema 作为主要类型定义
    - 修改 `src/lib/validations/quilt.ts`
    - 添加完整的 Quilt schema
    - 导出推导的类型 `type Quilt = z.infer<typeof QuiltSchema>`
    - _Requirements: 7.1_

  - [x] 13.2 更新 database/types.ts 使用 Zod 类型
    - 修改 `src/lib/database/types.ts`
    - 从 validations/quilt.ts 导入类型
    - 保留 Row 类型和转换函数
    - _Requirements: 7.1_

  - [x] 13.3 更新 types/quilt.ts 使用 Zod 类型
    - 修改 `src/types/quilt.ts`
    - 从 validations/quilt.ts 重新导出类型
    - 移除重复的类型定义
    - _Requirements: 7.1_

- [x] 14. 统一 QuiltStatus 定义
  - [x] 14.1 移除 AVAILABLE 状态
    - 更新 `src/lib/validations/quilt.ts` 确认只有 IN_USE, MAINTENANCE, STORAGE
    - 更新 `src/types/quilt.ts` 移除 AVAILABLE
    - 更新 `src/lib/database/types.ts` 移除 AVAILABLE
    - _Requirements: 7.2_

  - [ ]\* 14.2 编写属性测试验证类型一致性
    - **Property 4: Type consistency**
    - **Validates: Requirements 7.2**

  - [x] 14.3 更新所有使用 AVAILABLE 的代码
    - 搜索所有使用 'AVAILABLE' 的文件
    - 将 AVAILABLE 替换为 STORAGE
    - _Requirements: 7.2_

## Phase 7: 改进错误处理

- [x] 15. 实现统一错误响应格式
  - [x] 15.1 创建错误处理工具
    - 更新 `src/lib/error-handler.ts`
    - 定义 AppError 接口和错误代码
    - 实现 createError 函数
    - _Requirements: 10.1_

  - [x] 15.2 更新 Repository 错误处理
    - 修改 `src/lib/repositories/quilt.repository.ts`
    - 使用 createError 替代静默失败
    - 返回具体错误消息
    - _Requirements: 10.1_

  - [ ]\* 15.3 编写属性测试验证错误消息
    - **Property 5: Error message specificity**
    - **Validates: Requirements 10.1**

- [x] 16. 添加中文错误消息
  - [x] 16.1 创建 Zod 中文错误映射
    - 更新 `src/lib/validations/error-messages.ts`
    - 实现 zodErrorMap 函数
    - 覆盖常见验证错误
    - _Requirements: 10.2_

  - [x] 16.2 全局设置 Zod 错误映射
    - 在应用入口设置 z.setErrorMap
    - 确保所有验证错误使用中文
    - _Requirements: 10.2_

- [x] 17. 实现状态变更原子性
  - [x] 17.1 使用数据库事务处理状态变更
    - 修改状态变更逻辑使用事务
    - 确保状态变更和使用记录创建原子执行
    - _Requirements: 13.1_

  - [ ]\* 17.2 编写属性测试验证原子性
    - **Property 6: Status change atomicity**
    - **Validates: Requirements 13.1**

  - [x] 17.3 添加数据库约束确保单一活跃记录
    - 考虑添加部分唯一索引
    - 或在应用层验证
    - _Requirements: 13.2_

  - [ ]\* 17.4 编写属性测试验证单一活跃记录
    - **Property 7: Single active usage record**
    - **Validates: Requirements 13.2**

- [x] 18. Checkpoint - 确保错误处理正常
  - Ensure all tests pass, ask the user if questions arise.

## Phase 8: 清理文档和依赖

- [x] 19. 清理冗余文档
  - [x] 19.1 删除开发会话日志
    - 删除 `docs/sessions/` 目录
    - _Requirements: 15.1_

  - [x] 19.2 删除历史归档文档
    - 删除 `docs/archive/` 目录
    - _Requirements: 15.1_

  - [x] 19.3 合并 UI 优化文档
    - 将 `docs/ui-optimization/` 中的 8 个文件合并为 1 个
    - 删除原始文件
    - _Requirements: 15.1_

  - [x] 19.4 合并重构文档
    - 将 `docs/refactoring/` 中的 4 个文件合并为 1 个
    - 删除原始文件
    - _Requirements: 15.1_

  - [x] 19.5 合并发布说明到 CHANGELOG
    - 将 `RELEASE_NOTES_*.md` 内容合并到 `CHANGELOG.md`
    - 删除单独的发布说明文件
    - _Requirements: 15.1_

  - [x] 19.6 删除临时文件
    - 删除 `CLEANUP_SUMMARY.md`
    - 删除 `NEXT_STEPS.md`
    - _Requirements: 15.1_

- [x] 20. 清理未使用的依赖
  - [x] 20.1 检查并移除未使用的包
    - 检查 `multer` 是否使用（文件上传）
    - 检查 `@tanstack/react-virtual` 是否使用（虚拟列表）
    - 检查 `framer-motion` 的使用程度
    - _Requirements: 16.1_

  - [x] 20.2 更新 package.json
    - 移除确认未使用的依赖
    - 运行 `npm install` 更新 lock 文件
    - _Requirements: 16.1_

- [x] 21. 更新项目文档
  - [x] 21.1 更新 README.md
    - 移除已删除功能的描述
    - 更新项目结构说明
    - _Requirements: 15.1_

  - [x] 21.2 更新 docs/INDEX.md
    - 更新文档索引
    - 移除已删除文档的链接
    - _Requirements: 15.1_

- [x] 22. Final Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.
