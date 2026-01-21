/**
 * Data Export Service
 * 
 * Provides data export functionality in multiple formats (CSV, Excel).
 * Supports custom field mapping and formatting.
 * 
 * Requirements: 6.3 - Data export service supporting CSV and Excel formats
 */

// Item import removed

/**
 * Export field configuration
 */
export interface ExportFieldConfig {
  /** Field key (can use dot notation for nested fields) */
  key: string;
  /** Column header label */
  label: string;
  /** Optional formatter function */
  format?: (value: any, item: any) => string;
}

/**
 * Export options
 */
export interface ExportOptions {
  /** Fields to export */
  fields: ExportFieldConfig[];
  /** File name (without extension) */
  fileName?: string;
  /** Include header row */
  includeHeader?: boolean;
}

/**
 * Get nested value from object using dot notation
 * 
 * @param obj - Object to get value from
 * @param path - Dot-notation path (e.g., "attributes.size")
 * @returns Value at path or undefined
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Escape CSV value
 * 
 * @param value - Value to escape
 * @returns Escaped value
 */
function escapeCsvValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Export data to CSV format
 * 
 * @param data - Array of items to export
 * @param options - Export options
 * @returns CSV string
 */
export function exportToCSV<T = any>(data: T[], options: ExportOptions): string {
  const { fields, includeHeader = true } = options;

  const lines: string[] = [];

  // Add header row
  if (includeHeader) {
    const headers = fields.map((field) => escapeCsvValue(field.label));
    lines.push(headers.join(','));
  }

  // Add data rows
  for (const item of data) {
    const values = fields.map((field) => {
      const rawValue = getNestedValue(item, field.key);
      const formattedValue = field.format ? field.format(rawValue, item) : rawValue;
      return escapeCsvValue(formattedValue);
    });
    lines.push(values.join(','));
  }

  return lines.join('\n');
}

/**
 * Export data to Excel-compatible CSV format (UTF-8 with BOM)
 * 
 * @param data - Array of items to export
 * @param options - Export options
 * @returns CSV string with BOM
 */
export function exportToExcel<T = any>(data: T[], options: ExportOptions): string {
  const csv = exportToCSV(data, options);
  // Add UTF-8 BOM for Excel compatibility
  return '\uFEFF' + csv;
}

/**
 * Create download blob for CSV
 * 
 * @param csvContent - CSV content string
 * @param fileName - File name (without extension)
 * @returns Blob object
 */
