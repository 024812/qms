/**
 * Module Definition Types
 *
 * This file defines the core interfaces for the module system.
 * Each module must implement the ModuleDefinition interface.
 *
 * Requirements: 1.2, 5.1
 */

import { z } from 'zod';

/**
 * Module definition interface
 * Every item module must implement this interface
 */
export interface ModuleDefinition<
  TItem = unknown,
  TAttributes extends z.ZodRawShape = z.ZodRawShape,
> {
  /** Module unique identifier (kebab-case) */
  id: string;

  /** Module display name */
  name: string;

  /** Module description */
  description: string;

  /** Module icon (lucide-react icon name) */
  icon: string;

  /** Module color theme */
  color: string;

  /** Attributes Zod Schema */
  attributesSchema: z.ZodObject<TAttributes>;

  /** List card component */
  CardComponent?: React.ComponentType<{ item: TItem }>;

  /** Detail view component */
  DetailComponent?: React.ComponentType<{ item: TItem }>;

  /** Form field configuration */
  formFields: FormFieldConfig[];

  /** List column configuration */
  listColumns: ColumnConfig<TItem>[];

  /** Statistics configuration (optional) */
  statsConfig?: StatsConfig<TItem>;
}

/**
 * Form field configuration
 */
export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'textarea';
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
  required?: boolean;
  description?: string;
}

/**
 * Column configuration
 */
export interface ColumnConfig<TItem = unknown> {
  key: string;
  label: string;
  render?: (value: unknown, item: TItem) => unknown;
}

/**
 * Statistics configuration
 */
export interface StatsConfig<TItem = unknown> {
  metrics: Array<{
    key: string;
    label: string;
    calculate: (items: TItem[]) => number | string;
  }>;
}
