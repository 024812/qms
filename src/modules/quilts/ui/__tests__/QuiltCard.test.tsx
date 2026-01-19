/**
 * QuiltCard Component Tests
 * 
 * Unit tests for the QuiltCard component to verify:
 * - Correct rendering of quilt information
 * - Display of images when available
 * - Proper badge colors for season and status
 * - Handling of missing optional fields
 * 
 * Requirements: 4.1
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuiltCard } from '../QuiltCard';
import type { QuiltItem } from '../../schema';

describe('QuiltCard', () => {
  const mockQuiltItem: QuiltItem = {
    id: 'test-quilt-1',
    type: 'quilt',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    itemNumber: 1,
    groupId: null,
    name: '冬季羽绒被',
    season: 'WINTER',
    lengthCm: 200,
    widthCm: 150,
    weightGrams: 2500,
    fillMaterial: '羽绒',
    materialDetails: '90%白鹅绒',
    color: '白色',
    brand: '无印良品',
    purchaseDate: new Date('2023-12-01'),
    location: '主卧衣柜',
    packagingInfo: '真空压缩袋',
    currentStatus: 'IN_USE',
    notes: '非常保暖',
    imageUrl: null,
    thumbnailUrl: null,
    mainImage: 'https://example.com/quilt.jpg',
    attachmentImages: null,
  };

  it('should render quilt name', () => {
    render(<QuiltCard item={mockQuiltItem} />);
    expect(screen.getByText('冬季羽绒被')).toBeInTheDocument();
  });

  it('should render item number', () => {
    render(<QuiltCard item={mockQuiltItem} />);
    expect(screen.getByText('#1')).toBeInTheDocument();
  });

  it('should render season badge', () => {
    render(<QuiltCard item={mockQuiltItem} />);
    expect(screen.getByText('冬季')).toBeInTheDocument();
  });

  it('should render status badge', () => {
    render(<QuiltCard item={mockQuiltItem} />);
    expect(screen.getByText('使用中')).toBeInTheDocument();
  });

  it('should render dimensions when available', () => {
    render(<QuiltCard item={mockQuiltItem} />);
    expect(screen.getByText('200×150cm')).toBeInTheDocument();
  });

  it('should render weight and fill material', () => {
    render(<QuiltCard item={mockQuiltItem} />);
    expect(screen.getByText(/2500g · 羽绒/)).toBeInTheDocument();
  });

  it('should render color and location', () => {
    render(<QuiltCard item={mockQuiltItem} />);
    expect(screen.getByText(/白色 · 主卧衣柜/)).toBeInTheDocument();
  });

  it('should render main image when available', () => {
    const { container } = render(<QuiltCard item={mockQuiltItem} />);
    // Next.js Image component is present when mainImage is provided
    // We verify the image container exists instead of testing the Image component directly
    const imageContainer = container.querySelector('.relative.h-40');
    expect(imageContainer).toBeInTheDocument();
  });

  it('should handle missing dimensions gracefully', () => {
    const itemWithoutDimensions: QuiltItem = {
      ...mockQuiltItem,
      lengthCm: null,
      widthCm: null,
    };
    render(<QuiltCard item={itemWithoutDimensions} />);
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('should handle missing weight gracefully', () => {
    const itemWithoutWeight: QuiltItem = {
      ...mockQuiltItem,
      weightGrams: null,
    };
    render(<QuiltCard item={itemWithoutWeight} />);
    expect(screen.getByText(/- · 羽绒/)).toBeInTheDocument();
  });

  it('should not render image when mainImage is null', () => {
    const itemWithoutImage: QuiltItem = {
      ...mockQuiltItem,
      mainImage: null,
    };
    const { container } = render(<QuiltCard item={itemWithoutImage} />);
    // Image container should not be present when mainImage is null
    const imageContainer = container.querySelector('.relative.h-40');
    expect(imageContainer).not.toBeInTheDocument();
  });

  it('should render correct season label for SPRING_AUTUMN', () => {
    const springAutumnItem: QuiltItem = {
      ...mockQuiltItem,
      season: 'SPRING_AUTUMN',
    };
    render(<QuiltCard item={springAutumnItem} />);
    expect(screen.getByText('春秋')).toBeInTheDocument();
  });

  it('should render correct season label for SUMMER', () => {
    const summerItem: QuiltItem = {
      ...mockQuiltItem,
      season: 'SUMMER',
    };
    render(<QuiltCard item={summerItem} />);
    expect(screen.getByText('夏季')).toBeInTheDocument();
  });

  it('should render correct status label for STORAGE', () => {
    const storageItem: QuiltItem = {
      ...mockQuiltItem,
      currentStatus: 'STORAGE',
    };
    render(<QuiltCard item={storageItem} />);
    expect(screen.getByText('存储中')).toBeInTheDocument();
  });

  it('should render correct status label for MAINTENANCE', () => {
    const maintenanceItem: QuiltItem = {
      ...mockQuiltItem,
      currentStatus: 'MAINTENANCE',
    };
    render(<QuiltCard item={maintenanceItem} />);
    expect(screen.getByText('维护中')).toBeInTheDocument();
  });
});
