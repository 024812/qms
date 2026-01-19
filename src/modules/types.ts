/**
 * Module Definition Types
 * 
 * This file defines the core interfaces for the module system.
 * Each module must implement the ModuleDefinition interface.
 * 
 * Requirements: 1.2, 5.1
 */

import { z } from 'zod';
import { ReactNode } from 'react';

/**
 * Module definition interface
 * Every item module must implement this interface
 */
export interface ModuleDefinition {
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
  attributesSchema: z.ZodObject<any>;

  /** List card component */
  CardComponent?: React.ComponentType<{ item: any }>;

  /** Detail view component */
  DetailComponent?: React.ComponentType<{ item: any }>;

  /** Form field configuration */
  formFields: FormFieldConfig[];

  /** List column configuration */
  listColumns: ColumnConfig[];

  /** Statistics configuration (optional) */
  statsConfig?: StatsConfig;
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
export interface ColumnConfig {
  key: string;
  label: string;
  render?: (value: any, item: any) => ReactNode;
}

/**
 * Statistics configuration
 */
export interface StatsConfig {
  metrics: Array<{
    key: string;
    label: string;
    calculate: (items: any[]) => number | string;
  }>;
}
