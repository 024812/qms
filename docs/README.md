# QMS Documentation

本目录保存 QMS 当前仍然生效的项目文档。

当前版本：`2026.4.2`

## 核心文档

- `QUICK_START.md`
  5 分钟启动当前项目的最短路径。
- `PROJECT_SUMMARY.md`
  当前架构、模块标准化状态和发布概览。
- `MODULE_BLUEPRINT_V2.md`
  当前生效的可复制子模块蓝图。
- `MODULE_STANDARD.md`
  旧标准的废弃说明，保留给历史兼容阅读。

## 指南文档

位于 `docs/guides/`：

- `AUTH_IMPLEMENTATION_SUMMARY.md`
  当前认证实现、入口文件和运维说明。
- `AUTH_TEST_GUIDE.md`
  认证相关测试清单。
- `INITIALIZE-DATABASE.md`
  数据库初始化说明。
- `VERCEL-ENV-SETUP.md`
  当前 Vercel 环境变量配置。
- `VERCEL_DEPLOYMENT_GUIDE.md`
  当前部署流程与验证项。
- `BACKUP_QUICK_START.md`
  备份快速开始。
- `BACKUP_RESTORE_GUIDE.md`
  备份与恢复详细说明。
- `PASSWORD-MIGRATION-GUIDE.md`
  旧密码存储方案迁移到当前 Auth.js 用户表方案的说明。
- `SECURITY_AUDIT_SUMMARY.md`
  安全审计总结。
- `USAGE_TRACKING_IMPLEMENTATION.md`
  usage 模块实现说明。

## 文档约定

- Next.js 16 路由保护统一使用项目根目录 `proxy.ts`，不再使用 `middleware.ts`
- 内部页面和客户端交互以 `src/app/actions/*.ts` + `src/lib/data/*.ts` 为主路径
- `/api/**` 路由保留给兼容层、外部 HTTP 访问和第三方集成

## 历史文档

`docs/archive/` 已不再存在。历史状态请查看：

- `CHANGELOG.md`
- Git 提交历史
- 旧版规范说明 `MODULE_STANDARD.md`

## 相关入口

- `../README.md`
- `../README_zh.md`
- `../CHANGELOG.md`
