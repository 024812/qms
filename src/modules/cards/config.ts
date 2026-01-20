/**
 * Sports Card Module Configuration
 *
 * Comprehensive configuration for managing sports card collections.
 * Supports multiple sports, grading systems, and value tracking.
 *
 * Requirements: 5.1, 5.2
 */

import { ModuleDefinition } from '../types';
import { cardAttributesSchema } from './schema';
import { CardCard } from './ui/CardCard';
import { CardDetail } from './ui/CardDetail';

/**
 * Sports Card module configuration
 *
 * This configuration defines all fields for sports card management:
 * - Player information (name, sport, team, position)
 * - Card details (year, brand, series, card number)
 * - Grading information (company, grade, certification)
 * - Value tracking (purchase price, current value, estimated value)
 * - Physical details (parallel, serial number, autograph, memorabilia)
 * - Storage and condition
 */
export const cardModule: ModuleDefinition = {
  id: 'cards',
  name: '球星卡管理',
  description: '管理体育球星卡收藏，追踪价值和评级信息',
  icon: 'CreditCard',
  color: 'purple',

  attributesSchema: cardAttributesSchema,

  // Card component for list view
  CardComponent: CardCard,

  // Detail component for detail view
  DetailComponent: CardDetail,

  // ============================================================================
  // COMPREHENSIVE FORM FIELDS
  // ============================================================================
  formFields: [
    // Player Information Section
    {
      name: 'playerName',
      label: '球员姓名',
      type: 'text',
      placeholder: '例如：Michael Jordan',
      required: true,
      description: '球星卡上的球员姓名',
    },
    {
      name: 'sport',
      label: '运动类型',
      type: 'select',
      required: true,
      options: [
        { label: '篮球', value: 'BASKETBALL' },
        { label: '足球', value: 'SOCCER' },
        { label: '其他', value: 'OTHER' },
      ],
      description: '球星卡所属的运动类型',
    },
    {
      name: 'team',
      label: '球队',
      type: 'text',
      placeholder: '例如：Chicago Bulls',
      required: false,
      description: '球员所属球队',
    },
    {
      name: 'position',
      label: '位置',
      type: 'text',
      placeholder: '例如：SG (得分后卫)',
      required: false,
      description: '球员场上位置',
    },

    // Card Details Section
    {
      name: 'year',
      label: '年份',
      type: 'number',
      placeholder: '例如：1986',
      required: true,
      description: '球星卡发行年份',
    },
    {
      name: 'brand',
      label: '品牌',
      type: 'text',
      placeholder: '例如：Fleer, Topps, Panini',
      required: true,
      description: '球星卡制造商/品牌',
    },
    {
      name: 'series',
      label: '系列',
      type: 'text',
      placeholder: '例如：Rookie Card, Chrome',
      required: false,
      description: '球星卡所属系列',
    },
    {
      name: 'cardNumber',
      label: '卡号',
      type: 'text',
      placeholder: '例如：57, RC-1',
      required: false,
      description: '球星卡编号',
    },

    // Grading Information Section
    {
      name: 'gradingCompany',
      label: '评级公司',
      type: 'select',
      required: false,
      options: [
        { label: '未评级', value: 'UNGRADED' },
        { label: 'PSA', value: 'PSA' },
        { label: 'BGS (Beckett)', value: 'BGS' },
        { label: 'SGC', value: 'SGC' },
        { label: 'CGC', value: 'CGC' },
      ],
      description: '评级公司',
    },
    {
      name: 'grade',
      label: '评级分数',
      type: 'number',
      placeholder: '例如：9.5',
      required: false,
      description: '评级分数 (1-10)',
    },
    {
      name: 'certificationNumber',
      label: '认证编号',
      type: 'text',
      placeholder: '例如：12345678',
      required: false,
      description: '评级公司的认证编号',
    },

    // Value Information Section
    {
      name: 'purchasePrice',
      label: '购买价格 ($)',
      type: 'number',
      placeholder: '例如：100.00',
      required: false,
      description: '购买时的价格（美元）',
    },
    {
      name: 'purchaseDate',
      label: '购买日期',
      type: 'date',
      required: false,
      description: '购买球星卡的日期',
    },
    {
      name: 'currentValue',
      label: '当前价值 ($)',
      type: 'number',
      placeholder: '例如：500.00',
      required: false,
      description: '当前市场价值（美元）',
    },
    {
      name: 'estimatedValue',
      label: '估计价值 ($)',
      type: 'number',
      placeholder: '例如：550.00',
      required: false,
      description: '估计的市场价值（美元）',
    },

    // Physical Details Section
    {
      name: 'parallel',
      label: '平行版本',
      type: 'text',
      placeholder: '例如：Refractor, Gold',
      required: false,
      description: '特殊平行版本或变体',
    },
    {
      name: 'serialNumber',
      label: '序列号',
      type: 'text',
      placeholder: '例如：25/99',
      required: false,
      description: '限量版序列号',
    },
    {
      name: 'isAutographed',
      label: '是否有签名',
      type: 'select',
      required: false,
      options: [
        { label: '否', value: 'false' },
        { label: '是', value: 'true' },
      ],
      description: '球星卡是否包含球员签名',
    },
    {
      name: 'hasMemorabilia',
      label: '是否有实物',
      type: 'select',
      required: false,
      options: [
        { label: '否', value: 'false' },
        { label: '是', value: 'true' },
      ],
      description: '球星卡是否包含球衣/球鞋等实物',
    },
    {
      name: 'memorabiliaType',
      label: '实物类型',
      type: 'text',
      placeholder: '例如：Jersey, Patch, Shoe',
      required: false,
      description: '实物的类型（如球衣、球鞋等）',
    },

    // Storage and Condition Section
    {
      name: 'status',
      label: '状态',
      type: 'select',
      required: false,
      options: [
        { label: '收藏中', value: 'COLLECTION' },
        { label: '待售', value: 'FOR_SALE' },
        { label: '已售出', value: 'SOLD' },
        { label: '评级中', value: 'GRADING' },
        { label: '展示中', value: 'DISPLAY' },
      ],
      description: '球星卡当前状态',
    },
    {
      name: 'location',
      label: '存放位置',
      type: 'text',
      placeholder: '例如：保险柜、展示柜',
      required: false,
      description: '球星卡的存放位置',
    },
    {
      name: 'storageType',
      label: '存储方式',
      type: 'text',
      placeholder: '例如：卡盒、卡册、评级盒',
      required: false,
      description: '球星卡的存储方式',
    },
    {
      name: 'condition',
      label: '品相描述',
      type: 'textarea',
      placeholder: '描述球星卡的品相状况',
      required: false,
      description: '球星卡的品相和状况描述',
    },

    // Additional Information
    {
      name: 'notes',
      label: '备注',
      type: 'textarea',
      placeholder: '其他说明信息',
      required: false,
      description: '其他需要记录的信息',
    },
    {
      name: 'tags',
      label: '标签',
      type: 'text',
      placeholder: '例如：新秀卡, 投资级, 个人收藏',
      required: false,
      description: '用于分类的标签（逗号分隔）',
    },
  ],

  // ============================================================================
  // LIST COLUMNS - Show key information in list view
  // ============================================================================
  listColumns: [
    {
      key: 'itemNumber',
      label: '编号',
      render: value => `#${value}`,
    },
    {
      key: 'playerName',
      label: '球员',
    },
    {
      key: 'year',
      label: '年份',
    },
    {
      key: 'brand',
      label: '品牌',
    },
    {
      key: 'sport',
      label: '运动',
      render: value => {
        const sportMap: Record<string, string> = {
          BASKETBALL: '篮球',
          SOCCER: '足球',
          OTHER: '其他',
        };
        return sportMap[value as string] || value;
      },
    },
    {
      key: 'gradingCompany',
      label: '评级',
      render: (value, item) => {
        if (value === 'UNGRADED') return '未评级';
        const grade = item.grade ? ` ${item.grade}` : '';
        return `${value}${grade}`;
      },
    },
    {
      key: 'currentValue',
      label: '当前价值',
      render: value => {
        if (!value) return '-';
        return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      },
    },
    {
      key: 'isAutographed',
      label: '签名',
      render: value => (value ? '✓' : '-'),
    },
    {
      key: 'hasMemorabilia',
      label: '实物',
      render: value => (value ? '✓' : '-'),
    },
    {
      key: 'status',
      label: '状态',
      render: value => {
        const statusMap: Record<string, string> = {
          COLLECTION: '收藏中',
          FOR_SALE: '待售',
          SOLD: '已售出',
          GRADING: '评级中',
          DISPLAY: '展示中',
        };
        return statusMap[value as string] || value;
      },
    },
  ],

  // ============================================================================
  // COMPREHENSIVE STATISTICS
  // ============================================================================
  statsConfig: {
    metrics: [
      // Count metrics
      {
        key: 'total',
        label: '总数量',
        calculate: items => items.length,
      },
      {
        key: 'bySport',
        label: '按运动分类',
        calculate: items => {
          const sportCounts: Record<string, number> = {};
          items.forEach(item => {
            const sport = item.sport || 'OTHER';
            sportCounts[sport] = (sportCounts[sport] || 0) + 1;
          });
          const sportMap: Record<string, string> = {
            BASKETBALL: '篮球',
            SOCCER: '足球',
            OTHER: '其他',
          };
          return Object.entries(sportCounts)
            .map(([sport, count]) => `${sportMap[sport] || sport}:${count}`)
            .join(' ');
        },
      },
      {
        key: 'byStatus',
        label: '按状态统计',
        calculate: items => {
          const statusCounts: Record<string, number> = {
            COLLECTION: 0,
            FOR_SALE: 0,
            SOLD: 0,
            GRADING: 0,
            DISPLAY: 0,
          };
          items.forEach(item => {
            const status = item.status || 'COLLECTION';
            if (status in statusCounts) {
              statusCounts[status as keyof typeof statusCounts]++;
            }
          });
          return `收藏:${statusCounts.COLLECTION} 待售:${statusCounts.FOR_SALE} 已售:${statusCounts.SOLD}`;
        },
      },

      // Grading statistics
      {
        key: 'graded',
        label: '已评级',
        calculate: items => {
          const graded = items.filter(i => i.gradingCompany && i.gradingCompany !== 'UNGRADED');
          return `${graded.length}/${items.length}`;
        },
      },
      {
        key: 'avgGrade',
        label: '平均评级',
        calculate: items => {
          const gradedItems = items.filter(
            i => i.gradingCompany && i.gradingCompany !== 'UNGRADED' && i.grade
          );
          if (gradedItems.length === 0) return '无数据';
          const sum = gradedItems.reduce((acc, i) => acc + (i.grade || 0), 0);
          return (sum / gradedItems.length).toFixed(2);
        },
      },

      // Value statistics
      {
        key: 'totalValue',
        label: '总价值',
        calculate: items => {
          const itemsWithValue = items.filter(i => i.currentValue);
          if (itemsWithValue.length === 0) return '无数据';
          const sum = itemsWithValue.reduce((acc, i) => acc + (i.currentValue || 0), 0);
          return `$${sum.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        },
      },
      {
        key: 'avgValue',
        label: '平均价值',
        calculate: items => {
          const itemsWithValue = items.filter(i => i.currentValue);
          if (itemsWithValue.length === 0) return '无数据';
          const sum = itemsWithValue.reduce((acc, i) => acc + (i.currentValue || 0), 0);
          return `$${(sum / itemsWithValue.length).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        },
      },
      {
        key: 'totalInvestment',
        label: '总投资',
        calculate: items => {
          const itemsWithPrice = items.filter(i => i.purchasePrice);
          if (itemsWithPrice.length === 0) return '无数据';
          const sum = itemsWithPrice.reduce((acc, i) => acc + (i.purchasePrice || 0), 0);
          return `$${sum.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        },
      },
      {
        key: 'roi',
        label: '投资回报率',
        calculate: items => {
          const itemsWithBoth = items.filter(i => i.purchasePrice && i.currentValue);
          if (itemsWithBoth.length === 0) return '无数据';
          const totalInvestment = itemsWithBoth.reduce((acc, i) => acc + (i.purchasePrice || 0), 0);
          const totalValue = itemsWithBoth.reduce((acc, i) => acc + (i.currentValue || 0), 0);
          if (totalInvestment === 0) return '无数据';
          const roi = ((totalValue - totalInvestment) / totalInvestment) * 100;
          return `${roi > 0 ? '+' : ''}${roi.toFixed(2)}%`;
        },
      },

      // Special features
      {
        key: 'autographed',
        label: '签名卡',
        calculate: items => {
          const autographed = items.filter(i => i.isAutographed);
          return `${autographed.length}/${items.length}`;
        },
      },
      {
        key: 'memorabilia',
        label: '实物卡',
        calculate: items => {
          const memorabilia = items.filter(i => i.hasMemorabilia);
          return `${memorabilia.length}/${items.length}`;
        },
      },

      // Brand distribution
      {
        key: 'topBrands',
        label: '主要品牌',
        calculate: items => {
          const brands: Record<string, number> = {};
          items.forEach(item => {
            const brand = item.brand || '未知';
            brands[brand] = (brands[brand] || 0) + 1;
          });
          const topBrands = Object.entries(brands)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([brand, count]) => `${brand}:${count}`)
            .join(' ');
          return topBrands || '无数据';
        },
      },
    ],
  },
};
