/**
 * Quilt Type Definitions
 *
 * This file re-exports core types from the Zod validation schemas (single source of truth)
 * and defines additional UI-specific types.
 */

// ============================================================================
// Re-export core types from Zod schemas (single source of truth)
// ============================================================================

// Re-export enum constants and their types (declaration merging)
// Using a single export handles both the value and type
export {
  Season,
  QuiltStatus,
  QUILT_STATUSES,
  UsageType,
  SeasonSchema,
  QuiltStatusSchema,
  UsageTypeSchema,
  QuiltSchema,
  UsageRecordSchema,
  MaintenanceRecordSchema,
  createQuiltSchema,
  updateQuiltSchema,
  quiltFiltersSchema,
  quiltSearchSchema,
} from '@/lib/validations/quilt';

// Re-export model types (type-only exports)
export type {
  Quilt,
  UsageRecord,
  MaintenanceRecord,
  CreateQuiltInput,
  UpdateQuiltInput,
  QuiltFiltersInput,
  QuiltSearchInput,
} from '@/lib/validations/quilt';

// ============================================================================
// UI-specific Types
// ============================================================================

export type ViewMode = 'list' | 'grid';
export type SortDirection = 'asc' | 'desc';

export type SortField =
  | 'itemNumber'
  | 'name'
  | 'season'
  | 'size'
  | 'weight'
  | 'fillMaterial'
  | 'color'
  | 'location'
  | 'currentStatus';

// Import types for use in interfaces below
import type {
  Season as SeasonType,
  QuiltStatus as QuiltStatusType,
  Quilt as QuiltType,
} from '@/lib/validations/quilt';

export interface FilterCriteria {
  seasons: SeasonType[];
  statuses: QuiltStatusType[];
  colors: string[];
  materials: string[];
  locations?: string[];
  brands?: string[];
  minWeight?: number;
  maxWeight?: number;
}

export interface QuiltFormData {
  name?: string;
  season: SeasonType;
  lengthCm: number;
  widthCm: number;
  weightGrams: number;
  fillMaterial: string;
  materialDetails?: string;
  color: string;
  location: string;
  packagingInfo?: string;
  currentStatus: QuiltStatusType;
  brand?: string;
  purchaseDate?: string | Date;
  mainImage?: string | null;
  attachmentImages?: string[] | null;
  notes?: string;
}

export interface QuiltDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quilt?: QuiltType | null;
  onSave: (data: QuiltFormData) => Promise<void>;
}

export interface StatusChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quilt?: QuiltType | null;
  onStatusChange: (status: QuiltStatusType, date?: Date, notes?: string) => Promise<void>;
}

// Helper type for quilt list operations
export type QuiltListItem = QuiltType;

// Helper type for quilt card operations
export type QuiltCardItem = QuiltType;
