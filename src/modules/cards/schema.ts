/**
 * Sports Card Module Schema
 *
 * This module schema defines the structure for managing sports card collections.
 * It supports various sports, grading systems, and value tracking.
 *
 * Requirements: 2.2, 5.2
 */

import { z } from 'zod';

// ============================================================================
// Enum Definitions
// ============================================================================

/**
 * Sport types supported
 */
export const SportType = {
  BASKETBALL: 'BASKETBALL',
  SOCCER: 'SOCCER',
  OTHER: 'OTHER',
} as const;

export type SportType = (typeof SportType)[keyof typeof SportType];

export const SportTypeSchema = z.enum(['BASKETBALL', 'SOCCER', 'OTHER']);

/**
 * Card condition/grading systems
 */
export const GradingCompany = {
  PSA: 'PSA',
  BGS: 'BGS',
  SGC: 'SGC',
  CGC: 'CGC',
  UNGRADED: 'UNGRADED',
} as const;

export type GradingCompany = (typeof GradingCompany)[keyof typeof GradingCompany];

export const GradingCompanySchema = z.enum(['PSA', 'BGS', 'SGC', 'CGC', 'UNGRADED']);

/**
 * Card status
 */
export const CardStatus = {
  COLLECTION: 'COLLECTION',
  FOR_SALE: 'FOR_SALE',
  SOLD: 'SOLD',
  GRADING: 'GRADING',
  DISPLAY: 'DISPLAY',
} as const;

export type CardStatus = (typeof CardStatus)[keyof typeof CardStatus];

export const CardStatusSchema = z.enum(['COLLECTION', 'FOR_SALE', 'SOLD', 'GRADING', 'DISPLAY']);

// ============================================================================
// Card Attributes Schema
// ============================================================================

/**
 * Card attributes schema for the module registry
 *
 * This defines all the fields specific to sports cards:
 * - Player information (name, team, position)
 * - Card details (year, brand, series, card number)
 * - Grading information (company, grade, certification number)
 * - Value tracking (purchase price, current value, estimated value)
 * - Physical details (parallel, serial number, autograph, memorabilia)
 * - Storage and condition information
 */
export const cardAttributesSchema = z.object({
  // Player Information
  playerName: z.string().min(1, 'Player name is required').max(100, 'Player name too long').trim(),

  sport: SportTypeSchema,

  team: z.string().max(100, 'Team name too long').optional(),

  position: z.string().max(50, 'Position too long').optional(),

  // Card Details
  year: z
    .number()
    .int('Year must be an integer')
    .min(1800, 'Year too old')
    .max(new Date().getFullYear() + 1, 'Year cannot be in the future'),

  brand: z.string().min(1, 'Brand is required').max(100, 'Brand name too long').trim(),

  series: z.string().max(100, 'Series name too long').optional(),

  cardNumber: z.string().max(50, 'Card number too long').optional(),

  // Grading Information
  gradingCompany: GradingCompanySchema.optional().default('UNGRADED'),

  grade: z.number().min(1, 'Grade must be at least 1').max(10, 'Grade cannot exceed 10').optional(),

  certificationNumber: z.string().max(100, 'Certification number too long').optional(),

  // Value Information
  purchasePrice: z.number().min(0, 'Purchase price cannot be negative').optional(),

  purchaseDate: z.date().max(new Date(), 'Purchase date cannot be in the future').optional(),

  currentValue: z.number().min(0, 'Current value cannot be negative').optional(),

  estimatedValue: z.number().min(0, 'Estimated value cannot be negative').optional(),

  lastValueUpdate: z.date().optional(),

  // Physical Details
  parallel: z.string().max(100, 'Parallel name too long').optional(),

  serialNumber: z.string().max(50, 'Serial number too long').optional(),

  isAutographed: z.boolean().optional().default(false),

  hasMemorabilia: z.boolean().optional().default(false),

  memorabiliaType: z.string().max(100, 'Memorabilia type too long').optional(),

  // Storage and Condition
  status: CardStatusSchema.optional().default('COLLECTION'),

  location: z.string().max(200, 'Location too long').optional(),

  storageType: z.string().max(100, 'Storage type too long').optional(),

  condition: z.string().max(500, 'Condition description too long').optional(),

  // Additional Information
  notes: z.string().max(2000, 'Notes too long').optional(),

  tags: z.array(z.string().max(50)).optional(),
});

/**
 * Type for card attributes
 */
export type CardAttributes = z.infer<typeof cardAttributesSchema>;

// ============================================================================
// Complete Card Schema
// ============================================================================

/**
 * Complete Card Schema representing a card record
 */
