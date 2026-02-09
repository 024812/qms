# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2026.02.09] - 2026-02-09

### 🏗️ Cards Module Refactoring & Project Cleanup

- **Cards Module Migration to Family-Shared Data**
  - ✅ Created `CardRepository` class (320 lines) with full CRUD operations
  - ✅ Updated `cached-cards.repository.ts` to use `'use cache'` for shared data
  - ✅ Migrated `card-actions.ts` from `revalidatePath` to `revalidateTag`
  - ✅ Database migration: `cards.userId` now nullable with `ON DELETE SET NULL`
  - ✅ Added data isolation mode documentation to `MODULE_STANDARD.md`

- **Module Structure Compliance**
  - ✅ Added `quilts/[id]/page.tsx` detail page (Quilts compliance: 65% → 90%)
  - ✅ Added `cards/layout.tsx` module layout (Cards compliance: 90% → 95%)
  - ✅ Created `types.ts` files for both modules

- **Project Cleanup**
  - ✅ Deleted `docs/archive/` (8 checkpoint files)
  - ✅ Removed obsolete documentation (CLEANUP_COMPLETED.md, etc.)
  - ✅ Cleaned up 25 test/verify scripts from `scripts/`
  - ✅ Removed root-level temp files (design_system_output.md, etc.)

## [2026.02.02] - 2026-02-02

### 🃏 Trading Cards Module Production Release

- **Price Estimation & Smart Scan**
  - ✅ **Production Ready**: Enabled Production eBay API integration for real-time market data.
  - ✅ **Smart Scan**: Enhanced AI identification with locale-aware risk warnings (Chinese support).
  - ✅ **Valuation**: Restored "Estimate Price" button for manual valuation triggers.
- **Bug Fixes & Stability**
  - **Environment Fallback**: Added robust fallback to `.env` credentials if database settings are missing.
  - **Data Integrity**: Fixed URL corruption issue in System Settings API.
  - **Authentication**: Resolved eBay Client Credentials scope issues.
- **Cleanup**
  - Removed temporary debug scripts.
  - Updated project documentation.

## [2026.01.21] - 2026-01-21

### 🧹 Project Clean & Archival

- **Project Organization**
  - Archived all completed specs to `.kiro/specs/completed/`
  - Moved incomplete specs to `.kiro/specs/archived/`
  - Cleaned up project directory structure
  - Updated documentation
- **Version Management**
  - Bumped version to 2026.01.21
  - Updated README files (English & Chinese)
  - Consolidated release notes

## [2026.01.20] - 2026-01-20

### 👤 User Management & UI Enhancements

- **User Management System**
  - Complete CRUD operations for users (admin only)
  - Role-based access control (admin/member)
  - Module subscription management per user
  - Password management in users table
  - User creation with module assignments
- **UI/UX Improvements**
  - Beautiful welcome homepage with feature showcase
  - Sidebar auto-refresh after login
  - Module navigation improvements
  - Removed "Import/Export" from quilt module menu (moved to admin settings)
- **Sports Card Module**
  - Market data integration (eBay, PSA, Beckett, 130Point)
  - Value estimation algorithm
  - Card grading support
  - Image upload for cards

## [1.3.0] - 2026-01-13

### 🎨 UI Modernization

This release focuses on comprehensive UI modernization with shadcn/ui components and dark mode support.

#### Dark Mode Support

- **ThemeProvider**: Integrated next-themes for system-aware theme switching
- **ThemeToggle**: New component supporting light/dark/system modes
- **CSS Variables**: Complete dark mode color scheme using CSS custom properties
- **Component Updates**: All components updated to use CSS variables instead of hardcoded colors

#### shadcn Sidebar Migration

- **AppSidebar**: New sidebar component using shadcn/ui Sidebar primitives
- **SidebarRail**: Drag-to-collapse functionality
- **Keyboard Shortcuts**: Ctrl+B to toggle sidebar
- **Mobile Support**: Sheet-based sidebar on mobile devices

#### Command Palette

- **CommandPalette**: New Ctrl+K command palette for quick navigation
- **Quilt Search**: Search quilts by name, color, location
- **Page Navigation**: Quick access to all pages
- **Theme Switching**: Change theme from command palette

#### Navigation Improvements

- **Breadcrumb**: Auto-generated breadcrumb navigation based on route
- **AppHeader**: Redesigned header with breadcrumb, theme toggle, and command palette trigger

#### Accessibility

- **ARIA Labels**: shadcn components include built-in ARIA support
- **Keyboard Navigation**: Full keyboard support for all interactive elements
- **Reduced Motion**: Respects prefers-reduced-motion media query
- **Color Contrast**: WCAG AA compliant color scheme

