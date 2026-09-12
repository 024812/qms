/**
 * Import Table Tennis Paddles from Excel
 *
 * Imports paddle collection from Excel sheet "进销存" into the QMS database.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/import-paddles.ts [path-to-excel]
 */

import { existsSync } from 'node:fs';
import readXlsxFile from 'read-excel-file/node';
import { db } from '../src/db/index';
import { paddles } from '../src/db/schema';
import { sql } from 'drizzle-orm';

const DEFAULT_EXCEL_PATH = 'C:/Users/oheng/OneDrive/Documents/Personal/收藏清单 - 乒乓底板.xlsx';

function parseHandleType(
  model: string | null,
  desc: string | null,
  brand: string | null
): 'FL' | 'ST' | 'CS' | 'AN' | null {
  const text = `${model || ''} ${desc || ''}`.toUpperCase();
  if (
    text.includes('CS') ||
    text.includes('中式') ||
    text.includes('直拍') ||
    text.includes('直板')
  ) {
    return 'CS';
  }
  if (text.includes('AN')) return 'AN';
  if (text.includes('ST')) return 'ST';
  if (text.includes('FL') || text.includes('横拍') || text.includes('横板')) {
    return 'FL';
  }

  // Butterfly product numbering conventions:
  // 2xxxx = CS (Chinese Penhold)
  // 3xxx1 = FL (Flared)
  // 3xxx4 = ST (Straight)
  if (brand === '蝴蝶' && model) {
    const mStr = String(model);
    if (/^2\d{4}$/.test(mStr)) return 'CS';
    if (/^3\d{3}1$/.test(mStr)) return 'FL';
    if (/^3\d{3}4$/.test(mStr)) return 'ST';
  }

  // Stiga classic player handle conventions:
  // Alser = Conic/FL
  // Bengtsson = Straight/ST
  if (text.includes('ALSER')) return 'FL';
  if (text.includes('BENGTSSON')) return 'ST';

  return null;
}

function parseStatus(statusStr: string | null): 'ACTIVE' | 'DISPLAY' | 'SOLD' {
  if (statusStr === '使用中') return 'ACTIVE';
  if (statusStr === '收藏中') return 'DISPLAY';
  if (statusStr === '已卖出') return 'SOLD';
  return 'ACTIVE';
}

function formatPrice(val: unknown): string | null {
  if (typeof val === 'number' && Number.isFinite(val) && val >= 0) {
    return val.toFixed(2);
  }
  return null;
}

