# QMS 数据备份与恢复指南

## 目录

- [备份方案](#备份方案)
- [自动备份](#自动备份)
- [手动备份](#手动备份)
- [数据恢复](#数据恢复)
- [最佳实践](#最佳实践)

---

## 备份方案

### 方案对比

| 方案             | 优点               | 缺点           | 推荐场景  |
| ---------------- | ------------------ | -------------- | --------- |
| Neon 自动备份    | 自动、可靠、零配置 | 需要付费计划   | 生产环境  |
| pg_dump 手动备份 | 免费、完全控制     | 需要手动执行   | 开发/测试 |
| 导出功能备份     | 简单、用户友好     | 仅备份业务数据 | 日常备份  |

---

## 1. Neon 自动备份（推荐）

### 1.1 Neon 内置备份

Neon 提供自动备份功能（需要付费计划）：

**特点**：

- 自动每日备份
- 保留 7-30 天（根据计划）
- 一键恢复
- 零配置

**使用方法**：

1. 登录 [Neon Console](https://console.neon.tech)
2. 选择你的项目
3. 进入 "Backups" 标签
4. 查看备份历史
5. 点击 "Restore" 恢复到指定时间点

### 1.2 Neon 分支功能

Neon 的分支功能可以作为备份：

```bash
# 创建分支（快照）
neonctl branches create --name backup-$(date +%Y%m%d)

# 列出所有分支
neonctl branches list

# 从分支恢复
neonctl branches restore --branch backup-20250117
```

---

## 2. 手动备份（免费方案）

### 2.1 使用 pg_dump 备份

**前提条件**：

- 安装 PostgreSQL 客户端工具
- 获取 Neon 数据库连接字符串

#### Windows 安装 PostgreSQL 客户端：

```powershell
# 使用 Chocolatey
choco install postgresql

# 或下载安装包
# https://www.postgresql.org/download/windows/
```

#### 备份命令：

```bash
# 设置数据库连接字符串
$env:DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# 备份整个数据库
pg_dump $env:DATABASE_URL > backup_$(Get-Date -Format "yyyyMMdd_HHmmss").sql

# 备份到指定目录
pg_dump $env:DATABASE_URL > backups/qms_backup_$(Get-Date -Format "yyyyMMdd_HHmmss").sql

# 压缩备份（推荐）
pg_dump $env:DATABASE_URL | gzip > backups/qms_backup_$(Get-Date -Format "yyyyMMdd_HHmmss").sql.gz
```

#### 只备份数据（不包括表结构）：

```bash
pg_dump --data-only $env:DATABASE_URL > backup_data_only.sql
```

#### 只备份特定表：

```bash
# 备份被子表
pg_dump --table=quilts $env:DATABASE_URL > backup_quilts.sql

# 备份多个表
pg_dump --table=quilts --table=usage_records $env:DATABASE_URL > backup_core_tables.sql
```

### 2.2 创建备份脚本

创建 `scripts/backup-database.ps1`：

```powershell
# QMS Database Backup Script
param(
    [string]$BackupDir = "backups",
    [switch]$Compress
)

# 创建备份目录
if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir
}

# 生成备份文件名
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "$BackupDir/qms_backup_$timestamp.sql"

Write-Host "Starting backup..." -ForegroundColor Green

# 从 .env.local 读取数据库 URL
$envFile = Get-Content .env.local
$dbUrl = ($envFile | Select-String "DATABASE_URL=").ToString().Split("=")[1].Trim('"')

if ($Compress) {
    $backupFile = "$backupFile.gz"
    pg_dump $dbUrl | gzip > $backupFile
} else {
    pg_dump $dbUrl > $backupFile
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backup completed successfully!" -ForegroundColor Green
    Write-Host "Backup file: $backupFile" -ForegroundColor Cyan

    # 显示文件大小
    $size = (Get-Item $backupFile).Length / 1MB
    Write-Host "File size: $([math]::Round($size, 2)) MB" -ForegroundColor Cyan
} else {
    Write-Host "Backup failed!" -ForegroundColor Red
    exit 1
}
```

**使用方法**：

```powershell
# 普通备份
.\scripts\backup-database.ps1

# 压缩备份
.\scripts\backup-database.ps1 -Compress

# 指定备份目录
.\scripts\backup-database.ps1 -BackupDir "D:\Backups\QMS"
```

### 2.3 使用应用内导出功能

在应用中使用导入导出功能：

1. 登录 QMS 应用
2. 进入 "导入导出" 页面
3. 点击 "导出数据"
4. 选择要导出的数据类型：
   - 被子数据
   - 使用记录
   - 系统设置
5. 下载 Excel 文件

**优点**：

- 简单易用
- 不需要技术知识
- 可以选择性导出

**缺点**：

- 不包括所有数据库表
- 不包括图片文件

---

## 3. 数据恢复

### 3.1 从 pg_dump 备份恢复

```bash
# 恢复整个数据库
psql $env:DATABASE_URL < backup_20250117_120000.sql

# 从压缩备份恢复
gunzip -c backup_20250117_120000.sql.gz | psql $env:DATABASE_URL

# 恢复前清空数据库（谨慎使用！）
psql $env:DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
psql $env:DATABASE_URL < backup_20250117_120000.sql
```

### 3.2 从 Excel 恢复

1. 登录 QMS 应用
2. 进入 "导入导出" 页面
3. 点击 "导入数据"
4. 选择备份的 Excel 文件
5. 确认导入

### 3.3 创建恢复脚本

创建 `scripts/restore-database.ps1`：

```powershell
# QMS Database Restore Script
param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,
    [switch]$Force
)

if (!(Test-Path $BackupFile)) {
    Write-Host "Backup file not found: $BackupFile" -ForegroundColor Red
    exit 1
}

Write-Host "WARNING: This will overwrite all data in the database!" -ForegroundColor Yellow

if (!$Force) {
    $confirm = Read-Host "Are you sure you want to continue? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "Restore cancelled." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "Starting restore..." -ForegroundColor Green

# 从 .env.local 读取数据库 URL
$envFile = Get-Content .env.local
$dbUrl = ($envFile | Select-String "DATABASE_URL=").ToString().Split("=")[1].Trim('"')

# 检查是否是压缩文件
if ($BackupFile -like "*.gz") {
    gunzip -c $BackupFile | psql $dbUrl
} else {
    psql $dbUrl < $BackupFile
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "Restore completed successfully!" -ForegroundColor Green
} else {
    Write-Host "Restore failed!" -ForegroundColor Red
    exit 1
}
```

**使用方法**：

```powershell
# 恢复备份
.\scripts\restore-database.ps1 -BackupFile "backups/qms_backup_20250117_120000.sql"

# 跳过确认
.\scripts\restore-database.ps1 -BackupFile "backups/qms_backup_20250117_120000.sql" -Force
```

---

## 4. 图片文件备份

### 4.1 备份 Vercel Blob 存储的图片

如果使用 Vercel Blob 存储图片：

```bash
# 导出图片 URL 列表
psql $env:DATABASE_URL -c "COPY (SELECT main_image FROM quilts WHERE main_image IS NOT NULL UNION SELECT unnest(attachment_images) FROM quilts WHERE attachment_images IS NOT NULL) TO STDOUT" > image_urls.txt

# 下载所有图片
mkdir -p backups/images
cat image_urls.txt | xargs -I {} wget -P backups/images {}
```

### 4.2 备份本地图片

如果图片存储在本地 `public/uploads`：

```powershell
# 压缩图片目录
Compress-Archive -Path public/uploads -DestinationPath backups/images_$(Get-Date -Format "yyyyMMdd").zip
```

---

## 5. 自动化备份

### 5.1 Windows 任务计划程序

1. 打开 "任务计划程序"
2. 创建基本任务
3. 设置触发器（每天凌晨 2:00）
4. 操作：启动程序
   - 程序：`powershell.exe`
   - 参数：`-File "C:\path\to\qms\scripts\backup-database.ps1" -Compress`

### 5.2 使用 npm 脚本

在 `package.json` 中添加：

```json
{
  "scripts": {
    "backup": "node scripts/backup.js",
    "backup:auto": "node scripts/backup.js --auto",
    "restore": "node scripts/restore.js"
  }
}
```

创建 `scripts/backup.js`：

```javascript
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const backupDir = path.join(__dirname, '../backups');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const backupFile = path.join(backupDir, `qms_backup_${timestamp}.sql`);

// 确保备份目录存在
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// 执行备份
const dbUrl = process.env.DATABASE_URL;
exec(`pg_dump ${dbUrl} > ${backupFile}`, (error, stdout, stderr) => {
  if (error) {
    console.error('Backup failed:', error);
    process.exit(1);
  }

  console.log('Backup completed successfully!');
  console.log('Backup file:', backupFile);

  // 清理旧备份（保留最近 7 天）
  cleanOldBackups(backupDir, 7);
});

function cleanOldBackups(dir, daysToKeep) {
  const files = fs.readdirSync(dir);
  const now = Date.now();
  const maxAge = daysToKeep * 24 * 60 * 60 * 1000;

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);

    if (now - stats.mtime.getTime() > maxAge) {
      fs.unlinkSync(filePath);
      console.log('Deleted old backup:', file);
    }
  });
}
```

---

## 6. 最佳实践

### 6.1 备份策略

**3-2-1 备份规则**：

- **3** 份数据副本
- **2** 种不同的存储介质
- **1** 份异地备份

**推荐方案**：

1. Neon 自动备份（云端）
2. 本地 pg_dump 备份（本地硬盘）
3. 云存储备份（Google Drive / OneDrive / Dropbox）

### 6.2 备份频率

| 环境     | 频率 | 保留期 |
| -------- | ---- | ------ |
| 生产环境 | 每天 | 30 天  |
| 测试环境 | 每周 | 14 天  |
| 开发环境 | 按需 | 7 天   |

### 6.3 备份检查清单

- [ ] 定期测试恢复流程
- [ ] 验证备份文件完整性
- [ ] 记录备份和恢复操作
- [ ] 加密敏感数据备份
- [ ] 异地存储重要备份
- [ ] 清理过期备份文件

### 6.4 恢复测试

**每月至少测试一次恢复流程**：

```bash
# 1. 创建测试数据库
neonctl databases create --name qms-test

# 2. 恢复到测试数据库
psql $TEST_DATABASE_URL < backup_latest.sql

# 3. 验证数据完整性
psql $TEST_DATABASE_URL -c "SELECT COUNT(*) FROM quilts;"
psql $TEST_DATABASE_URL -c "SELECT COUNT(*) FROM usage_records;"

# 4. 删除测试数据库
neonctl databases delete --name qms-test
```

---

## 7. 紧急恢复流程

### 如果数据丢失：

1. **不要慌张** - 停止所有操作
2. **评估损失** - 确定丢失的数据范围
3. **选择备份** - 找到最近的可用备份
4. **创建快照** - 在恢复前创建当前状态快照
5. **执行恢复** - 使用恢复脚本
6. **验证数据** - 检查数据完整性
7. **通知用户** - 如果是生产环境

### 联系支持：

- Neon 支持：https://neon.tech/docs/introduction/support
- GitHub Issues：https://github.com/ohengcom/qms-app/issues

---

## 8. 快速参考

### 常用命令

```bash
# 备份
npm run backup

# 恢复
npm run restore

# 查看备份列表
ls -lh backups/

# 测试备份文件
pg_restore --list backup_file.sql
```

### 备份文件命名规范

```
qms_backup_YYYYMMDD_HHMMSS.sql
qms_backup_20250117_120000.sql
qms_backup_20250117_120000.sql.gz (压缩)
```

---

## 9. 故障排除

### 问题：pg_dump 命令不存在

**解决方案**：

```bash
# Windows
choco install postgresql

# 或添加到 PATH
$env:PATH += ";C:\Program Files\PostgreSQL\16\bin"
```

### 问题：连接数据库失败

**解决方案**：

- 检查 DATABASE_URL 是否正确
- 确认网络连接
- 验证 SSL 设置（Neon 需要 sslmode=require）

### 问题：恢复后数据不完整

**解决方案**：

- 检查备份文件是否完整
- 确认备份时数据库状态
- 尝试使用更早的备份

---

## 相关文档

- [Neon 备份文档](https://neon.tech/docs/manage/backups)
- [PostgreSQL 备份文档](https://www.postgresql.org/docs/current/backup.html)
- [QMS 导入导出功能](./IMPORT_EXPORT_GUIDE.md)

---

**最后更新**: 2025-01-17
**版本**: 1.0.0
