import {
  createModuleCacheTags,
  createModuleQueryKeys,
  defineModuleBlueprint,
} from '../core/blueprint';

export const antiquesCacheTags = createModuleCacheTags('antiques');
export const antiquesQueryKeys = createModuleQueryKeys('antiques');

export const antiquesBlueprint = defineModuleBlueprint({
  id: 'antiques',
  routeSegment: 'antiques',
  summary:
    'Antiques 是按 V3 API-first 蓝图实现的文玩管理模块。完整实现了 DAL、Actions、Server Page + Client Shell、正式 REST API。',
  directories: {
    moduleDir: 'src/modules/antiques',
    dataFile: 'src/lib/data/antiques.ts',
    actionFile: 'src/app/actions/antiques.ts',
    pageDir: 'src/app/[locale]/antiques',
    serverPage: 'src/app/[locale]/antiques/page.tsx',
    clientComponentsDir: 'src/app/[locale]/antiques/_components',
    clientShellFile: 'src/app/[locale]/antiques/_components/AntiquesPageClient.tsx',
    detailPage: 'src/app/[locale]/antiques/[id]/page.tsx',
  },
  dataLayer: {
    authoritativeFile: 'src/lib/data/antiques.ts',
    responsibilities: [
      '唯一权威 CRUD',
      '服务端筛选、排序、分页',
      '事务化状态切换',
      '模块级 cache tag 管理',
    ],
    rules: [
      '图片更新和基础字段更新必须合并为同一事务边界中的一次保存动作',
      '页面不允许在拿到全量 antiques 后再重复 filter/sort 作为主查询路径',
      '任何新写入逻辑都只能进入 src/lib/data/antiques.ts',
    ],
  },
  actions: {
    authoritativeFile: 'src/app/actions/antiques.ts',
    targetActions: [
      'getAntiquesAction',
      'getAntiqueAction',
      'createAntiqueAction',
      'updateAntiqueAction',
      'deleteAntiqueAction',
    ],
    rules: [
      '页面内部读写默认通过 Server Actions 发起',
      'Server Actions 负责 revalidateTag，而不是再回调 /api/antiques',
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
      '调用 antiques actions 完成 mutation',
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
      root: antiquesCacheTags.root,
      list: antiquesCacheTags.list,
      itemPattern: antiquesCacheTags.item(':id'),
      slices: [
        antiquesCacheTags.slice('status', 'COLLECTION'),
        antiquesCacheTags.slice('status', 'FOR_SALE'),
        antiquesCacheTags.slice('category', 'JADE'),
      ],
    },
    queryKeys: {
      root: antiquesQueryKeys.root,
      exampleListKey: antiquesQueryKeys.list({ search: '玉器', status: 'COLLECTION' }),
      exampleItemKey: antiquesQueryKeys.item(':id'),
    },
    rules: [
      '主缓存层是 Next cache tag，不是 React Query',
      '状态变更需要同时失效旧状态切片和新状态切片',
    ],
  },
  keep: [
    'src/lib/data/antiques.ts',
    'src/app/actions/antiques.ts',
    'src/modules/antiques/config.ts',
    'src/modules/antiques/schema.ts',
    'src/modules/antiques/ui/*',
  ],
  legacy: [],
  migrationSteps: [
    '按 V3 蓝图从零实现，无需迁移',
    '完整实现 DAL、Actions、Server Page + Client Shell、REST API',
  ],
});