#### Components Updated for Dark Mode

- UsageCalendar, TemperatureDisplay, UsageTracker, UsageHistoryTable
- DashboardAlerts, SeasonalChart, RecentUsageList
- QuiltFilters, ErrorBoundary, ImportUpload, ImportResults
- WeatherForecast, WeatherWidget

## [1.2.0] - 2026-01-07

### 🔄 2026 Comprehensive Project Review

This release focuses on a comprehensive review and upgrade of the entire project, including dependency updates, code quality improvements, security enhancements, and UI/UX optimizations.

#### Dependency Upgrades

- **Next.js**: 16.0.7 → 16.1.1
- **React**: 19.2.1 → 19.2.3
- **TypeScript**: 5.6.3 → 5.9.3
- **Tailwind CSS**: 4.1.17 → 4.1.18
- **React Query**: 5.90.12 → 5.90.16
- **Framer Motion**: 12.23.25 → 12.24.7
- **Zod**: 4.1.13 → 4.3.5
- **Lucide React**: Updated to 0.562.0
- All other dependencies updated to latest stable versions

#### Code Quality Improvements

- ✅ Removed all unused imports and variables (ESLint no-unused-vars)
- ✅ Refactored duplicate code patterns into reusable functions
- ✅ Enhanced TypeScript type safety (zero type errors)
- ✅ Unified API response format with `createSuccessResponse` and `createErrorResponse`
- ✅ Ensured all API inputs use Zod validation
- ✅ Optimized database queries (COUNT queries instead of fetching all records)

#### Next.js 16 Best Practices

- ✅ Updated middleware to proxy naming convention (`src/proxy.ts`)
- ✅ Updated `next.config.js` with Turbopack configuration
- ✅ Verified all API routes follow Next.js 16 patterns

#### Security Enhancements

- ✅ Verified input sanitization using `sanitization.ts`
- ✅ Confirmed bcrypt configuration (salt rounds >= 10)
- ✅ Validated secure cookie settings (httpOnly=true, secure=true)
- ✅ Verified authentication and rate limiting
- ✅ Confirmed error responses don't leak sensitive information

#### UI/UX Improvements

