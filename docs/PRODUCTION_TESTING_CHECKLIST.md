# 🧪 生产测试清单 / Production Testing Checklist

**最后更新 / Last Updated**: 2026-01-07  
**环境 / Environment**: Production (Vercel)  
**URL**: https://your-app-domain.vercel.app

---

## 🎯 快速测试 (5 分钟) / Quick Test

### 1. 基本访问 / Basic Access

- [ ] 打开生产 URL
- [ ] 页面加载无错误
- [ ] 无控制台错误 (F12 → Console)
- [ ] 登录页面显示正常

### 2. 认证 / Authentication

- [ ] 使用密码登录
- [ ] 重定向到仪表板
- [ ] 刷新后 Session 保持

### 3. 仪表板 / Dashboard

- [ ] 统计卡片显示正确
- [ ] 天气预报显示（页面顶部）
- [ ] 当前使用标签显示被子
- [ ] 无控制台错误

### 4. 核心功能 / Core Functions

- [ ] 导航到被子管理页面
- [ ] 列表显示正确
- [ ] 点击被子查看详情
- [ ] 无控制台错误

---

## 🔍 详细测试 (15 分钟) / Detailed Test

### 1. 控制台检查 / Console Check

打开浏览器控制台 (F12 → Console)

预期结果:

- 无红色错误
- 无生产代码的 console.log
- 仅性能日志（如有）应有环境检查

### 2. 页面测试 / Pages Test

#### 仪表板 (/)

- [ ] 天气预报显示
- [ ] 统计卡片显示正确数字
- [ ] "当前使用" 标签正常
- [ ] "历史使用" 标签正常

#### 被子管理 (/quilts)

- [ ] 列表显示所有被子
- [ ] 搜索功能正常
- [ ] 筛选功能正常
- [ ] 添加/编辑/删除被子正常
- [ ] 状态变更正常

#### 使用记录 (/usage)

- [ ] 使用记录显示
- [ ] 日历视图正常
- [ ] 添加/编辑/删除使用记录正常

#### 数据分析 (/analytics)

- [ ] 图表显示正确
- [ ] 数据加载无错误

#### 设置 (/settings)

- [ ] 页面加载
- [ ] 修改密码正常
- [ ] 语言切换正常

### 3. API 路由测试 / API Routes Test

打开网络标签 (F12 → Network)

测试端点:

- `/api/quilts` - 返回被子数据
- `/api/dashboard` - 返回统计数据
- `/api/weather` - 返回天气数据
- `/api/usage` - 返回使用记录

预期: 所有请求状态 200，响应时间 < 1 秒

### 4. 性能测试 / Performance Test

打开 Lighthouse (F12 → Lighthouse)

目标:

- Performance > 80
- Accessibility > 90
- Best Practices > 90
- SEO > 80

---

## 成功标准 / Success Criteria

### 必须通过（关键）

- 任何页面无控制台错误
- 登录正常
- 仪表板加载
- 被子页面正常
- 所有 API 调用成功

### 应该通过（重要）

- 生产代码无 console.log
- 天气显示正确
- 所有页面加载 < 2s

---

## 相关文档 / Related Documentation

- [部署指南](./DEPLOYMENT_SUMMARY.md)
- [Vercel 部署指南](./guides/VERCEL_DEPLOYMENT_GUIDE.md)
- [缓存修复指南](./guides/CACHE-FIX-GUIDE.md)

---

**测试指南版本**: 2.0  
**维护者**: QMS Team
