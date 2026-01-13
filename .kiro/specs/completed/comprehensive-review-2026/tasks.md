# Implementation Plan: QMS 2026 全面项目审查

## Overview

本任务列表将设计文档转化为可执行的编码任务，按优先级和依赖关系组织。每个任务都引用具体的需求和设计属性。

## Tasks

- [x] 1. 技术栈评估与依赖升级
  - [x] 1.1 检查所有依赖的最新版本
    - 运行 `npm outdated` 检查过时依赖
    - 记录每个依赖的当前版本和最新版本
    - 识别主要版本升级和潜在破坏性变更
    - _Requirements: 1.1, 1.2_

  - [x] 1.2 升级核心依赖
    - 升级 Next.js 到最新稳定版
    - 升级 React 和 React DOM
    - 升级 TypeScript
    - 运行 `npm install` 并验证无错误
    - _Requirements: 1.3, 1.5_

  - [x] 1.3 升级 UI 和工具依赖
    - 升级 Tailwind CSS
    - 升级 Radix UI 组件
    - 升级 React Query
    - 升级 Framer Motion
    - 升级 Zod
    - _Requirements: 1.3, 1.5_

  - [x] 1.4 验证升级后功能正常
    - 运行 `npm run build` 确保构建成功
    - 运行 `npm run type-check` 确保类型检查通过
    - 运行 `npm run lint` 确保代码规范
    - _Requirements: 1.3_

- [x] 2. Next.js 16 最佳实践应用
  - [x] 2.1 检查并更新 middleware 到 proxy 命名
    - 检查是否存在 middleware.ts 文件
    - 如果存在，重命名为 proxy.ts
    - 更新导出函数名从 middleware 到 proxy
    - _Requirements: 3.1_

  - [x] 2.2 更新 next.config.js 配置
    - 移除已弃用的配置选项
    - 添加 Turbopack 配置
    - 优化图片配置
    - 更新安全头配置
    - _Requirements: 3.2, 3.5_

  - [x] 2.3 验证 API 路由遵循 Next.js 16 模式
    - 检查所有 API 路由使用正确的导出 (GET, POST, PUT, DELETE)
    - 确保路由处理器返回 NextResponse
    - _Requirements: 3.4_

- [x] 3. 代码质量审查与优化
  - [x] 3.1 运行 ESLint 修复未使用代码
    - 运行 `npm run lint` 识别问题
    - 修复所有 no-unused-vars 警告
    - 移除未使用的导入
    - _Requirements: 4.1, 4.6_

  - [ ]\* 3.2 编写属性测试验证代码清洁度
    - **Property 1: Code Cleanliness - No Unused Code**
    - **Validates: Requirements 4.1, 4.6**

  - [x] 3.3 识别并重构重复代码
    - 检查 API 路由中的重复错误处理
    - 检查组件中的重复样式模式
    - 提取公共逻辑到工具函数
    - _Requirements: 4.2, 4.7_

  - [ ]\* 3.4 编写属性测试验证 DRY 原则
    - **Property 2: Code DRY-ness - No Duplicate Code**
    - **Validates: Requirements 4.2, 4.7**

  - [x] 3.5 确保 TypeScript 类型安全
    - 运行 `npm run type-check`
    - 修复所有类型错误
    - 添加缺失的类型定义
    - _Requirements: 4.4_

  - [ ]\* 3.6 编写属性测试验证类型安全
    - **Property 3: TypeScript Type Safety**
    - **Validates: Requirements 4.4**

- [x] 4. Checkpoint - 代码质量验证
  - 确保所有测试通过，如有问题请询问用户

