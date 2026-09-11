/**
 * Antiques Module Configuration
 *
 * Complete configuration for antique (文玩) management system.
 * Supports various categories (jade, wood, ceramic, metal, stone, paper),
 * appraisal tracking, and value management.
 *
 * Requirements: V3 API-first blueprint
 */

import { ModuleDefinition } from '../types';
import { antiqueAttributesSchema, type AntiqueItem } from './schema';
import { AntiqueCard } from './ui/AntiqueCard';
import { AntiqueDetail } from './ui/AntiqueDetail';

/**
 * Antiques module configuration
 */
export const antiqueModule: ModuleDefinition<AntiqueItem> = {
  id: 'antiques',
  name: '文玩管理',
  description: '管理古董文玩收藏，记录鉴定和估值信息',
  icon: 'Gem',
  color: '#8B4513',

  attributesSchema: antiqueAttributesSchema,

  CardComponent: AntiqueCard,
  DetailComponent: AntiqueDetail,

  // ============================================================================
  // FORM FIELDS
  // ============================================================================
  formFields: [
    // Display-only field for item number
    {
      name: 'itemNumber',
      label: '物品编号',
      type: 'number',
      description: '自动生成的唯一编号',
      required: false,
    },

    // Basic Information
    {
      name: 'name',
      label: '名称',
      type: 'text',
      placeholder: '例如：清代和田玉佩',
      required: true,
      description: '文玩的名称或描述',
    },
    {
      name: 'category',
      label: '类别',
      type: 'select',
      required: true,
      options: [
        { label: '玉器', value: 'JADE' },
        { label: '木器', value: 'WOOD' },
        { label: '陶瓷', value: 'CERAMIC' },
        { label: '金属', value: 'METAL' },
        { label: '石器', value: 'STONE' },
        { label: '纸品', value: 'PAPER' },
        { label: '其他', value: 'OTHER' },
      ],
      description: '文玩的主要类别',
    },
    {
      name: 'material',
      label: '材质',
      type: 'text',
      placeholder: '例如：和田白玉、紫檀木、青花瓷',
      required: false,
      description: '文玩的具体材质',
    },
    {
      name: 'era',
      label: '年代',
      type: 'text',
      placeholder: '例如：清代、民国、现代',
      required: false,
      description: '文玩的制作年代或时期',
    },
    {
      name: 'dynasty',
      label: '朝代',
      type: 'text',
      placeholder: '例如：清朝、明朝',
      required: false,
      description: '文玩所属朝代（如适用）',
    },

    // Dimensions
    {
      name: 'lengthCm',
      label: '长度（厘米）',
      type: 'number',
      placeholder: '例如：10.5',
      required: false,
      description: '文玩的长度',
    },
    {
      name: 'widthCm',
      label: '宽度（厘米）',
      type: 'number',
      placeholder: '例如：5.2',
      required: false,
      description: '文玩的宽度',
    },
    {
      name: 'heightCm',
      label: '高度（厘米）',
      type: 'number',
      placeholder: '例如：3.8',
      required: false,
      description: '文玩的高度',
    },
    {
      name: 'weightG',
      label: '重量（克）',
      type: 'number',
      placeholder: '例如：125.5',
      required: false,
      description: '文玩的重量',
    },

    // Condition and Certification
    {
      name: 'condition',
      label: '品相',
      type: 'textarea',
      placeholder: '例如：完整无损，包浆自然，有轻微使用痕迹',
      required: false,
      description: '文玩的保存状态和品相描述',
    },
    {
      name: 'certificate',
      label: '证书',
      type: 'text',
      placeholder: '例如：国家珠宝玉石质量监督检验中心证书',
      required: false,
      description: '鉴定证书信息',
    },
    {
      name: 'appraisalDate',
      label: '鉴定日期',
      type: 'date',
      required: false,
      description: '鉴定或评估的日期',
    },
    {
      name: 'appraisalBy',
      label: '鉴定机构/专家',
      type: 'text',
      placeholder: '例如：故宫博物院专家',
      required: false,
      description: '进行鉴定的机构或专家',
    },

    // Value Information
    {
      name: 'purchasePrice',
      label: '购入价格（元）',
      type: 'number',
      placeholder: '例如：50000',
      required: false,
      description: '购买时的价格',
    },
    {
      name: 'acquiredFrom',
      label: '来源',
      type: 'text',
      placeholder: '例如：拍卖行、古玩市场、赠送',
      required: false,
      description: '文玩的获得来源',
    },
    {
      name: 'acquiredDate',
      label: '获得日期',
      type: 'date',
      required: false,
      description: '购买或获得文玩的日期',
    },
    {
      name: 'currentValue',
      label: '当前价值（元）',
      type: 'number',
      placeholder: '例如：80000',
      required: false,
      description: '当前市场价值估计',
    },
    {
      name: 'estimatedValue',
      label: '估值（元）',
      type: 'number',
      placeholder: '例如：100000',
      required: false,
      description: '专业评估价值',
    },

    // Status and Location
    {
      name: 'status',
      label: '状态',
      type: 'select',
      required: true,
      options: [
        { label: '收藏中', value: 'COLLECTION' },
        { label: '待售', value: 'FOR_SALE' },
        { label: '已售出', value: 'SOLD' },
        { label: '展示中', value: 'DISPLAY' },
        { label: '鉴定中', value: 'APPRAISAL' },
      ],
      description: '文玩的当前状态',
    },
    {
      name: 'location',
      label: '存放位置',
      type: 'text',
      placeholder: '例如：书房展柜、保险柜',
      required: false,
      description: '文玩的存放位置',
    },

    // Notes
    {
      name: 'notes',
      label: '备注',
      type: 'textarea',
      placeholder: '其他说明信息',
      required: false,
      description: '其他需要记录的信息',
    },

    // Images
    {
      name: 'mainImage',
      label: '主图片',
      type: 'text',
      placeholder: '主图片URL',
      required: false,
      description: '文玩的主要展示图片',
    },
    {
      name: 'attachmentImages',
      label: '附加图片',
      type: 'textarea',
      placeholder: '多个图片URL，每行一个',
      required: false,
      description: '文玩的其他图片（细节图等）',
    },
  ],

  // ============================================================================
  // LIST COLUMNS
  // ============================================================================
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
      key: 'category',
      label: '类别',
      render: value => {
        const categoryMap: Record<string, string> = {
          JADE: '玉器',
          WOOD: '木器',
          CERAMIC: '陶瓷',
          METAL: '金属',
          STONE: '石器',
          PAPER: '纸品',
          OTHER: '其他',
        };
        return categoryMap[value as string] || value;
      },
    },
    {
      key: 'material',
      label: '材质',
      render: value => value || '-',
    },
    {
      key: 'era',
      label: '年代',
      render: value => value || '-',
    },
    {
      key: 'dynasty',
      label: '朝代',
      render: value => value || '-',
    },
    {
      key: 'currentValue',
      label: '当前价值',
      render: value => {
        if (!value) return '-';
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        return `¥${numValue.toLocaleString()}`;
      },
    },
    {
      key: 'status',
      label: '状态',
      render: value => {
        const statusMap: Record<string, string> = {
          COLLECTION: '收藏中',
          FOR_SALE: '待售',
          SOLD: '已售出',
          DISPLAY: '展示中',
          APPRAISAL: '鉴定中',
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

  // ============================================================================
  // STATISTICS
  // ============================================================================
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
          const statusCounts = {
            COLLECTION: 0,
            FOR_SALE: 0,
            SOLD: 0,
            DISPLAY: 0,
            APPRAISAL: 0,
          };
          items.forEach(item => {
            const status = item.status || 'COLLECTION';
            if (status in statusCounts) {
              statusCounts[status as keyof typeof statusCounts]++;
            }
          });
          return `收藏:${statusCounts.COLLECTION} 待售:${statusCounts.FOR_SALE} 已售:${statusCounts.SOLD} 展示:${statusCounts.DISPLAY} 鉴定:${statusCounts.APPRAISAL}`;
        },
      },
      {
        key: 'byCategory',
        label: '按类别统计',
        calculate: items => {
          const categoryCounts: Record<string, number> = {};
          items.forEach(item => {
            const category = item.category || 'OTHER';
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
          });
          const categoryMap: Record<string, string> = {
            JADE: '玉器',
            WOOD: '木器',
            CERAMIC: '陶瓷',
            METAL: '金属',
            STONE: '石器',
            PAPER: '纸品',
            OTHER: '其他',
          };
          return Object.entries(categoryCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([cat, count]) => `${categoryMap[cat] || cat}:${count}`)
            .join(' ');
        },
      },
      {
        key: 'totalValue',
        label: '总价值',
        calculate: items => {
          const itemsWithValue = items.filter(i => i.currentValue);
          if (itemsWithValue.length === 0) return '无数据';
          const sum = itemsWithValue.reduce((acc, i) => {
            const value =
              typeof i.currentValue === 'string' ? parseFloat(i.currentValue) : i.currentValue;
            return acc + (value || 0);
          }, 0);
          return `¥${sum.toLocaleString()}`;
        },
      },
      {
        key: 'avgValue',
        label: '平均价值',
        calculate: items => {
          const itemsWithValue = items.filter(i => i.currentValue);
          if (itemsWithValue.length === 0) return '无数据';
          const sum = itemsWithValue.reduce((acc, i) => {
            const value =
              typeof i.currentValue === 'string' ? parseFloat(i.currentValue) : i.currentValue;
            return acc + (value || 0);
          }, 0);
          return `¥${(sum / itemsWithValue.length).toLocaleString()}`;
        },
      },
      {
        key: 'withCertificate',
        label: '有证书',
        calculate: items => {
          const withCert = items.filter(i => i.certificate);
          return `${withCert.length}/${items.length}`;
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
