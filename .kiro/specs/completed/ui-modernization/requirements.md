# Requirements Document

## Introduction

QMS (家庭被子管理系统) UI 现代化重构，采用 shadcn/ui 组件体系，添加 Light/Dark Mode 支持，统一设计系统，提升用户体验和可维护性。

## Glossary

- **Theme_Provider**: 主题提供者组件，管理 light/dark 模式切换
- **Sidebar**: 侧边导航栏组件
- **Command_Palette**: 全局命令面板，支持快捷键搜索
- **Design_System**: 设计系统，包含颜色、字体、间距等变量
- **shadcn_ui**: 基于 Radix UI 的 React 组件库

## Requirements

### Requirement 1: Dark Mode 支持

**User Story:** As a user, I want to switch between light and dark themes, so that I can use the app comfortably in different lighting conditions.

#### Acceptance Criteria

1. WHEN the app loads, THE Theme_Provider SHALL detect system preference and apply the corresponding theme
2. WHEN a user clicks the theme toggle button, THE Theme_Provider SHALL switch between light and dark modes
3. WHEN a theme is selected, THE Theme_Provider SHALL persist the preference to localStorage
4. THE Design_System SHALL provide CSS variables for both light and dark themes
5. WHILE in dark mode, THE app SHALL use dark backgrounds (#0A0E27) with light text (#F1F5F9)
6. WHILE in light mode, THE app SHALL use light backgrounds (#F8FAFC) with dark text (#1E293B)

### Requirement 2: shadcn Sidebar 迁移

**User Story:** As a user, I want a modern collapsible sidebar with smooth animations, so that I can navigate efficiently and maximize screen space.

#### Acceptance Criteria

1. THE Sidebar SHALL use shadcn/ui SidebarProvider and Sidebar components
2. WHEN a user clicks the collapse button, THE Sidebar SHALL animate to icon-only mode
3. WHEN the Sidebar is collapsed, THE Sidebar SHALL show tooltips on hover for menu items
4. WHEN on mobile devices, THE Sidebar SHALL display as a sheet overlay
5. THE Sidebar SHALL support keyboard shortcut (Ctrl+B) for toggling
6. THE Sidebar SHALL persist collapse state to localStorage

### Requirement 3: 全局搜索 Command Palette

**User Story:** As a user, I want to quickly search and navigate using keyboard shortcuts, so that I can find quilts and pages faster.

#### Acceptance Criteria

1. WHEN a user presses Ctrl+K (or Cmd+K on Mac), THE Command_Palette SHALL open
2. THE Command_Palette SHALL search quilts by name, color, and location
3. THE Command_Palette SHALL provide quick navigation to all pages
4. WHEN a user selects a result, THE Command_Palette SHALL navigate to the selected item
5. THE Command_Palette SHALL support keyboard navigation (arrow keys, Enter, Escape)

### Requirement 4: 设计系统统一

**User Story:** As a developer, I want a consistent design system with CSS variables, so that the UI is maintainable and consistent.

#### Acceptance Criteria

1. THE Design_System SHALL define primary color as #2563EB (Trust Blue)
2. THE Design_System SHALL define secondary color as #3B82F6
3. THE Design_System SHALL define CTA/accent color as #F97316 (Orange)
4. THE Design_System SHALL use Inter font family
5. THE Design_System SHALL provide consistent border radius (0.5rem default)
6. THE Design_System SHALL provide consistent spacing scale

### Requirement 5: 组件现代化

**User Story:** As a user, I want modern, accessible UI components, so that the app feels polished and professional.

#### Acceptance Criteria

1. THE Settings page SHALL use Switch components for toggle options
2. THE Quilts list page SHALL use DataTable with sorting and filtering
3. THE Navigation SHALL include Breadcrumb for page hierarchy
4. THE Header SHALL include theme toggle button
5. IF an error occurs, THEN THE app SHALL display error states using Alert components
6. WHEN data is loading, THE app SHALL show Skeleton components

### Requirement 6: 无障碍性

**User Story:** As a user with accessibility needs, I want the app to be fully accessible, so that I can use it with assistive technologies.

#### Acceptance Criteria

1. THE app SHALL meet WCAG AA contrast requirements in both themes
2. THE app SHALL support keyboard navigation for all interactive elements
3. THE app SHALL respect prefers-reduced-motion media query
4. THE app SHALL provide proper ARIA labels for all interactive elements
5. THE app SHALL maintain focus management during navigation
