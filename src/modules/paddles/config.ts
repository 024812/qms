/**
 * Paddles Module Configuration
 *
 * Configuration for the table tennis paddle management module.
 * Supports blade characteristics, rubber configurations, and performance tracking.
 */

import { ModuleDefinition } from '../types';
import { paddleAttributesSchema, type PaddleItem } from './schema';
import { PaddleCard } from './ui/PaddleCard';
import { PaddleDetail } from './ui/PaddleDetail';

/**
 * Paddles module configuration
 */
export const paddleModule: ModuleDefinition<PaddleItem> = {
  id: 'paddles',
  name: '乒乓球底板管理',
  description: '管理乒乓球底板收藏，记录配置和性能信息',
  icon: 'Disc3',
  color: '#FF6B35',

  attributesSchema: paddleAttributesSchema,

  // Card component for list view
  CardComponent: PaddleCard,

  // Detail component for detail view
  DetailComponent: PaddleDetail,

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
      placeholder: '例如：蝴蝶王',
      required: true,
      description: '底板的名称或描述',
    },
    {
      name: 'bladeBrand',
      label: '底板品牌',
      type: 'text',
      placeholder: '例如：蝴蝶、斯帝卡、红双喜',
      required: false,
      description: '底板的品牌',
    },
    {
      name: 'bladeModel',
      label: '底板型号',
      type: 'text',
      placeholder: '例如：VISCARIA、张继科ALC',
      required: false,
      description: '底板的具体型号',
    },

    // Physical Characteristics
    {
      name: 'bladeWeightG',
      label: '底板重量（克）',
      type: 'number',
      placeholder: '例如：85',
      required: false,
      description: '底板重量，单位：克（通常在70-100克之间）',
    },
    {
      name: 'handleType',
      label: '握拍方式',
      type: 'select',
      required: false,
      options: [
        { label: 'FL（横拍）', value: 'FL' },
        { label: 'ST（直拍）', value: 'ST' },
        { label: 'CS（中国式直拍）', value: 'CS' },
        { label: 'AN（解剖握拍）', value: 'AN' },
      ],
      description: '底板的握拍方式',
    },

    // Rubber Configuration
    {
      name: 'forehandRubber',
      label: '正手胶皮',
      type: 'text',
      placeholder: '例如：天极3、狂飙3',
      required: false,
      description: '正手使用的胶皮型号',
    },
    {
      name: 'backhandRubber',
      label: '反手胶皮',
      type: 'text',
      placeholder: '例如：多尼克F1、骄猛唯佳',
      required: false,
      description: '反手使用的胶皮型号',
    },
    {
      name: 'rubberThicknessMm',
      label: '海绵厚度（毫米）',
      type: 'number',
      placeholder: '例如：2.1',
      required: false,
      description: '胶皮海绵厚度，单位：毫米（通常在1.5-2.5mm之间）',
    },

    // Performance Ratings
    {
      name: 'bladeSpeed',
      label: '速度评分（1-10）',
      type: 'number',
      placeholder: '例如：8',
      required: false,
      description: '底板速度评分，1为最慢，10为最快',
    },
    {
      name: 'bladeControl',
      label: '控制评分（1-10）',
      type: 'number',
      placeholder: '例如：7',
      required: false,
      description: '底板控制评分，1为最低，10为最高',
    },

    // Purchase and Value
    {
      name: 'purchaseDate',
      label: '购买日期',
      type: 'date',
      required: false,
      description: '购买底板的日期',
    },
    {
      name: 'purchasePrice',
      label: '购买价格（元）',
      type: 'number',
      placeholder: '例如：800',
      required: false,
      description: '底板的购买价格',
    },
    {
      name: 'currentValue',
      label: '当前估值（元）',
      type: 'number',
      placeholder: '例如：600',
      required: false,
      description: '底板的当前市场估值',
    },

    // Status and Condition
    {
      name: 'status',
      label: '状态',
      type: 'select',
      required: true,
      options: [
        { label: '使用中', value: 'ACTIVE' },
        { label: '已退役', value: 'RETIRED' },
        { label: '待售', value: 'FOR_SALE' },
        { label: '已售出', value: 'SOLD' },
        { label: '展示', value: 'DISPLAY' },
      ],
      description: '底板的当前状态',
    },
    {
      name: 'condition',
      label: '状况',
      type: 'text',
      placeholder: '例如：良好、轻微磨损',
      required: false,
      description: '底板的物理状况描述',
    },
    {
      name: 'location',
      label: '存放位置',
      type: 'text',
      placeholder: '例如：球包、储物柜',
      required: false,
      description: '底板当前的存放位置',
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

    // Image Management
    {
      name: 'mainImage',
      label: '主图片',
      type: 'text',
      placeholder: '主图片URL',
      required: false,
      description: '底板的主要展示图片',
    },
    {
      name: 'attachmentImages',
      label: '附加图片',
      type: 'textarea',
      placeholder: '多个图片URL，每行一个',
      required: false,
      description: '底板的其他图片（细节图、配置图等）',
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
      key: 'bladeBrand',
      label: '品牌',
      render: value => value || '-',
    },
    {
      key: 'bladeModel',
      label: '型号',
      render: value => value || '-',
    },
    {
      key: 'bladeWeightG',
      label: '重量',
      render: value => (value ? `${value}g` : '-'),
    },
    {
      key: 'handleType',
      label: '握拍',
      render: value => {
        const handleMap: Record<string, string> = {
          FL: '横拍',
          ST: '直拍',
          CS: '中式直拍',
          AN: '解剖',
        };
        return value ? handleMap[value as string] || value : '-';
      },
    },
    {
      key: 'forehandRubber',
      label: '正手胶皮',
      render: value => value || '-',
    },
    {
      key: 'backhandRubber',
      label: '反手胶皮',
      render: value => value || '-',
    },
    {
      key: 'bladeSpeed',
      label: '速度',
      render: value => (value ? `${value}/10` : '-'),
    },
    {
      key: 'bladeControl',
      label: '控制',
      render: value => (value ? `${value}/10` : '-'),
    },
    {
      key: 'status',
      label: '状态',
      render: value => {
        const statusMap: Record<string, string> = {
          ACTIVE: '使用中',
          RETIRED: '已退役',
          FOR_SALE: '待售',
          SOLD: '已售出',
          DISPLAY: '展示',
        };
        return statusMap[value as string] || value;
      },
    },
    {
      key: 'location',
      label: '位置',
      render: value => value || '-',
    },
  ],

  // ============================================================================
  // STATISTICS
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
        key: 'byStatus',
        label: '按状态统计',
        calculate: items => {
          const statusCounts = {
            ACTIVE: 0,
            RETIRED: 0,
            FOR_SALE: 0,
            SOLD: 0,
            DISPLAY: 0,
          };
          items.forEach(item => {
            const status = item.status || 'ACTIVE';
            if (status in statusCounts) {
              statusCounts[status as keyof typeof statusCounts]++;
            }
          });
          return `使用:${statusCounts.ACTIVE} 退役:${statusCounts.RETIRED} 待售:${statusCounts.FOR_SALE} 已售:${statusCounts.SOLD} 展示:${statusCounts.DISPLAY}`;
        },
      },

      // Average metrics
      {
        key: 'avgSpeed',
        label: '平均速度',
        calculate: items => {
          const itemsWithSpeed = items.filter(i => i.bladeSpeed);
          if (itemsWithSpeed.length === 0) return '无数据';
          const sum = itemsWithSpeed.reduce((acc, i) => acc + (i.bladeSpeed || 0), 0);
          return `${(sum / itemsWithSpeed.length).toFixed(1)}/10`;
        },
      },
      {
        key: 'avgControl',
        label: '平均控制',
        calculate: items => {
          const itemsWithControl = items.filter(i => i.bladeControl);
          if (itemsWithControl.length === 0) return '无数据';
          const sum = itemsWithControl.reduce((acc, i) => acc + (i.bladeControl || 0), 0);
          return `${(sum / itemsWithControl.length).toFixed(1)}/10`;
        },
      },
      {
        key: 'avgWeight',
        label: '平均重量',
        calculate: items => {
          const itemsWithWeight = items.filter(i => i.bladeWeightG);
          if (itemsWithWeight.length === 0) return '无数据';
          const sum = itemsWithWeight.reduce((acc, i) => acc + (i.bladeWeightG || 0), 0);
          return `${(sum / itemsWithWeight.length).toFixed(1)}g`;
        },
      },

      // Brand distribution
      {
        key: 'brandDistribution',
        label: '品牌分布',
        calculate: items => {
          const brands: Record<string, number> = {};
          items.forEach(item => {
            const brand = item.bladeBrand || '未知品牌';
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

      // Handle type distribution
      {
        key: 'handleDistribution',
        label: '握拍分布',
        calculate: items => {
          const handles: Record<string, number> = {};
          items.forEach(item => {
            const handle = item.handleType || '未知';
            handles[handle] = (handles[handle] || 0) + 1;
          });
          const handleMap: Record<string, string> = {
            FL: '横拍',
            ST: '直拍',
            CS: '中式',
            AN: '解剖',
          };
          return (
            Object.entries(handles)
              .map(([handle, count]) => `${handleMap[handle] || handle}:${count}`)
              .join(' ') || '无数据'
          );
        },
      },

      // Value metrics
      {
        key: 'totalValue',
        label: '总估值',
        calculate: items => {
          const itemsWithValue = items.filter(i => i.currentValue);
          if (itemsWithValue.length === 0) return '无数据';
          const sum = itemsWithValue.reduce((acc, i) => acc + (i.currentValue || 0), 0);
          return `¥${sum.toFixed(2)}`;
        },
      },
    ],
  },
};
