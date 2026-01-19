/**
 * QuiltDetail Component Tests
 * 
 * Tests for the QuiltDetail component to ensure it properly displays
 * all quilt information fields.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuiltDetail } from '../QuiltDetail';
import type { QuiltItem } from '../../schema';

describe('QuiltDetail', () => {
  const mockQuiltItem: QuiltItem = {
    id: 'test-quilt-1',
    type: 'quilt',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    itemNumber: 1,
    groupId: null,
    name: '测试冬季羽绒被',
    season: 'WINTER',
    lengthCm: 200,
    widthCm: 150,
    weightGrams: 2500,
    fillMaterial: '羽绒',
    materialDetails: '90%白鹅绒，10%羽毛',
    color: '白色',
    brand: '无印良品',
    purchaseDate: new Date('2023-12-01'),
    location: '主卧衣柜',
    packagingInfo: '真空压缩袋',
    currentStatus: 'IN_USE',
    notes: '非常保暖，适合冬季使用',
    imageUrl: null,
    thumbnailUrl: null,
    mainImage: 'https://example.com/main.jpg',
    attachmentImages: ['https://example.com/detail1.jpg', 'https://example.com/detail2.jpg'],
  };

  it('should render basic information correctly', () => {
    render(<QuiltDetail item={mockQuiltItem} />);

    // Check item number
    expect(screen.getByText('#1')).toBeInTheDocument();

    // Check name
    expect(screen.getByText('测试冬季羽绒被')).toBeInTheDocument();

    // Check season
    expect(screen.getByText('冬季')).toBeInTheDocument();

    // Check status
    expect(screen.getByText('使用中')).toBeInTheDocument();
  });

  it('should render dimensions and weight correctly', () => {
    render(<QuiltDetail item={mockQuiltItem} />);

    // Check length
    expect(screen.getByText('200 厘米')).toBeInTheDocument();

    // Check width
    expect(screen.getByText('150 厘米')).toBeInTheDocument();

    // Check weight
    expect(screen.getByText(/2500 克/)).toBeInTheDocument();
    expect(screen.getByText(/2.50 千克/)).toBeInTheDocument();
  });

  it('should render material information correctly', () => {
    render(<QuiltDetail item={mockQuiltItem} />);

    // Check fill material
    expect(screen.getByText('羽绒')).toBeInTheDocument();

    // Check material details
    expect(screen.getByText('90%白鹅绒，10%羽毛')).toBeInTheDocument();

    // Check color
    expect(screen.getByText('白色')).toBeInTheDocument();

    // Check brand
    expect(screen.getByText('无印良品')).toBeInTheDocument();
  });

  it('should render storage information correctly', () => {
    render(<QuiltDetail item={mockQuiltItem} />);

    // Check location
    expect(screen.getByText('主卧衣柜')).toBeInTheDocument();

    // Check packaging info
    expect(screen.getByText('真空压缩袋')).toBeInTheDocument();
  });

  it('should render notes when provided', () => {
    render(<QuiltDetail item={mockQuiltItem} />);

    expect(screen.getByText('非常保暖，适合冬季使用')).toBeInTheDocument();
  });

  it('should render image gallery with main and attachment images', () => {
    render(<QuiltDetail item={mockQuiltItem} />);

    // Check for image section
    expect(screen.getByText('图片')).toBeInTheDocument();

    // Check for main image badge
    expect(screen.getByText('主图')).toBeInTheDocument();

    // Check that all images are rendered (1 main + 2 attachments = 3 total)
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(3);
  });

  it('should handle missing optional fields gracefully', () => {
    const minimalQuilt: QuiltItem = {
      id: 'test-quilt-2',
      type: 'quilt',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      itemNumber: 2,
      groupId: null,
      name: '简单被子',
      season: 'SUMMER',
      lengthCm: null,
      widthCm: null,
      weightGrams: null,
      fillMaterial: '棉花',
      materialDetails: null,
      color: '蓝色',
      brand: null,
      purchaseDate: null,
      location: '储物间',
      packagingInfo: null,
      currentStatus: 'STORAGE',
      notes: null,
      imageUrl: null,
      thumbnailUrl: null,
      mainImage: null,
      attachmentImages: null,
    };

    render(<QuiltDetail item={minimalQuilt} />);

    // Should render name
    expect(screen.getByText('简单被子')).toBeInTheDocument();

    // Should show '-' for missing dimensions
    const dashElements = screen.getAllByText('-');
    expect(dashElements.length).toBeGreaterThan(0);
  });

  it('should display all section headers', () => {
    render(<QuiltDetail item={mockQuiltItem} />);

    // Check for all section headers
    expect(screen.getByText('图片')).toBeInTheDocument();
    expect(screen.getByText('基本信息')).toBeInTheDocument();
    expect(screen.getByText('尺寸与重量')).toBeInTheDocument();
    expect(screen.getByText('材料信息')).toBeInTheDocument();
    expect(screen.getByText('购买与存储')).toBeInTheDocument();
    expect(screen.getByText('备注')).toBeInTheDocument();
    expect(screen.getByText('记录信息')).toBeInTheDocument();
  });

  it('should format dates correctly', () => {
    render(<QuiltDetail item={mockQuiltItem} />);

    // Check that dates are formatted in Chinese locale
    // The exact format may vary, but should contain year, month, day
    const dateElements = screen.getAllByText(/2024年|2023年/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('should display group ID when provided', () => {
    const quiltWithGroup: QuiltItem = {
      ...mockQuiltItem,
      groupId: 5,
    };

    render(<QuiltDetail item={quiltWithGroup} />);

    expect(screen.getByText('5')).toBeInTheDocument();
  });
});
