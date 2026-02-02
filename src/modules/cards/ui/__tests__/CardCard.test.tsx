/**
 * CardCard Component Tests
 *
 * Unit tests for the CardCard component to verify:
 * - Correct rendering of card information
 * - Display of images when available
 * - Proper badge colors for sport and status
 * - Handling of missing optional fields
 * - Grading information display
 * - Special features (autograph, memorabilia)
 *
 * Requirements: 5.7, 5.8, 5.9
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CardCard } from '../CardCard';
import type { CardItem } from '../../schema';

describe('CardCard', () => {
  const mockCardItem: CardItem = {
    id: 'test-card-1',
    type: 'card',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    itemNumber: 123,
    playerName: 'Michael Jordan',
    sport: 'BASKETBALL',
    team: 'Chicago Bulls',
    position: 'SG',
    year: 1986,
    brand: 'Fleer',
    series: 'Rookie Card',
    cardNumber: '57',
    gradingCompany: 'PSA',
    grade: 9.5,
    certificationNumber: '12345678',
    purchasePrice: 100.0,
    purchaseDate: new Date('2023-01-01'),
    currentValue: 500.0,
    estimatedValue: 1200,
    soldPrice: null,
    soldDate: null,
    lastValueUpdate: new Date('2024-01-01'),
    parallel: 'Refractor',
    serialNumber: null,
    isAutographed: true,
    hasMemorabilia: true,
    memorabiliaType: 'Jersey',
    status: 'COLLECTION',
    location: '保险柜',
    storageType: '评级盒',
    condition: '完美品相',
    notes: '投资级球星卡',
    tags: null,
    mainImage: 'https://example.com/card.jpg',
    attachmentImages: null,
  };

  it('should render player name', () => {
    render(<CardCard item={mockCardItem} />);
    expect(screen.getByText('Michael Jordan')).toBeInTheDocument();
  });

  it('should render item number', () => {
    render(<CardCard item={mockCardItem} />);
    expect(screen.getByText('#123')).toBeInTheDocument();
  });

  it('should render sport badge', () => {
    render(<CardCard item={mockCardItem} />);
    expect(screen.getByText('篮球')).toBeInTheDocument();
  });

  it('should render status badge', () => {
    render(<CardCard item={mockCardItem} />);
    expect(screen.getByText('收藏中')).toBeInTheDocument();
  });

  it('should render grading info when graded', () => {
    render(<CardCard item={mockCardItem} />);
    expect(screen.getByText(/PSA 9.5/)).toBeInTheDocument();
  });

  it('should not render grading badge when ungraded', () => {
    const ungradedItem: CardItem = {
      ...mockCardItem,
      gradingCompany: 'UNGRADED',
      grade: null,
    };
    render(<CardCard item={ungradedItem} />);
    expect(screen.queryByText(/PSA/)).not.toBeInTheDocument();
  });

  it('should render year and brand', () => {
    render(<CardCard item={mockCardItem} />);
    expect(screen.getByText('1986 • Fleer')).toBeInTheDocument();
  });

  it('should render current value when available', () => {
    render(<CardCard item={mockCardItem} />);
    expect(screen.getByText('$500.00')).toBeInTheDocument();
  });

  it('should render autograph marker when autographed', () => {
    render(<CardCard item={mockCardItem} />);
    expect(screen.getByText('✓签名')).toBeInTheDocument();
  });

  it('should render memorabilia marker when has memorabilia', () => {
    render(<CardCard item={mockCardItem} />);
    expect(screen.getByText('✓实物')).toBeInTheDocument();
  });

  it('should not render autograph marker when not autographed', () => {
    const nonAutographedItem: CardItem = {
      ...mockCardItem,
      isAutographed: false,
    };
    render(<CardCard item={nonAutographedItem} />);
    expect(screen.queryByText('✓签名')).not.toBeInTheDocument();
  });

  it('should not render memorabilia marker when no memorabilia', () => {
    const noMemorabiliaItem: CardItem = {
      ...mockCardItem,
      hasMemorabilia: false,
    };
    render(<CardCard item={noMemorabiliaItem} />);
    expect(screen.queryByText('✓实物')).not.toBeInTheDocument();
  });

  it('should render main image when available', () => {
    const { container } = render(<CardCard item={mockCardItem} />);
    const imageContainer = container.querySelector('.relative.h-40');
    expect(imageContainer).toBeInTheDocument();
  });

  it('should not render image when mainImage is null', () => {
    const itemWithoutImage: CardItem = {
      ...mockCardItem,
      mainImage: null,
    };
    const { container } = render(<CardCard item={itemWithoutImage} />);
    const imageContainer = container.querySelector('.relative.h-40');
    expect(imageContainer).not.toBeInTheDocument();
  });

  it('should render correct sport label for SOCCER', () => {
    const soccerItem: CardItem = {
      ...mockCardItem,
      sport: 'SOCCER',
    };
    render(<CardCard item={soccerItem} />);
    expect(screen.getByText('足球')).toBeInTheDocument();
  });

  it('should render correct sport label for OTHER', () => {
    const otherItem: CardItem = {
      ...mockCardItem,
      sport: 'OTHER',
    };
    render(<CardCard item={otherItem} />);
    expect(screen.getByText('其他')).toBeInTheDocument();
  });

  it('should render correct status label for FOR_SALE', () => {
    const forSaleItem: CardItem = {
      ...mockCardItem,
      status: 'FOR_SALE',
    };
    render(<CardCard item={forSaleItem} />);
    expect(screen.getByText('待售')).toBeInTheDocument();
  });

  it('should render correct status label for SOLD', () => {
    const soldItem: CardItem = {
      ...mockCardItem,
      status: 'SOLD',
    };
    render(<CardCard item={soldItem} />);
    expect(screen.getByText('已售出')).toBeInTheDocument();
  });

  it('should render correct status label for GRADING', () => {
    const gradingItem: CardItem = {
      ...mockCardItem,
      status: 'GRADING',
    };
    render(<CardCard item={gradingItem} />);
    expect(screen.getByText('评级中')).toBeInTheDocument();
  });

  it('should render correct status label for DISPLAY', () => {
    const displayItem: CardItem = {
      ...mockCardItem,
      status: 'DISPLAY',
    };
    render(<CardCard item={displayItem} />);
    expect(screen.getByText('展示中')).toBeInTheDocument();
  });

  it('should handle missing current value gracefully', () => {
    const itemWithoutValue: CardItem = {
      ...mockCardItem,
      currentValue: null,
    };
    render(<CardCard item={itemWithoutValue} />);
    // Should not display value when null
    expect(screen.queryByText('500.00')).not.toBeInTheDocument();
  });

  it('should render grading company label for BGS', () => {
    const bgsItem: CardItem = {
      ...mockCardItem,
      gradingCompany: 'BGS',
      grade: 9.0,
    };
    render(<CardCard item={bgsItem} />);
    expect(screen.getByText(/BGS \(Beckett\) 9/)).toBeInTheDocument();
  });

  it('should render grading company label for SGC', () => {
    const sgcItem: CardItem = {
      ...mockCardItem,
      gradingCompany: 'SGC',
      grade: 10,
    };
    render(<CardCard item={sgcItem} />);
    expect(screen.getByText(/SGC 10/)).toBeInTheDocument();
  });

  it('should render grading company label for CGC', () => {
    const cgcItem: CardItem = {
      ...mockCardItem,
      gradingCompany: 'CGC',
      grade: 9.5,
    };
    render(<CardCard item={cgcItem} />);
    expect(screen.getByText(/CGC 9.5/)).toBeInTheDocument();
  });
});
