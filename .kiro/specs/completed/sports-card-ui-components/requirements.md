# 需求文档

## 介绍

本文档定义了球星卡管理子模块UI组件的需求。该模块是一个Next.js 16 + React 19 + TypeScript项目的一部分，使用模块化架构管理不同类型的收藏品。

**项目背景**:

- **数据库架构决策**：采用独立表方案，每个模块使用独立的数据库表（quilts表、cards表等），而非单表继承+JSONB模式
- **技术原因**：基于Drizzle ORM和Neon Postgres最佳实践，独立表提供更好的类型安全、查询性能、索引效率和数据完整性
- 球星卡模块将使用独立的`cards`表，包含30+个原生列字段，配合针对性索引优化查询性能
- 球星卡模块已在MODULE_REGISTRY中注册（id: 'card'）
- config.ts和schema.ts已完成，包含完整的数据模型和表单配置
- CardCard和CardDetail组件需要实现，以符合MODULE_STANDARD.md规范

**目标**:

1. 实现CardCard和CardDetail UI组件，完全符合模块开发标准
2. 确保组件与新的独立表数据库架构兼容
3. 提供一致的用户体验，并与被子模块保持设计一致性

## 术语表

- **System**: 球星卡管理UI组件系统
- **CardCard**: 列表视图中显示球星卡摘要信息的卡片组件
- **CardDetail**: 详情视图中显示球星卡完整信息的详情组件
- **Server_Component**: React 19的服务器组件，在服务器端渲染
- **Client_Component**: React 19的客户端组件，在浏览器中渲染
- **Module_Registry**: 模块注册系统，管理所有子模块的配置和组件
- **DetailField**: 统一样式的详情字段组件
- **Badge**: 徽章组件，用于显示状态和分类信息
- **Image_Component**: Next.js Image组件，用于优化图片加载
- **Cards_Table**: 独立的PostgreSQL表，存储球星卡数据，包含30+个原生列字段
- **Drizzle_ORM**: 类型安全的TypeScript ORM，用于数据库操作
- **Neon_Postgres**: Serverless Postgres数据库，支持分支、自动扩展和scale-to-zero

## 需求

### 需求 1: CardCard组件实现

**用户故事**: 作为用户，我想在列表视图中看到球星卡的关键信息，以便快速浏览和识别我的收藏。

#### 验收标准

1. WHEN CardCard组件渲染时，THE System SHALL显示球员姓名作为主标题
2. WHEN CardCard组件渲染时，THE System SHALL显示物品编号（格式：#数字）
3. WHEN CardCard组件渲染时，THE System SHALL显示运动类型徽章（篮球/足球/其他）
4. WHEN CardCard组件渲染时，THE System SHALL显示年份和品牌信息
5. WHEN CardCard组件渲染时，THE System SHALL显示评级信息（评级公司+分数，如果已评级）
6. WHEN CardCard组件渲染时，THE System SHALL显示当前价值（如果有）
7. WHEN CardCard组件渲染时，THE System SHALL显示签名标记（如果是签名卡）
8. WHEN CardCard组件渲染时，THE System SHALL显示实物标记（如果包含实物）
9. WHEN CardCard组件渲染时，THE System SHALL显示状态徽章（收藏中/待售/已售出/评级中/展示中）
10. WHEN 球星卡有主图片时，THE System SHALL在卡片顶部显示主图片
11. WHEN 球星卡没有主图片时，THE System SHALL不显示图片区域
12. THE CardCard组件 SHALL使用Next.js Image组件加载图片
13. THE CardCard组件 SHALL使用懒加载（loading="lazy"）优化图片加载
14. THE CardCard组件 SHALL不包含Card包装器（由父组件ItemCard处理）
15. THE CardCard组件 SHALL使用Tailwind CSS语义化颜色（bg-background, text-foreground等）

### 需求 2: CardCard组件样式和布局

**用户故事**: 作为用户，我想要一个美观且响应式的卡片布局，以便在不同设备上都能良好显示。

#### 验收标准

