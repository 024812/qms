# Quilt Module Schema Verification

## 状态

- `COMPLETED`
- 已按当前 QMS 模块蓝图对齐

## 当前结论

`src/modules/quilts/schema.ts` 继续承担 quilts 模块的 schema / type adapter 角色，并且已经和当前架构保持一致：

- 复用 `src/lib/validations/quilt.ts` 作为核心验证来源
- 复用 `src/lib/database/types.ts` 作为数据库行类型与转换来源
- 为模块注册系统提供 `QuiltItem` 等适配类型
- 不再依赖历史 repository 作为权威契约

## 已验证内容

### re-export 完整性

schema 仍然正确暴露以下能力：

- `SeasonSchema`
- `QuiltStatusSchema`
- `UsageTypeSchema`
- `QuiltSchema`
- `UsageRecordSchema`
- `MaintenanceRecordSchema`
- `createQuiltSchema`
- `updateQuiltSchema`
- `quiltFiltersSchema`
- `quiltSearchSchema`

以及对应类型：

- `Quilt`
- `UsageRecord`
- `MaintenanceRecord`
- `CreateQuiltInput`
- `UpdateQuiltInput`
- `QuiltSearchInput`

### adapter 能力

当前 schema 仍然提供：

- `quiltAttributesSchema`
- `QuiltAttributes`
- `QuiltItem`
- `quiltToQuiltItem(...)`
- `quiltItemToQuilt(...)`

这些能力用于把 quilts 模块接入模块注册系统和模块 UI，而不是用于维持旧 repository 兼容。

### 现有字段保持完整

schema 继续覆盖 quilts 全量字段：

- 基础字段
- 尺寸与重量
- 材料信息
- 购买信息
- 存储信息
- 状态与备注
- 图片字段
- 时间戳

## 架构对齐说明

当前 quilts 的权威层分工如下：

- 验证与类型：`src/lib/validations/quilt.ts`
- 模块适配：`src/modules/quilts/schema.ts`
- 数据访问：`src/lib/data/quilts.ts`
- mutation 入口：`src/app/actions/quilts.ts`

因此，这份 schema 文档不再把 `src/lib/repositories/quilt.repository.ts` 视为前提条件。

## 验证结论

- schema 仍然可用
- schema 仍然完整
- schema 已与当前 server-first、DAL-first 架构一致
- 后续模块应复制这套“validation + module adapter + DAL + actions”的结构
