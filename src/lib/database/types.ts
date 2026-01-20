/**
 * Database Type Definitions
 *
 * This file defines types for database rows (snake_case) and transformer functions
 * to convert between database rows and application models.
 *
 * Application model types (Quilt, UsageRecord, MaintenanceRecord) are imported from
 * the Zod validation schemas which serve as the single source of truth.
 */

import {
  Season,
  QuiltStatus,
  UsageType,
  // Import model types from Zod schemas (single source of truth)
  type Quilt,
  type UsageRecord,
  type MaintenanceRecord,
} from '@/lib/validations/quilt';

// Re-export model types for convenience
export type { Quilt, UsageRecord, MaintenanceRecord };

// ============================================================================
// Database Row Types (snake_case - matches PostgreSQL schema)
// ============================================================================

export interface QuiltRow {
  id: string;
  item_number: number;
  group_id: number | null;
  name: string;
  season: string;
  length_cm: number | null;
  width_cm: number | null;
  weight_grams: number | null;
  fill_material: string;
  material_details: string | null;
  color: string;
  brand: string | null;
  purchase_date: string | null;
  location: string;
  packaging_info: string | null;
  current_status: string;
  notes: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
  main_image: string | null;
  attachment_images: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface UsageRecordRow {
  id: string;
  quilt_id: string;
  start_date: string;
  end_date: string | null;
  usage_type: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceRecordRow {
  id: string;
  quilt_id: string;
  maintenance_type: string;
  description: string;
  performed_at: string;
  cost: number | null;
  next_due_date: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Transformer Functions
// ============================================================================

/**
 * Convert a database row to a Quilt application model
 */
export function rowToQuilt(row: QuiltRow): Quilt {
  return {
    id: row.id,
    itemNumber: row.item_number,
    groupId: row.group_id,
    name: row.name,
    season: row.season as Season,
    lengthCm: row.length_cm,
    widthCm: row.width_cm,
    weightGrams: row.weight_grams,
    fillMaterial: row.fill_material,
    materialDetails: row.material_details,
    color: row.color,
    brand: row.brand,
    purchaseDate: row.purchase_date ? new Date(row.purchase_date) : null,
    location: row.location,
    packagingInfo: row.packaging_info,
    currentStatus: row.current_status as QuiltStatus,
    notes: row.notes,
    imageUrl: row.image_url,
    thumbnailUrl: row.thumbnail_url,
    mainImage: row.main_image,
    attachmentImages: row.attachment_images,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Convert a Quilt application model to a database row (partial for updates)
 */
export function quiltToRow(quilt: Partial<Quilt>): Partial<QuiltRow> {
  const row: Partial<QuiltRow> = {};

  if (quilt.id !== undefined) row.id = quilt.id;
  if (quilt.itemNumber !== undefined) row.item_number = quilt.itemNumber;
  if (quilt.groupId !== undefined) row.group_id = quilt.groupId;
  if (quilt.name !== undefined) row.name = quilt.name;
  if (quilt.season !== undefined) row.season = quilt.season;
  if (quilt.lengthCm !== undefined) row.length_cm = quilt.lengthCm;
  if (quilt.widthCm !== undefined) row.width_cm = quilt.widthCm;
  if (quilt.weightGrams !== undefined) row.weight_grams = quilt.weightGrams;
  if (quilt.fillMaterial !== undefined) row.fill_material = quilt.fillMaterial;
  if (quilt.materialDetails !== undefined) row.material_details = quilt.materialDetails;
  if (quilt.color !== undefined) row.color = quilt.color;
  if (quilt.brand !== undefined) row.brand = quilt.brand;
  if (quilt.purchaseDate !== undefined) {
    row.purchase_date = quilt.purchaseDate ? quilt.purchaseDate.toISOString() : null;
  }
  if (quilt.location !== undefined) row.location = quilt.location;
  if (quilt.packagingInfo !== undefined) row.packaging_info = quilt.packagingInfo;
  if (quilt.currentStatus !== undefined) row.current_status = quilt.currentStatus;
  if (quilt.notes !== undefined) row.notes = quilt.notes;
  if (quilt.imageUrl !== undefined) row.image_url = quilt.imageUrl;
  if (quilt.thumbnailUrl !== undefined) row.thumbnail_url = quilt.thumbnailUrl;
  if (quilt.mainImage !== undefined) row.main_image = quilt.mainImage;
  if (quilt.attachmentImages !== undefined) row.attachment_images = quilt.attachmentImages;
  if (quilt.createdAt !== undefined) row.created_at = quilt.createdAt.toISOString();
  if (quilt.updatedAt !== undefined) row.updated_at = quilt.updatedAt.toISOString();

  return row;
}

/**
 * Convert a database row to a UsageRecord application model
 */
export function rowToUsageRecord(row: UsageRecordRow): UsageRecord {
  return {
    id: row.id,
    quiltId: row.quilt_id,
    startDate: new Date(row.start_date),
    endDate: row.end_date ? new Date(row.end_date) : null,
    usageType: row.usage_type as UsageType,
    notes: row.notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Convert a UsageRecord application model to a database row (partial for updates)
 */
export function usageRecordToRow(record: Partial<UsageRecord>): Partial<UsageRecordRow> {
  const row: Partial<UsageRecordRow> = {};

  if (record.id !== undefined) row.id = record.id;
  if (record.quiltId !== undefined) row.quilt_id = record.quiltId;
  if (record.startDate !== undefined) row.start_date = record.startDate.toISOString();
  if (record.endDate !== undefined) {
    row.end_date = record.endDate ? record.endDate.toISOString() : null;
  }
  if (record.usageType !== undefined) row.usage_type = record.usageType;
  if (record.notes !== undefined) row.notes = record.notes;
  if (record.createdAt !== undefined) row.created_at = record.createdAt.toISOString();
  if (record.updatedAt !== undefined) row.updated_at = record.updatedAt.toISOString();

  return row;
}

/**
 * Convert a database row to a MaintenanceRecord application model
 */
export function rowToMaintenanceRecord(row: MaintenanceRecordRow): MaintenanceRecord {
  return {
    id: row.id,
    quiltId: row.quilt_id,
    maintenanceType: row.maintenance_type,
    description: row.description,
    performedAt: new Date(row.performed_at),
    cost: row.cost,
    nextDueDate: row.next_due_date ? new Date(row.next_due_date) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Convert a MaintenanceRecord application model to a database row (partial for updates)
 */
export function maintenanceRecordToRow(
  record: Partial<MaintenanceRecord>
): Partial<MaintenanceRecordRow> {
  const row: Partial<MaintenanceRecordRow> = {};

  if (record.id !== undefined) row.id = record.id;
  if (record.quiltId !== undefined) row.quilt_id = record.quiltId;
  if (record.maintenanceType !== undefined) row.maintenance_type = record.maintenanceType;
  if (record.description !== undefined) row.description = record.description;
  if (record.performedAt !== undefined) row.performed_at = record.performedAt.toISOString();
  if (record.cost !== undefined) row.cost = record.cost;
  if (record.nextDueDate !== undefined) {
    row.next_due_date = record.nextDueDate ? record.nextDueDate.toISOString() : null;
  }
  if (record.createdAt !== undefined) row.created_at = record.createdAt.toISOString();
  if (record.updatedAt !== undefined) row.updated_at = record.updatedAt.toISOString();

  return row;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if a value is a valid Season
 */
export function isSeason(value: unknown): value is Season {
  return typeof value === 'string' && ['WINTER', 'SPRING_AUTUMN', 'SUMMER'].includes(value);
}

/**
 * Check if a value is a valid QuiltStatus
 * Note: AVAILABLE status removed per Requirements 7.2 - use STORAGE instead
 */
export function isQuiltStatus(value: unknown): value is QuiltStatus {
  return typeof value === 'string' && ['IN_USE', 'STORAGE', 'MAINTENANCE'].includes(value);
}

/**
 * Check if a value is a valid UsageType
 */
export function isUsageType(value: unknown): value is UsageType {
  return (
    typeof value === 'string' &&
    ['REGULAR', 'GUEST', 'SPECIAL_OCCASION', 'SEASONAL_ROTATION'].includes(value)
  );
}

// ============================================================================
// Card Types (for independent cards table)
// ============================================================================

import type { CardItem, SportType, GradingCompany, CardStatus } from '@/modules/cards/schema';

/**
 * Database row type for cards table (snake_case - matches PostgreSQL schema)
 *
 * Requirements: 5.6 - Type-safe database row definitions
 */
export interface CardRow {
  id: string;
  user_id: string;
  item_number: number;
  player_name: string;
  sport: string;
  team: string | null;
  position: string | null;
  year: number;
  brand: string;
  series: string | null;
  card_number: string | null;
  grading_company: string;
  grade: string | null; // numeric stored as string
  certification_number: string | null;
  purchase_price: string | null; // numeric stored as string
  purchase_date: string | null; // date stored as string
  current_value: string | null; // numeric stored as string
  estimated_value: string | null; // numeric stored as string
  parallel: string | null;
  serial_number: string | null;
  is_autographed: boolean;
  has_memorabilia: boolean;
  memorabilia_type: string | null;
  status: string;
  location: string | null;
  storage_type: string | null;
  condition: string | null;
  notes: string | null;
  main_image: string | null;
  attachment_images: string[] | null;
  created_at: string;
  updated_at: string;
}

/**
 * Convert a database row to a CardItem application model
 *
 * Transforms snake_case database columns to camelCase application properties.
 * Handles type conversions for numeric and date fields.
 *
 * Requirements: 5.6, 5.7 - Type-safe row to model conversion
 */
export function rowToCardItem(row: CardRow): CardItem {
  return {
    id: row.id,
    type: 'card',
    itemNumber: row.item_number,
    playerName: row.player_name,
    sport: row.sport as SportType,
    team: row.team,
    position: row.position,
    year: row.year,
    brand: row.brand,
    series: row.series,
    cardNumber: row.card_number,
    gradingCompany: row.grading_company as GradingCompany,
    grade: row.grade ? parseFloat(row.grade) : null,
    certificationNumber: row.certification_number,
    purchasePrice: row.purchase_price ? parseFloat(row.purchase_price) : null,
    purchaseDate: row.purchase_date ? new Date(row.purchase_date) : null,
    currentValue: row.current_value ? parseFloat(row.current_value) : null,
    estimatedValue: row.estimated_value ? parseFloat(row.estimated_value) : null,
    lastValueUpdate: null, // Not stored in cards table yet
    parallel: row.parallel,
    serialNumber: row.serial_number,
    isAutographed: row.is_autographed,
    hasMemorabilia: row.has_memorabilia,
    memorabiliaType: row.memorabilia_type,
    status: row.status as CardStatus,
    location: row.location,
    storageType: row.storage_type,
    condition: row.condition,
    notes: row.notes,
    tags: null, // Not stored in cards table yet
    mainImage: row.main_image,
    attachmentImages: row.attachment_images,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Convert a CardItem application model to a database row (partial for updates)
 *
 * Transforms camelCase application properties to snake_case database columns.
 * Handles type conversions for numeric and date fields.
 *
 * Requirements: 5.6, 5.7 - Type-safe model to row conversion
 */
export function cardItemToRow(item: Partial<CardItem>): Partial<CardRow> {
  const row: Partial<CardRow> = {};

  if (item.id !== undefined) row.id = item.id;
  if (item.itemNumber !== undefined) row.item_number = item.itemNumber;
  if (item.playerName !== undefined) row.player_name = item.playerName;
  if (item.sport !== undefined) row.sport = item.sport;
  if (item.team !== undefined) row.team = item.team;
  if (item.position !== undefined) row.position = item.position;
  if (item.year !== undefined) row.year = item.year;
  if (item.brand !== undefined) row.brand = item.brand;
  if (item.series !== undefined) row.series = item.series;
  if (item.cardNumber !== undefined) row.card_number = item.cardNumber;
  if (item.gradingCompany !== undefined) row.grading_company = item.gradingCompany;
  if (item.grade !== undefined) row.grade = item.grade !== null ? item.grade.toString() : null;
  if (item.certificationNumber !== undefined) row.certification_number = item.certificationNumber;
  if (item.purchasePrice !== undefined)
    row.purchase_price = item.purchasePrice !== null ? item.purchasePrice.toString() : null;
  if (item.purchaseDate !== undefined)
    row.purchase_date = item.purchaseDate ? item.purchaseDate.toISOString() : null;
  if (item.currentValue !== undefined)
    row.current_value = item.currentValue !== null ? item.currentValue.toString() : null;
  if (item.estimatedValue !== undefined)
    row.estimated_value = item.estimatedValue !== null ? item.estimatedValue.toString() : null;
  if (item.parallel !== undefined) row.parallel = item.parallel;
  if (item.serialNumber !== undefined) row.serial_number = item.serialNumber;
  if (item.isAutographed !== undefined) row.is_autographed = item.isAutographed;
  if (item.hasMemorabilia !== undefined) row.has_memorabilia = item.hasMemorabilia;
  if (item.memorabiliaType !== undefined) row.memorabilia_type = item.memorabiliaType;
  if (item.status !== undefined) row.status = item.status;
  if (item.location !== undefined) row.location = item.location;
  if (item.storageType !== undefined) row.storage_type = item.storageType;
  if (item.condition !== undefined) row.condition = item.condition;
  if (item.notes !== undefined) row.notes = item.notes;
  if (item.mainImage !== undefined) row.main_image = item.mainImage;
  if (item.attachmentImages !== undefined) row.attachment_images = item.attachmentImages;
  if (item.createdAt !== undefined) row.created_at = item.createdAt.toISOString();
  if (item.updatedAt !== undefined) row.updated_at = item.updatedAt.toISOString();

  return row;
}

/**
 * Check if a value is a valid SportType
 *
 * Requirements: 5.6 - Type guards for validation
 */
export function isSportType(value: unknown): value is SportType {
  return typeof value === 'string' && ['BASKETBALL', 'SOCCER', 'OTHER'].includes(value);
}

/**
 * Check if a value is a valid GradingCompany
 *
 * Requirements: 5.6 - Type guards for validation
 */
export function isGradingCompany(value: unknown): value is GradingCompany {
  return typeof value === 'string' && ['PSA', 'BGS', 'SGC', 'CGC', 'UNGRADED'].includes(value);
}

/**
 * Check if a value is a valid CardStatus
 *
 * Requirements: 5.6 - Type guards for validation
 */
export function isCardStatus(value: unknown): value is CardStatus {
  return (
    typeof value === 'string' &&
    ['COLLECTION', 'FOR_SALE', 'SOLD', 'GRADING', 'DISPLAY'].includes(value)
  );
}