1. THE CardCard组件 SHALL使用响应式图片尺寸（sizes属性）
2. THE CardCard组件 SHALL在移动端、平板和桌面设备上正确显示
3. THE CardCard组件 SHALL支持暗色模式
4. THE CardCard组件 SHALL使用统一的徽章颜色系统
5. THE CardCard组件 SHALL使用Lucide React图标
6. THE CardCard组件 SHALL保持与被子模块卡片组件一致的布局结构
7. THE CardCard组件 SHALL使用合适的间距和排版
8. WHEN 显示运动类型徽章时，THE System SHALL使用不同颜色区分不同运动
9. WHEN 显示状态徽章时，THE System SHALL使用不同颜色区分不同状态
10. WHEN 显示评级信息时，THE System SHALL格式化为"公司名 分数"格式

### 需求 3: CardDetail组件实现

**用户故事**: 作为用户，我想在详情页看到球星卡的所有信息，以便全面了解这张卡片的详细情况。

#### 验收标准

1. WHEN CardDetail组件渲染时，THE System SHALL显示图片画廊（主图+附加图片）
2. WHEN CardDetail组件渲染时，THE System SHALL显示基本信息卡片（球员信息）
3. WHEN CardDetail组件渲染时，THE System SHALL显示卡片详情卡片（年份、品牌、系列、卡号）
4. WHEN CardDetail组件渲染时，THE System SHALL显示评级信息卡片（评级公司、分数、认证编号）
5. WHEN CardDetail组件渲染时，THE System SHALL显示价值信息卡片（购买价格、当前价值、投资回报率）
6. WHEN CardDetail组件渲染时，THE System SHALL显示物理特征卡片（平行版本、序列号、签名、实物）
7. WHEN CardDetail组件渲染时，THE System SHALL显示存储信息卡片（状态、位置、存储方式、品相）
8. WHEN CardDetail组件渲染时，THE System SHALL显示时间戳卡片（创建时间、更新时间）
9. WHEN 有备注信息时，THE System SHALL显示备注卡片
10. THE CardDetail组件 SHALL使用DetailField组件统一字段样式
11. THE CardDetail组件 SHALL使用响应式网格布局（grid-cols-1 md:grid-cols-2）
12. THE CardDetail组件 SHALL在图片画廊中标记主图
13. THE CardDetail组件 SHALL使用Next.js Image组件优化图片加载
14. THE CardDetail组件 SHALL按逻辑分组显示信息（图片→基本信息→详细信息→时间戳）
15. WHEN 计算投资回报率时，THE System SHALL显示百分比和正负号

### 需求 4: CardDetail组件数据格式化

**用户故事**: 作为用户，我想看到格式化良好的数据显示，以便更容易理解信息。

#### 验收标准

1. WHEN 显示日期时，THE System SHALL格式化为中文日期格式（年月日）
2. WHEN 显示价格时，THE System SHALL格式化为货币格式（带千位分隔符和两位小数）
3. WHEN 显示运动类型时，THE System SHALL显示中文标签（篮球、足球、其他）
4. WHEN 显示评级公司时，THE System SHALL显示完整名称（PSA、BGS (Beckett)等）
5. WHEN 显示状态时，THE System SHALL显示中文标签（收藏中、待售等）
6. WHEN 字段值为空时，THE System SHALL显示"-"占位符
7. WHEN 计算投资回报率时，THE System SHALL显示为百分比格式（+XX.XX%或-XX.XX%）
8. WHEN 没有购买价格或当前价值时，THE System SHALL显示"无数据"
9. WHEN 显示布尔值时，THE System SHALL显示"是"或"否"
10. WHEN 显示签名和实物标记时，THE System SHALL使用徽章组件

### 需求 5: 组件类型安全

**用户故事**: 作为开发者，我想要完整的TypeScript类型支持，以便在开发时捕获错误。

#### 验收标准

1. THE CardCard组件 SHALL使用type import导入类型
2. THE CardDetail组件 SHALL使用type import导入类型
3. THE CardCard组件 SHALL接收CardItem类型的item属性
4. THE CardDetail组件 SHALL接收CardItem类型的item属性
5. THE System SHALL为所有辅助函数定义明确的类型签名
6. THE System SHALL不使用any类型
7. THE System SHALL通过TypeScript严格类型检查
8. THE System SHALL为所有组件属性定义接口
9. THE System SHALL为所有函数参数和返回值定义类型
10. THE System SHALL使用Zod schema推导的类型

