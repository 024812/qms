# QMS - 家庭物品管理系统 🏠

**[English](README.md) | [中文](README_zh.md)**

> **模块化家庭物品管理系统**

一个现代化的 Next.js 应用，使用 Neon PostgreSQL，提供模块化、可扩展的平台，用于管理各种家庭物品，包括被子、球星卡等。

**🌐 在线演示**: https://qms-app-omega.vercel.app

## ✨ 核心功能

### 📦 模块化架构

- **多模块支持**: 可扩展系统支持多种物品类型
  - 🛏️ **被子管理**: 床品库存与使用追踪
  - 🃏 **球星卡**: 球星卡收藏管理
  - 🔧 _更多模块即将推出..._
- **动态侧边栏导航**: 可折叠的模块特定子菜单
- **模块订阅**: 用户可以订阅/取消订阅模块
- **基于角色的访问**: 仅管理员可访问系统管理功能

### 📊 核心功能（被子模块）

- **被子管理**: 完整的增删改查操作，自动生成名称和编号
- **图片管理**: 使用 Cloudinary 集成上传和管理被子照片
- **使用追踪**: 自动化使用记录创建，智能状态检测
- **状态管理**: 三种状态（使用中、存储中、维护中）智能转换
- **天气显示**: 实时天气信息和预报
- **数据分析**: 使用统计、季节分析、趋势可视化
- **设置管理**: 集中配置，数据库存储

### 🃏 球星卡管理

- **统一卡片仪表板**: 集成查看与编辑功能的单一界面，采用三栏布局（图片、数据、AI分析）
- **AI 赋能洞察**: 通过 Perplexity API 集成实时获取球员新闻和市场情绪，结合 Azure OpenAI 进行智能分析
- **球星卡追踪**: 详细属性包括球员、球队、年份、品牌和系列
- **评级支持**: 追踪专业评级（PSA, BGS, SGC, CGC）及认证编号
- **价值估算**: 内置算法，基于评级、年份和特征估算卡片价值
- **市场连接**: 直接集成 eBay, 130Point, PSA CardFacts 和 Beckett 市场数据
- **投资回报率可视化**: 基于购买价格与当前价值的实时 ROI 计算
- **收藏统计**: 包含总价值、投资回报率和品牌分布的综合统计

### 🎨 现代化 UI/UX

- **响应式设计**: 使用 Tailwind CSS 完美适配桌面、平板和手机
- **流畅动画**: Framer Motion 驱动的过渡和微交互
- **双视图模式**: 网格和列表视图无缝切换
- **高级过滤**: 多条件搜索，支持季节、状态、位置、品牌和重量过滤
- **双语支持**: 完整的中英文界面，带语言切换器
- **空状态**: 无数据时的友好引导，带上下文操作
- **加载状态**: 骨架屏提升感知性能
- **实时统计**: 实时数据库统计，自动刷新
- **设计系统**: 整个应用统一的间距、颜色和排版
- **乐观更新**: 即时 UI 反馈，提升用户体验
- **仪表板**: 全面概览，带快速操作和统计信息

### 🔐 安全与认证

- **密码保护**: 安全登录，JWT 会话管理
- **路由保护**: 基于中间件的认证
- **会话持久化**: 记住我功能
- **安全 Cookie**: HTTP-only cookies 存储令牌
- **数据库密码存储**: 密码安全存储在数据库中（无需更新环境变量）
- **即时密码更改**: 更改密码无需重新部署

### 🚀 性能与可靠性

- **快速加载**: 首次加载 < 2秒，页面切换 < 500毫秒
- **优化查询**: 数据库级别过滤，Repository 模式
- **高效渲染**: React Query 配合乐观更新，即时反馈
- **代码分割**: Next.js 自动基于路由的代码分割
- **无服务器**: Neon PostgreSQL 可扩展数据库
- **错误处理**: 完善的错误边界，友好的中文错误消息

## 🏗️ 技术栈

