# QMS 模块标准（已废弃）

本文件不再作为新增或重构子模块的执行标准。

自 `2026-04-02` 起，QMS 统一以 [docs/MODULE_BLUEPRINT_V2.md](/c:/Users/sli/OneDrive/Projects/qms/docs/MODULE_BLUEPRINT_V2.md) 为准。

## 废弃原因

旧标准默认允许以下层长期并行：

- `repository`
- `cached repository`
- `Server Actions`
- `Route Handlers`
- `hooks/use<Module>.ts`

这会导致同一个子模块同时存在多条读写路径，进一步带来：

- 同一资源的缓存策略分裂
- 页面、action、HTTP API、repository 同步演进
- 很难判断哪一层才是权威实现
- quilts、cards、dashboard 逐步形成不同架构

## 现行标准

- 权威数据层固定为 `src/lib/data/<module>.ts`
- 权威写入口固定为 `src/app/actions/<module>.ts`
- 页面固定为 `Server Page + 私有 Client Shell`
- `Route Handlers` 仅保留外部 HTTP、Webhook、第三方集成所需的兼容面
- `React Query hooks` 不是默认基础层，只在高交互 client 场景下作为补充层出现

## 首批模板模块

- `quilts`

`cards` 和后续模块应直接复制 quilts 的模式，不再重新发明第二套架构。
