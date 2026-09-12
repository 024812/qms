/**
 * Maps Module Configuration
 *
 * Configuration for managing map collections with comprehensive field support.
 *
 * Requirements: V3 API-first blueprint
 */

import { ModuleDefinition } from '../types';
import { mapAttributesSchema, type MapItem } from './schema';
import { MapCard } from './ui/MapCard';
import { MapDetail } from './ui/MapDetail';

/**
 * Maps module configuration
 *
 * This configuration defines all fields for the map management system:
 * - itemNumber (auto-generated, display only)
 * - name, mapType, scale, publishedYear, publisher
 * - material, dimensions (width, height)
 * - region, country, language
 * - condition, isOriginal, edition
 * - acquiredDate, purchasePrice, currentValue
 * - status, location, notes
 * - mainImage, attachmentImages (image upload support)
 */
export const mapsModule: ModuleDefinition<MapItem> = {
  id: 'maps',
  name: '地图管理',
  description: '管理地图收藏，记录来源和状态信息',
  icon: 'Map',
  color: '#4A90E2',

  attributesSchema: mapAttributesSchema,

  // Card component for list view
  CardComponent: MapCard,

  // Detail component for detail view
  DetailComponent: MapDetail,

  // ============================================================================
  // FORM FIELDS
  // ============================================================================
  formFields: [
    // Display-only field for item number (auto-generated)
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
      label: '地图名称',
      type: 'text',
      placeholder: '例如：北京市区地图',
      required: true,
      description: '地图的名称或标题',
    },
    {
      name: 'mapType',
      label: '地图类型',
      type: 'select',
      required: true,
      options: [
        { label: '地形图', value: 'TOPOGRAPHIC' },
        { label: '道路图', value: 'ROAD' },
        { label: '城市图', value: 'CITY' },
        { label: '历史地图', value: 'HISTORICAL' },
        { label: '专题地图', value: 'THEMATIC' },
        { label: '航海图', value: 'NAUTICAL' },
        { label: '航空图', value: 'AERONAUTICAL' },
        { label: '地图集', value: 'ATLAS' },
        { label: '其他', value: 'OTHER' },
      ],
      description: '地图的类型分类',
    },
    {
      name: 'scale',
      label: '比例尺',
      type: 'text',
      placeholder: '例如：1:50000',
      required: false,
      description: '地图的比例尺',
    },
    {
      name: 'publishedYear',
      label: '出版年份',
      type: 'number',
      placeholder: '例如：1980',
      required: false,
      description: '地图的出版或发行年份',
    },
    {
      name: 'publishedMonth',
      label: '出版月份',
      type: 'number',
      placeholder: '例如：7',
      required: false,
      description: '地图的出版或发行月份 (1-12)',
    },
    {
      name: 'printYear',
      label: '印刷年份',
      type: 'number',
      placeholder: '例如：1981',
      required: false,
      description: '地图的实际印刷年份',
    },
    {
      name: 'printMonth',
      label: '印刷月份',
      type: 'number',
      placeholder: '例如：8',
      required: false,
      description: '地图的实际印刷月份 (1-12)',
    },
    {
      name: 'publisher',
      label: '出版社/制图者',
      type: 'text',
      placeholder: '例如：中国地图出版社',
      required: false,
      description: '出版该地图的机构或个人',
    },
    {
      name: 'series',
      label: '系列',
      type: 'text',
      placeholder: '例如：中国分省系列、交通旅游系列',
      required: false,
      description: '所属地图系列',
    },
    {
      name: 'isbn',
      label: 'ISBN / 统一书号',
      type: 'text',
      placeholder: '例如：12100.002 或 978-7-116-06194-1',
      required: false,
      description: '统一书号或国际标准书号 (ISBN)',
    },
    {
      name: 'originalPrice',
      label: '原标价（元）',
      type: 'number',
      placeholder: '例如：0.15',
      required: false,
      description: '地图票面印刷的原始定价',
    },

    // Material and Dimensions
    {
      name: 'material',
      label: '材质',
      type: 'select',
      required: true,
      options: [
        { label: '纸质', value: 'PAPER' },
        { label: '布质', value: 'CLOTH' },
        { label: '数字', value: 'DIGITAL' },
        { label: '其他', value: 'OTHER' },
      ],
      description: '地图的材质',
    },
    {
      name: 'widthCm',
      label: '宽度（厘米）',
      type: 'number',
      placeholder: '例如：60',
      required: false,
      description: '地图的宽度，单位：厘米',
    },
    {
      name: 'heightCm',
      label: '高度（厘米）',
      type: 'number',
      placeholder: '例如：80',
      required: false,
      description: '地图的高度，单位：厘米',
    },

    // Geographic Information
    {
      name: 'country',
      label: '国家',
      type: 'text',
      placeholder: '例如：中国',
      required: false,
      description: '地图所属或覆盖的国家',
    },
    {
      name: 'province',
      label: '省份',
      type: 'text',
      placeholder: '例如：江苏、浙江',
      required: false,
      description: '地图所属省份/行政区',
    },
    {
      name: 'city',
      label: '城市',
      type: 'text',
      placeholder: '例如：南京、西宁',
      required: false,
      description: '地图所描绘的城市',
    },
    {
      name: 'region',
      label: '地区',
      type: 'text',
      placeholder: '例如：华东地区',
      required: false,
      description: '地图所覆盖的大区或地理范围',
    },
    {
      name: 'language',
      label: '语言',
      type: 'text',
      placeholder: '例如：中文',
      required: false,
      description: '地图标注使用的语言',
    },

    // Condition and Authenticity
    {
      name: 'condition',
      label: '品相描述',
      type: 'textarea',
      placeholder: '例如：保存完好，边缘有轻微磨损',
      required: false,
      description: '地图的保存状态和品相',
    },
    {
      name: 'isOriginal',
      label: '是否原版',
      type: 'select',
      required: false,
      options: [
        { label: '是', value: 'true' },
        { label: '否', value: 'false' },
      ],
      description: '是否为原版地图（非复制品）',
    },
    {
      name: 'edition',
      label: '版次',
      type: 'text',
      placeholder: '例如：第一版',
      required: false,
      description: '地图的版次信息',
    },

    // Acquisition Information
    {
      name: 'acquiredDate',
      label: '获得日期',
      type: 'date',
      required: false,
      description: '获得该地图的日期',
    },
    {
      name: 'purchasePrice',
      label: '购买价格',
      type: 'number',
      placeholder: '例如：500',
      required: false,
      description: '购买地图时的价格',
    },
    {
      name: 'currentValue',
      label: '当前价值',
      type: 'number',
      placeholder: '例如：800',
      required: false,
      description: '地图的当前估值',
    },

    // Status and Storage
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
        { label: '已装裱', value: 'FRAMED' },
      ],
      description: '地图的当前状态',
    },
    {
      name: 'location',
      label: '存放位置',
      type: 'text',
      placeholder: '例如：书房书柜',
      required: false,
      description: '地图的存放位置',
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
      description: '地图的主要展示图片',
    },
    {
      name: 'attachmentImages',
      label: '附加图片',
      type: 'textarea',
      placeholder: '多个图片URL，每行一个',
      required: false,
      description: '地图的其他图片（细节图、背面图等）',
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
      key: 'mapType',
      label: '类型',
      render: value => {
        const typeMap: Record<string, string> = {
          TOPOGRAPHIC: '地形图',
          ROAD: '道路图',
          CITY: '城市图',
          HISTORICAL: '历史地图',
          THEMATIC: '专题地图',
          NAUTICAL: '航海图',
          AERONAUTICAL: '航空图',
          OTHER: '其他',
        };
        return typeMap[value as string] || value;
      },
    },
    {
      key: 'region',
      label: '地区',
      render: value => value || '-',
    },
    {
      key: 'publishedYear',
      label: '年份',
      render: value => (value ? String(value) : '-'),
    },
    {
      key: 'publisher',
      label: '出版社',
      render: value => value || '-',
    },
    {
      key: 'material',
      label: '材质',
      render: value => {
        const materialMap: Record<string, string> = {
          PAPER: '纸质',
          CLOTH: '布质',
          DIGITAL: '数字',
          OTHER: '其他',
        };
        return materialMap[value as string] || value;
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
          FRAMED: '已装裱',
        };
        return statusMap[value as string] || value;
      },
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
            COLLECTION: 0,
            FOR_SALE: 0,
            SOLD: 0,
            DISPLAY: 0,
            FRAMED: 0,
          };
          items.forEach(item => {
            const status = item.status || 'COLLECTION';
            if (status in statusCounts) {
              statusCounts[status as keyof typeof statusCounts]++;
            }
          });
          return `收藏:${statusCounts.COLLECTION} 待售:${statusCounts.FOR_SALE} 已售:${statusCounts.SOLD} 展示:${statusCounts.DISPLAY} 装裱:${statusCounts.FRAMED}`;
        },
      },
      {
        key: 'byType',
        label: '按类型统计',
        calculate: items => {
          const typeCounts: Record<string, number> = {};
          items.forEach(item => {
            const type = item.mapType || 'OTHER';
            typeCounts[type] = (typeCounts[type] || 0) + 1;
          });
          const topTypes = Object.entries(typeCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([type, count]) => {
              const typeMap: Record<string, string> = {
                TOPOGRAPHIC: '地形图',
                ROAD: '道路图',
                CITY: '城市图',
                HISTORICAL: '历史地图',
                THEMATIC: '专题地图',
                NAUTICAL: '航海图',
                AERONAUTICAL: '航空图',
                OTHER: '其他',
              };
              return `${typeMap[type] || type}:${count}`;
            })
            .join(' ');
          return topTypes || '无数据';
        },
      },

      // Value metrics
      {
        key: 'totalValue',
        label: '总价值',
        calculate: items => {
          const total = items.reduce((sum, item) => sum + (item.currentValue || 0), 0);
          return total > 0 ? `¥${total.toFixed(2)}` : '无数据';
        },
      },
      {
        key: 'avgValue',
        label: '平均价值',
        calculate: items => {
          const itemsWithValue = items.filter(i => i.currentValue);
          if (itemsWithValue.length === 0) return '无数据';
          const avg =
            itemsWithValue.reduce((sum, i) => sum + (i.currentValue || 0), 0) /
            itemsWithValue.length;
          return `¥${avg.toFixed(2)}`;
        },
      },

      // Material distribution
      {
        key: 'materialDistribution',
        label: '材质分布',
        calculate: items => {
          const materials: Record<string, number> = {};
          items.forEach(item => {
            const material = item.material || 'OTHER';
            materials[material] = (materials[material] || 0) + 1;
          });
          const materialMap: Record<string, string> = {
            PAPER: '纸质',
            CLOTH: '布质',
            DIGITAL: '数字',
            OTHER: '其他',
          };
          const distribution = Object.entries(materials)
            .map(([material, count]) => `${materialMap[material] || material}:${count}`)
            .join(' ');
          return distribution || '无数据';
        },
      },

      // Image coverage
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

      // Time period distribution
      {
        key: 'periodDistribution',
        label: '年代分布',
        calculate: items => {
          const itemsWithYear = items.filter(i => i.publishedYear);
          if (itemsWithYear.length === 0) return '无数据';
          const years = itemsWithYear.map(i => i.publishedYear!);
          const oldest = Math.min(...years);
          const newest = Math.max(...years);
          return `${oldest}-${newest} (${itemsWithYear.length}张)`;
        },
      },
    ],
  },
};
