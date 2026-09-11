import {
  createModuleCacheTags,
  createModuleQueryKeys,
  defineModuleBlueprint,
} from '../core/blueprint';

export const mapsCacheTags = createModuleCacheTags('maps');
export const mapsQueryKeys = createModuleQueryKeys('maps');

export const mapsBlueprint = defineModuleBlueprint({
  id: 'maps',
  routeSegment: 'maps',
  summary:
    'Maps 模块遵循 V3 API-first 蓝图。使用单一 DAL、单一 actions、Server Page + Client Shell 架构。',
  directories: {
    moduleDir: 'src/modules/maps',
    dataFile: 'src/lib/data/maps.ts',
    actionFile: 'src/app/actions/maps.ts',
    pageDir: 'src/app/[locale]/maps',
    serverPage: 'src/app/[locale]/maps/page.tsx',
    clientComponentsDir: 'src/app/[locale]/maps/_components',
    clientShellFile: 'src/app/[locale]/maps/_components/MapsPageClient.tsx',
    detailPage: 'src/app/[locale]/maps/[id]/page.tsx',
  },
  dataLayer: {
    authoritativeFile: 'src/lib/data/maps.ts',
    responsibilities: [
      '唯一权威 CRUD',
      '服务端筛选、排序、分页',
      '事务化状态切换',
      '模块级 cache tag 管理',
    ],
    rules: [
      '图片更新和基础字段更新必须合并为同一事务边界中的一次保存动作',
      '页面不允许在拿到全量 maps 后再重复 filter/sort 作为主查询路径',
      '任何新写入逻辑都只能进入 src/lib/data/maps.ts',
    ],
  },
  actions: {
    authoritativeFile: 'src/app/actions/maps.ts',
    targetActions: [
      'getMapsAction',
      'getMapAction',
      'createMapAction',
      'updateMapAction',
      'deleteMapAction',
    ],
    rules: [
      '页面内部读写默认通过 Server Actions 发起',
      'Server Actions 负责 revalidateTag，而不是再回调 /api/maps',
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
      '调用 maps actions 完成 mutation',
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
      root: mapsCacheTags.root,
      list: mapsCacheTags.list,
      itemPattern: mapsCacheTags.item(':id'),
      slices: [
        mapsCacheTags.slice('status', 'COLLECTION'),
        mapsCacheTags.slice('status', 'DISPLAY'),
        mapsCacheTags.slice('mapType', 'HISTORICAL'),
        mapsCacheTags.slice('mapType', 'TOPOGRAPHIC'),
      ],
    },
    queryKeys: {
      root: mapsQueryKeys.root,
      exampleListKey: mapsQueryKeys.list({ search: '地图', status: 'COLLECTION' }),
      exampleItemKey: mapsQueryKeys.item(':id'),
    },
    rules: [
      '主缓存层是 Next cache tag，不是 React Query',
      '如果 maps 使用 React Query，则必须统一使用 [module, moduleId, scope, params] key 形状',
      '状态变更需要同时失效旧状态切片和新状态切片',
    ],
  },
  keep: [
    'src/lib/data/maps.ts',
    'src/app/actions/maps.ts',
    'src/modules/maps/config.ts',
    'src/modules/maps/schema.ts',
    'src/modules/maps/types.ts',
    'src/modules/maps/ui/*',
  ],
  legacy: [],
  migrationSteps: [
    '新增 src/app/[locale]/maps/_components/MapsPageClient.tsx，承接交互逻辑',
    '把 src/app/[locale]/maps/page.tsx 设为 server shell，只做 searchParams 解析与首屏读取',
    '确认 API 和 Web UI 使用相同 schema、权限、状态和错误语义',
  ],
});
