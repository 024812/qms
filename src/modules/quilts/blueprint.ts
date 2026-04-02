import {
  createModuleCacheTags,
  createModuleQueryKeys,
  defineModuleBlueprint,
} from '../core/blueprint';

export const quiltsCacheTags = createModuleCacheTags('quilts');
export const quiltsQueryKeys = createModuleQueryKeys('quilts');

export const quiltsBlueprint = defineModuleBlueprint({
  id: 'quilts',
  routeSegment: 'quilts',
  summary:
    'Quilts 是 QMS 第一批标准化子模块。当前已经收敛到单一 DAL、单一 actions、Server Page + Client Shell，并移除了 repository 并行层。',
  directories: {
    moduleDir: 'src/modules/quilts',
    dataFile: 'src/lib/data/quilts.ts',
    actionFile: 'src/app/actions/quilts.ts',
    pageDir: 'src/app/[locale]/quilts',
    serverPage: 'src/app/[locale]/quilts/page.tsx',
    clientComponentsDir: 'src/app/[locale]/quilts/_components',
    clientShellFile: 'src/app/[locale]/quilts/_components/QuiltsPageClient.tsx',
    detailPage: 'src/app/[locale]/quilts/[id]/page.tsx',
  },
  dataLayer: {
    authoritativeFile: 'src/lib/data/quilts.ts',
    responsibilities: [
      '唯一权威 CRUD',
      '服务端筛选、排序、分页',
      '事务化状态切换与使用记录写入',
      '模块级 cache tag 管理',
    ],
    rules: [
      '图片更新和基础字段更新必须合并为同一事务边界中的一次保存动作',
      '页面不允许在拿到全量 quilts 后再重复 filter/sort 作为主查询路径',
      '任何新写入逻辑都只能进入 src/lib/data/quilts.ts，不再新增 repository 包装层',
    ],
  },
  actions: {
    authoritativeFile: 'src/app/actions/quilts.ts',
    targetActions: [
      'getQuiltsAction',
      'getQuiltAction',
      'saveQuiltAction',
      'changeQuiltStatusAction',
      'deleteQuiltAction',
    ],
    rules: [
      '页面内部读写默认通过 Server Actions 发起',
      'Server Actions 负责 updateTag，而不是再回调 /api/quilts',
      '统一返回可被页面直接消费的结果结构，不分散错误映射',
    ],
  },
  pageShell: {
    serverResponsibilities: [
      '解析 URL 查询参数',
      '调用权威数据层读取首屏列表',
      '准备可序列化的初始 props',
      '把交互交给私有 client shell',
    ],
    clientResponsibilities: [
      'toolbar、dialog、selection、transition',
      '本地 UI 状态',
      '调用 quilts actions 完成 mutation',
      '必要时把筛选条件回写 URL',
    ],
    forbiddenInServerPage: ['维护 dialog 开关', '维护批量选择状态', '直接写表单提交细节'],
    forbiddenInClientShell: [
      '直接访问数据库',
      '复制服务端主筛选逻辑',
      '绕过 actions 直接调用 legacy REST',
    ],
  },
  cache: {
    tags: {
      root: quiltsCacheTags.root,
      list: quiltsCacheTags.list,
      itemPattern: quiltsCacheTags.item(':id'),
      slices: [
        quiltsCacheTags.slice('status', 'IN_USE'),
        quiltsCacheTags.slice('status', 'STORAGE'),
        quiltsCacheTags.slice('season', 'WINTER'),
      ],
    },
    queryKeys: {
      root: quiltsQueryKeys.root,
      exampleListKey: quiltsQueryKeys.list({ search: '鹅绒', status: 'STORAGE' }),
      exampleItemKey: quiltsQueryKeys.item(':id'),
    },
    rules: [
      '主缓存层是 Next cache tag，不是 React Query',
      '如果 quilts 仍暂时保留 React Query，则必须统一使用 [module, moduleId, scope, params] key 形状',
      '状态变更需要同时失效旧状态切片和新状态切片',
    ],
  },
  keep: [
    'src/lib/data/quilts.ts',
    'src/app/actions/quilts.ts',
    'src/hooks/useQuilts.ts',
    'src/modules/quilts/config.ts',
    'src/modules/quilts/schema.ts',
    'src/modules/quilts/types.ts',
    'src/modules/quilts/ui/*',
  ],
  legacy: [
    {
      path: 'src/hooks/useQuilts.ts',
      status: 'legacy',
      replacement: '长期目标是更多 server shell 直读，当前已不再依赖 /api/quilts',
    },
    {
      path: 'src/app/api/quilts/**',
      status: 'legacy',
      replacement: '内部读写已经不再依赖 Route Handlers',
    },
    {
      path: 'src/lib/repositories/quilt.repository.ts',
      status: 'remove-after-migration',
      replacement: 'src/lib/data/quilts.ts',
    },
    {
      path: 'src/lib/repositories/cached-quilt.repository.ts',
      status: 'remove-after-migration',
      replacement: 'src/lib/data/quilts.ts 内部 cacheTag/use cache',
    },
  ],
  migrationSteps: [
    '新增 src/app/[locale]/quilts/_components/QuiltsPageClient.tsx，承接原 page.tsx 的交互逻辑',
    '把 src/app/[locale]/quilts/page.tsx 收敛成 server shell，只做 searchParams 解析与首屏读取',
    '把图片更新与元数据更新合并成单一 saveQuiltAction',
    '把 src/hooks/useQuilts.ts 收敛成 action-based read wrapper',
    '确认没有内部调用方依赖 /api/quilts 后，repository 已移除，Route Handlers 仅为外部 HTTP 保留',
  ],
});
