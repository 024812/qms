# QMS - Family Item Management System 🏠

**[English](README.md) | [中文](README_zh.md)**

> **Modular Family Item Management System**

A modern Next.js application with Neon PostgreSQL that provides a modular, extensible platform for managing various family items including quilts, trading cards, and more.

**🌐 Live Demo**: https://qms-app-omega.vercel.app

## ✨ Key Features

### 📦 Modular Architecture

- **Multi-Module Support**: Extensible system supporting multiple item types
  - 🛏️ **Quilt Management**: Bedding inventory with usage tracking
  - 🃏 **Trading Cards**: Trading card collection management
  - 🔧 _More modules coming soon..._
- **Dynamic Sidebar Navigation**: Collapsible module-specific sub-menus
- **Module Subscription**: Users can subscribe/unsubscribe to modules
- **Role-Based Access**: Admin-only system management features

### 📊 Core Functionality (Quilt Module)

- **Quilt Management**: Complete CRUD operations with auto-generated names and numbers
- **Image Management**: Upload and manage quilt photos with Cloudinary integration
- **Usage Tracking**: Automated usage record creation with smart status detection
- **Status Management**: Three states (In Use, Storage, Maintenance) with intelligent transitions
- **Weather Display**: Real-time weather information and forecasts
- **Data Analytics**: Usage statistics, seasonal analysis, and trend visualization
- **Settings Management**: Centralized configuration with database storage

### 🃏 Sports Card Management

- **Unified Card Dashboard**: Single interface for viewing and editing card details with a 3-column layout (Images, Data, AI Analysis)
- **AI-Powered Insights**: Real-time player news and market sentiment gathering via Perplexity API integration, combined with Azure OpenAI analysis
- **Card Tracking**: Detailed attributes including player, team, year, brand, and series
- **Grading Support**: Track professional grading (PSA, BGS, SGC, CGC) with certification numbers
- **Value Estimation**: Built-in algorithm to estimate card value based on grade, age, and features
- **Market Connect**: Direct integration with eBay, 130Point, PSA CardFacts, and Beckett for market data
- **ROI Visualization**: Real-time Return on Investment (ROI) calculation based on purchase vs. current value
- **Collection Stats**: Comprehensive statistics on total value, ROI, and brand distribution

### 🎨 Modern UI/UX

- **Responsive Design**: Optimized for desktop, tablet, and mobile devices using Tailwind CSS
- **Smooth Animations**: Framer Motion powered transitions and micro-interactions
- **Dual View Modes**: Grid and list views with seamless switching
- **Advanced Filtering**: Multi-criteria search with season, status, location, brand, and weight filters
- **Bilingual Support**: Full Chinese/English interface with language switcher
- **Empty States**: Friendly guidance when no data is available with contextual actions
- **Loading States**: Skeleton screens for better perceived performance
- **Real-time Stats**: Live database statistics with auto-refresh
- **Design System**: Consistent spacing, colors, and typography throughout
- **Optimistic Updates**: Instant UI feedback for better user experience
- **Dashboard**: Comprehensive overview with quick actions and statistics

### 🔐 Security & Authentication

- **Password Protection**: Secure login with JWT session management
- **Route Protection**: Middleware-based authentication
- **Session Persistence**: Remember me functionality
- **Secure Cookies**: HTTP-only cookies for token storage
- **Database Password Storage**: Passwords stored securely in database (no environment variable updates needed)
- **Instant Password Changes**: Change password without redeployment

### 🚀 Performance & Reliability

- **Fast Loading**: < 2s first load, < 500ms page transitions
- **Optimized Queries**: Database-level filtering with repository pattern
- **Efficient Rendering**: React Query with optimistic updates for instant feedback
- **Code Splitting**: Automatic route-based code splitting with Next.js
- **Serverless**: Neon PostgreSQL for scalable database
- **Error Handling**: Comprehensive error boundaries with user-friendly Chinese messages

## 🏗️ Tech Stack

### Frontend

- **Framework**: Next.js 16.1.1 (App Router)
- **Language**: TypeScript 5.9.3
- **Styling**: Tailwind CSS 4.1.18
- **UI Components**: Radix UI
- **Animations**: Framer Motion 12.24.7
- **State Management**: Zustand 5.0.8, React Query 5.90.16
- **Forms**: React Hook Form + Zod 4.3.5

### Backend

- **Database**: Neon Serverless PostgreSQL
- **API**: Next.js API Routes (REST API)
- **Authentication**: JWT + bcryptjs
- **Validation**: Zod schemas
- **ORM**: Custom Repository Pattern
- **Image Storage**: Cloudinary
- **Weather API**: OpenWeatherMap

### DevOps

- **Deployment**: Vercel
- **Version Control**: Git + GitHub
- **Code Quality**: ESLint, Prettier, Husky
- **Package Manager**: npm

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/ohengcom/qms-app.git
cd qms-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Neon database URL