### 前端

- **框架**: Next.js 16.1.1 (App Router)
- **语言**: TypeScript 5.9.3
- **样式**: Tailwind CSS 4.1.18
- **UI 组件**: Radix UI
- **动画**: Framer Motion 12.24.7
- **状态管理**: Zustand 5.0.8, React Query 5.90.16
- **表单**: React Hook Form + Zod 4.3.5

### 后端

- **数据库**: Neon Serverless PostgreSQL
- **API**: Next.js API Routes
- **认证**: JWT + bcryptjs
- **验证**: Zod schemas

### 开发运维

- **部署**: Vercel
- **版本控制**: Git + GitHub
- **代码质量**: ESLint, Prettier, Husky
- **包管理**: npm

## 🚀 快速开始

### 前置要求

- Node.js 18+
- npm 或 yarn

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/ohengcom/qms-app.git
cd qms-app

# 安装依赖
npm install

# 设置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入你的 Neon 数据库 URL

# 设置管理员密码
npm run setup-password

# 启动开发服务器
npm run dev
```

访问 `http://localhost:3000` 查看应用。

### 环境变量

```env
# 数据库（必需）
DATABASE_URL="postgresql://..."

# 认证（必需）
QMS_JWT_SECRET="..."

# 图片上传（可选）
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="..."
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="..."

# 天气 API（可选）
OPENWEATHER_API_KEY="..."

# 可选 - 密码可在设置页面管理
QMS_PASSWORD_HASH="..."  # 仅初始设置需要
```

### 初始设置

部署后，系统设置将在首次使用时自动初始化。你可以在设置页面管理密码。

## 📊 数据库结构

### 主要表

**quilts** - 被子信息

- 基本信息：名称、季节、尺寸、重量、材料
- 存储信息：位置、包装、品牌、购买日期
- 状态：current_status (IN_USE, STORAGE, MAINTENANCE)
- 图片：main_image, attachment_images（Cloudinary URLs）

**usage_records** - 使用记录

- 被子引用
- 开始/结束日期
- 使用类型（REGULAR, GUEST, SPECIAL_OCCASION, SEASONAL_ROTATION）
- 状态 (ACTIVE, COMPLETED)
- 备注

**system_settings** - 应用配置

- 键值存储设置
- 密码哈希（bcrypt）
- 应用名称
- 其他可配置选项

## 🎯 核心功能详解

### 1. 自动化使用追踪

当你更改被子状态时：

- **改为使用中**: 自动创建新的使用记录
- **从使用中改为其他**: 自动结束活动的使用记录
- **日期选择**: 可选择自定义开始/结束日期
- **备注支持**: 可添加可选备注

### 2. 智能被子命名

自动生成格式：
`品牌 + 颜色 + 重量 + 季节`

示例：`百思寒褐色1100克春秋被`

### 3. 天气显示

实时天气信息：

- 当前温度和天气状况
- 天气预报
- 使用记录的历史天气数据

### 4. 图片管理

- 上传主被子照片
- 添加多张附加图片
- Cloudinary 集成优化存储
- 图片预览和管理

### 5. 高级过滤

多条件搜索：

- 季节（冬被、春秋被、夏被、四季被）
- 状态（使用中、存储中、维护中）
- 位置
- 品牌
- 重量范围
- 文本搜索

### 6. 双视图模式

**网格视图**：

- 美观的卡片布局，带图片
- 季节颜色指示器
- 状态徽章
- 悬停效果
- 响应式列数（1-4列）

**列表视图**：

- 详细的表格格式
- 可排序列
- 批量操作
- 快速操作

## 📚 可用脚本

```bash
# 开发
npm run dev                    # 启动开发服务器
npm run build                  # 生产构建
npm run start                  # 启动生产服务器
npm run lint                   # 运行 ESLint
npm run type-check            # TypeScript 检查

# 数据库设置
npm run setup-usage-tracking   # 设置使用追踪数据库

# 工具
npm run setup-password         # 设置管理员密码
npm run audit-translations     # 检查翻译覆盖率
npm run update-quilt-names     # 更新被子名称
```

