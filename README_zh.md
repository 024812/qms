# QMS - 被子管理系统 🛏️

**[English](README.md) | [中文](README_zh.md)**

> **家庭床品智能库存管理增强版**

一个复杂的Web应用程序，将简单的基于Excel的被子跟踪转换为具有季节推荐、使用分析和预测洞察的智能库存管理系统。

## 🌟 功能特性

### 📊 **智能仪表板**
- 实时库存概览，状态跟踪
- 季节分布和使用情况分析
- 快速访问过滤器和搜索功能
- 存储位置优化洞察

### 🔍 **高级搜索与过滤**
- 跨姓名、品牌、颜色和备注的多字段搜索
- 按季节、状态、位置、重量范围和材料过滤
- 智能建议和已保存的搜索
- 实时搜索结果

### 🌱 **季节智能**
- 自动季节分类（冬季/春秋/夏季）
- 基于当前季节和天气的智能推荐
- 使用模式分析，实现最佳轮换
- 季节转换提醒和准备提醒

### 📈 **使用分析**
- 详细的使用历史，时间轴可视化
- 使用频率和模式分析
- 下次使用期间的预测洞察
- 基于使用模式的维护调度

### 🗂️ **存储优化**
- 基于可访问性的存储布局建议
- 带包装信息的位置跟踪
- 存储效率分析和优化
- 可视化存储组织工具

### 📱 **现代UI/UX**
- 针对桌面、平板和移动设备优化的响应式设计
- 直观的Material Design界面与Element Plus
- 渐进式Web应用功能
- 离线支持和缓存

## 🏗️ 系统架构

### 后端 (FastAPI + SQLAlchemy)
```
backend/
├── app/
│   ├── main.py                 # FastAPI应用程序入口点
│   ├── database.py             # 数据库配置
│   ├── models.py               # 增强的SQLAlchemy模型
│   ├── schema.py               # Pydantic模式
│   ├── migration/
│   │   └── excel_importer.py   # Excel数据迁移
│   └── routers/
│       ├── quilts.py           # 传统API（向后兼容）
│       └── enhanced_quilts.py  # 具有高级功能的增强API
└── requirements.txt            # Python依赖项
```

### 前端 (Vue.js 3 + Element Plus)
```
frontend/
├── src/
│   ├── main.js                 # 应用程序入口点
│   ├── App.vue                 # 主应用程序组件
│   ├── router/                 # Vue Router配置
│   ├── stores/                 # Pinia状态管理
│   ├── components/             # 可重用的Vue组件
│   ├── views/                  # 页面组件
│   └── assets/                 # 静态资源和样式
├── package.json                # Node.js依赖项
└── vite.config.js              # Vite构建配置
```

## 🚀 快速开始

### 前置要求
- Python 3.8+
- Node.js 16+
- npm 或 yarn

### 后端设置
```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows下: venv\Scripts\activate

# 安装依赖项
pip install -r requirements.txt

# 启动服务器
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 前端设置
```bash
cd frontend

# 安装依赖项
npm install

