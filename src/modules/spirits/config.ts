/**
 * Spirits Module Configuration
 *
 * Configuration for the spirits (fine alcohol collection) management module.
 */

import { ModuleDefinition } from '../types';
import { spiritAttributesSchema, type SpiritItem } from './schema';
import { SpiritCard } from './ui/SpiritCard';
import { SpiritDetail } from './ui/SpiritDetail';

export const spiritModule: ModuleDefinition<SpiritItem> = {
  id: 'spirits',
  name: '藏酒管理',
  description: '管理珍藏烈酒、葡萄酒和其他酒类收藏',
  icon: 'Wine',
  color: '#722F37',

  attributesSchema: spiritAttributesSchema,

  CardComponent: SpiritCard,
  DetailComponent: SpiritDetail,

  formFields: [
    {
      name: 'itemNumber',
      label: '物品编号',
      type: 'number',
      description: '自动生成的唯一编号',
      required: false,
    },
    {
      name: 'name',
      label: '名称',
      type: 'text',
      placeholder: '例如：Macallan 18 Year Old',
      required: true,
      description: '酒品的名称',
    },
    {
      name: 'spiritType',
      label: '酒类',
      type: 'select',
      required: true,
      options: [
        { label: '威士忌', value: 'WHISKY' },
        { label: '干邑', value: 'COGNAC' },
        { label: '白兰地', value: 'BRANDY' },
        { label: '朗姆酒', value: 'RUM' },
        { label: '伏特加', value: 'VODKA' },
        { label: '金酒', value: 'GIN' },
        { label: '龙舌兰', value: 'TEQUILA' },
        { label: '白酒', value: 'BAIJIU' },
        { label: '葡萄酒', value: 'WINE' },
        { label: '其他', value: 'OTHER' },
      ],
      description: '酒的类型',
    },
    {
      name: 'subType',
      label: '子类型/香型',
      type: 'text',
      placeholder: '例如：干红、小甜水、桃红、酱香型、浓香型',
      required: false,
      description: '葡萄酒分类、白酒香型或特色细分',
    },
    {
      name: 'brand',
      label: '品牌',
      type: 'text',
      placeholder: '例如：Macallan, 五粮液, 泸州老窖',
      required: false,
      description: '酒品牌',
    },
    {
      name: 'model',
      label: '型号/酒款名',
      type: 'text',
      placeholder: '例如：普五、特曲、国窖1573、奥仙奴12、黄牌',
      required: false,
      description: '具体型号、系列或酒款名称',
    },
    {
      name: 'distillery',
      label: '酒厂/酒庄',
      type: 'text',
      placeholder: '例如：The Macallan Distillery',
      required: false,
      description: '生产酒厂或酒庄',
    },
    {
      name: 'region',
      label: '产区',
      type: 'text',
      placeholder: '例如：Speyside, Cognac',
      required: false,
      description: '产地区域',
    },
    {
      name: 'country',
      label: '国家',
      type: 'text',
      placeholder: '例如：Scotland, France',
      required: false,
      description: '生产国家',
    },
    {
      name: 'vintage',
      label: '年份',
      type: 'number',
      placeholder: '例如：2005',
      required: false,
      description: '酿造年份',
    },
    {
      name: 'age',
      label: '陈年（年）',
      type: 'number',
      placeholder: '例如：18',
      required: false,
      description: '陈年时间（年）',
    },
    {
      name: 'abv',
      label: '酒精度（%）',
      type: 'number',
      placeholder: '例如：43.0',
      required: false,
      description: '酒精度百分比',
    },
    {
      name: 'volumeMl',
      label: '容量（毫升）',
      type: 'number',
      placeholder: '例如：700',
      required: false,
      description: '瓶装容量',
    },
    {
      name: 'bottleNumber',
      label: '瓶号',
      type: 'text',
      placeholder: '例如：123/500',
      required: false,
      description: '限量版瓶号',
    },
    {
      name: 'limitedEdition',
      label: '限量版',
      type: 'select',
      options: [
        { label: '是', value: 'true' },
        { label: '否', value: 'false' },
      ],
      required: false,
      description: '是否为限量版',
    },
    {
      name: 'caskType',
      label: '桶型',
      type: 'text',
      placeholder: '例如：Sherry Oak, Bourbon',
      required: false,
      description: '陈酿使用的橡木桶类型',
    },
    {
      name: 'bottlingDate',
      label: '装瓶日期',
      type: 'date',
      required: false,
      description: '装瓶日期',
    },
    {
      name: 'acquiredDate',
      label: '获得日期',
      type: 'date',
      required: false,
      description: '获得或购买日期',
    },
    {
      name: 'acquiredFrom',
      label: '购买渠道/供应商',
      type: 'text',
      placeholder: '例如：京东、中粮名庄荟、酒仙网、专卖店',
      required: false,
      description: '购买或获得藏酒的渠道或店铺',
    },
    {
      name: 'purchasePrice',
      label: '购买价格',
      type: 'number',
      placeholder: '例如：2500',
      required: false,
      description: '购买时的价格',
    },
    {
      name: 'currentValue',
      label: '当前价值',
      type: 'number',
      placeholder: '例如：3500',
      required: false,
      description: '当前市场价值',
    },
    {
      name: 'estimatedValue',
      label: '估值',
      type: 'number',
      placeholder: '例如：4000',
      required: false,
      description: '专业估值',
    },
    {
      name: 'status',
      label: '状态',
      type: 'select',
      required: true,
      options: [
        { label: '收藏中', value: 'COLLECTION' },
        { label: '陈化中', value: 'AGING' },
        { label: '待售', value: 'FOR_SALE' },
        { label: '已售出', value: 'SOLD' },
        { label: '已开瓶', value: 'OPENED' },
        { label: '已饮完', value: 'EMPTY' },
      ],
      description: '酒的状态',
    },
    {
      name: 'bottleStatus',
      label: '瓶身状态',
      type: 'select',
      required: true,
      options: [
        { label: '未开封', value: 'SEALED' },
        { label: '已开封', value: 'OPENED' },
        { label: '已空', value: 'EMPTY' },
      ],
      description: '瓶身封装状态',
    },
    {
      name: 'storageCondition',
      label: '储存条件',
      type: 'textarea',
      placeholder: '例如：恒温18-20°C，避光，湿度60%',
      required: false,
      description: '储存环境和条件',
    },
    {
      name: 'location',
      label: '存放位置',
      type: 'text',
      placeholder: '例如：酒柜A区第2层',
      required: false,
      description: '具体存放位置',
    },
    {
      name: 'tastingNotes',
      label: '品鉴笔记',
      type: 'textarea',
      placeholder: '香气、口感、余韵等品鉴记录',
      required: false,
      description: '品鉴笔记和感受',
    },
    {
      name: 'notes',
      label: '备注',
      type: 'textarea',
      placeholder: '其他说明信息',
      required: false,
      description: '其他需要记录的信息',
    },
    {
      name: 'mainImage',
      label: '主图片',
      type: 'text',
      placeholder: '主图片URL',
      required: false,
      description: '酒品的主要展示图片',
    },
    {
      name: 'attachmentImages',
      label: '附加图片',
      type: 'textarea',
      placeholder: '多个图片URL，每行一个',
      required: false,
      description: '酒品的其他图片（细节图、标签图等）',
    },
  ],

  listColumns: [
    {
      key: 'itemNumber',
      label: '编号',
      render: value => `#${value}`,
    },
    {
      key: 'name',
      label: '名称',
    },
    {
      key: 'spiritType',
      label: '类型',
      render: value => {
        const typeMap: Record<string, string> = {
          WHISKY: '威士忌',
          COGNAC: '干邑',
          BRANDY: '白兰地',
          RUM: '朗姆酒',
          VODKA: '伏特加',
          GIN: '金酒',
          TEQUILA: '龙舌兰',
          BAIJIU: '白酒',
          WINE: '葡萄酒',
          OTHER: '其他',
        };
        return typeMap[value as string] || value;
      },
    },
    {
      key: 'brand',
      label: '品牌',
      render: value => value || '-',
    },
    {
      key: 'vintage',
      label: '年份',
      render: value => (value ? String(value) : '-'),
    },
    {
      key: 'age',
      label: '年份',
      render: value => (value ? `${value}年` : '-'),
    },
    {
      key: 'abv',
      label: 'ABV',
      render: value => (value ? `${value}%` : '-'),
    },
    {
      key: 'volumeMl',
      label: '容量',
      render: value => (value ? `${value}ml` : '-'),
    },
    {
      key: 'status',
      label: '状态',
      render: value => {
        const statusMap: Record<string, string> = {
          COLLECTION: '收藏中',
          AGING: '陈化中',
          FOR_SALE: '待售',
          SOLD: '已售出',
          OPENED: '已开瓶',
          EMPTY: '已饮完',
        };
        return statusMap[value as string] || value;
      },
    },
    {
      key: 'bottleStatus',
      label: '瓶身',
      render: value => {
        const statusMap: Record<string, string> = {
          SEALED: '未开封',
          OPENED: '已开封',
          EMPTY: '已空',
        };
        return statusMap[value as string] || value;
      },
    },
    {
      key: 'location',
      label: '位置',
      render: value => value || '-',
    },
    {
      key: 'mainImage',
      label: '图片',
      render: value => (value ? '✓' : '-'),
    },
  ],

  statsConfig: {
    metrics: [
      {
        key: 'total',
        label: '总数量',
        calculate: items => items.length,
      },
      {
        key: 'byStatus',
        label: '按状态统计',
        calculate: items => {
          const statusCounts: Record<string, number> = {};
          items.forEach(item => {
            const status = item.status || 'COLLECTION';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
          });
          return Object.entries(statusCounts)
            .map(([status, count]) => {
              const statusMap: Record<string, string> = {
                COLLECTION: '收藏',
                AGING: '陈化',
                FOR_SALE: '待售',
                SOLD: '已售',
                OPENED: '已开',
                EMPTY: '已空',
              };
              return `${statusMap[status] || status}:${count}`;
            })
            .join(' ');
        },
      },
      {
        key: 'byType',
        label: '按类型统计',
        calculate: items => {
          const typeCounts: Record<string, number> = {};
          items.forEach(item => {
            const type = item.spiritType;
            typeCounts[type] = (typeCounts[type] || 0) + 1;
          });
          const topTypes = Object.entries(typeCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([type, count]) => {
              const typeMap: Record<string, string> = {
                WHISKY: '威士忌',
                COGNAC: '干邑',
                BRANDY: '白兰地',
                RUM: '朗姆',
                VODKA: '伏特加',
                GIN: '金酒',
                TEQUILA: '龙舌兰',
                BAIJIU: '白酒',
                WINE: '葡萄酒',
                OTHER: '其他',
              };
              return `${typeMap[type] || type}:${count}`;
            })
            .join(' ');
          return topTypes || '无数据';
        },
      },
      {
        key: 'limitedEdition',
        label: '限量版',
        calculate: items => {
          const limited = items.filter(i => i.limitedEdition);
          return `${limited.length}/${items.length}`;
        },
      },
      {
        key: 'totalValue',
        label: '总估值',
        calculate: items => {
          const itemsWithValue = items.filter(i => i.currentValue || i.estimatedValue);
          if (itemsWithValue.length === 0) return '无数据';
          const total = itemsWithValue.reduce(
            (sum, i) => sum + Number(i.currentValue || i.estimatedValue || 0),
            0
          );
          return `¥${total.toLocaleString()}`;
        },
      },
      {
        key: 'avgAge',
        label: '平均陈年',
        calculate: items => {
          const itemsWithAge = items.filter(i => i.age);
          if (itemsWithAge.length === 0) return '无数据';
          const avg = itemsWithAge.reduce((sum, i) => sum + (i.age || 0), 0) / itemsWithAge.length;
          return `${avg.toFixed(1)}年`;
        },
      },
      {
        key: 'withImages',
        label: '有图片',
        calculate: items => {
          const withImages = items.filter(
            i => i.mainImage || (i.attachmentImages && i.attachmentImages.length > 0)
          );
          return `${withImages.length}/${items.length}`;
        },
      },
    ],
  },
};