## 📁 项目结构

```
qms-app/
├── src/
│   ├── app/                   # Next.js App Router 页面
│   │   ├── api/              # API 路由
│   │   ├── login/            # 登录页面
│   │   ├── quilts/           # 被子模块页面
│   │   ├── usage/            # 使用追踪
│   │   ├── analytics/        # 数据分析
│   │   ├── settings/         # 用户设置
│   │   ├── users/            # 用户管理（管理员）
│   │   ├── admin/            # 管理员设置
│   │   └── (dashboard)/      # 仪表板路由组
│   ├── components/           # React 组件
│   │   ├── layout/          # 布局组件（AppSidebar, AppHeader）
│   │   ├── ui/              # 基础 UI 组件（基于 Radix）
│   │   ├── motion/          # 动画组件
│   │   ├── quilts/          # 被子相关组件
│   │   ├── usage/           # 使用追踪组件
│   │   └── dashboard/       # 仪表板组件
│   ├── modules/             # 模块系统
│   │   ├── types.ts         # 模块类型定义
│   │   ├── registry.ts      # 模块注册表
│   │   ├── quilts/          # 被子模块配置
│   │   └── cards/           # 卡片模块配置
│   ├── hooks/               # 自定义 Hooks
│   ├── lib/                 # 工具库
│   │   ├── repositories/   # 数据库 Repository 模式
│   │   ├── validations/    # Zod schemas
│   │   └── neon.ts         # 数据库连接
│   └── server/             # 服务器代码
├── scripts/                # 工具脚本
└── docs/                   # 文档
```

### 侧边栏导航结构

```
├── 被子管理 ▸ (被子列表, 使用跟踪, 数据分析, 导入导出)
├── 球星卡管理 ▸ (卡片列表)
├── 系统管理 ▸ [仅管理员, 可折叠]
│   ├── 用户管理
│   ├── 系统配置
│   └── 被子管理设置
└── 用户设置 (模块订阅 + 语言 + 密码)
```

## 🎨 UI 组件

### 动画组件

- `PageTransition` - 页面淡入淡出过渡
- `AnimatedCard` - 带悬停效果的卡片
- `AnimatedList` - 交错列表动画
- `AnimatedButton` - 按钮按压动画
- `AnimatedInput` - 输入框焦点动画

### UI 组件

- `EmptyState` - 友好的空状态
- `Skeleton` - 加载占位符
- `StatusChangeDialog` - 智能状态更新
- `QuiltDialog` - 被子添加/编辑表单

## 📖 文档

### 实现指南 (docs/guides/)

- **认证实现** - 认证系统实现和测试
- **部署指南** - Vercel 部署指南
- **使用追踪** - 自动化实现
- **安全审计** - 安全审计总结

## 🗺️ 路线图

### ✅ 已完成 (v1.1.0)

- **代码质量与架构**
  - Repository 模式数据库操作
  - 数据库级别过滤和分页
  - Zod 类型安全数据库操作
  - 中文错误消息的错误边界
  - 统一类型定义
- **认证与安全**
  - 密码工具（bcrypt 哈希）
  - JWT 令牌管理
  - 登录限流
  - 登录/登出功能
  - 中间件路由保护
  - 数据库密码存储
- **API 整合**
  - tRPC 集成
  - 统一错误处理
  - 类型安全 API 调用
- **增强的设置页面**
  - 修改密码（即时生效，无需重新部署）
  - 修改应用名称
  - 语言切换（中文/English）
  - 实时数据库统计
- **使用追踪**
  - 迁移到 tRPC
  - 编辑使用记录
  - 使用类型（日常、客人、特殊场合、季节轮换）
  - 自动记录创建/完成
- **图片管理**
  - Cloudinary 集成
  - 主图上传
  - 多附加图片
