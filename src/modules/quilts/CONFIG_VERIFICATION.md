# Quilt Module Configuration Verification

## 状态

- `COMPLETED`
- 已按当前 QMS 模块蓝图对齐

## 当前结论

`src/modules/quilts/config.ts` 仍然完整覆盖 quilts 模块配置需求，且已经和当前架构对齐：

- 模块字段完整
- 列表列定义完整
- 统计项完整
- 与 `src/modules/quilts/schema.ts` 对齐
- 与 `src/lib/data/quilts.ts` / `src/app/actions/quilts.ts` 的 server-first 架构兼容

## 配置覆盖范围

### 表单字段

配置覆盖 quilts 现有核心字段，包括但不限于：

- `itemNumber`
- `name`
- `season`
- `lengthCm`
- `widthCm`
- `weightGrams`
- `fillMaterial`
- `materialDetails`
- `color`
- `brand`
- `purchaseDate`
- `location`
- `packagingInfo`
- `currentStatus`
- `notes`
- `mainImage`
- `attachmentImages`
- `groupId`

### 列表列

当前配置能支撑 quilts 列表页展示：

- 编号
- 名称
- 季节
- 尺寸
- 重量
- 填充材料
- 颜色
- 品牌
- 位置
- 状态
- 图片标记

### 统计项

当前配置可支撑：

- 总数
- 按状态统计
- 按季节统计
- 平均重量
- 平均尺寸
- 材料分布
- 品牌分布
- 图片覆盖率

## 架构对齐说明

这份配置文档不再把 repository 视为 quilts 的权威层。

当前 quilts 模块的权威结构是：

- 配置与 schema：`src/modules/quilts/*`
- 数据层：`src/lib/data/quilts.ts`
- 写入口：`src/app/actions/quilts.ts`
- 页面壳：`src/app/[locale]/quilts/**`

兼容层说明：

- `src/app/api/quilts/**` 仅保留外部 HTTP compatibility surface
- `src/hooks/useQuilts.ts` 仅保留为 action-backed read wrapper

## 验证结论

- quilts config 仍然有效
- 不需要为当前架构新增 repository 层
- 后续 cards 等模块应复制 quilts 当前模式，而不是复制历史并行层