- [x] 5. API 路由优化
  - [x] 5.1 统一 API 响应格式
    - 创建 `src/lib/api/response.ts` 响应构建器
    - 更新所有 API 路由使用统一响应格式
    - 确保错误响应包含 code, message, details
    - _Requirements: 5.3_

  - [ ]\* 5.2 编写属性测试验证 API 响应一致性
    - **Property 4: API Response Consistency**
    - **Validates: Requirements 5.3**

  - [x] 5.3 确保所有 API 输入使用 Zod 验证
    - 检查每个 API 路由的输入验证
    - 添加缺失的 Zod schema
    - 确保验证错误返回有意义的消息
    - _Requirements: 5.4_

  - [ ]\* 5.4 编写属性测试验证 Zod 覆盖
    - **Property 5: Zod Validation Coverage**
    - **Validates: Requirements 5.4**

  - [x] 5.5 优化数据库查询效率
    - 检查 Dashboard API 使用 COUNT 查询
    - 确保分页查询在数据库层执行
    - 移除应用层过滤，改用 SQL WHERE
    - _Requirements: 5.1, 5.2_

- [x] 6. Repository 模式完善
  - [x] 6.1 验证所有数据库操作通过 Repository
    - 检查 API 路由中的直接 SQL 调用
    - 将直接调用迁移到 Repository 方法
    - _Requirements: 6.1, 6.2_

  - [ ]\* 6.2 编写属性测试验证 Repository 模式
    - **Property 6: Repository Pattern Compliance**
    - **Validates: Requirements 6.1, 6.2**

  - [x] 6.3 确保所有 SQL 使用参数化查询
    - 检查所有 sql 模板字面量使用
    - 确保没有字符串拼接 SQL
    - _Requirements: 6.4_

  - [ ]\* 6.4 编写属性测试验证 SQL 注入防护
    - **Property 7: SQL Injection Prevention**
    - **Validates: Requirements 6.4**

- [x] 7. Checkpoint - API 和数据层验证
  - 确保所有测试通过，如有问题请询问用户

- [x] 8. 安全性审查
  - [x] 8.1 验证输入清理
    - 检查 sanitization.ts 使用情况
    - 确保所有用户输入经过清理
    - _Requirements: 11.1_

  - [ ]\* 8.2 编写属性测试验证输入清理
    - **Property 13: Input Sanitization**
    - **Validates: Requirements 11.1**

  - [x] 8.3 验证密码存储安全
    - 检查 bcrypt 配置 (salt rounds >= 10)
    - 确保密码从不以明文存储
    - _Requirements: 11.2_

  - [ ]\* 8.4 编写属性测试验证密码安全
    - **Property 14: Secure Password Storage**
    - **Validates: Requirements 11.2**

  - [x] 8.5 验证 Cookie 安全配置
    - 检查认证 Cookie 设置
    - 确保 httpOnly=true, secure=true
    - _Requirements: 11.3_

  - [ ]\* 8.6 编写属性测试验证 Cookie 安全
    - **Property 15: Secure Cookie Configuration**
    - **Validates: Requirements 11.3**

  - [x] 8.7 验证认证和速率限制
    - 检查 API 路由认证检查
    - 验证速率限制配置
    - _Requirements: 11.4, 11.5_

  - [x] 8.8 验证错误响应不泄露敏感信息
    - 检查错误响应内容
    - 确保不包含堆栈跟踪或敏感数据
    - _Requirements: 11.6_

- [x] 9. Checkpoint - 安全性验证
  - 确保所有测试通过，如有问题请询问用户

- [x] 10. UI/UX 改进
  - [x] 10.1 应用设计系统颜色方案
    - 更新 globals.css 颜色变量
    - 确保使用设计令牌而非硬编码值
    - _Requirements: 9.2, 8.4_

  - [ ]\* 10.2 编写属性测试验证设计令牌使用
    - **Property 9: Design Token Usage**
    - **Validates: Requirements 8.4, 9.2, 9.3**

  - [x] 10.3 验证 Hover 状态不造成布局偏移
    - 检查所有 hover 效果
    - 确保使用颜色/透明度变化而非尺寸变化
    - _Requirements: 9.5_

  - [ ]\* 10.4 编写属性测试验证无布局偏移
    - **Property 10: No Layout Shift on Hover**
    - **Validates: Requirements 9.5**

  - [x] 10.5 确保使用 SVG 图标而非 Emoji
    - 检查所有图标使用
    - 将 emoji 替换为 Lucide React 图标
    - _Requirements: 9.6_

  - [ ]\* 10.6 编写属性测试验证 SVG 图标使用
    - **Property 11: SVG Icons Only**
    - **Validates: Requirements 9.6**

  - [x] 10.7 优化图片加载
    - 确保所有图片使用 Next.js Image 组件
    - 启用懒加载
    - 配置适当的图片格式
    - _Requirements: 10.5_

  - [ ]\* 10.8 编写属性测试验证图片优化
    - **Property 12: Image Optimization**
    - **Validates: Requirements 10.5**