- **天气显示**
  - OpenWeatherMap API 集成
  - 实时天气数据
  - 使用记录历史天气
- **高级功能**
  - 高级过滤系统
  - 带统计的仪表板

### ✅ 已完成 (v2026.01.21) - 项目清理与规范归档

- **项目组织**
  - 将所有已完成的规范归档到 `.kiro/specs/completed/`
  - 将未完成的规范移至 `.kiro/specs/archived/`
  - 清理项目目录结构
  - 更新文档
- **版本管理**
  - 版本号升级至 2026.01.21
  - 更新 README 文件（中英文）
  - 整合发布说明

### ✅ 已完成 (v2026.01.20) - 用户管理与 UI 增强

- **用户管理系统**
  - 完整的用户 CRUD 操作（仅管理员）
  - 基于角色的访问控制（管理员/成员）
  - 每个用户的模块订阅管理
  - users 表中的密码管理
  - 创建用户时分配模块
- **UI/UX 改进**
  - 美观的欢迎首页，展示功能特性
  - 登录后侧边栏自动刷新
  - 模块导航改进
  - 从被子模块菜单移除"导入导出"（移至管理员设置）
- **Bug 修复**
  - 修复密码修改功能（现在更新 users 表）
  - 修复用户列表显示（API 响应格式）
  - 修复创建用户时模块选择保存
  - 修复侧边栏无限循环问题
  - 修复 SessionProvider 配置以实现自动刷新
- **球星卡模块**
  - 市场数据集成（eBay、PSA、Beckett、130Point）
  - 价值评估算法
  - 卡片评级支持
  - 卡片图片上传

### ✅ 已完成 (v1.2.0) - 2026 全面审查

- **依赖升级**
  - Next.js 16.1.1（最新稳定版）
  - React 19.2.3
  - TypeScript 5.9.3
  - Tailwind CSS 4.1.18
  - Framer Motion 12.24.7
  - Zod 4.3.5
  - 所有依赖更新到最新稳定版本
- **代码质量改进**
  - 移除所有未使用的导入和变量
  - 重构重复代码模式
  - 增强 TypeScript 类型安全
  - 统一 API 响应格式
- **安全性增强**
  - 验证输入清理
  - 确认 bcrypt 配置（salt rounds >= 10）
  - 验证安全 Cookie 设置
  - 验证认证和速率限制
- **UI/UX 改进**
  - 应用设计系统颜色方案
  - 验证 hover 状态不造成布局偏移
  - 将 emoji 替换为 SVG 图标（Lucide React）
  - 使用 Next.js Image 优化图片加载
  - 添加 prefers-reduced-motion 支持
- **项目结构**
  - 清理空目录
  - 移除未使用文件
  - 验证命名规范一致性
- **国际化**
  - 验证翻译完整性（中文/英文）

### 📋 计划中（未来版本）

- **导入导出**
  - Excel/CSV 导入预览
  - 数据导出过滤
  - 使用报表
- **维护系统**
  - 维护记录追踪
  - 定期维护提醒
- **数据分析**
  - 使用趋势分析
  - 季节洞察
- **UI 增强**
  - 主题切换（深色模式）
  - 批量编辑

## 🤝 贡献

这是一个个人项目。欢迎通过 Pull Request 贡献。

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 📞 支持

如有问题或建议，请在 GitHub 上提 issue。

## 🙏 致谢

- 使用 [Next.js](https://nextjs.org/) 构建
- UI 组件来自 [Radix UI](https://www.radix-ui.com/)
- 动画由 [Framer Motion](https://www.framer.com/motion/) 提供
- 数据库使用 [Neon](https://neon.tech/)
- 部署在 [Vercel](https://vercel.com/)

---

**版本**: 2026.01.21  
**状态**: ✅ 生产就绪  
**最后更新**: 2026-01-22

用 ❤️ 打造，为了更好的家居整理