- ✅ Applied design system color scheme (Trust Blue #2563EB)
- ✅ Verified hover states don't cause layout shift
- ✅ Replaced emojis with SVG icons (Lucide React)
- ✅ Optimized image loading with Next.js Image component
- ✅ Added `prefers-reduced-motion` support for accessibility
- ✅ Ran accessibility audit with axe-core

#### Repository Pattern

- ✅ Verified all database operations go through Repository classes
- ✅ Ensured all SQL uses parameterized queries (Neon sql template literal)

#### Project Structure

- ✅ Cleaned up empty directories
- ✅ Removed unused files
- ✅ Verified naming convention consistency

#### Internationalization

- ✅ Verified translation completeness (Chinese/English)
- ✅ Added missing translation keys

#### Documentation

- ✅ Updated README.md with new version and tech stack
- ✅ Updated README_zh.md to match English version
- ✅ Updated CHANGELOG.md with all changes
- ✅ Updated docs/INDEX.md with current architecture

## [1.1.0] - 2025-12-11

### 🏗️ Architecture Simplification

This release focuses on simplifying the project architecture and improving maintainability.

#### Version Management

- **Unified Version Number**: All version references now consistently show 1.1.0
- **Single Source of Truth**: Version is now read from package.json via REST API
- **New System Info API**: Created `/api/settings/system-info` endpoint
- **Settings Page Update**: Version display now fetches from API instead of hardcoded fallback

#### Completed Changes

- ✅ Removed tRPC framework, migrated to pure REST API + React Query
- ✅ Removed deprecated `executeQuery` function (SQL injection risk)
- ✅ Cleaned up notification system code
- ✅ Removed unused components and hooks
- ✅ Cleaned up temporary documentation files

#### Code Quality Improvements (Phase 3)

- **Removed Outdated Documentation**: Deleted `FRONTEND-TRPC-MIGRATION.md` and `TRPC-MUTATION-FIX.md`
- **Updated Code Comments**: Replaced tRPC references with "React Query" in 4 files
- **Fixed README.md**: Updated Backend API description to "Next.js API Routes (REST API)"
- **Optimized Dashboard API**: Changed from fetching all quilts to database-level COUNT queries
- **Updated Service Worker**: Changed tRPC endpoints to REST API endpoints in `public/sw.js`

### 📚 Documentation

- Updated README.md version to 1.1.0
- Updated README_zh.md version to 1.1.0
- Added architecture simplification changelog

## [1.0.1] - 2025-01-17

### 🐛 Bug Fixes

- Fixed quilt status change failure due to function signature mismatch
- Fixed double-click behavior not working in quilt management page
- Fixed usage detail page back button requiring two clicks
- Fixed notification query SQL parameter count mismatch
- Fixed duplicate close buttons in image viewer dialog
- Fixed misaligned action columns in quilt list view
- Fixed usage detail page unable to get quiltId parameter
- Added missing translations for quilts.form.notes and quilts.form.purchaseDate

### ✨ New Features

- **Quilt Image Viewer**
  - View main image and attachment images in full screen
  - Navigate between images with arrow keys or buttons
  - Thumbnail navigation bar for quick access
  - Support ESC key to close dialog
  - Display current image number and total count

- **Independent Usage Detail Page**
  - New route: `/usage/[quiltId]`
  - Display quilt information card with complete details
  - Show usage history table with temperature data
  - Smart back button (returns to source page based on `from` parameter)
  - Shareable direct links to specific quilt usage details

- **Purchase Date Field**
  - Added purchase date input in quilt add/edit form
  - Date picker with future date restriction
  - Properly loads and displays existing purchase dates
  - Optional field, not required

- **Data Backup & Restore**
  - Complete backup and restore documentation
  - PowerShell scripts for Windows (backup-database.ps1, restore-database.ps1)
  - Support for compressed backups
  - Automatic cleanup of old backups (keeps 30 most recent)
  - Pre-restore automatic backup for safety
  - npm scripts: `npm run backup`, `npm run backup:compress`, `npm run restore`

### 🔄 Refactoring

- **Simplified Usage Tracking Page**
  - Removed embedded detail view (176 lines of code removed)
  - All "view details" actions now navigate to independent detail page
  - Cleaner code structure, improved maintainability
  - Consistent user experience across the application
  - Code reduced from 466 lines to 290 lines (38% reduction)

### 📚 Documentation

- Added comprehensive backup and restore guide (BACKUP_RESTORE_GUIDE.md)
- Added quick start guide for backups (BACKUP_QUICK_START.md)
- Updated README with new features

### 🎯 Improvements

- All quilts now show image view button for consistent UI alignment
- Improved navigation flow: only one click needed to return from detail pages
- Better URL structure for usage details
- Enhanced user experience with clearer navigation paths

## [1.0.0] - 2025-01-11

### 🎉 First Stable Release

This is the first stable release of the Quilt Management System (QMS)!

### Added

- **UI Unification**
  - Migrated all pages to Shadcn UI component library
  - Unified table styles across all pages (header colors, sorting icons, action columns)
  - Created reusable error alert component
  - Standardized card padding (p-4 for stats, p-6 for content)
  - Improved empty state displays

- **Quilt Management Enhancements**
  - Componentized quilt table row for better maintainability
  - View usage history button (eye icon) in action column
  - Direct navigation to usage tracking page with quilt details
  - Fixed duplicate History icons in action column

- **Analytics Page Reorganization**
  - Split data overview into 4 focused tabs:
    - Data Overview (基础统计)
    - Status Distribution (状态分布)
    - Usage Rankings (使用排行)
    - Usage Frequency Analysis (使用频率分析)
  - Better data organization and navigation

- **Documentation**
  - Created comprehensive docs directory structure
  - Added PROJECT_SUMMARY.md with complete project overview
  - Added NEXT_STEPS.md for future development roadmap
  - Updated README with latest features

### Changed

- Improved table sorting with visual indicators (arrows)
- Enhanced action column layout and icon consistency
- Optimized page layouts and spacing
- Better mobile responsiveness

### Fixed

- Fixed size column sorting to use area calculation (length × width)
- Fixed view history button functionality in quilt management
- Fixed duplicate icons in operation columns
- Improved error handling and user feedback

### Technical

- TypeScript strict mode enabled
- Better component separation and reusability
- Consistent styling patterns across all pages
- Improved code organization

## [0.5.0] - 2025-11-04

### Added

- **System Settings**
  - Double-click behavior configuration for quilt list (none/status/edit)
  - Configurable interaction behavior in system settings
  - Database migration for double-click action setting

- **Import/Export**
  - Unified import/export page with tab navigation
  - Excel file import support (.xls, .xlsx)
  - CSV and JSON export functionality
  - Integrated existing import/export components

### Changed

- **Overall Framework**
  - Updated app title to "QMS家庭被子管理系统"
  - Removed language switcher from header
  - Updated app metadata to Chinese

- **Dashboard (仪表面板)**
  - Renamed from "仪表板" to "仪表面板"
  - Removed subtitle text
  - Date and weather now displayed on same line with larger font
  - Compact single-line display for "Currently in Use" quilts list
  - Compact single-line display for "Historical Usage" list

- **Quilt Management**
  - Default brand value set to "无品牌"
  - Default location value set to "未存储"
  - Number inputs (length/width/weight) now use integer steps
  - Double-click on table rows triggers configured action
  - Status change to "IN_USE" automatically sets location to "在用"
  - Status change to "IN_USE" automatically creates usage record

- **Analytics (数据分析)**
  - Renamed from "分析" to "数据分析"
  - Removed "Available" status from status distribution chart
  - More compact layout for "Most Used Quilts" list

- **Navigation**
  - "Reports" menu item renamed to "导入导出"
  - Updated navigation descriptions

### Fixed

- Usage record creation when changing quilt status to IN_USE
- Automatic location update when status changes

## [0.3.0] - 2025-11-03

### Added

- **Code Quality & Architecture**
  - Logging utility (`src/lib/logger.ts`) with environment-based filtering
  - Repository pattern for database operations
  - Type-safe database type definitions
  - Error boundaries with bilingual support
  - Base repository implementation for consistent data access

- **Authentication & Security**
  - Password utilities with bcrypt hashing (12 salt rounds)
  - JWT token generation and verification
  - Rate limiting for login attempts (5 attempts per 15 minutes)
  - Login page with password visibility toggle
  - Logout functionality
  - Middleware-based route protection
  - Database password storage (passwords stored in `system_settings` table)
  - Instant password changes without redeployment

- **API Consolidation**
  - tRPC integration for type-safe API calls
  - Unified error handling with `handleTRPCError`
  - Quilts router with tRPC
  - Usage router with tRPC
  - Settings router with tRPC
  - Removed duplicate REST API endpoints

- **Enhanced Settings Page**
  - Change password dialog with validation
  - Modify application name (saved to database)
  - Language switcher component (🇨🇳 中文 / 🇺🇸 English)
  - Real-time database statistics (auto-refresh every minute)
  - System information display (version, framework, environment)
  - Browser-based system settings initialization

- **Usage Tracking Improvements**
  - Migrated usage tracking to tRPC
  - Edit usage records functionality
  - Delete usage records functionality
  - Removed usage type field (simplified UI)
  - Removed season column from usage table

- **Database**
  - `system_settings` table for application configuration
  - Password hash storage in database
  - Application name storage
  - UUID extension support

### Changed

- Replaced `console.log` with structured logging throughout codebase
- Updated all database operations to use repository pattern
- Migrated frontend API calls from REST to tRPC
- Improved error handling with consistent error messages
- Enhanced settings page UI with better organization

### Fixed

- Usage record editing now works correctly with tRPC
- Toast notifications work properly in all components
- UUID generation in system_settings table
- Timestamp handling in database inserts

### Security

- Passwords now stored securely in database with bcrypt
- JWT tokens for session management
- Rate limiting on login endpoint
- HTTP-only cookies for token storage
- Middleware protection for all routes except login and health check

### Documentation

- Added `PASSWORD-MIGRATION-GUIDE.md` for password migration instructions
- Updated README with new features and setup instructions
- Added changelog for version tracking

## [0.2.2] - 2025-01-16

### Added

- Usage tracking automation
- Bilingual support (Chinese/English)
- Data validation with Zod
- UI enhancements with animations

### Changed

- Improved quilt management interface
- Enhanced data import/export

### Fixed

- Various bug fixes and performance improvements

## [0.2.0] - 2025-01-10

### Added

- Initial release with core functionality
- Quilt management (CRUD operations)
- Basic usage tracking
- Excel import/export
- Responsive design

---

[1.3.0]: https://github.com/ohengcom/qms-app/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/ohengcom/qms-app/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/ohengcom/qms-app/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/ohengcom/qms-app/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/ohengcom/qms-app/compare/v0.5.0...v1.0.0
[0.5.0]: https://github.com/ohengcom/qms-app/compare/v0.3.0...v0.5.0
[0.3.0]: https://github.com/ohengcom/qms-app/compare/v0.2.2...v0.3.0
[0.2.2]: https://github.com/ohengcom/qms-app/compare/v0.2.0...v0.2.2
[0.2.0]: https://github.com/ohengcom/qms-app/releases/tag/v0.2.0
