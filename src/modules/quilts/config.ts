/**
 * Quilt Module Configuration
 * 
 * COMPREHENSIVE configuration that preserves ALL existing quilt functionality.
 * This configuration matches the existing quilt management system with 24+ fields,
 * usage tracking, image management, and maintenance records.
 * 
 * DO NOT simplify this configuration - it must support the full existing system.
 * 
 * Requirements: 5.1, 5.2
 */

import { ModuleDefinition } from '../types';
import { quiltAttributesSchema } from './schema';
import { QuiltCard } from './ui/QuiltCard';
import { QuiltDetail } from './ui/QuiltDetail';

/**
 * Quilt module configuration
 * 
 * This configuration defines ALL fields from the existing quilt system:
 * - itemNumber (auto-generated, display only)
 * - name, season, dimensions (length, width), weight
 * - fillMaterial, materialDetails, color, brand
 * - purchaseDate, location, packagingInfo
 * - currentStatus, notes
 * - mainImage, attachmentImages (image upload support)
 * - groupId (for grouping related quilts)
 */
export const quiltModule: ModuleDefinition = {
  id: 'quilts',
  name: '被子管理',
  description: '管理家中的被子，记录使用情况和保养信息',
  icon: 'Bed',
  color: 'blue',

  attributesSchema: quiltAttributesSchema,

  // Card component for list view
  CardComponent: QuiltCard,

  // Detail component for detail view
  DetailComponent: QuiltDetail,

  // ============================================================================
  // COMPREHENSIVE FORM FIELDS - ALL 24+ fields from existing system
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
      label: '名称',
      type: 'text',
      placeholder: '例如：冬季羽绒被',
      required: true,
      description: '被子的名称或描述',
    },
    {
      name: 'season',
      label: '适用季节',
      type: 'select',
      required: true,
      options: [
        { label: '冬季', value: 'WINTER' },
        { label: '春秋季', value: 'SPRING_AUTUMN' },
        { label: '夏季', value: 'SUMMER' },
      ],
      description: '被子适用的季节',
    },
    
    // Dimensions
    {
      name: 'lengthCm',
      label: '长度（厘米）',
      type: 'number',
      placeholder: '例如：200',
      required: false,
      description: '被子的长度，单位：厘米',
    },
    {
      name: 'widthCm',
      label: '宽度（厘米）',
      type: 'number',
      placeholder: '例如：150',
      required: false,
      description: '被子的宽度，单位：厘米',
    },
    {
      name: 'weightGrams',
      label: '重量（克）',
      type: 'number',
      placeholder: '例如：2500',
      required: false,
      description: '被子的重量，单位：克',
    },
    
    // Material Information
    {
      name: 'fillMaterial',
      label: '填充材料',
      type: 'text',
      required: true,
      placeholder: '例如：羽绒、棉花、聚酯纤维',
      description: '被子的主要填充材料',
    },
    {
      name: 'materialDetails',
      label: '材料详情',
      type: 'textarea',
      placeholder: '例如：90%白鹅绒，10%羽毛，面料为100%纯棉',
      required: false,
      description: '材料的详细说明，包括面料、填充物比例等',
    },
    {
      name: 'color',
      label: '颜色',
      type: 'text',
      required: true,
      placeholder: '例如：白色、米色、蓝色',
      description: '被子的主要颜色',
    },
    {
      name: 'brand',
      label: '品牌',
      type: 'text',
      placeholder: '例如：无印良品、宜家',
      required: false,
      description: '被子的品牌',
    },
    
    // Purchase Information
    {
      name: 'purchaseDate',
      label: '购买日期',
      type: 'date',
      required: false,
      description: '购买被子的日期',
    },
    
    // Storage and Location
    {
      name: 'location',
      label: '存放位置',
      type: 'text',
      required: true,
      placeholder: '例如：主卧衣柜、储物间',
      description: '被子当前的存放位置',
    },
    {
      name: 'packagingInfo',
      label: '包装信息',
      type: 'text',
      placeholder: '例如：真空压缩袋、收纳箱',
      required: false,
      description: '被子的包装方式或收纳信息',
    },
    
    // Status
    {
      name: 'currentStatus',
      label: '当前状态',
      type: 'select',
      required: true,
      options: [
        { label: '使用中', value: 'IN_USE' },
        { label: '维护中', value: 'MAINTENANCE' },
        { label: '存储中', value: 'STORAGE' },
      ],
      description: '被子的当前使用状态',
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
      description: '被子的主要展示图片',
    },
    {
      name: 'attachmentImages',
      label: '附加图片',
      type: 'textarea',
      placeholder: '多个图片URL，每行一个',
      required: false,
      description: '被子的其他图片（细节图、标签图等）',
    },
    
    // Grouping (for related quilts)
    {
      name: 'groupId',
      label: '分组ID',
      type: 'number',
      placeholder: '例如：1',
      required: false,
      description: '用于将相关被子分组（如同一套被子的不同季节版本）',
    },
  ],

  // ============================================================================
  // LIST COLUMNS - Show key information in list view
  // ============================================================================
  listColumns: [
    {
      key: 'itemNumber',
      label: '编号',
      render: (value) => `#${value}`,
    },
    {
      key: 'name',
      label: '名称',
    },
    {
      key: 'season',
      label: '季节',
      render: (value) => {
        const seasonMap: Record<string, string> = {
          WINTER: '冬季',
          SPRING_AUTUMN: '春秋',
          SUMMER: '夏季',
        };
        return seasonMap[value as string] || value;
      },
    },
    {
      key: 'lengthCm',
      label: '尺寸',
      render: (value, item) => {
        if (item.lengthCm && item.widthCm) {
          return `${item.lengthCm}×${item.widthCm}cm`;
        }
        return '-';
      },
    },
    {
      key: 'weightGrams',
      label: '重量',
      render: (value) => {
        if (value) {
          return `${(value / 1000).toFixed(1)}kg`;
        }
        return '-';
      },
    },
    {
      key: 'fillMaterial',
      label: '填充材料',
    },
    {
      key: 'color',
      label: '颜色',
    },
    {
      key: 'brand',
      label: '品牌',
      render: (value) => value || '-',
    },
    {
      key: 'location',
      label: '位置',
    },
    {
      key: 'currentStatus',
      label: '状态',
      render: (value) => {
        const statusMap: Record<string, string> = {
          IN_USE: '使用中',
          MAINTENANCE: '维护中',
          STORAGE: '存储中',
        };
        return statusMap[value as string] || value;
      },
    },
    {
      key: 'mainImage',
      label: '图片',
      render: (value) => (value ? '✓' : '-'),
    },
  ],

  // ============================================================================
  // COMPREHENSIVE STATISTICS - Track usage, status, and physical properties
  // ============================================================================
  statsConfig: {
    metrics: [
      // Count metrics
      {
        key: 'total',
        label: '总数量',
        calculate: (items) => items.length,
      },
      {
        key: 'byStatus',
        label: '按状态统计',
        calculate: (items) => {
          const statusCounts = {
            IN_USE: 0,
            MAINTENANCE: 0,
            STORAGE: 0,
          };
          items.forEach((item) => {
            const status = item.currentStatus || 'STORAGE';
            if (status in statusCounts) {
              statusCounts[status as keyof typeof statusCounts]++;
            }
          });
          return `使用中:${statusCounts.IN_USE} 维护:${statusCounts.MAINTENANCE} 存储:${statusCounts.STORAGE}`;
        },
      },
      {
        key: 'bySeason',
        label: '按季节统计',
        calculate: (items) => {
          const seasonCounts = {
            WINTER: 0,
            SPRING_AUTUMN: 0,
            SUMMER: 0,
          };
          items.forEach((item) => {
            const season = item.season;
            if (season in seasonCounts) {
              seasonCounts[season as keyof typeof seasonCounts]++;
            }
          });
          return `冬季:${seasonCounts.WINTER} 春秋:${seasonCounts.SPRING_AUTUMN} 夏季:${seasonCounts.SUMMER}`;
        },
      },
      
      // Average metrics
      {
        key: 'avgWeight',
        label: '平均重量',
        calculate: (items) => {
          const itemsWithWeight = items.filter((i) => i.weightGrams);
          if (itemsWithWeight.length === 0) return '无数据';
          const sum = itemsWithWeight.reduce((acc, i) => acc + (i.weightGrams || 0), 0);
          return `${(sum / itemsWithWeight.length / 1000).toFixed(2)}kg`;
        },
      },
      {
        key: 'avgDimensions',
        label: '平均尺寸',
        calculate: (items) => {
          const itemsWithDimensions = items.filter((i) => i.lengthCm && i.widthCm);
          if (itemsWithDimensions.length === 0) return '无数据';
          const avgLength = itemsWithDimensions.reduce((acc, i) => acc + (i.lengthCm || 0), 0) / itemsWithDimensions.length;
          const avgWidth = itemsWithDimensions.reduce((acc, i) => acc + (i.widthCm || 0), 0) / itemsWithDimensions.length;
          return `${avgLength.toFixed(0)}×${avgWidth.toFixed(0)}cm`;
        },
      },
      
      // Material distribution
      {
        key: 'materialDistribution',
        label: '材料分布',
        calculate: (items) => {
          const materials: Record<string, number> = {};
          items.forEach((item) => {
            const material = item.fillMaterial || '未知';
            materials[material] = (materials[material] || 0) + 1;
          });
          const topMaterials = Object.entries(materials)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([material, count]) => `${material}:${count}`)
            .join(' ');
          return topMaterials || '无数据';
        },
      },
      
      // Image coverage
      {
        key: 'withImages',
        label: '有图片',
        calculate: (items) => {
          const withImages = items.filter((i) => i.mainImage || (i.attachmentImages && i.attachmentImages.length > 0));
          return `${withImages.length}/${items.length}`;
        },
      },
      
      // Brand distribution
      {
        key: 'brandDistribution',
        label: '品牌分布',
        calculate: (items) => {
          const brands: Record<string, number> = {};
          items.forEach((item) => {
            const brand = item.brand || '无品牌';
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