async function run() {
  const filePath = process.argv[2] || DEFAULT_EXCEL_PATH;

  if (!existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  console.log(`Reading Excel file: ${filePath}`);
  const sheets = await readXlsxFile(filePath);
  const jxcSheet = sheets.find(s => s.sheet === '进销存');

  if (!jxcSheet) {
    console.error('Sheet "进销存" not found in the Excel workbook.');
    process.exit(1);
  }

  console.log(`Found sheet "进销存" with ${jxcSheet.data.length} total rows.`);

  const rawRows = jxcSheet.data.slice(1);
  const validRows = rawRows.filter(
    r => (r[0] || r[1] || r[2]) && !r.some(c => typeof c === 'string' && c.includes('合计'))
  );

  console.log(`Parsed ${validRows.length} valid paddle inventory rows.`);

  // Clear and reset sequence for clean re-import
  console.log('Resetting paddles table for clean import...');
  await db.delete(paddles);
  await db.execute(sql`SELECT setval(pg_get_serial_sequence('paddles', 'item_number'), 1, false);`);
  console.log('Reset paddles item_number serial sequence to 1.');

  const recordsToInsert = validRows.map((r, i) => {
    const statusStr = r[0] ? String(r[0]).trim() : null;
    const brand = r[1] ? String(r[1]).trim() : '';
    const model = r[2] && String(r[2]).trim() !== 'N/A' ? String(r[2]).trim() : null;
    const desc = r[3] ? String(r[3]).trim() : null;
    const rawWeight = r[4];
    const length = r[5];
    const width = r[6];
    const shoulder = r[7];
    const thickness = r[8];
    const buyDate = r[9];
    const buyPrice = r[10];
    const vendor = r[11];
    const sellDate = r[12];
    const sellPrice = r[13];
    const priceDiff = r[14];
    const holdingDays = r[15];

    // Format paddle title
    const nameParts = [brand];
    if (model) nameParts.push(model);
    if (desc && desc !== model) nameParts.push(desc);
    const name = nameParts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

    // Determine status & handle type
    const status = parseStatus(statusStr);
    const handleType = parseHandleType(model, desc, brand);
    const bladeWeightG = typeof rawWeight === 'number' && rawWeight > 0 ? String(rawWeight) : null;
    const thicknessMm = typeof thickness === 'number' && thickness > 0 ? String(thickness) : null;
    const acquiredFrom = vendor ? String(vendor).trim() : null;

    // Preserving extra columns in notes
    const noteParts: string[] = [];
    if (length || width || shoulder) {
      const dim = [
        length ? `长${length}mm` : null,
        width ? `宽${width}mm` : null,
        shoulder ? `肩宽${shoulder}mm` : null,
      ]
        .filter(Boolean)
        .join('，');
      noteParts.push(`版面规格: ${dim}`);
    }
    if ((priceDiff !== null && priceDiff !== undefined) || holdingDays) {
      const transParts: string[] = [];
      if (priceDiff !== null && priceDiff !== undefined) {
        transParts.push(`盈亏: ￥${priceDiff}`);
      }
      if (holdingDays) {
        transParts.push(`持有时间: ${holdingDays}天`);
      }
      noteParts.push(`交易统计: ${transParts.join('，')}`);
    }

    const purchaseDate =
      buyDate instanceof Date
        ? buyDate.toISOString().slice(0, 10)
        : buyDate
          ? String(buyDate).slice(0, 10)
          : null;

    const purchasePrice = formatPrice(buyPrice);
    const soldPrice = formatPrice(sellPrice);
    const soldDate =
      sellDate instanceof Date
        ? sellDate.toISOString().slice(0, 10)
        : sellDate
          ? String(sellDate).slice(0, 10)
          : null;

    const currentValue =
      typeof sellPrice === 'number' && sellPrice >= 0 ? formatPrice(sellPrice) : purchasePrice;

    return {
      rowIdx: i + 1,
      name,
      bladeBrand: brand || null,
      bladeModel: model,
      bladeWeightG,
      thicknessMm,
      handleType,
      status,
      purchaseDate,
      purchasePrice,
      acquiredFrom,
      currentValue,
      soldPrice,
      soldDate,
      notes: noteParts.length > 0 ? noteParts.join('\n') : null,
    };
  });

  console.log(`Starting insertion of ${recordsToInsert.length} paddles...`);

  let insertedCount = 0;
  for (const item of recordsToInsert) {
    const { rowIdx, ...insertData } = item;
    try {
      await db.insert(paddles).values(insertData);
      insertedCount++;
      process.stdout.write(`\rImported ${insertedCount}/${recordsToInsert.length} paddles...`);
    } catch (err) {
      console.error(`\nFailed to insert row #${rowIdx} (${insertData.name}):`, err);
    }
  }

  console.log(`\n\n=== Import Finished ===`);
  console.log(`Successfully imported: ${insertedCount}/${recordsToInsert.length} records.`);

  // Summary statistics
  const allPaddles = await db.select().from(paddles);
  const byStatus: Record<string, number> = {};
  for (const p of allPaddles) {
    byStatus[p.status] = (byStatus[p.status] || 0) + 1;
  }

  console.log('\n--- Database Summary ---');
  console.log(`Total paddles in DB: ${allPaddles.length}`);
  console.log(`  使用中 (ACTIVE):   ${byStatus['ACTIVE'] || 0}`);
  console.log(`  展示/收藏 (DISPLAY): ${byStatus['DISPLAY'] || 0}`);
  console.log(`  已售出 (SOLD):     ${byStatus['SOLD'] || 0}`);
}

run().catch(err => {
  console.error('Fatal import error:', err);
  process.exit(1);
});
