import {
  createModuleCacheTags,
  createModuleQueryKeys,
  defineModuleBlueprint,
} from '../core/blueprint';

export const spiritsCacheTags = createModuleCacheTags('spirits');
export const spiritsQueryKeys = createModuleQueryKeys('spirits');

export const spiritsBlueprint = defineModuleBlueprint({
  id: 'spirits',
  routeSegment: 'spirits',
  summary: 'Spirits 是藏酒管理模块，遵循 V3 API-first 蓝图标准化实现。',
  directories: {
    moduleDir: 'src/modules/spirits',
    dataFile: 'src/lib/data/spirits.ts',
    actionFile: 'src/app/actions/spirits.ts',
    pageDir: 'src/app/[locale]/spirits',
    serverPage: 'src/app/[locale]/spirits/page.tsx',
    clientComponentsDir: 'src/app/[locale]/spirits/_components',
    clientShellFile: 'src/app/[locale]/spirits/_components/SpiritsPageClient.tsx',
    detailPage: 'src/app/[locale]/spirits/[id]/page.tsx',
  },
  dataLayer: {
    authoritativeFile: 'src/lib/data/spirits.ts',
    responsibilities: [
      '唯一权威 CRUD',
      '服务端筛选、排序、分页',
      '事务化状态切换',
      '模块级 cache tag 管理',
    ],
    rules: [
      '所有数据库访问必须通过此 DAL',
      '使用 Next.js 16 use cache 和统一 cache tags',
      '写入操作后使用 revalidateTag(, "max") 失效缓存',
    ],
  },
  actions: {
    authoritativeFile: 'src/app/actions/spirits.ts',
    targetActions: [
      'getSpiritsAction',
      'getSpiritAction',
      'createSpiritAction',
      'updateSpiritAction',
      'deleteSpiritAction',
    ],
    rules: [
      '页面内部读写默认通过 Server Actions 发起',
      'Server Actions 负责 auth、授权、校验和 ActionResult',
      '统一返回可被页面直接消费的结果结构',
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
      '调用 spirits actions 完成 mutation',
      '必要时把筛选条件回写 URL',
    ],
    forbiddenInServerPage: ['维护 dialog 开关', '维护批量选择状态', '直接写表单提交细节'],
    forbiddenInClientShell: ['直接访问数据库', '复制服务端主筛选逻辑', '绕过 actions 调用 API'],
  },
  cache: {
    tags: {
      root: spiritsCacheTags.root,
      list: spiritsCacheTags.list,
      itemPattern: spiritsCacheTags.item(':id'),
      slices: [
        spiritsCacheTags.slice('status', 'COLLECTION'),
        spiritsCacheTags.slice('status', 'AGING'),
        spiritsCacheTags.slice('spiritType', 'WHISKY'),
        spiritsCacheTags.slice('spiritType', 'COGNAC'),
      ],
    },
    queryKeys: {
      root: spiritsQueryKeys.root,
      exampleListKey: spiritsQueryKeys.list({ search: 'Macallan', status: 'COLLECTION' }),
      exampleItemKey: spiritsQueryKeys.item(':id'),
    },
    rules: [
      '主缓存层是 Next cache tag，不是 React Query',
      '状态变更需要同时失效旧状态切片和新状态切片',
      '类型变更需要同时失效旧类型切片和新类型切片',
    ],
  },
  keep: [
    'src/lib/data/spirits.ts',
    'src/app/actions/spirits.ts',
    'src/modules/spirits/config.ts',
    'src/modules/spirits/schema.ts',
    'src/modules/spirits/ui/*',
  ],
  legacy: [],
  migrationSteps: [],
});
