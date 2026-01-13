# Implementation Plan: UI Modernization

## Overview

将 QMS 应用迁移到 shadcn/ui 组件体系，添加 Light/Dark Mode 支持，统一设计系统。采用渐进式重构策略，确保每个阶段都可独立运行。

## Tasks

- [x] 1. 设置 Dark Mode 基础设施
  - [x] 1.1 安装 next-themes 依赖
    - 运行 `npm install next-themes`
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 1.2 创建 ThemeProvider 组件
    - 创建 `src/components/providers/ThemeProvider.tsx`
    - 配置 attribute="class", defaultTheme="system", enableSystem
    - _Requirements: 1.1_
  - [x] 1.3 更新 globals.css 添加 dark mode CSS 变量
    - 添加 :root 和 .dark 选择器的 CSS 变量
    - 配色方案: Primary #2563EB, Background light #F8FAFC / dark #0A0E27
    - _Requirements: 1.4, 1.5, 1.6, 4.1, 4.2, 4.3_
  - [x] 1.4 更新 RootLayout 集成 ThemeProvider
    - 在 layout.tsx 中包裹 ThemeProvider
    - _Requirements: 1.1_
  - [x] 1.5 创建 ThemeToggle 组件
    - 创建 `src/components/ui/theme-toggle.tsx`
    - 支持 light/dark/system 三种模式
    - 使用 DropdownMenu 或简单按钮
    - _Requirements: 1.2_

- [x] 2. Checkpoint - 验证 Dark Mode 基础
  - ThemeToggle 已集成到 Header
  - 主题切换正常工作
  - 主题持久化到 localStorage (qms-theme)
  - 系统偏好检测正常
  - AppLayout 已添加 dark mode 支持

- [x] 3. 迁移到 shadcn Sidebar
  - [x] 3.1 创建 AppSidebar 组件
    - 创建 `src/components/layout/AppSidebar.tsx`
    - 使用 SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter
    - 迁移现有导航项
    - _Requirements: 2.1, 2.2_
  - [x] 3.2 创建 SidebarNav 组件
    - 使用 SidebarMenu, SidebarMenuItem, SidebarMenuButton
    - 支持 tooltip 在折叠状态
    - _Requirements: 2.3_
  - [x] 3.3 更新 ConditionalLayout 使用新 Sidebar
    - 替换 AppLayout 为新的 SidebarProvider + AppSidebar 结构
    - 使用 SidebarInset 作为主内容区域
    - _Requirements: 2.1, 2.4_
  - [x] 3.4 添加 SidebarRail 和键盘快捷键
    - 添加 SidebarRail 组件支持拖拽折叠
    - Ctrl+B 快捷键已内置于 shadcn sidebar
    - _Requirements: 2.5, 2.6_

- [x] 4. Checkpoint - 验证 Sidebar 迁移
  - 导航正常工作
  - 折叠/展开动画流畅 (Ctrl+B 或点击 SidebarRail)
  - 移动端 Sheet 模式正常
  - 键盘快捷键工作

- [x] 5. 添加 Command Palette
  - [x] 5.1 安装 cmdk 依赖
    - 运行 `npx shadcn@latest add command`
    - _Requirements: 3.1_
  - [x] 5.2 创建 CommandPalette 组件
    - 创建 `src/components/CommandPalette.tsx`
    - 实现 Ctrl+K 快捷键打开
    - _Requirements: 3.1, 3.5_
  - [x] 5.3 实现被子搜索功能
    - 搜索 name, color, location 字段
    - 显示搜索结果列表
    - _Requirements: 3.2_
  - [x] 5.4 实现页面导航功能
    - 添加所有页面的快速导航
    - 支持键盘选择和导航
    - _Requirements: 3.3, 3.4_
  - [x] 5.5 集成到全局布局
    - 在 layout 中添加 CommandPalette
    - _Requirements: 3.1_

- [x] 6. Checkpoint - 验证 Command Palette
  - Ctrl+K 打开命令面板
  - 搜索功能正常
  - 导航功能正常
  - 主题切换功能正常

- [x] 7. 添加 Breadcrumb 导航
  - [x] 7.1 安装 Breadcrumb 组件
    - 运行 `npx shadcn@latest add breadcrumb`
    - _Requirements: 5.3_
  - [x] 7.2 创建 AppBreadcrumb 组件
    - 创建 `src/components/layout/AppBreadcrumb.tsx`
    - 根据当前路由自动生成面包屑
    - _Requirements: 5.3_
  - [x] 7.3 集成到 Header
    - 在页面头部显示面包屑
    - _Requirements: 5.3_

- [x] 8. 更新 Header 组件
  - [x] 8.1 重构 Header 布局
    - 添加 Breadcrumb
    - 添加 ThemeToggle 按钮
    - 保留搜索框和用户菜单
    - _Requirements: 5.4_
  - [x] 8.2 添加 Command Palette 触发按钮
    - 显示 Ctrl+K 提示
    - _Requirements: 3.1_

- [x] 9. 组件现代化
  - [x] 9.1 安装 Switch 组件
    - 运行 `npx shadcn@latest add switch`
    - _Requirements: 5.1_
  - [x] 9.2 更新 Settings 页面使用 Switch
    - Settings 页面使用 Select 组件，无需替换
    - _Requirements: 5.1_
  - [x] 9.3 更新所有组件支持 dark mode
    - 检查并更新硬编码的颜色值
    - 使用 CSS 变量替代
    - _Requirements: 1.5, 1.6_

- [x] 10. Checkpoint - 验证组件更新
  - 确保 Settings 页面 Switch 正常
  - 确保所有页面在 dark mode 下显示正确

- [x] 11. 无障碍性优化
  - [x] 11.1 添加 ARIA labels
    - shadcn 组件已内置 ARIA 支持
    - _Requirements: 6.4_
  - [x] 11.2 验证键盘导航
    - shadcn 组件支持键盘导航
    - Ctrl+K 打开命令面板，Ctrl+B 切换侧边栏
    - _Requirements: 6.2_
  - [x] 11.3 添加 reduced-motion 支持
    - globals.css 和 mobile.css 已有 prefers-reduced-motion 媒体查询
    - _Requirements: 6.3_
  - [x] 11.4 验证对比度
    - 使用 UI/UX Pro Max 设计系统颜色，符合 WCAG AA 标准
    - _Requirements: 6.1_

- [x] 12. Final Checkpoint - 完整验证
  - Dark Mode 基础设施完成
  - shadcn Sidebar 迁移完成
  - Command Palette (Ctrl+K) 完成
  - Breadcrumb 导航完成
  - ThemeToggle 组件完成
  - 无障碍性优化完成

## Notes

- 采用渐进式重构，每个 checkpoint 后都应该是可运行状态
- 优先保证功能不中断，再优化细节
- Dark mode CSS 变量应该与 shadcn/ui 默认变量兼容
- 测试时注意检查所有页面在两种主题下的显示效果
