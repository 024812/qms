/**
 * CardDetail Component Tests
 *
 * Unit tests for the CardDetail component to verify:
 * - Correct rendering of all card information sections
 * - Display of image gallery
 * - Proper formatting of dates and currency
 * - ROI calculation
 * - Conditional rendering of notes section
 * - DetailField component functionality
 *
 * Requirements: 5.7, 5.8, 5.9
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CardDetail } from '../CardDetail';
import type { CardItem } from '../../schema';

describe('CardDetail', () => {
  const mockCardItem: CardItem = {
    id: 'test-card-1',
    type: 'card',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-15T00:00:00Z'),
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
    estimatedValue: 550.0,
    lastValueUpdate: null,
    parallel: 'Refractor',
    serialNumber: '25/99',
    isAutographed: true,
    hasMemorabilia: true,
    memorabiliaType: 'Jersey Patch',
    status: 'COLLECTION',
    location: '保险柜',
    storageType: '评级盒',
    condition: '完美品相，无瑕疵',
    notes: '这是一张投资级球星卡，具有很高的收藏价值。',
    tags: null,
    mainImage: 'https://example.com/card-main.jpg',
    attachmentImages: ['https://example.com/card-back.jpg', 'https://example.com/card-cert.jpg'],
  };

  describe('Image Gallery', () => {
    it('should render image gallery section', () => {
      render(<CardDetail item={mockCardItem} />);
      expect(screen.getByText('图片')).toBeInTheDocument();
    });

    it('should render all images (main + attachments)', () => {
      const { container } = render(<CardDetail item={mockCardItem} />);
      const images = container.querySelectorAll('.aspect-square');
      expect(images).toHaveLength(3); // 1 main + 2 attachments
    });

    it('should mark first image as main', () => {
      render(<CardDetail item={mockCardItem} />);
      expect(screen.getByText('主图')).toBeInTheDocument();
    });

    it('should not render image gallery when no images', () => {
      const itemWithoutImages: CardItem = {
        ...mockCardItem,
        mainImage: null,
        attachmentImages: null,
      };
      render(<CardDetail item={itemWithoutImages} />);
      expect(screen.queryByText('图片')).not.toBeInTheDocument();
    });
  });

  describe('Player Information', () => {
    it('should render player information section', () => {
      render(<CardDetail item={mockCardItem} />);
      expect(screen.getByText('球员信息')).toBeInTheDocument();
    });

    it('should render player name', () => {
      render(<CardDetail item={mockCardItem} />);
      expect(screen.getByText('Michael Jordan')).toBeInTheDocument();
    });

    it('should render sport type', () => {
      render(<CardDetail item={mockCardItem} />);
      expect(screen.getByText('篮球')).toBeInTheDocument();
    });

    it('should render team', () => {
      render(<CardDetail item={mockCardItem} />);
      expect(screen.getByText('Chicago Bulls')).toBeInTheDocument();
    });

    it('should render position', () => {
      render(<CardDetail item={mockCardItem} />);
      expect(screen.getByText('SG')).toBeInTheDocument();
    });

    it('should handle missing team gracefully', () => {
      const itemWithoutTeam: CardItem = {
        ...mockCardItem,
        team: null,
      };
      render(<CardDetail item={itemWithoutTeam} />);
      const teamLabels = screen.getAllByText('-');
      expect(teamLabels.length).toBeGreaterThan(0);
    });
  });

  describe('Card Details', () => {
    it('should render card details section', () => {
      render(<CardDetail item={mockCardItem} />);
      expect(screen.getByText('卡片详情')).toBeInTheDocument();
    });

    it('should render year', () => {
      render(<CardDetail item={mockCardItem} />);
      expect(screen.getByText('1986')).toBeInTheDocument();
    });

    it('should render brand', () => {
      render(<CardDetail item={mockCardItem} />);
      expect(screen.getByText('Fleer')).toBeInTheDocument();
    });

    it('should render series', () => {
      render(<CardDetail item={mockCardItem} />);
      expect(screen.getByText('Rookie Card')).toBeInTheDocument();
    });

    it('should render card number', () => {
      render(<CardDetail item={mockCardItem} />);
      expect(screen.getByText('57')).toBeInTheDocument();
    });
  });

  describe('Grading Information', () => {
    it('should render grading information section', () => {
      render(<CardDetail item={mockCardItem} />);
      expect(screen.getByText('评级信息')).toBeInTheDocument();
    });

    it('should render grading company', () => {
      render(<CardDetail item={mockCardItem} />);
      expect(screen.getByText('PSA')).toBeInTheDocument();
    });

    it('should render grade', () => {
      render(<CardDetail item={mockCardItem} />);
      expect(screen.getByText('9.5')).toBeInTheDocument();
    });

    it('should render certification number', () => {
      render(<CardDetail item={mockCardItem} />);
      expect(screen.getByText('12345678')).toBeInTheDocument();
    });

    it('should handle ungraded card', () => {
      const ungradedItem: CardItem = {
        ...mockCardItem,
        gradingCompany: 'UNGRADED',
        grade: null,
        certificationNumber: null,
      };
      render(<CardDetail item={ungradedItem} />);
      expect(screen.getByText('未评级')).toBeInTheDocument();
    });
  });

  describe('Value Information', () => {
    it('should render value information section', () => {
      render(<CardDetail item={mockCardItem} />);
      expect(screen.getByText('价值信息')).toBeInTheDocument();
    });

    it('should render purchase price', () => {
      render(<CardDetail item={mockCardItem} />);
      expect(screen.getByText('$100.00')).toBeInTheDocument();
    });

    it('should render current value', () => {
      render(<CardDetail item={mockCardItem} />);
      expect(screen.getByText('$500.00')).toBeInTheDocument();
    });

    it('should render estimated value', () => {
      render(<CardDetail item={mockCardItem} />);
      expect(screen.getByText('$550.00')).toBeInTheDocument();
    });

    it('should calculate and render positive ROI', () => {
      render(<CardDetail item={mockCardItem} />);
      expect(screen.getByText('+400.00%')).toBeInTheDocument();
    });

    it('should calculate and render negative ROI', () => {
      const lossItem: CardItem = {
        ...mockCardItem,
        purchasePrice: 500.0,
        currentValue: 100.0,
      };
      render(<CardDetail item={lossItem} />);
      expect(screen.getByText('-80.00%')).toBeInTheDocument();
    });

    it('should handle missing value data for ROI', () => {
      const noValueItem: CardItem = {
        ...mockCardItem,
        purchasePrice: null,
        currentValue: null,
      };
      render(<CardDetail item={noValueItem} />);
      expect(screen.getByText('无数据')).toBeInTheDocument();
    });
  });

  describe('Physical Characteristics', () => {
    it('should render physical characteristics section', () => {
      render(<CardDetail item={mockCardItem} />);
      expect(screen.getByText('物理特征')).toBeInTheDocument();
    });

    it('should render parallel version', () => {
      render(<CardDetail item={mockCardItem} />);
      expect(screen.getByText('Refractor')).toBeInTheDocument();
    });

    it('should render serial number', () => {
      render(<CardDetail item={mockCardItem} />);
      expect(screen.getByText('25/99')).toBeInTheDocument();
    });

    it('should render autograph badge when autographed', () => {
      render(<CardDetail item={mockCardItem} />);
      const autographBadges = screen.getAllByText('是');
      expect(autographBadges.length).toBeGreaterThan(0);
    });

    it('should render memorabilia type', () => {
      render(<CardDetail item={mockCardItem} />);
      expect(screen.getByText('Jersey Patch')).toBeInTheDocument();
    });

    it('should not render memorabilia type when not present', () => {
      const noMemorabiliaItem: CardItem = {
        ...mockCardItem,
        hasMemorabilia: false,
        memorabiliaType: null,
      };
      render(<CardDetail item={noMemorabiliaItem} />);
      expect(screen.queryByText('Jersey Patch')).not.toBeInTheDocument();
    });
  });

  describe('Storage Information', () => {
    it('should render storage information section', () => {
      render(<CardDetail item={mockCardItem} />);
      expect(screen.getByText('存储信息')).toBeInTheDocument();
    });

    it('should render status', () => {
      render(<CardDetail item={mockCardItem} />);
      expect(screen.getByText('收藏中')).toBeInTheDocument();
    });

    it('should render location', () => {
      render(<CardDetail item={mockCardItem} />);
      expect(screen.getByText('保险柜')).toBeInTheDocument();
    });

    it('should render storage type', () => {
      render(<CardDetail item={mockCardItem} />);
      expect(screen.getByText('评级盒')).toBeInTheDocument();
    });

    it('should render condition', () => {
      render(<CardDetail item={mockCardItem} />);
      expect(screen.getByText('完美品相，无瑕疵')).toBeInTheDocument();
    });
  });

  describe('Notes Section', () => {
    it('should render notes section when notes exist', () => {
      render(<CardDetail item={mockCardItem} />);
      expect(screen.getByText('备注信息')).toBeInTheDocument();
      expect(screen.getByText('这是一张投资级球星卡，具有很高的收藏价值。')).toBeInTheDocument();
    });

    it('should not render notes section when notes are null', () => {
      const itemWithoutNotes: CardItem = {
        ...mockCardItem,
        notes: null,
      };
      render(<CardDetail item={itemWithoutNotes} />);
      expect(screen.queryByText('备注信息')).not.toBeInTheDocument();
    });
  });

  describe('Timestamps', () => {
    it('should render timestamps section', () => {
      render(<CardDetail item={mockCardItem} />);
      expect(screen.getByText('记录信息')).toBeInTheDocument();
    });

    it('should render created date', () => {
      render(<CardDetail item={mockCardItem} />);
      // Date format: 2024年1月1日
      const dates = screen.getAllByText(/2024/);
      expect(dates.length).toBeGreaterThanOrEqual(1);
    });

    it('should render updated date', () => {
      render(<CardDetail item={mockCardItem} />);
      // Should have two dates (created and updated)
      const dates = screen.getAllByText(/2024/);
      expect(dates.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('DetailField Component', () => {
    it('should render field labels', () => {
      render(<CardDetail item={mockCardItem} />);
      expect(screen.getByText('球员姓名')).toBeInTheDocument();
      expect(screen.getByText('运动类型')).toBeInTheDocument();
      expect(screen.getByText('年份')).toBeInTheDocument();
    });

    it('should render field values', () => {
      render(<CardDetail item={mockCardItem} />);
      expect(screen.getByText('Michael Jordan')).toBeInTheDocument();
      expect(screen.getByText('篮球')).toBeInTheDocument();
      expect(screen.getByText('1986')).toBeInTheDocument();
    });
  });
});
