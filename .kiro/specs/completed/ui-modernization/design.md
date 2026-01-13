# Design Document: UI Modernization

## Overview

本设计文档描述 QMS 应用的 UI 现代化重构方案，采用 shadcn/ui 组件体系，实现 Light/Dark Mode，统一设计系统。

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Root Layout                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                   ThemeProvider                          ││
│  │  ┌─────────────────────────────────────────────────────┐││
│  │  │                 SidebarProvider                      │││
│  │  │  ┌──────────┐  ┌────────────────────────────────┐   │││
│  │  │  │ Sidebar  │  │         SidebarInset           │   │││
│  │  │  │          │  │  ┌──────────────────────────┐  │   │││
│  │  │  │ - Logo   │  │  │        Header            │  │   │││
│  │  │  │ - Nav    │  │  │  - Breadcrumb            │  │   │││
│  │  │  │ - Footer │  │  │  - Search (Cmd+K)        │  │   │││
│  │  │  │          │  │  │  - Theme Toggle          │  │   │││
│  │  │  │          │  │  └──────────────────────────┘  │   │││
│  │  │  │          │  │  ┌──────────────────────────┐  │   │││
│  │  │  │          │  │  │        Main Content      │  │   │││
│  │  │  │          │  │  │        (children)        │  │   │││
│  │  │  │          │  │  └──────────────────────────┘  │   │││
│  │  │  └──────────┘  └────────────────────────────────┘   │││
│  │  └─────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │              CommandDialog (Global)                      ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. ThemeProvider

使用 `next-themes` 库实现主题切换。

```typescript
// src/components/providers/ThemeProvider.tsx
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: 'light' | 'dark' | 'system';
  storageKey?: string;
}

// 使用 next-themes 的 ThemeProvider
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
```

### 2. ThemeToggle Component

```typescript
// src/components/ui/theme-toggle.tsx
interface ThemeToggleProps {
  className?: string;
}

// 使用 DropdownMenu 或简单按钮切换主题
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  // 切换 light/dark/system
}
```

### 3. AppSidebar (shadcn Sidebar)

```typescript
// src/components/layout/AppSidebar.tsx
interface AppSidebarProps {
  // 使用 shadcn Sidebar 组件
}

// 结构:
// - SidebarHeader: Logo
// - SidebarContent: Navigation Menu
// - SidebarFooter: Version, Links
// - SidebarRail: 折叠拖拽条
```

### 4. CommandPalette

```typescript
// src/components/CommandPalette.tsx
interface CommandPaletteProps {
  quilts: Quilt[];
}

// 功能:
// - 搜索被子 (名称、颜色、位置)
// - 快速导航到页面
// - 键盘快捷键 Ctrl+K
```

### 5. Breadcrumb Navigation

```typescript
// src/components/layout/AppBreadcrumb.tsx
interface BreadcrumbItem {
  label: string;
  href?: string;
}

// 根据当前路由自动生成面包屑
```

## Data Models

### Theme Configuration

```typescript
interface ThemeConfig {
  light: {
    background: '#F8FAFC';
    foreground: '#1E293B';
    primary: '#2563EB';
    secondary: '#3B82F6';
    accent: '#F97316';
    muted: '#F1F5F9';
    mutedForeground: '#64748B';
    border: '#E2E8F0';
    card: '#FFFFFF';
    cardForeground: '#1E293B';
  };
  dark: {
    background: '#0A0E27';
    foreground: '#F1F5F9';
    primary: '#3B82F6';
    secondary: '#60A5FA';
    accent: '#FB923C';
    muted: '#1E293B';
    mutedForeground: '#94A3B8';
    border: '#1E293B';
    card: '#0F172A';
    cardForeground: '#F1F5F9';
  };
}
```

### Navigation Items

```typescript
interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  badge?: string | number;
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Theme Persistence Round-Trip

_For any_ theme selection (light, dark, system), selecting a theme and then reloading the page should restore the same theme preference from localStorage.

**Validates: Requirements 1.1, 1.3**

### Property 2: Command Palette Search Relevance

_For any_ search query in the Command Palette, all returned quilt results should contain the query string in their name, color, or location fields (case-insensitive).

**Validates: Requirements 3.2**

### Property 3: Sidebar Collapse State Persistence

_For any_ sidebar collapse action, the collapse state should be persisted to localStorage and restored on page reload.

**Validates: Requirements 2.6**

### Property 4: DataTable Sorting Invariant

_For any_ DataTable sort operation, the resulting list should contain exactly the same elements as the original list, just in different order.

**Validates: Requirements 5.2**

### Property 5: DataTable Filtering Subset

_For any_ DataTable filter operation, the resulting list should be a subset of the original list (all filtered items exist in original).

**Validates: Requirements 5.2**

### Property 6: WCAG AA Contrast Compliance

_For any_ text element in the app, the contrast ratio between text color and background color should be at least 4.5:1 for normal text and 3:1 for large text, in both light and dark modes.

**Validates: Requirements 6.1**

### Property 7: Keyboard Accessibility

_For any_ interactive element (buttons, links, inputs), the element should be focusable via Tab key and operable via Enter or Space key.

**Validates: Requirements 6.2**

### Property 8: ARIA Labels Presence

_For any_ interactive element without visible text, the element should have an aria-label, aria-labelledby, or title attribute providing an accessible name.

**Validates: Requirements 6.4**

## Error Handling

### Theme Loading Errors

- If localStorage is unavailable, fall back to system preference
- If system preference detection fails, default to light mode

### Command Palette Errors

- If quilt data fails to load, show error message in palette
- If search throws error, show "Search unavailable" message

### Sidebar State Errors

- If localStorage is unavailable, default to expanded state
- If state parsing fails, reset to default expanded state

## Testing Strategy

### Unit Tests

- Theme toggle functionality
- Command palette search logic
- Breadcrumb generation from routes
- Sidebar collapse state management

### Property-Based Tests

- Theme persistence round-trip (Property 1)
- Search relevance (Property 2)
- DataTable sorting invariant (Property 4)
- DataTable filtering subset (Property 5)

### Integration Tests

- Full theme switching flow
- Command palette navigation
- Sidebar responsive behavior

### Accessibility Tests

- Contrast ratio validation (Property 6)
- Keyboard navigation (Property 7)
- ARIA labels audit (Property 8)

### Testing Framework

- Vitest for unit and property tests
- fast-check for property-based testing
- @testing-library/react for component tests
- axe-core for accessibility testing
