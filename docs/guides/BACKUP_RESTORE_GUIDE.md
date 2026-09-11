# QMS 数据备份与恢复指南

## 当前状态和边界

当前仓库没有 `npm run backup`、`npm run backup:compress` 或 `npm run restore` scripts，也没有已注册的备份/恢复脚本。任何自动化脚本、任务计划程序和保留策略都属于 planned 运维能力，不能当作当前仓库功能。

QMS 使用 Neon Postgres。生产环境应使用 Neon Console/计划提供的备份与分支能力，或由外部运维平台安全调用 `pg_dump`/`psql`。数据库凭据只能通过受控环境变量提供，备份文件应加密并存放在 OneDrive 之外的受控异地存储。

## 备份策略

| 策略                            | 当前状态                           | 建议                           |
| ------------------------------- | ---------------------------------- | ------------------------------ |
| Neon 备份和时间点恢复           | 取决于 Neon 计划                   | 生产首选，确认保留期和恢复权限 |
| Neon 分支快照                   | 可由 Neon 工具/控制台操作          | 迁移前或恢复演练前创建         |
| 外部 `pg_dump`                  | 可手工或由运维平台执行             | 加密、异地保存并定期验证       |
| 应用内导出                      | 仅业务数据，不能替代完整数据库备份 | 用于日常业务数据副本           |
| 仓库 npm backup/restore scripts | 不存在，planned                    | 不要在部署文档中引用           |

遵循 3-2-1 原则：至少 3 份副本、2 种存储介质、1 份异地副本。先在 staging/临时分支恢复演练，再考虑生产恢复。

## 手工 `pg_dump` 备份

在安装 PostgreSQL client 后执行。若需要安装工具或运行项目命令，必须在 `C:\temp\<project>` 副本中操作，不要在 OneDrive 工作区生成依赖、缓存或备份文件。

```powershell
$env:DATABASE_URL = "postgresql://...neon.tech/...?...sslmode=require"
New-Item -ItemType Directory -Force -Path "C:\temp\qms-backups"
$file = "C:\temp\qms-backups\qms_backup_$(Get-Date -Format yyyyMMdd_HHmmss).sql"
pg_dump $env:DATABASE_URL > $file
Get-Item $file | Select-Object Name, Length, CreationTime
```

压缩或加密后再上传到受控存储。不要把真实 `DATABASE_URL` 写入脚本、命令历史、提交或文档。

## 恢复流程

1. 停止应用写入并评估影响范围。
2. 在 Neon Console 创建当前数据库快照或分支。
3. 先把备份恢复到 staging/临时 Neon 分支，检查行数、约束和应用访问。
4. 经授权后恢复生产目标，并记录操作者、时间、目标和备份文件校验信息。
5. 验证 `quilts`、`usage_records`、`users`、认证表和关键业务流程。
6. 恢复应用并观察日志。

```powershell
$env:DATABASE_URL = "postgresql://...neon.tech/...?...sslmode=require"
psql $env:DATABASE_URL < "C:\temp\qms-backups\qms_backup_YYYYMMDD_HHMMSS.sql"
```

不要在没有快照、授权和目标确认的情况下执行清空 schema 的命令。

## 应用内导出

管理员报表页面提供 Quilt 等业务数据的导出能力。导出文件不包含所有数据库表、认证数据、完整 schema 或图片，因此不能替代 Neon/`pg_dump` 完整备份。

## 恢复演练检查清单

- [ ] Neon 备份保留期和权限已确认
- [ ] 最近备份位于加密的异地存储
- [ ] 备份文件可读取且大小合理
- [ ] 已在 staging/临时分支恢复过
- [ ] 已验证 `quilts` 和 `usage_records` 数据
- [ ] 已记录恢复操作并清理临时凭据

## 相关文档

- [Neon 备份文档](https://neon.tech/docs/manage/backups)
- [PostgreSQL 备份文档](https://www.postgresql.org/docs/current/backup.html)
- [数据库迁移指南](./DATABASE_MIGRATIONS.md)
