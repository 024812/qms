/**
 * Import Spirits & Fine Wines from Excel
 *
 * Imports from:
 *   收藏清单 - 酒.xlsx
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/import-spirits.ts
 */

import { existsSync } from 'node:fs';
import readXlsxFile from 'read-excel-file/node';
import { db } from '../src/db/index';
import { spirits } from '../src/db/schema';
import { sql } from 'drizzle-orm';
import type { SpiritType, SpiritStatus, BottleStatus } from '../src/modules/spirits/schema';

const SPIRITS_PATH = 'C:/Users/oheng/OneDrive/Documents/Personal/收藏清单 - 酒.xlsx';

function formatPrice(val: unknown): string | null {
  if (typeof val === 'number' && Number.isFinite(val) && val >= 0) {
    return val.toFixed(2);
  }
  return null;
}

function formatDate(val: unknown): string | null {
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  if (val) return String(val).slice(0, 10);
  return null;
}

function parseSpiritType(typeStr: string | null): SpiritType {
  if (!typeStr) return 'OTHER';
  const t = typeStr.trim();
  if (t.includes('白酒')) return 'BAIJIU';
  if (t.includes('葡萄') || t.includes('红酒') || t.includes('酒')) return 'WINE';
  if (t.includes('威士忌')) return 'WHISKY';
  if (t.includes('干邑')) return 'COGNAC';
  if (t.includes('白兰地')) return 'BRANDY';
  if (t.includes('朗姆')) return 'RUM';
  if (t.includes('伏特加')) return 'VODKA';
  if (t.includes('金酒')) return 'GIN';
  if (t.includes('龙舌兰')) return 'TEQUILA';
  return 'OTHER';
}

async function run() {
  console.log('=== Starting Spirits & Wine Import ===');

  if (!existsSync(SPIRITS_PATH)) {
    console.error(`File not found: ${SPIRITS_PATH}`);
    process.exit(1);
  }

  // Reset table for clean import
  console.log('Resetting spirits table for clean import...');
  await db.delete(spirits);
  await db.execute(sql`SELECT setval(pg_get_serial_sequence('spirits', 'item_number'), 1, false);`);
  console.log('Reset spirits item_number serial sequence to 1.');

  const sheets = await readXlsxFile(SPIRITS_PATH);
  const rawRows = sheets[0].data.slice(1);
  const validRows = rawRows.filter(
    r =>
      (r[0] || r[1] || r[3]) &&
      !String(r[13] || '').includes('合计') &&
      !String(r[14] || '').includes('合计')
  );

  console.log(`Found ${validRows.length} valid wine & spirit rows.`);

  const toInsert = validRows.map((r, i) => {
    const statusStr = r[0] ? String(r[0]).trim() : '';
    const typeStr = r[1] ? String(r[1]).trim() : '';
    const subType = r[2] ? String(r[2]).trim() : null;
    const brand = r[3] ? String(r[3]).trim() : '';
    const model = r[4] ? String(r[4]).trim() : '';
    const volume = typeof r[5] === 'number' ? r[5] : null;
    const abv = typeof r[6] === 'number' ? r[6] : null;
    const vintage = typeof r[7] === 'number' ? r[7] : null;
    const country = r[8] ? String(r[8]).trim() : null;
    const desc = r[9] ? String(r[9]).trim() : null;
    const buyDate = r[10];
    const buyPrice = r[11];
    const vendor = r[12] ? String(r[12]).trim() : null;
    const consumeDate = r[13];
    const sellPrice = r[14];
    const priceDiff = r[15];
    const holdingDays = r[16];

    // Formulate clean title
    const nameParts = [brand];
    if (model && model !== brand) nameParts.push(model);
    if (subType && subType !== model) nameParts.push(subType);
    if (vintage) nameParts.push(`${vintage}年`);
    if (abv) nameParts.push(`${abv}%`);
    if (volume) nameParts.push(`${volume}ml`);
    const name = nameParts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

    const spiritType = parseSpiritType(typeStr);

    let status: SpiritStatus = 'COLLECTION';
    let bottleStatus: BottleStatus = 'SEALED';

    if (statusStr === '已享受') {
      status = 'EMPTY';
      bottleStatus = 'EMPTY';
    } else if (statusStr === '已送出') {
      status = 'SOLD';
      bottleStatus = 'SEALED';
    } else if (statusStr === '收藏中') {
      status = 'COLLECTION';
      bottleStatus = 'SEALED';
    }

    const noteParts: string[] = [];
    if (desc) noteParts.push(`描述: ${desc}`);
    if (subType) noteParts.push(`品类细分: ${subType}`);
    if (consumeDate || holdingDays) {
      const trans = [
        consumeDate ? `开瓶/流转日期: ${formatDate(consumeDate)}` : null,
        sellPrice !== null && sellPrice !== undefined ? `转让/价值: ￥${sellPrice}` : null,
        priceDiff !== null && priceDiff !== undefined ? `盈亏: ￥${priceDiff}` : null,
        holdingDays ? `持有天数: ${holdingDays}天` : null,
      ].filter(Boolean);
      noteParts.push(`饮用/流转记录: ${trans.join('，')}`);
    }

    const purchasePrice = formatPrice(buyPrice);
    const currentValue = purchasePrice;

    return {
      rowIdx: i + 1,
      name,
      spiritType,
      subType,
      brand: brand || null,
      model: model || null,
      country,
      vintage,
      abv: abv !== null ? abv.toFixed(2) : null,
      volumeMl: volume,
      acquiredDate: formatDate(buyDate),
      acquiredFrom: vendor,
      purchasePrice,
      currentValue,
      status,
      bottleStatus,
      notes: noteParts.length > 0 ? noteParts.join('\n') : null,
    };
  });

  console.log(`Starting insertion of ${toInsert.length} spirits into database...`);

  let count = 0;
  for (const item of toInsert) {
    const { rowIdx, ...insertData } = item;
    try {
      await db.insert(spirits).values(insertData);
      count++;
      process.stdout.write(`\rImported ${count}/${toInsert.length} spirits...`);
    } catch (err) {
      console.error(`\nFailed to insert spirit #${rowIdx} (${insertData.name}):`, err);
    }
  }

  console.log(`\n\n=== Spirits Import Completed ===`);
  console.log(`Successfully imported: ${count}/${toInsert.length} bottles.`);

  // Summary
  const all = await db.select().from(spirits);
  const byType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  for (const s of all) {
    byType[s.spiritType] = (byType[s.spiritType] || 0) + 1;
    byStatus[s.status] = (byStatus[s.status] || 0) + 1;
  }
  console.log('\n--- Database Spirits Summary ---');
  console.log(`Total in DB: ${all.length}`);
  console.log('By Type:');
  for (const [t, c] of Object.entries(byType)) console.log(`  ${t}: ${c}`);
  console.log('By Status:');
  for (const [st, c] of Object.entries(byStatus)) console.log(`  ${st}: ${c}`);
}

run().catch(err => {
  console.error('Fatal error importing spirits:', err);
  process.exit(1);
});