# Set up admin password
npm run setup-password

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the application.

### Environment Variables

```env
# Database (Required)
DATABASE_URL="postgresql://..."

# Authentication (Required)
QMS_JWT_SECRET="..."

# Image Upload (Optional)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="..."
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="..."

# Weather API (Optional)
OPENWEATHER_API_KEY="..."

# Optional - Password can be managed in Settings page
QMS_PASSWORD_HASH="..."  # Only needed for initial setup
```

### Initial Setup

After deployment, the system settings will be automatically initialized on first use. You can manage your password in the Settings page.

## 📊 Database Schema

### Main Tables

**quilts** - Quilt information

- Basic info: name, season, dimensions, weight, materials
- Storage: location, packaging, brand, purchase date
- Status: current_status (IN_USE, STORAGE, MAINTENANCE)
- Images: main_image, attachment_images (Cloudinary URLs)

**usage_records** - Usage tracking

- Quilt reference
- Start/end dates
- Usage type (REGULAR, GUEST, SPECIAL_OCCASION, SEASONAL_ROTATION)
- Status (ACTIVE, COMPLETED)
- Notes

**system_settings** - Application configuration

- Key-value storage for settings
- Password hash (bcrypt)
- Application name
- Other configurable options

## 🎯 Core Features

### 1. Automated Usage Tracking

When you change a quilt's status:

- **To IN_USE**: Automatically creates a new usage record
- **From IN_USE**: Automatically ends the active usage record
- **Date Selection**: Choose custom start/end dates
- **Usage Types**: Regular, Guest, Special Occasion, Seasonal Rotation
- **Notes Support**: Add optional notes to records

### 2. Smart Quilt Naming

Automatically generates names in format:
`Brand + Color + Weight + Season`

Example: `百思寒褐色1100克春秋被`

### 3. Weather Display

Real-time weather information:

- Current temperature and weather conditions
- Weather forecasts
- Historical weather data for usage records

### 4. Image Management

- Upload main quilt photo
- Add multiple attachment images
- Cloudinary integration for optimized storage
- Image preview and management

### 5. Advanced Filtering

Multi-criteria search with:

- Season (Winter, Spring/Autumn, Summer, All-Season)
- Status (In Use, Storage, Maintenance)
- Location
- Brand
- Weight range
- Text search

### 6. Dual View Modes

**Grid View**:

- Beautiful card layout with images
- Season color indicators
- Status badges
- Hover effects
- Responsive columns (1-4)

**List View**:

- Detailed table format
- Sortable columns
- Batch operations
- Quick actions

## 📚 Available Scripts

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run start                  # Start production server
npm run lint                   # Run ESLint
npm run type-check            # TypeScript checking

# Database Setup
npm run setup-usage-tracking   # Set up usage tracking schema