export const CardSchema = z.object({
  id: z.string().uuid(),
  itemNumber: z.number().int().positive(),
  playerName: z.string(),
  sport: SportTypeSchema,
  team: z.string().nullable(),
  position: z.string().nullable(),
  year: z.number().int(),
  brand: z.string(),
  series: z.string().nullable(),
  cardNumber: z.string().nullable(),
  gradingCompany: GradingCompanySchema,
  grade: z.number().nullable(),
  certificationNumber: z.string().nullable(),
  purchasePrice: z.number().nullable(),
  purchaseDate: z.date().nullable(),
  currentValue: z.number().nullable(),
  estimatedValue: z.number().nullable(),
  lastValueUpdate: z.date().nullable(),
  parallel: z.string().nullable(),
  serialNumber: z.string().nullable(),
  isAutographed: z.boolean(),
  hasMemorabilia: z.boolean(),
  memorabiliaType: z.string().nullable(),
  status: CardStatusSchema,
  location: z.string().nullable(),
  storageType: z.string().nullable(),
  condition: z.string().nullable(),
  notes: z.string().nullable(),
  tags: z.array(z.string()).nullable(),
  mainImage: z.string().nullable(),
  attachmentImages: z.array(z.string()).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Card type derived from CardSchema
 */
export type Card = z.infer<typeof CardSchema>;

/**
 * Extended Card type that includes the base Item fields
 */
export interface CardItem {
  id: string;
  type: 'card';
  createdAt: Date;
  updatedAt: Date;
  itemNumber: number;
  playerName: string;
  sport: SportType;
  team: string | null;
  position: string | null;
  year: number;
  brand: string;
  series: string | null;
  cardNumber: string | null;
  gradingCompany: GradingCompany;
  grade: number | null;
  certificationNumber: string | null;
  purchasePrice: number | null;
  purchaseDate: Date | null;
  currentValue: number | null;
  estimatedValue: number | null;
  lastValueUpdate: Date | null;
  parallel: string | null;
  serialNumber: string | null;
  isAutographed: boolean;
  hasMemorabilia: boolean;
  memorabiliaType: string | null;
  status: CardStatus;
  location: string | null;
  storageType: string | null;
  condition: string | null;
  notes: string | null;
  tags: string[] | null;
  mainImage: string | null;
  attachmentImages: string[] | null;
}

/**
 * Helper function to convert a Card to CardItem format
 */
export function cardToCardItem(card: Card): CardItem {
  return {
    id: card.id,
    type: 'card',
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
    itemNumber: card.itemNumber,
    playerName: card.playerName,
    sport: card.sport,
    team: card.team,
    position: card.position,
    year: card.year,
    brand: card.brand,
    series: card.series,
    cardNumber: card.cardNumber,
    gradingCompany: card.gradingCompany,
    grade: card.grade,
    certificationNumber: card.certificationNumber,
    purchasePrice: card.purchasePrice,
    purchaseDate: card.purchaseDate,
    currentValue: card.currentValue,
    estimatedValue: card.estimatedValue,
    lastValueUpdate: card.lastValueUpdate,
    parallel: card.parallel,
    serialNumber: card.serialNumber,
    isAutographed: card.isAutographed,
    hasMemorabilia: card.hasMemorabilia,
    memorabiliaType: card.memorabiliaType,
    status: card.status,
    location: card.location,
    storageType: card.storageType,
    condition: card.condition,
    notes: card.notes,
    tags: card.tags,
    mainImage: card.mainImage,
    attachmentImages: card.attachmentImages,
  };
}

/**
 * Helper function to convert CardItem back to Card format
 */
export function cardItemToCard(item: CardItem): Card {
  return {
    id: item.id,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    itemNumber: item.itemNumber,
    playerName: item.playerName,
    sport: item.sport,
    team: item.team,
    position: item.position,
    year: item.year,
    brand: item.brand,
    series: item.series,
    cardNumber: item.cardNumber,
    gradingCompany: item.gradingCompany,
    grade: item.grade,
    certificationNumber: item.certificationNumber,
    purchasePrice: item.purchasePrice,
    purchaseDate: item.purchaseDate,
    currentValue: item.currentValue,
    estimatedValue: item.estimatedValue,
    lastValueUpdate: item.lastValueUpdate,
    parallel: item.parallel,
    serialNumber: item.serialNumber,
    isAutographed: item.isAutographed,
    hasMemorabilia: item.hasMemorabilia,
    memorabiliaType: item.memorabiliaType,
    status: item.status,
    location: item.location,
    storageType: item.storageType,
    condition: item.condition,
    notes: item.notes,
    tags: item.tags,
    mainImage: item.mainImage,
    attachmentImages: item.attachmentImages,
  };
}

// ============================================================================
// Value History Schema
// ============================================================================

/**
 * Value history record for tracking card value over time
 */
export const ValueHistorySchema = z.object({
  id: z.string().uuid(),
  cardId: z.string().uuid(),
  value: z.number().min(0),
  source: z.string().max(100).optional(),
  recordedAt: z.date(),
  notes: z.string().max(500).optional(),
  createdAt: z.date(),
});

export type ValueHistory = z.infer<typeof ValueHistorySchema>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format currency value
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Calculate value change percentage
 */
export function calculateValueChange(
  currentValue: number | null,
  purchasePrice: number | null
): { change: number; percentage: number } | null {
  if (!currentValue || !purchasePrice || purchasePrice === 0) return null;

  const change = currentValue - purchasePrice;
  const percentage = (change / purchasePrice) * 100;

  return {
    change: Math.round(change * 100) / 100,
    percentage: Math.round(percentage * 100) / 100,
  };
}

/**
 * Get sport display name in Chinese
 */
export function getSportDisplayName(sport: SportType): string {
  const sportMap: Record<SportType, string> = {
    BASKETBALL: '篮球',
    SOCCER: '足球',
    OTHER: '其他',
  };
  return sportMap[sport] || sport;
}

/**
 * Get grading company display name
 */
export function getGradingCompanyDisplayName(company: GradingCompany): string {
  const companyMap: Record<GradingCompany, string> = {
    PSA: 'PSA',
    BGS: 'BGS (Beckett)',
    SGC: 'SGC',
    CGC: 'CGC',
    UNGRADED: '未评级',
  };
  return companyMap[company] || company;
}

/**
 * Get status display name in Chinese
 */
export function getStatusDisplayName(status: CardStatus): string {
  const statusMap: Record<CardStatus, string> = {
    COLLECTION: '收藏中',
    FOR_SALE: '待售',
    SOLD: '已售出',
    GRADING: '评级中',
    DISPLAY: '展示中',
  };
  return statusMap[status] || status;
}
