# QMS Project Summary

当前版本：`2026.4.2`

## 当前定位

QMS 已经从“单项目堆功能”收敛为“可复制子模块平台”。现在最重要的不是继续堆平行实现，而是让每个新增模块都能沿着同一条标准路径落地。

第一批标准化模板模块：

- `quilts`
- `cards`

## 当前架构

### 1. 页面结构

- 页面位于 `src/app/[locale]/**`
- 首屏数据在 Server Component 获取
- 交互状态下沉到模块私有 `_components/*`

### 2. 数据真相源

- 每个模块只保留一个 canonical data layer：`src/lib/data/<module>.ts`
- 每个模块只保留一个 canonical server action surface：`src/app/actions/<module>.ts`
- `/api/**` 不再承担内部主读写路径

### 3. 缓存策略

- 服务端共享数据使用 Next.js 16 `use cache`、`cacheLife`、`cacheTag`、`revalidateTag`
- 客户端保持 React Query 包装层，主要负责交互态、失效与局部同步

### 4. 路由和鉴权

- Next.js 16 路由保护使用项目根目录 `proxy.ts`
- Auth.js v5 负责登录、注册、会话和权限扩展
- 用户角色和启用模块保存在 `users.preferences`

## 2026.4.2 这次收口的重点

- 清理了失效 npm scripts，避免新环境按照错误命令启动
- 去掉了 `next.config.js` 中已经不再生效的 legacy webpack 配置
- 统一了 `cards` 和 `settings` 的 canonical data flow，减少重复真相源
- 优化了 cards overview 统计，改为数据库聚合而不是把整表拉到内存里计算
- 删除了死文件和无引用文件，减少复制新模块时的噪音
- 更新了 README 和部署文档，移除旧认证方案和失效环境变量

## 新模块复制时的最小模板

1. 在 `src/modules/<module>/` 放入 `blueprint.ts`、`schema.ts`、`types.ts`
2. 在 `src/lib/data/<module>.ts` 实现唯一的数据读写与缓存失效
3. 在 `src/app/actions/<module>.ts` 暴露唯一的内部 action 入口
4. 在 `src/app/[locale]/<module>/page.tsx` 建立 server page shell
5. 在 `src/app/[locale]/<module>/_components/*` 放置 client shell 和交互组件
6. 为模块定义清晰的 cache tags 和 query keys

## 后续持续约束

- 不新增第二套并行 repository 或 cached repository
- 不让页面重新直接拼装数据库查询
- 不让内部 UI 重新依赖 `/api/**` 作为主路径
- 文档更新必须和 `package.json` 版本、根 `README`、`CHANGELOG.md` 同步