# Utilities
npm run setup-password         # Set admin password
npm run audit-translations     # Check translation coverage
npm run update-quilt-names     # Update quilt names
```

## 📁 Project Structure

```
qms-app/
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── api/              # API routes
│   │   ├── login/            # Login page
│   │   ├── quilts/           # Quilt module pages
│   │   ├── usage/            # Usage tracking
│   │   ├── analytics/        # Data analytics
│   │   ├── settings/         # User settings
│   │   ├── users/            # User management (admin)
│   │   ├── admin/            # Admin settings
│   │   └── (dashboard)/      # Dashboard route group
│   ├── components/           # React components
│   │   ├── layout/          # Layout components (AppSidebar, AppHeader)
│   │   ├── ui/              # Base UI components (Radix-based)
│   │   ├── motion/          # Animation components
│   │   ├── quilts/          # Quilt-specific components
│   │   ├── usage/           # Usage tracking components
│   │   └── dashboard/       # Dashboard components
│   ├── modules/             # Module system
│   │   ├── types.ts         # Module type definitions
│   │   ├── registry.ts      # Module registry
│   │   ├── quilts/          # Quilt module config
│   │   └── cards/           # Card module config
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # Utilities
│   │   ├── repositories/   # Database repository pattern
│   │   ├── validations/    # Zod schemas
│   │   └── neon.ts         # Database connection
│   └── server/             # Server code
├── scripts/                # Utility scripts
└── docs/                   # Documentation
```

### Sidebar Navigation Structure

```
├── 被子管理 ▸ (被子列表, 使用跟踪, 数据分析, 导入导出)
├── 球星卡管理 ▸ (卡片列表)
├── 系统管理 ▸ [Admin Only, Collapsible]
│   ├── 用户管理
│   ├── 系统配置
│   └── 被子管理设置
└── 用户设置 (模块订阅 + 语言 + 密码)
```

## 🎨 UI Components

### Animation Components

- `PageTransition` - Page fade/slide transitions
- `AnimatedCard` - Cards with hover effects
- `AnimatedList` - Staggered list animations
- `AnimatedButton` - Button press animations
- `AnimatedInput` - Input focus animations

### UI Components

- `EmptyState` - Friendly empty states
- `Skeleton` - Loading placeholders
- `StatusChangeDialog` - Smart status updates
- `QuiltDialog` - Quilt add/edit forms

## 📖 Documentation

### Guides (docs/guides/)

- **Authentication**: Implementation and testing
- **Deployment**: Vercel deployment guide
- **Usage Tracking**: Automation implementation
- **Security**: Security audit summary

## 🗺️ Roadmap

### ✅ Completed (v1.1.0)

- **Code Quality & Architecture**
  - Repository pattern for database operations
  - Database-level filtering and pagination
  - Type-safe database operations with Zod
  - Error boundaries with Chinese error messages
  - Unified type definitions
- **Authentication & Security**
  - Password utilities (bcrypt hashing)
  - JWT token management
  - Rate limiting for login attempts
  - Login/logout functionality
  - Middleware-based route protection
  - Database password storage
- **API Consolidation**
  - tRPC integration
  - Unified error handling
  - Type-safe API calls
- **Enhanced Settings Page**
  - Change password (instant, no redeployment)
  - Modify application name
  - Language switcher (中文/English)
  - Real-time database statistics
- **Usage Tracking**
  - Migrated to tRPC
  - Edit usage records
  - Usage types (Regular, Guest, Special Occasion, Seasonal Rotation)
  - Automated record creation/completion
- **Image Management**
  - Cloudinary integration
  - Main image upload
  - Multiple attachment images
- **Weather Display**
  - OpenWeatherMap API integration
  - Real-time weather data
  - Historical weather data for usage records
- **Advanced Features**
  - Advanced filtering system
  - Dashboard with statistics

### ✅ Completed (v2026.01.21) - Project Cleanup & Spec Archival

- **Project Organization**
  - Archived all completed specs to `.kiro/specs/completed/`
  - Moved incomplete specs to `.kiro/specs/archived/`
  - Cleaned up project directory structure
  - Updated documentation
- **Version Management**
  - Bumped version to 2026.01.21
  - Updated README files (English & Chinese)
  - Consolidated release notes

### ✅ Completed (v2026.01.20) - User Management & UI Enhancements

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
- **Bug Fixes**
  - Fixed password change functionality (now updates users table)
  - Fixed user list display (API response format)
  - Fixed module selection saving on user creation
  - Fixed sidebar infinite loop issue
  - Fixed SessionProvider configuration for auto-refresh
- **Sports Card Module**
  - Market data integration (eBay, PSA, Beckett, 130Point)
  - Value estimation algorithm
  - Card grading support
  - Image upload for cards

### ✅ Completed (v1.2.0) - 2026 Comprehensive Review

- **Dependency Upgrades**
  - Next.js 16.1.1 (latest stable)
  - React 19.2.3
  - TypeScript 5.9.3
  - Tailwind CSS 4.1.18
  - Framer Motion 12.24.7
  - Zod 4.3.5
  - All dependencies updated to latest stable versions
- **Code Quality Improvements**
  - Removed all unused imports and variables
  - Refactored duplicate code patterns
  - Enhanced TypeScript type safety
  - Unified API response format
- **Security Enhancements**
  - Verified input sanitization
  - Confirmed bcrypt configuration (salt rounds >= 10)
  - Validated secure cookie settings
  - Verified authentication and rate limiting
- **UI/UX Improvements**
  - Applied design system color scheme
  - Verified hover states don't cause layout shift
  - Replaced emojis with SVG icons (Lucide React)
  - Optimized image loading with Next.js Image
  - Added prefers-reduced-motion support
- **Project Structure**
  - Cleaned up empty directories
  - Removed unused files
  - Verified naming convention consistency
- **Internationalization**
  - Verified translation completeness (Chinese/English)

### 📋 Planned (Future Releases)

- **Import/Export**
  - Excel/CSV import with preview
  - Data export with filters
  - Usage reports
- **Maintenance System**
  - Maintenance record tracking
  - Scheduled maintenance reminders
- **Analytics**
  - Usage trend analysis
  - Seasonal insights
- **UI Enhancements**
  - Theme switching (dark mode)
  - Batch editing

## 🤝 Contributing

This is a personal project. Contributions are welcome via pull requests.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 📞 Support

For questions or issues, please open an issue on GitHub.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Animations by [Framer Motion](https://www.framer.com/motion/)
- Database by [Neon](https://neon.tech/)
- Deployed on [Vercel](https://vercel.com/)

---

**Version**: 2026.02.21  
**Status**: ✅ Production Ready  
**Last Updated**: 2026-02-21

Made with ❤️ for better home organization