export function createCSVBlob(csvContent: string, fileName: string = 'export'): Blob {
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Create download blob for Excel
 * 
 * @param csvContent - CSV content string with BOM
 * @param fileName - File name (without extension)
 * @returns Blob object
 */
export function createExcelBlob(csvContent: string, fileName: string = 'export'): Blob {
  return new Blob([csvContent], {
    type: 'application/vnd.ms-excel;charset=utf-8;',
  });
}

/**
 * Trigger browser download
 * 
 * @param blob - Blob to download
 * @param fileName - File name with extension
 */
export function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export items to CSV and trigger download
 * 
 * @param data - Array of items to export
 * @param options - Export options
 */
export function downloadCSV<T = any>(data: T[], options: ExportOptions): void {
  const fileName = options.fileName || 'export';
  const csv = exportToCSV(data, options);
  const blob = createCSVBlob(csv, fileName);
  triggerDownload(blob, `${fileName}.csv`);
}

/**
 * Export items to Excel and trigger download
 * 
 * @param data - Array of items to export
 * @param options - Export options
 */
export function downloadExcel<T = any>(data: T[], options: ExportOptions): void {
  const fileName = options.fileName || 'export';
  const csv = exportToExcel(data, options);
  const blob = createExcelBlob(csv, fileName);
  triggerDownload(blob, `${fileName}.xlsx`);
}

/**
 * Common formatters for export
 */
export const ExportFormatters = {
  /**
   * Format date to YYYY-MM-DD
   */
  date: (value: any): string => {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    return date.toISOString().split('T')[0];
  },

  /**
   * Format datetime to YYYY-MM-DD HH:mm:ss
   */
  datetime: (value: any): string => {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    return date.toISOString().replace('T', ' ').split('.')[0];
  },

  /**
   * Format number with specified decimal places
   */
  number: (decimals: number = 2) => (value: any): string => {
    if (value === null || value === undefined || isNaN(value)) return '';
    return Number(value).toFixed(decimals);
  },

  /**
   * Format currency (CNY)
   */
  currency: (value: any): string => {
    if (value === null || value === undefined || isNaN(value)) return '';
    return `¥${Number(value).toFixed(2)}`;
  },

  /**
   * Format boolean as Yes/No
   */
  boolean: (value: any): string => {
    return value ? '是' : '否';
  },

  /**
   * Format array as comma-separated string
   */
  array: (value: any): string => {
    if (!Array.isArray(value)) return '';
    return value.join(', ');
  },

  /**
   * Format JSON object as string
   */
  json: (value: any): string => {
    if (value === null || value === undefined) return '';
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  },

  /**
   * Truncate long text
   */
  truncate: (maxLength: number = 50) => (value: any): string => {
    if (!value) return '';
    const str = String(value);
    return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
  },
};

/**
 * Pre-defined field configurations for common item fields
 */
export const CommonExportFields = {
  /**
   * Basic item fields
   */
  basic: (): ExportFieldConfig[] => [
    { key: 'id', label: 'ID' },
    { key: 'name', label: '名称' },
    { key: 'type', label: '类型' },
    { key: 'status', label: '状态' },
    { key: 'createdAt', label: '创建时间', format: ExportFormatters.datetime },
    { key: 'updatedAt', label: '更新时间', format: ExportFormatters.datetime },
  ],

  /**
   * Item with owner information
   */
  withOwner: (): ExportFieldConfig[] => [
    ...CommonExportFields.basic(),
    { key: 'ownerId', label: '所有者ID' },
  ],

  /**
   * Item with images
   */
  withImages: (): ExportFieldConfig[] => [
    ...CommonExportFields.basic(),
    { key: 'images', label: '图片数量', format: (value) => String(value?.length || 0) },
  ],
};

/**
 * Create custom export fields for a module
 * 
 * @param attributeFields - Array of attribute field configurations
 * @returns Complete export field configuration
 */
export function createModuleExportFields(
  attributeFields: Array<{ key: string; label: string; format?: (value: any) => string }>
): ExportFieldConfig[] {
  const basicFields = CommonExportFields.basic();
  const customFields = attributeFields.map((field) => ({
    key: `attributes.${field.key}`,
    label: field.label,
    format: field.format,
  }));

  return [...basicFields, ...customFields];
}

/**
 * Batch export with progress tracking
 */
export async function exportWithProgress<T = any>(
  data: T[],
  options: ExportOptions,
  onProgress?: (progress: number) => void
): Promise<string> {
  const { fields, includeHeader = true } = options;
  const lines: string[] = [];
  const batchSize = 100;

  // Add header
  if (includeHeader) {
    const headers = fields.map((field) => escapeCsvValue(field.label));
    lines.push(headers.join(','));
  }

  // Process in batches
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);

    for (const item of batch) {
      const values = fields.map((field) => {
        const rawValue = getNestedValue(item, field.key);
        const formattedValue = field.format ? field.format(rawValue, item) : rawValue;
        return escapeCsvValue(formattedValue);
      });
      lines.push(values.join(','));
    }

    // Report progress
    if (onProgress) {
      const progress = Math.min(100, Math.round(((i + batchSize) / data.length) * 100));
      onProgress(progress);
    }

    // Allow UI to update
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  if (onProgress) {
    onProgress(100);
  }

  return lines.join('\n');
}

/**
 * Validate export data
 * 
 * @param data - Data to validate
 * @param options - Export options
 * @returns Validation result
 */
export function validateExportData<T = any>(
  data: T[],
  options: ExportOptions
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(data)) {
    errors.push('数据必须是数组');
  }

  if (data.length === 0) {
    errors.push('没有数据可导出');
  }

  if (!options.fields || options.fields.length === 0) {
    errors.push('必须指定至少一个导出字段');
  }

  // Check if all fields exist in at least one item
  if (data.length > 0 && options.fields) {
    const sampleItem = data[0];
    for (const field of options.fields) {
      const value = getNestedValue(sampleItem, field.key);
      if (value === undefined) {
        // This is just a warning, not an error
        console.warn(`Field "${field.key}" not found in sample item`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Export statistics summary
 */
export interface ExportSummary {
  totalRecords: number;
  exportedRecords: number;
  fields: number;
  estimatedSize: string;
}

/**
 * Get export summary
 * 
 * @param data - Data to export
 * @param options - Export options
 * @returns Export summary
 */
export function getExportSummary<T = any>(data: T[], options: ExportOptions): ExportSummary {
  const csv = exportToCSV(data, options);
  const sizeInBytes = new Blob([csv]).size;
  const sizeInKB = sizeInBytes / 1024;
  const sizeInMB = sizeInKB / 1024;

  let estimatedSize: string;
  if (sizeInMB >= 1) {
    estimatedSize = `${sizeInMB.toFixed(2)} MB`;
  } else if (sizeInKB >= 1) {
    estimatedSize = `${sizeInKB.toFixed(2)} KB`;
  } else {
    estimatedSize = `${sizeInBytes} bytes`;
  }

  return {
    totalRecords: data.length,
    exportedRecords: data.length,
    fields: options.fields.length,
    estimatedSize,
  };
}

/**
 * Export all utilities
 */
export default {
  exportToCSV,
  exportToExcel,
  downloadCSV,
  downloadExcel,
  createCSVBlob,
  createExcelBlob,
  triggerDownload,
  ExportFormatters,
  CommonExportFields,
  createModuleExportFields,
  exportWithProgress,
  validateExportData,
  getExportSummary,
};
