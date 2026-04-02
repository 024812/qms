import {
  createModuleCacheTags,
  createModuleQueryKeys,
  defineModuleBlueprint,
} from '../core/blueprint';

export const cardsCacheTags = createModuleCacheTags('cards');
export const cardsQueryKeys = createModuleQueryKeys('cards');

export const cardsBlueprint = defineModuleBlueprint({
  id: 'cards',
  routeSegment: 'cards',
  summary:
    'Cards 是 quilts 之后的第二个标准化目标模块。当前已建立 canonical DAL + canonical actions，并把列表、settings、detail、sold、overview 等切片收敛到 server-first 结构。',
  directories: {
    moduleDir: 'src/modules/cards',
    dataFile: 'src/lib/data/cards.ts',
    actionFile: 'src/app/actions/cards.ts',
    pageDir: 'src/app/[locale]/cards',
    serverPage: 'src/app/[locale]/cards/page.tsx',
    clientComponentsDir: 'src/app/[locale]/cards/_components',
    clientShellFile: 'src/app/[locale]/cards/_components/CardsPageClient.tsx',
    detailPage: 'src/app/[locale]/cards/[id]/page.tsx',
  },
  dataLayer: {
    authoritativeFile: 'src/lib/data/cards.ts',
    responsibilities: [
      '卡片列表与详情读取',
      '卡片写入、删除、状态变更',
      '模块级缓存标签管理',
      'stats / overview / activity 读取统一归档',
    ],
    rules: [
      'cards 模块不再继续扩散新的 repository-first 读写入口',
      'settings、stats、overview 等切片统一收敛到 cards 数据层与 cards actions',
      '页面内部不允许再把 /api/cards/** 作为主读写路径',
    ],
  },
  actions: {
    authoritativeFile: 'src/app/actions/cards.ts',
    targetActions: [
      'getCardSettingsAction',
      'updateCardSettingsAction',
      'getCardsAction',
      'getCardAction',
      'saveCardAction',
      'deleteCardAction',
      'getCardStatsAction',
      'getMonthlyBuySellDataAction',
      'getRecentActivityAction',
    ],
    rules: [
      '新的 cards 内部页面默认通过 src/app/actions/cards.ts 读写',
      'action 负责统一认证、入参校验、错误映射与调用 canonical DAL',
      '旧的 card-actions.ts / card-stats.ts / card-overview-data.ts 已不再被内部页面依赖',
    ],
  },
  pageShell: {
    serverResponsibilities: [
      '读取 session / role',
      '准备首屏可序列化数据',
      '按 server-first 模式把数据传给 client shell',
      '避免把认证判断留给客户端首帧完成',
    ],
    clientResponsibilities: [
      '表单状态',
      '弹窗与交互状态',
      '调用 cards actions 完成 mutation',
      '必要时保留 action-backed React Query wrapper',
    ],
    forbiddenInServerPage: ['直接维护表单输入状态', '直接持有点击交互状态'],
    forbiddenInClientShell: ['再通过 fetch 调 /api/cards/** 作为主通路', '重复实现权限判定逻辑'],
  },
  cache: {
    tags: {
      root: cardsCacheTags.root,
      list: cardsCacheTags.list,
      itemPattern: cardsCacheTags.item(':id'),
      slices: [
        cardsCacheTags.slice('status', 'COLLECTION'),
        cardsCacheTags.slice('status', 'SOLD'),
        cardsCacheTags.slice('sport', 'BASKETBALL'),
        cardsCacheTags.slice('overview', 'stats'),
      ],
    },
    queryKeys: {
      root: cardsQueryKeys.root,
      exampleListKey: cardsQueryKeys.list({ search: 'Jordan', status: 'COLLECTION' }),
      exampleItemKey: cardsQueryKeys.item(':id'),
    },
    rules: [
      'settings 这类敏感配置不走长期缓存，优先实时读取',
      '其余 cards 读路径以 Next cache tag 为主',
      'React Query 只作为兼容包装，不再承载内部 REST 真相层',
    ],
  },
  keep: [
    'src/modules/cards/config.ts',
    'src/modules/cards/schema.ts',
    'src/modules/cards/types.ts',
    'src/modules/cards/services/*',
    'src/modules/cards/ui/*',
    'src/lib/data/cards.ts',
    'src/app/actions/cards.ts',
    'src/hooks/useCardSettings.ts',
    'src/app/[locale]/cards/page.tsx',
    'src/app/[locale]/cards/_components/CardsPageClient.tsx',
    'src/app/[locale]/cards/settings/page.tsx',
    'src/app/[locale]/cards/settings/_components/CardSettingsPageClient.tsx',
  ],
  legacy: [
    {
      path: 'src/hooks/useCardSettings.ts',
      status: 'legacy',
      replacement: '已保留为 action-backed wrapper，不再依赖 /api/cards/settings',
    },
    {
      path: 'src/app/api/cards/settings/route.ts',
      status: 'legacy',
      replacement:
        '内部设置页已切换到 cards actions；Route Handler 仅保留外部 HTTP compatibility surface',
    },
  ],
  migrationSteps: [
    '先把 cards/page.tsx 迁移为 server page + client shell',
    '把 cards/settings 页面迁移为 server page + client shell',
    '把 useCardSettings 改成 action-backed hook，移除内部 /api/cards/settings 依赖',
    '建立 src/modules/cards/blueprint.ts 作为第二个可复制模块样板',
    '建立 src/lib/data/cards.ts 作为 cards 模块唯一 DAL',
    '把 page.tsx、overview、sold、detail 等页面全部对齐到 canonical cards actions',
    '删除 card-actions.ts / card-stats.ts / card-overview-data.ts 这些迁移剩余文件',
  ],
});
