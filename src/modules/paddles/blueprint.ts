import {
  createModuleCacheTags,
  createModuleQueryKeys,
  defineModuleBlueprint,
} from '../core/blueprint';

export const paddlesCacheTags = createModuleCacheTags('paddles');
export const paddlesQueryKeys = createModuleQueryKeys('paddles');

export const paddlesBlueprint = defineModuleBlueprint({
  id: 'paddles',
  routeSegment: 'paddles',
  summary:
    'Paddles 是乒乓球底板管理模块，遵循 V3 API-first blueprint，包含完整的 DAL、Server Actions、REST API 和 Web UI。',
  directories: {
    moduleDir: 'src/modules/paddles',
    dataFile: 'src/lib/data/paddles.ts',
    actionFile: 'src/app/actions/paddles.ts',
    pageDir: 'src/app/[locale]/paddles',
    serverPage: 'src/app/[locale]/paddles/page.tsx',
    clientComponentsDir: 'src/app/[locale]/paddles/_components',
    clientShellFile: 'src/app/[locale]/paddles/_components/PaddlesPageClient.tsx',
    detailPage: 'src/app/[locale]/paddles/[id]/page.tsx',
  },
  dataLayer: {
    authoritativeFile: 'src/lib/data/paddles.ts',
    responsibilities: [
      '唯一权威 CRUD',
      '服务端筛选、排序、分页',
      '事务化状态切换',
      '模块级 cache tag 管理',
    ],
    rules: [
      '图片更新和基础字段更新必须合并为同一事务边界中的一次保存动作',
      '页面不允许在拿到全量 paddles 后再重复 filter/sort 作为主查询路径',
      '任何新写入逻辑都只能进入 src/lib/data/paddles.ts',
    ],
  },
  actions: {
    authoritativeFile: 'src/app/actions/paddles.ts',
    targetActions: [
      'getPaddlesAction',
      'getPaddleAction',
      'createPaddleAction',
      'updatePaddleAction',
      'deletePaddleAction',
    ],
    rules: [
      '页面内部读写默认通过 Server Actions 发起',
      'Server Actions 负责 revalidateTag，而不是再回调 /api/paddles',
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
      '调用 paddles actions 完成 mutation',
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
      root: paddlesCacheTags.root,
      list: paddlesCacheTags.list,
      itemPattern: paddlesCacheTags.item(':id'),
      slices: [
        paddlesCacheTags.slice('status', 'ACTIVE'),
        paddlesCacheTags.slice('status', 'RETIRED'),
        paddlesCacheTags.slice('status', 'FOR_SALE'),
      ],
    },
    queryKeys: {
      root: paddlesQueryKeys.root,
      exampleListKey: paddlesQueryKeys.list({ search: '蝴蝶', status: 'ACTIVE' }),
      exampleItemKey: paddlesQueryKeys.item(':id'),
    },
    rules: [
      '主缓存层是 Next cache tag，不是 React Query',
      '状态变更需要同时失效旧状态切片和新状态切片',
    ],
  },
  keep: [
    'src/lib/data/paddles.ts',
    'src/app/actions/paddles.ts',
    'src/modules/paddles/config.ts',
    'src/modules/paddles/schema.ts',
    'src/modules/paddles/ui/*',
  ],
  legacy: [],
  migrationSteps: [
    '新增 paddles 模块完全遵循 V3 blueprint',
    'Database schema 包含完整的 paddle 字段和索引',
    'DAL 使用统一 cache-tags.ts 工厂',
    'Server Actions 执行 auth、模块授权、schema 校验',
    'REST API 复用 Server Actions 和统一 response envelope',
    'Web UI 使用 Server Page + Client Shell 模式',
  ],
});