- [x] 11. 可访问性改进
  - [x] 11.1 运行可访问性审计
    - 使用 axe-core 检查组件
    - 修复所有严重和重要问题
    - _Requirements: 8.2_

  - [ ]\* 11.2 编写属性测试验证可访问性
    - **Property 8: Accessibility Compliance**
    - **Validates: Requirements 8.2, 9.7**

  - [x] 11.3 添加 prefers-reduced-motion 支持
    - 检查动画组件
    - 添加媒体查询支持
    - _Requirements: 9.4_

- [x] 12. Checkpoint - UI/UX 验证
  - 确保所有测试通过，如有问题请询问用户

- [x] 13. 项目结构优化
  - [x] 13.1 清理空目录
    - 扫描项目中的空目录
    - 删除不需要的空目录
    - _Requirements: 13.1, 13.4_

  - [ ]\* 13.2 编写属性测试验证项目结构
    - **Property 16: Project Structure Cleanliness**
    - **Validates: Requirements 13.1, 13.4**

  - [x] 13.3 清理未使用文件
    - 识别未被导入的文件
    - 删除确认不需要的文件
    - _Requirements: 13.2, 13.5_

  - [x] 13.4 验证命名规范一致性
    - 检查文件命名 (kebab-case, PascalCase)
    - 修复不一致的命名
    - _Requirements: 13.3_

- [x] 14. 国际化完善
  - [x] 14.1 验证翻译完整性
    - 比较中英文翻译文件
    - 添加缺失的翻译键
    - _Requirements: 14.2, 14.5_

  - [ ]\* 14.2 编写属性测试验证国际化完整性
    - **Property 17: Internationalization Completeness**
    - **Validates: Requirements 14.2, 14.5**

  - [x] 14.3 验证日期和数字本地化
    - 检查日期格式化使用 locale
    - 检查数字格式化使用 locale
    - _Requirements: 14.3, 14.4_

  - [ ]\* 14.4 编写属性测试验证本地化格式
    - **Property 18: Locale-Aware Formatting**
    - **Validates: Requirements 14.3, 14.4**

- [x] 15. 文档更新
  - [x] 15.1 更新 README.md
    - 更新版本号
    - 更新技术栈描述
    - 添加新功能说明
    - _Requirements: 7.3_

  - [x] 15.2 更新 README_zh.md
    - 同步英文 README 的更新
    - 确保中英文一致
    - _Requirements: 7.5_

  - [ ]\* 15.3 编写属性测试验证文档一致性
    - **Property: README Consistency**
    - **Validates: Requirements 7.5**

  - [x] 15.4 更新 CHANGELOG.md
    - 添加新版本条目
    - 记录所有变更
    - _Requirements: 7.4_

  - [x] 15.5 清理过时文档
    - 删除不再相关的文档
    - 更新过时的指南
    - _Requirements: 7.1, 7.2_

- [x] 16. Final Checkpoint - 全面验证
  - 运行完整测试套件
  - 运行构建验证
  - 运行类型检查
  - 确保所有属性测试通过
  - 如有问题请询问用户

## Notes

- 任务标记 `*` 为可选测试任务，可跳过以加快 MVP 进度
- 每个任务引用具体的需求编号以确保可追溯性
- Checkpoint 任务用于阶段性验证，确保增量进展
- 属性测试验证系统的正确性属性
- 单元测试验证具体示例和边界情况