### 需求 6: 组件文档和注释

**用户故事**: 作为开发者，我想要清晰的代码文档，以便理解组件的功能和使用方法。

#### 验收标准

1. THE CardCard组件 SHALL包含完整的JSDoc文件头注释
2. THE CardDetail组件 SHALL包含完整的JSDoc文件头注释
3. THE System SHALL为所有辅助函数添加JSDoc注释
4. THE System SHALL在注释中说明组件的关键特性
5. THE System SHALL在注释中引用相关需求编号
6. THE System SHALL为复杂逻辑添加行内注释
7. THE System SHALL说明组件不包含Card包装器（CardCard）
8. THE System SHALL说明组件的布局结构（CardDetail）
9. THE System SHALL为所有接口添加注释
10. THE System SHALL使用中文编写用户可见的注释

### 需求 7: 响应式设计

**用户故事**: 作为用户，我想在不同设备上都能良好使用球星卡管理功能，以便随时随地管理我的收藏。

#### 验收标准

1. THE CardCard组件 SHALL在移动端（<640px）正确显示
2. THE CardCard组件 SHALL在平板（640px-1024px）正确显示
3. THE CardCard组件 SHALL在桌面（>1024px）正确显示
4. THE CardDetail组件 SHALL在移动端使用单列布局
5. THE CardDetail组件 SHALL在平板和桌面使用双列布局
6. THE System SHALL使用Tailwind响应式断点（sm, md, lg）
7. THE System SHALL确保图片在所有设备上正确缩放
8. THE System SHALL确保文本在所有设备上可读
9. THE System SHALL确保徽章在移动端不会换行混乱
10. THE System SHALL确保触摸目标在移动端足够大

### 需求 8: 性能优化

**用户故事**: 作为用户，我想要快速加载的页面，以便流畅地浏览我的收藏。

#### 验收标准

1. THE System SHALL使用Next.js Image组件自动优化图片
2. THE System SHALL为图片设置合适的sizes属性
3. THE System SHALL使用懒加载加载非首屏图片
4. THE System SHALL使用WebP/AVIF格式提供图片
5. THE System SHALL避免不必要的客户端JavaScript
6. THE System SHALL使用Server Component优先原则
7. THE System SHALL避免在组件中进行复杂计算
8. THE System SHALL使用memo优化辅助函数（如果需要）
9. THE System SHALL避免内联样式
10. THE System SHALL使用Tailwind CSS减少CSS体积

### 需求 9: 可访问性

**用户故事**: 作为有辅助需求的用户，我想要可访问的界面，以便使用屏幕阅读器等辅助工具。

#### 验收标准

1. THE System SHALL为所有图片提供有意义的alt文本
2. THE System SHALL使用语义化HTML标签
3. THE System SHALL确保颜色对比度符合WCAG标准
4. THE System SHALL为图标提供文本标签
5. THE System SHALL确保键盘导航可用
6. THE System SHALL使用ARIA属性（如果需要）
7. THE System SHALL确保焦点状态可见
8. THE System SHALL避免仅依赖颜色传达信息
9. THE System SHALL确保文本可缩放
10. THE System SHALL测试屏幕阅读器兼容性

### 需求 10: 错误处理

**用户故事**: 作为用户，我想在数据缺失或错误时看到合理的显示，以便不影响使用体验。

#### 验收标准

1. WHEN 图片加载失败时，THE System SHALL显示占位符或隐藏图片区域
2. WHEN 必填字段缺失时，THE System SHALL显示"-"占位符
3. WHEN 可选字段缺失时，THE System SHALL不显示该字段或显示"-"
4. WHEN 数值计算失败时，THE System SHALL显示"无数据"
5. WHEN 日期格式错误时，THE System SHALL显示"-"
6. WHEN 枚举值未知时，THE System SHALL显示原始值
7. THE System SHALL优雅处理null和undefined值
8. THE System SHALL避免抛出未捕获的异常
9. THE System SHALL在控制台记录错误（开发环境）
10. THE System SHALL不向用户显示技术错误信息
