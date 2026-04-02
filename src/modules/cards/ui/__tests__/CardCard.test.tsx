import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CardCard } from '../CardCard';
import type { CardItem } from '../../schema';

const pushMock = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'enums.sport.BASKETBALL': 'Basketball',
      'enums.sport.SOCCER': 'Soccer',
      'enums.sport.OTHER': 'Other',
      'enums.status.COLLECTION': 'Collection',
      'enums.status.FOR_SALE': 'For Sale',
      'enums.status.SOLD': 'Sold',
      'enums.status.GRADING': 'Grading',
      'enums.status.DISPLAY': 'Display',
    };

    return translations[key] ?? key;
  },
}));

vi.mock('@/i18n/routing', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock('next/image', () => ({
  default: ({ alt, src }: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} />
  ),
}));

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
    purchasePrice: 100,
    purchaseDate: new Date('2023-01-01'),
    currentValue: 500,
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
    location: 'Vault',
    storageType: 'Slab',
    condition: 'Mint',
    notes: 'Investment grade card',
    tags: null,
    mainImage: 'https://example.com/card.jpg',
    attachmentImages: null,
  };

  beforeEach(() => {
    pushMock.mockReset();
  });

  it('renders player name', () => {
    render(<CardCard item={mockCardItem} />);

    expect(screen.getByText('Michael Jordan')).toBeInTheDocument();
  });

  it('renders item number', () => {
    render(<CardCard item={mockCardItem} />);

    expect(screen.getByText('#123')).toBeInTheDocument();
  });

  it('renders sport badge', () => {
    render(<CardCard item={mockCardItem} />);

    expect(screen.getByText('Basketball')).toBeInTheDocument();
  });

  it('renders status indicator title', () => {
    render(<CardCard item={mockCardItem} />);

    expect(screen.getByTitle('Collection')).toBeInTheDocument();
  });

  it('renders grading info when graded', () => {
    render(<CardCard item={mockCardItem} />);

    expect(screen.getByText('PSA 9.5')).toBeInTheDocument();
  });

  it('does not render grading badge when ungraded', () => {
    render(
      <CardCard
        item={{
          ...mockCardItem,
          gradingCompany: 'UNGRADED',
          grade: null,
        }}
      />
    );

    expect(screen.queryByText(/PSA/)).not.toBeInTheDocument();
  });

  it('renders year and brand', () => {
    render(<CardCard item={mockCardItem} />);

    expect(screen.getByText('1986 Fleer')).toBeInTheDocument();
  });

  it('renders current value when available', () => {
    render(<CardCard item={mockCardItem} />);

    expect(screen.getByText('$500')).toBeInTheDocument();
  });

  it('renders autograph marker when autographed', () => {
    render(<CardCard item={mockCardItem} />);

    expect(screen.getByText('Auto')).toBeInTheDocument();
  });

  it('renders memorabilia marker when present', () => {
    render(<CardCard item={mockCardItem} />);

    expect(screen.getByText('Mem')).toBeInTheDocument();
  });

  it('does not render autograph marker when absent', () => {
    render(
      <CardCard
        item={{
          ...mockCardItem,
          isAutographed: false,
        }}
      />
    );

    expect(screen.queryByText('Auto')).not.toBeInTheDocument();
  });

  it('does not render memorabilia marker when absent', () => {
    render(
      <CardCard
        item={{
          ...mockCardItem,
          hasMemorabilia: false,
        }}
      />
    );

    expect(screen.queryByText('Mem')).not.toBeInTheDocument();
  });

  it('renders main image when available', () => {
    render(<CardCard item={mockCardItem} />);

    expect(screen.getByAltText('Michael Jordan - 1986 Fleer')).toHaveAttribute(
      'src',
      'https://example.com/card.jpg'
    );
  });

  it('does not render image when mainImage is null', () => {
    render(
      <CardCard
        item={{
          ...mockCardItem,
          mainImage: null,
        }}
      />
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders correct sport label for SOCCER', () => {
    render(
      <CardCard
        item={{
          ...mockCardItem,
          sport: 'SOCCER',
        }}
      />
    );

    expect(screen.getByText('Soccer')).toBeInTheDocument();
  });

  it('renders correct sport label for OTHER', () => {
    render(
      <CardCard
        item={{
          ...mockCardItem,
          sport: 'OTHER',
        }}
      />
    );

    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('renders correct status title for FOR_SALE', () => {
    render(
      <CardCard
        item={{
          ...mockCardItem,
          status: 'FOR_SALE',
        }}
      />
    );

    expect(screen.getByTitle('For Sale')).toBeInTheDocument();
  });

  it('renders correct status title for SOLD', () => {
    render(
      <CardCard
        item={{
          ...mockCardItem,
          status: 'SOLD',
        }}
      />
    );

    expect(screen.getByTitle('Sold')).toBeInTheDocument();
  });

  it('renders correct status title for GRADING', () => {
    render(
      <CardCard
        item={{
          ...mockCardItem,
          status: 'GRADING',
        }}
      />
    );

    expect(screen.getByTitle('Grading')).toBeInTheDocument();
  });

  it('renders correct status title for DISPLAY', () => {
    render(
      <CardCard
        item={{
          ...mockCardItem,
          status: 'DISPLAY',
        }}
      />
    );

    expect(screen.getByTitle('Display')).toBeInTheDocument();
  });

  it('renders fallback value when current value is missing', () => {
    render(
      <CardCard
        item={{
          ...mockCardItem,
          currentValue: null,
        }}
      />
    );

    expect(screen.queryByText('$500')).not.toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('renders BGS grading company label', () => {
    render(
      <CardCard
        item={{
          ...mockCardItem,
          gradingCompany: 'BGS',
          grade: 9,
        }}
      />
    );

    expect(screen.getByText('BGS 9')).toBeInTheDocument();
  });

  it('renders SGC grading company label', () => {
    render(
      <CardCard
        item={{
          ...mockCardItem,
          gradingCompany: 'SGC',
          grade: 10,
        }}
      />
    );

    expect(screen.getByText('SGC 10')).toBeInTheDocument();
  });

  it('renders CGC grading company label', () => {
    render(
      <CardCard
        item={{
          ...mockCardItem,
          gradingCompany: 'CGC',
          grade: 9.5,
        }}
      />
    );

    expect(screen.getByText('CGC 9.5')).toBeInTheDocument();
  });

  it('navigates to the card detail page on click', () => {
    render(<CardCard item={mockCardItem} />);

    fireEvent.click(screen.getByText('Michael Jordan'));

    expect(pushMock).toHaveBeenCalledWith('/cards/test-card-1');
  });
});