# 启动开发服务器
npm run dev
```

### 访问应用程序
- **前端**: http://localhost:5173
- **后端API**: http://localhost:8000
- **API文档**: http://localhost:8000/docs

## 📊 数据迁移

### 从Excel导入
系统可以自动导入您现有的Excel数据：

```bash
cd backend
python -c "from app.migration.excel_importer import run_migration; run_migration('家中被子列表.xlsx')"
```

或使用Web界面：
1. 导航到Web应用程序中的导入部分
2. 上传您的Excel文件
3. 查看并确认导入

### Excel格式支持
系统支持包含以下列的Excel文件：
- Group, 编号, 季节, 填充物, 颜色, 长, 宽, 重量（g）
- 放置位置, 包, 使用时间段, 品牌, 购买日期, 备注
- 历史使用列：上次使用, 上上次使用等

## 🎯 增强数据模型

### 被子实体
```python
- id: 主键
- group_id: Excel Group分类
- item_number: 唯一项目编号
- name: 描述性名称
- season: 季节分类（冬季/春秋/夏季）
- length_cm, width_cm: 物理尺寸
- weight_grams: 季节推荐的重量
- fill_material: 主要材料
- material_details: 详细成分
- color: 颜色描述
- brand: 制造商
- purchase_date: 生命周期跟踪的购买日期
- location: 存储位置
- packaging_info: 包装详情
- current_status: available/in_use/maintenance/storage
- notes: 附加备注
```

### 使用跟踪
- **使用期间**：具有开始/结束日期的历史使用
- **当前使用**：活动使用跟踪
- **使用分析**：模式、频率和预测
- **季节分析**：基于季节的使用优化

## 📚 API文档

### 核心端点

#### 被子管理
- `GET /api/quilts/` - 使用过滤和搜索列出被子
- `GET /api/quilts/{id}` - 获取详细的被子信息
- `POST /api/quilts/` - 创建新被子
- `PUT /api/quilts/{id}` - 更新被子信息
- `DELETE /api/quilts/{id}` - 删除被子

#### 季节智能
- `GET /api/quilts/seasonal/{season}` - 获取季节被子
- `GET /api/quilts/recommendations/{season}` - 智能推荐
- `GET /api/quilts/current-season` - 当前季节推荐

#### 使用管理
- `POST /api/usage/start` - 开始使用被子
- `POST /api/usage/end/{id}` - 结束使用期间
- `GET /api/usage/current` - 获取当前使用的被子
- `GET /api/usage/history/{id}` - 获取使用历史

#### 分析
- `GET /api/analytics/dashboard` - 仪表板统计
- `GET /api/analytics/usage-patterns` - 使用模式分析
- `GET /api/search` - 高级搜索功能

#### 数据管理
- `POST /api/migration/excel-import` - 从Excel导入
- `GET /api/export/excel` - 导出到Excel

## 🛠️ 开发

### 技术栈
- **后端**: FastAPI, SQLAlchemy, Pydantic, Pandas
- **前端**: Vue.js 3, Element Plus, Vite, Pinia
- **数据库**: SQLite（开发）, PostgreSQL（生产）
- **部署**: Docker, Docker Compose

### 开发工具
- **代码质量**: ESLint, Prettier, Black
- **测试**: Vitest（前端）, Pytest（后端）
- **构建**: Vite（前端）, uvicorn（后端）

### 环境变量
```bash
# 后端
DATABASE_URL=sqlite:///./quilts.db
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# 前端
VITE_API_BASE_URL=http://localhost:8000/api
```

## 📦 部署

### Docker部署
```bash
# 使用Docker Compose构建和运行
docker-compose up -d

# 访问应用程序
# 前端: http://localhost:3000
# 后端: http://localhost:8000
```

### 生产部署
1. 设置PostgreSQL数据库
2. 配置环境变量
3. 构建前端：`npm run build`
4. 使用gunicorn部署后端
5. 使用nginx提供前端服务

## 🧪 测试

### 后端测试
```bash
cd backend
pytest tests/ -v
```

### 前端测试
```bash
cd frontend
npm run test:unit
npm run test:e2e
```

## 📋 路线图

### 第一阶段：基础 ✅
- [x] 增强数据库模式
- [x] 全面的API层
- [x] Excel数据迁移
- [x] Vue.js前端基础

### 第二阶段：核心功能（进行中）
- [ ] 完整的仪表板UI
- [ ] 被子管理表单
- [ ] 搜索和过滤UI
- [ ] 使用跟踪界面

### 第三阶段：高级功能
- [ ] 预测分析
- [ ] 维护调度
- [ ] 存储优化
- [ ] 移动应用（PWA）

### 第四阶段：生产
- [ ] 全面测试
- [ ] 性能优化
- [ ] 安全加固
- [ ] 部署自动化

## 🤝 贡献

1. Fork存储库
2. 创建您的功能分支（`git checkout -b feature/amazing-feature`）
3. 提交您的更改（`git commit -m 'Add some amazing feature'`）
4. 推送到分支（`git push origin feature/amazing-feature`）
5. 打开Pull Request

## 📄 许可证

该项目在MIT许可证下授权 - 有关详细信息，请参阅[LICENSE](LICENSE)文件。

## 📞 支持

如有问题或支持，请在GitHub上打开issue或联系开发团队。

---

**QMS v2.0** - 将简单的库存跟踪转换为智能床品管理 🛏️✨