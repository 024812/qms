/**
 * Data Export Service
 *
 * Provides data export functionality in multiple formats (CSV, Excel).
 * Supports custom field mapping and formatting.
 *
 * Requirements: 6.3 - Data export service supporting CSV and Excel formats
 */

type ExportRecord = Record<string, unknown>;
type ExportFormatter<TItem extends ExportRecord = ExportRecord> = (
  value: unknown,
  item: TItem
) => string;

export interface ExportFieldConfig<TItem extends ExportRecord = ExportRecord> {
  key: string;
  label: string;
  format?: ExportFormatter<TItem>;
}

export interface ExportOptions<TItem extends ExportRecord = ExportRecord> {
  fields: ExportFieldConfig<TItem>[];
  fileName?: string;
  includeHeader?: boolean;
}

export interface ExportSummary {
  totalRecords: number;
  exportedRecords: number;
  fields: number;
  estimatedSize: string;
}

function toDateValue(value: unknown): Date | null {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

function toNumberValue(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isNaN(value) ? null : value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const numericValue = Number(value);
    return Number.isNaN(numericValue) ? null : numericValue;
  }

  return null;
}

function getNestedValue(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (typeof current !== 'object' || current === null) {
      return undefined;
    }

    return (current as ExportRecord)[key];
  }, obj);
}

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

export function exportToCSV<TItem extends ExportRecord>(
  data: TItem[],
  options: ExportOptions<TItem>
): string {
  const { fields, includeHeader = true } = options;
  const lines: string[] = [];

  if (includeHeader) {
    lines.push(fields.map(field => escapeCsvValue(field.label)).join(','));
  }

  for (const item of data) {
    const values = fields.map(field => {
      const rawValue = getNestedValue(item, field.key);
      const formattedValue = field.format ? field.format(rawValue, item) : rawValue;
      return escapeCsvValue(formattedValue);
    });
    lines.push(values.join(','));
  }

  return lines.join('\n');
}

export function exportToExcel<TItem extends ExportRecord>(
  data: TItem[],
  options: ExportOptions<TItem>
): string {
  return '\uFEFF' + exportToCSV(data, options);
}

export function createCSVBlob(csvContent: string, _fileName: string = 'export'): Blob {
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

export function createExcelBlob(csvContent: string, _fileName: string = 'export'): Blob {
  return new Blob([csvContent], {
    type: 'application/vnd.ms-excel;charset=utf-8;',
  });
}

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

export function downloadCSV<TItem extends ExportRecord>(
  data: TItem[],
  options: ExportOptions<TItem>
): void {
  const fileName = options.fileName || 'export';
  triggerDownload(createCSVBlob(exportToCSV(data, options), fileName), `${fileName}.csv`);
}

export function downloadExcel<TItem extends ExportRecord>(
  data: TItem[],
  options: ExportOptions<TItem>
): void {
  const fileName = options.fileName || 'export';
  triggerDownload(createExcelBlob(exportToExcel(data, options), fileName), `${fileName}.xlsx`);
}

export const ExportFormatters = {
  date: (value: unknown): string => {
    const date = toDateValue(value);
    return date ? date.toISOString().split('T')[0] : '';
  },
  datetime: (value: unknown): string => {
    const date = toDateValue(value);
    return date ? date.toISOString().replace('T', ' ').split('.')[0] : '';
  },
  number:
    (decimals: number = 2) =>
    (value: unknown): string => {
      const numericValue = toNumberValue(value);
      return numericValue === null ? '' : numericValue.toFixed(decimals);
    },
  currency: (value: unknown): string => {
    const numericValue = toNumberValue(value);
    return numericValue === null ? '' : `CNY ${numericValue.toFixed(2)}`;
  },
  boolean: (value: unknown): string => (value ? '是' : '否'),
  array: (value: unknown): string => (Array.isArray(value) ? value.join(', ') : ''),
  json: (value: unknown): string => {
    if (value === null || value === undefined) {
      return '';
    }

    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  },
  truncate:
    (maxLength: number = 50) =>
    (value: unknown): string => {
      if (!value) {
        return '';
      }

      const stringValue = String(value);
      return stringValue.length > maxLength
        ? `${stringValue.substring(0, maxLength)}...`
        : stringValue;
    },
};

export const CommonExportFields = {
  basic: (): ExportFieldConfig[] => [
    { key: 'id', label: 'ID' },
    { key: 'name', label: '名称' },
    { key: 'type', label: '类型' },
    { key: 'status', label: '状态' },
    { key: 'createdAt', label: '创建时间', format: ExportFormatters.datetime },
    { key: 'updatedAt', label: '更新时间', format: ExportFormatters.datetime },
  ],
  withOwner: (): ExportFieldConfig[] => [
    ...CommonExportFields.basic(),
    { key: 'ownerId', label: '所有者ID' },
  ],
  withImages: (): ExportFieldConfig[] => [
    ...CommonExportFields.basic(),
    {
      key: 'images',
      label: '图片数量',
      format: value => (Array.isArray(value) ? String(value.length) : '0'),
    },
  ],
};

export function createModuleExportFields(
  attributeFields: Array<{ key: string; label: string; format?: (value: unknown) => string }>
): ExportFieldConfig[] {
  return [
    ...CommonExportFields.basic(),
    ...attributeFields.map(field => ({
      key: `attributes.${field.key}`,
      label: field.label,
      format: field.format,
    })),
  ];
}

export async function exportWithProgress<TItem extends ExportRecord>(
  data: TItem[],
  options: ExportOptions<TItem>,
  onProgress?: (progress: number) => void
): Promise<string> {
  const { fields, includeHeader = true } = options;
  const lines: string[] = [];
  const batchSize = 100;

  if (includeHeader) {
    lines.push(fields.map(field => escapeCsvValue(field.label)).join(','));
  }

  for (let index = 0; index < data.length; index += batchSize) {
    const batch = data.slice(index, index + batchSize);

    for (const item of batch) {
      const values = fields.map(field => {
        const rawValue = getNestedValue(item, field.key);
        const formattedValue = field.format ? field.format(rawValue, item) : rawValue;
        return escapeCsvValue(formattedValue);
      });
      lines.push(values.join(','));
    }

    if (onProgress) {
      onProgress(Math.min(100, Math.round(((index + batchSize) / data.length) * 100)));
    }

    await new Promise(resolve => setTimeout(resolve, 0));
  }

  onProgress?.(100);
  return lines.join('\n');
}

export function validateExportData<TItem extends ExportRecord>(
  data: TItem[],
  options: ExportOptions<TItem>
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

  if (data.length > 0 && options.fields) {
    const sampleItem = data[0];
    for (const field of options.fields) {
      if (getNestedValue(sampleItem, field.key) === undefined) {
        console.warn(`Field "${field.key}" not found in sample item`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function getExportSummary<TItem extends ExportRecord>(
  data: TItem[],
  options: ExportOptions<TItem>
): ExportSummary {
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

const exportUtilities = {
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

export default exportUtilities;
