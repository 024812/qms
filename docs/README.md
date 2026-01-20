# QMS 项目文档 / QMS Project Documentation

## 📚 文档目录 / Documentation Index

本目录包含 QMS（被子管理系统）的所有技术文档。
This directory contains all technical documentation for QMS (Quilt Management System).

---

## 📖 核心文档 / Core Documentation

### 快速开始 / Quick Start

- **[QUICK_START.md](./QUICK_START.md)** - 5分钟快速开始指南
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - 项目总结和完成度

### 开发标准 / Development Standards

- **[MODULE_STANDARD.md](./MODULE_STANDARD.md)** - 子模块开发标准（完整版）
- **[MODULE_STANDARD_SUMMARY.md](./MODULE_STANDARD_SUMMARY.md)** - 子模块开发快速参考

---

## 🔧 操作指南 / Implementation Guides

位于 `docs/guides/` 目录：

### 数据库 / Database

- **[INITIALIZE-DATABASE.md](./guides/INITIALIZE-DATABASE.md)** - 数据库初始化

### 备份与恢复 / Backup & Restore

- **[BACKUP_QUICK_START.md](./guides/BACKUP_QUICK_START.md)** - 备份快速开始
- **[BACKUP_RESTORE_GUIDE.md](./guides/BACKUP_RESTORE_GUIDE.md)** - 完整备份恢复指南

### 认证与安全 / Authentication & Security

- **[AUTH_IMPLEMENTATION_SUMMARY.md](./guides/AUTH_IMPLEMENTATION_SUMMARY.md)** - 认证实现总结
- **[AUTH_TEST_GUIDE.md](./guides/AUTH_TEST_GUIDE.md)** - 认证测试指南
- **[PASSWORD-MIGRATION-GUIDE.md](./guides/PASSWORD-MIGRATION-GUIDE.md)** - 密码迁移指南
- **[SECURITY_AUDIT_SUMMARY.md](./guides/SECURITY_AUDIT_SUMMARY.md)** - 安全审计总结

### 部署 / Deployment

- **[VERCEL-ENV-SETUP.md](./guides/VERCEL-ENV-SETUP.md)** - Vercel 环境配置
- **[VERCEL_DEPLOYMENT_GUIDE.md](./guides/VERCEL_DEPLOYMENT_GUIDE.md)** - Vercel 部署指南

### 使用追踪 / Usage Tracking

- **[USAGE_TRACKING_IMPLEMENTATION.md](./guides/USAGE_TRACKING_IMPLEMENTATION.md)** - 使用追踪实现

---

## 📦 历史归档 / Archive

位于 `docs/archive/` 目录，包含项目演进过程中的历史文档：

- 阶段检查点文档
- 完成总结文档
- 代码分析文档

---

## 🎨 设计系统 / Design System

### 颜色系统 / Color System

基于语义化颜色系统：

| 用途        | 变量名        | 说明                |
| ----------- | ------------- | ------------------- |
| Primary     | `primary`     | 主色调 - Trust Blue |
| Secondary   | `secondary`   | 次要色调            |
| Muted       | `muted`       | 柔和色调            |
| Accent      | `accent`      | 强调色调            |
| Destructive | `destructive` | 危险/删除操作       |

### 组件库 / Component Library

- 基于 Shadcn UI + Radix UI
- 统一的 Card, Table, Badge, Button 等组件
- 完整的表单组件（Input, Select, Textarea, DatePicker）

### 间距系统 / Spacing System

- 页面容器: `space-y-6` (24px)
- 卡片内部: `space-y-4` (16px)
- 表单字段: `space-y-2` (8px)

---

## 📊 项目状态 / Project Status

### 当前版本 / Current Version

- **版本**: v2026.01.20
- **状态**: ✅ 生产就绪

### 技术栈 / Tech Stack

- **前端**: Next.js 16.1.1 + React 19.2.3 + TypeScript 5.9+
- **样式**: Tailwind CSS 4.1+ + Shadcn UI
- **数据获取**: TanStack Query 5.90+
- **数据库**: Neon PostgreSQL + Drizzle ORM 0.45+
- **认证**: NextAuth.js 5.0
- **部署**: Vercel

---

## 🔗 相关链接 / Related Links

- [主 README](../README.md)
- [中文 README](../README_zh.md)
- [CHANGELOG](../CHANGELOG.md)

---

**最后更新 / Last Updated**: 2026-01-20  
**维护者 / Maintainer**: QMS Team
