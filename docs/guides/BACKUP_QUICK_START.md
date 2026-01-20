# 备份快速开始指南

## 🚀 5分钟快速备份

### 1. 立即备份

```bash
npm run backup
```

备份文件将保存在 `backups/` 目录。

### 2. 压缩备份（推荐）

```bash
npm run backup:compress
```

节省存储空间，适合长期保存。

### 3. 恢复备份

```bash
npm run restore
```

然后输入备份文件路径。

---

## 📋 常用命令

| 命令                      | 说明           |
| ------------------------- | -------------- |
| `npm run backup`          | 创建数据库备份 |
| `npm run backup:compress` | 创建压缩备份   |
| `npm run restore`         | 从备份恢复     |

---

## 💡 最佳实践

### 每日备份

在 Windows 任务计划程序中设置：

- 时间：每天凌晨 2:00
- 程序：`powershell.exe`
- 参数：`-File "C:\path\to\qms\scripts\backup-database.ps1" -Compress`

### 备份前检查

- [ ] 确保 `.env.local` 文件存在
- [ ] 确认 `DATABASE_URL` 配置正确
- [ ] 检查磁盘空间是否充足

### 备份后验证

```bash
# 查看备份文件
ls backups/

# 检查文件大小
Get-Item backups/qms_backup_*.sql | Select-Object Name, Length, CreationTime
```

---

## 🆘 紧急恢复

如果数据丢失：

1. **停止应用**
2. **找到最近的备份**
   ```bash
   ls backups/ | Sort-Object -Descending | Select-Object -First 1
   ```
3. **执行恢复**
   ```bash
   .\scripts\restore-database.ps1 -BackupFile "backups/qms_backup_YYYYMMDD_HHMMSS.sql"
   ```
4. **验证数据**
5. **重启应用**

---

## 📞 需要帮助？

查看完整文档：[BACKUP_RESTORE_GUIDE.md](./BACKUP_RESTORE_GUIDE.md)
