import { beforeEach, describe, expect, it, vi } from 'vitest';

const { readSheetMock, getQuiltsMock, saveQuiltMock } = vi.hoisted(() => ({
  readSheetMock: vi.fn(),
  getQuiltsMock: vi.fn(),
  saveQuiltMock: vi.fn(),
}));

vi.mock('read-excel-file/node', () => ({ readSheet: readSheetMock }));
vi.mock('@/lib/data/quilts', () => ({
  getQuilts: getQuiltsMock,
  saveQuilt: saveQuiltMock,
}));

import { importQuiltWorkbook, parseQuiltWorkbook } from '@/lib/import/quilts';

const fileData = Buffer.from('xlsx fixture').toString('base64');
const headers = [
  'Name',
  'Season',
  'Length',
  'Width',
  'Weight',
  'Fill Material',
  'Color',
  'Location',
];
const validRow = ['Winter Quilt', 'WINTER', 220, 200, 2000, 'Down', 'White', 'Closet'];

describe('quilt workbook import', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getQuiltsMock.mockResolvedValue([]);
    saveQuiltMock.mockResolvedValue({ quilt: { id: 'quilt-1' } });
  });

  it('validates and previews workbook rows', async () => {
    readSheetMock.mockResolvedValue([headers, validRow]);

    const parsed = await parseQuiltWorkbook(fileData);

    expect(parsed.preview.summary).toEqual({ totalRows: 1, duplicates: 0 });
    expect(parsed.preview.errors).toEqual([]);
    expect(parsed.validRows[0].data).toMatchObject({
      name: 'Winter Quilt',
      season: 'WINTER',
      weightGrams: 2000,
    });
  });

  it('skips duplicates and imports valid rows', async () => {
    readSheetMock.mockResolvedValue([headers, validRow, [...validRow]]);

    const result = await importQuiltWorkbook(fileData);

    expect(result.imported).toBe(1);
    expect(result.summary.duplicates).toBe(1);
    expect(saveQuiltMock).toHaveBeenCalledOnce();
  });
});
