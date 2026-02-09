/**
 * Quilts Module Types
 *
 * Re-exports all types from the schema for convenient imports.
 * Example: import { Quilt, Season } from '@/modules/quilts/types';
 */

export type {
  // Core types
  Season,
  QuiltStatus,
  UsageType,
  Quilt,
  UsageRecord,
  MaintenanceRecord,

  // Input types
  CreateQuiltInput,
  UpdateQuiltInput,
  CreateUsagePeriodInput,
  CreateCurrentUsageInput,
  EndCurrentUsageInput,
  QuiltFiltersInput,
  QuiltSearchInput,
  CreateMaintenanceRecordInput,
  AnalyticsDateRangeInput,
  DashboardStatsInput,

  // Database types
  QuiltRow,
  UsageRecordRow,
  MaintenanceRecordRow,

  // Module types
  QuiltAttributes,
  QuiltItem,
} from './schema';

// Re-export helper functions
export {
  quiltToQuiltItem,
  quiltItemToQuilt,
  rowToQuilt,
  quiltToRow,
  rowToUsageRecord,
  usageRecordToRow,
  rowToMaintenanceRecord,
  maintenanceRecordToRow,
  isSeason,
  isQuiltStatus,
  isUsageType,
} from './schema';
