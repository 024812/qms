# 项目审查 — 2026-09-25

状态：本次审查记录。依赖版本以 lockfile 为准。

## 结论与范围

### Vercel 部署日志后续修正

提交 `22afa03` 在 Vercel 编译、类型检查、117/117 页面生成及部署均成功。随后将 Node 从开放范围固定为 `24.x`，避免平台自动跨主版本升级；按 lockfile 版本为 esbuild（0.25.12 / 0.28.2）、@parcel/watcher（2.6.0）、@swc/core（1.16.2）、unrs-resolver（1.12.2）配置 `allowScripts`。这些脚本用于构建工具的本机二进制准备、校验或源码构建。

重新核对 npm registry：最新稳定 drizzle-kit 0.31.11 仍直接依赖 @esbuild-kit/esm-loader；最新 eslint-plugin-import 2.32.0 和 eslint-plugin-react 的 peer range 仍截止 ESLint 9。因此 esbuild-kit 与 ESLint 9 的弃用提示仍保留，待上游兼容升级后解决。没有隐藏日志或强制覆盖 peer 约束。

修正后在 `C:\temp\qms-review-20260925` 使用 Node 24.20.0 / npm 11.19.0 完整运行 `npm ci`，返回 `No packages with unreviewed install scripts.`；lint、type-check、360 个测试和生产构建（117/117 页面）全部通过。新配置尚需下一次 Vercel 部署验证。

项目总体采用 Next.js 16 Server Page / Client Shell、模块 DAL、Zod 输入校验、Neon 事务和显式模块授权，方向合理。本次审查核对了依赖、构建配置、认证、用户管理、代表性 DAL、Agent 工具入口、导出、缓存及文档，并运行全部现有测试。它不是对每个业务流程的浏览器验收，也不能据此宣称所有功能完整或没有缺陷。

通过 Context7 查阅 Next.js 缓存与 Server Action、Better Auth Next.js 会话集成、Drizzle Neon 事务文档。当前 npm registry 查询用于确定实际发布版本；文档示例不替代安装兼容性验证。

## 已修复

1. **导出截断**：`src/lib/data/settings.ts` 原先调用默认分页查询，导出遗漏后续记录。改为同一 repeatable-read 只读事务内读取全部 quilts / usage；新增超过第一页数量的回归用例。该导出仍是被子与使用记录导出，不是六模块全库备份。
2. **用户 REST 写入后报错**：`src/app/actions/users.ts` 被 Route Handler 直接调用，原有 `updateTag` 限 Server Action 上下文。改用支持两种入口的 `revalidateTag(tag, { expire: 0 })`。
3. **密码策略分叉**：创建要求 12 字符、管理员重置允许 6、自助修改允许 8、登录又要求 12。新建和修改统一 12；登录仅要求非空以允许历史凭据正常验证；同步中英文提示与修改表单。
4. **撤销会话延迟**：关闭 Better Auth cookie cache，并在 `auth()` 显式禁用 cookie cache，确保读取数据库会话状态。
5. **用户偏好并发覆盖**：管理员更新现在在事务内锁定用户行后合并 preferences，与订阅修改使用同一行锁。
6. **Agent 被子校验不足**：保留传输层日期/数字转换后复用 canonical create/update schema，补全必填字段和业务规则校验；Zod 错误返回 validation response。
7. **日期上限冻结**：购买日期不再使用模块初始化时的 `new Date()` 作为长期上限，改为每次校验计算。
8. **缓存说明错误**：纠正 `next.config.ts` 中“max invalidation 立即可见”的说法；`max` 实际采用 stale-while-revalidate。

## 依赖

刷新 `package-lock.json`；保留现有兼容 semver 声明。重要实际版本：Next.js 16.3.6、React 19.3.0、Better Auth 1.7.6、Drizzle ORM 0.45.3、next-intl 4.14.7、Zod 4.6.5、React Query 5.103.2、Vitest 5.0.1、Vite 8.3.1。Node 最低声明提升至 22.13，验证环境为 Node 24.20.0；推荐 Node 24 LTS。

`npm outdated --include=dev --json` 仅剩以下两项：

| 依赖       | 保留   | registry latest | 实测原因                                                                 |
| ---------- | ------ | --------------- | ------------------------------------------------------------------------ |
| TypeScript | 6.0.3  | 7.0.2           | eslint-config-next 使用的 typescript-eslint 明确拒绝 TS 7，lint 无法启动 |
| ESLint     | 9.39.5 | 10.11.0         | eslint-plugin-import 当前 peer range 截止 ESLint 9，安装出现 peer 冲突   |

ESLint 9 已有上游停止支持提示；应在插件支持新主版本后迁移。没有通过强制忽略 peer 依赖留下不兼容工具链。

## 验证结果

所有安装与运行均位于 `C:\temp\qms-review-20260925`。

- `npm run lint:check`：通过。
- `npm run type-check`：通过。
- `npm test`：33 文件、360 测试通过（新增 4 个回归用例）。
- `npm run build`：Next.js 16.3.6 Turbopack 生产构建成功，117/117 静态页面生成，退出码 0。
- `npm audit --json`：0 个已报告漏洞。
- 构建使用占位 Neon URL 和本地验证用 secret；未连接真实数据库。因此不代表数据库迁移、实际登录、生产事务或外部 AI 服务联调通过。

## 仍需处理 / 验证

- **Agent 幂等状态与业务写入不是同一事务**：`src/app/api/agent/tools/route.ts` 的 reservation、DAL 写入、成功状态记录分开提交。进程中断后可能留下 in_progress 或“业务成功但状态失败”；同 key 会被阻止，但不能宣称 exactly-once 或完整可恢复。需要事务级设计与故障注入测试。
- **Agent 契约仍有重复**：cards 与其他收藏模块仍独立声明部分 schema；OpenAPI 的手写契约也需要系统性对齐。此次修复只收紧了已确认的被子写入漏洞。
- **缓存写后可见性**：多数模块继续使用 blueprint 规定的 `revalidateTag(..., 'max')`，可能先读到旧值。需要真实浏览器核对保存后列表与计数；不可将 SWR 当作严格即时一致性。
- **AI 分析缓存未启用**：`src/modules/cards/services/analysis-cache-service.ts` 的 get/set 是 no-op，文件记录数据库迁移同步问题。需要确认部署 schema 后恢复，当前会增加重复分析延迟和提供商费用。
- **市场数据功能未完整实现**：`price-data-providers.ts` 存在 scraper placeholder；不应在产品文档中将所有市场数据来源描述为已接通。
- **设置字段语义**：`UpdateAppSettingsInput` 包含 language/itemsPerPage/defaultView，但 DAL 返回固定值并未持久化这些字段。应决定这些是用户本地偏好还是共享系统配置，再统一 UI、schema 与存储。
- **历史认证迁移**：登录回退仍执行建表/凭据迁移；应在 Neon 迁移状态核验和历史用户迁移完成后移除运行时 DDL。
- **性能**：列表大量读取完整行及 base64 图片；尚未通过真实数据量和浏览器 profiler 测量，因此不声称已经完成性能优化。可优先测量列表投影、缩略图与对象存储方案。
- **测试配置提示**：Vite 对 `vitest.config.ts` 的未来 native config loader 有兼容性提示；当前测试正常。

后续验收应使用隔离 Neon 分支覆盖六模块 CRUD、状态变更、导入导出、管理员改密与会话撤销、Agent 重试，以及已配置外部服务的真实请求。
