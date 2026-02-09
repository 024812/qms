/**
 * Cards Module Types
 *
 * Re-exports all types from the schema for convenient imports.
 * Example: import { Card, SportType } from '@/modules/cards/types';
 */

export type {
  // Enum types
  SportType,
  GradingCompany,
  CardStatus,

  // Core types
  Card,
  CardItem,
  CardAttributes,
  ValueHistory,
} from './schema';

// Re-export enums as values
export {
  SportType as SportTypeEnum,
  GradingCompany as GradingCompanyEnum,
  CardStatus as CardStatusEnum,
} from './schema';

// Re-export schemas for validation
export {
  SportTypeSchema,
  GradingCompanySchema,
  CardStatusSchema,
  cardAttributesSchema,
  CardSchema,
  ValueHistorySchema,
} from './schema';

// Re-export helper functions
export {
  cardToCardItem,
  cardItemToCard,
  formatCurrency,
  calculateValueChange,
  getSportDisplayName,
  getGradingCompanyDisplayName,
  getStatusDisplayName,
} from './schema';
