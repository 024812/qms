import { readSheet } from 'read-excel-file/node';

import { getQuilts, saveQuilt } from '@/lib/data/quilts';
import { createQuiltSchema, type CreateQuiltInput } from '@/lib/validations/quilt';

export const MAX_IMPORT_FILE_BYTES = 2 * 1024 * 1024;

export interface QuiltImportError {
  row: number;
  message: string;
  field?: string;
  data?: unknown;
}

export interface QuiltImportPreview {
  summary: {
    totalRows: number;
    duplicates: number;
  };
  errors: QuiltImportError[];
  preview: Array<{
    itemNumber: number;
    name: string;
    season: string;
    color?: string;
    brand?: string;
    location?: string;
  }>;
}

export interface QuiltImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: QuiltImportError[];
  summary: {
    totalRows: number;
    successfulImports: number;
    duplicates: number;
    validationErrors: number;
  };
}

interface ParsedImport {
  preview: QuiltImportPreview;
  validRows: Array<{ row: number; data: CreateQuiltInput }>;
}

const headerAliases: Record<string, string> = {
  name: 'name',
  名称: 'name',
  season: 'season',
  季节: 'season',
  lengthcm: 'lengthCm',
  length: 'lengthCm',
  长度: 'lengthCm',
  widthcm: 'widthCm',
  width: 'widthCm',
  宽度: 'widthCm',
  weightgrams: 'weightGrams',
  weight: 'weightGrams',
  重量: 'weightGrams',
  fillmaterial: 'fillMaterial',
  填充材料: 'fillMaterial',
  color: 'color',
  颜色: 'color',
  brand: 'brand',
  品牌: 'brand',
  location: 'location',
  位置: 'location',
  packaginginfo: 'packagingInfo',
  包装信息: 'packagingInfo',
  currentstatus: 'currentStatus',
  status: 'currentStatus',
  状态: 'currentStatus',
  notes: 'notes',
  备注: 'notes',
  purchasedate: 'purchaseDate',
  购买日期: 'purchaseDate',
};

function normalizeHeader(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}

function cellText(value: unknown) {
  if (value === null || value === undefined) return undefined;
  const text = String(value).trim();
  return text === '' ? undefined : text;
}

function cellNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(cellText(value));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeSeason(value: unknown) {
  const normalized = normalizeHeader(value);
  if (['winter', '冬', '冬季'].includes(normalized)) return 'WINTER';
  if (['springautumn', 'springfall', '春秋', '春秋季'].includes(normalized)) {
    return 'SPRING_AUTUMN';
  }
  if (['summer', '夏', '夏季'].includes(normalized)) return 'SUMMER';
  return cellText(value)?.toUpperCase();
}

function normalizeStatus(value: unknown) {
  const normalized = normalizeHeader(value);
  if (['inuse', '使用中'].includes(normalized)) return 'IN_USE';
  if (['maintenance', '维护中', '保养中'].includes(normalized)) return 'MAINTENANCE';
  if (['storage', '存放', '收纳'].includes(normalized)) return 'STORAGE';
  return cellText(value)?.toUpperCase() || 'STORAGE';
}

function duplicateKey(input: Pick<CreateQuiltInput, 'name' | 'brand' | 'color'>) {
  return [input.name ?? '', input.brand ?? '', input.color]
    .map(value => value.trim().toLowerCase())
    .join('|');
}

export function decodeImportFile(fileData: string) {
  const buffer = Buffer.from(fileData, 'base64');
  if (buffer.length === 0 || buffer.length > MAX_IMPORT_FILE_BYTES) {
    throw new Error(`Import file must be between 1 byte and ${MAX_IMPORT_FILE_BYTES} bytes`);
  }
  return buffer;
}

export async function parseQuiltWorkbook(fileData: string): Promise<ParsedImport> {
  const rows = await readSheet(decodeImportFile(fileData));
  if (rows.length < 2) {
    throw new Error('The workbook must contain a header row and at least one data row');
  }

  const headers = rows[0].map(cell => headerAliases[normalizeHeader(cell)]);
  const requiredHeaders = [
    'season',
    'lengthCm',
    'widthCm',
    'weightGrams',
    'fillMaterial',
    'color',
    'location',
  ];
  const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
  if (missingHeaders.length > 0) {
    throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
  }

  const existing = await getQuilts({ limit: 10_000 });
  const seen = new Set(
    existing.map(quilt =>
      duplicateKey({ name: quilt.name, brand: quilt.brand ?? undefined, color: quilt.color })
    )
  );
  const errors: QuiltImportError[] = [];
  const validRows: ParsedImport['validRows'] = [];
  let duplicates = 0;

  rows.slice(1).forEach((row, index) => {
    const rowNumber = index + 2;
    const values = Object.fromEntries(
      headers.flatMap((header, cellIndex) => (header ? [[header, row[cellIndex]]] : []))
    );
    const candidate = {
      name: cellText(values.name),
      season: normalizeSeason(values.season),
      lengthCm: cellNumber(values.lengthCm),
      widthCm: cellNumber(values.widthCm),
      weightGrams: cellNumber(values.weightGrams),
      fillMaterial: cellText(values.fillMaterial),
      color: cellText(values.color),
      brand: cellText(values.brand),
      location: cellText(values.location),
      packagingInfo: cellText(values.packagingInfo),
      currentStatus: normalizeStatus(values.currentStatus),
      notes: cellText(values.notes),
      purchaseDate: values.purchaseDate
        ? values.purchaseDate instanceof Date
          ? values.purchaseDate
          : new Date(String(values.purchaseDate))
        : undefined,
    };
    const validation = createQuiltSchema.safeParse(candidate);

    if (!validation.success) {
      for (const issue of validation.error.issues) {
        errors.push({
          row: rowNumber,
          field: issue.path.join('.'),
          message: issue.message,
        });
      }
      return;
    }

    const key = duplicateKey(validation.data);
    if (seen.has(key)) {
      duplicates += 1;
      errors.push({ row: rowNumber, message: 'Duplicate quilt', field: 'name' });
      return;
    }

    seen.add(key);
    validRows.push({ row: rowNumber, data: validation.data });
  });

  return {
    validRows,
    preview: {
      summary: { totalRows: rows.length - 1, duplicates },
      errors,
      preview: validRows.slice(0, 5).map(({ row, data }) => ({
        itemNumber: row,
        name: data.name ?? '',
        season: data.season,
        color: data.color,
        brand: data.brand,
        location: data.location,
      })),
    },
  };
}

export async function importQuiltWorkbook(fileData: string): Promise<QuiltImportResult> {
  const parsed = await parseQuiltWorkbook(fileData);
  const errors = [...parsed.preview.errors];
  let imported = 0;

  for (const row of parsed.validRows) {
    try {
      await saveQuilt(row.data);
      imported += 1;
    } catch {
      errors.push({ row: row.row, message: 'Database import failed' });
    }
  }

  return {
    success: errors.length === 0,
    imported,
    skipped: parsed.preview.summary.totalRows - imported,
    errors,
    summary: {
      totalRows: parsed.preview.summary.totalRows,
      successfulImports: imported,
      duplicates: parsed.preview.summary.duplicates,
      validationErrors: errors.length - parsed.preview.summary.duplicates,
    },
  };
}
