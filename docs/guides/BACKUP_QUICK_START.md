# 备份快速开始指南

## 当前状态

当前仓库的 `package.json` **没有** `backup`、`backup:compress` 或 `restore` scripts，也没有随仓库提供可直接调用的备份/恢复脚本。因此以下命令不存在，不能执行：

```text
npm run backup
npm run backup:compress
npm run restore
```

自动化备份脚本仍是 planned；生产备份应使用 Neon 提供的备份/分支能力，或由运维系统调用 PostgreSQL 客户端工具。

## 5 分钟手工备份

前提：安装 PostgreSQL client，并使用 Neon 的 `DATABASE_URL`。不要把连接字符串提交到 Git，也不要把含凭据的备份文件放在 OneDrive 工作区。

```powershell
$env:DATABASE_URL = "postgresql://...neon.tech/...?...sslmode=require"
New-Item -ItemType Directory -Force -Path "C:\temp\qms-backups"
pg_dump $env:DATABASE_URL > "C:\temp\qms-backups\qms_backup_$(Get-Date -Format yyyyMMdd_HHmmss).sql"
```

压缩、加密并复制到受控的异地存储。生产优先在 Neon Console 使用项目的备份或分支功能，并定期演练恢复。

## 手工恢复

恢复前暂停应用、确认目标 Neon 数据库和备份文件，并先为当前状态创建快照。建议先恢复到 staging 或临时 Neon 分支：

```powershell
$env:DATABASE_URL = "postgresql://...neon.tech/...?...sslmode=require"
psql $env:DATABASE_URL < "C:\temp\qms-backups\qms_backup_YYYYMMDD_HHMMSS.sql"
```

恢复后验证关键表（至少 `quilts`、`usage_records`、`users`），再按发布流程启动应用。完整说明见 [BACKUP_RESTORE_GUIDE.md](./BACKUP_RESTORE_GUIDE.md)。

## 运行环境约束

如果需要安装 PostgreSQL client、运行项目命令或执行恢复验证，先将仓库复制到 `C:\temp\<project>`；禁止在 OneDrive 下执行 `npm install`、测试、构建或启动服务。
