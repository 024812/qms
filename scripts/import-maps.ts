/**
 * Import Maps & Atlases from Excel
 *
 * Imports from:
 *   1. 收藏清单 - 地图.xlsx (6 sheets, 694 maps)
 *   2. 收藏清单 - 地图集.xlsx (Sheet 1 "我的地图集", 8 atlases)
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/import-maps.ts
 */

import { existsSync } from 'node:fs';
import readXlsxFile from 'read-excel-file/node';
import { db } from '../src/db/index';
import { maps } from '../src/db/schema';
import { sql } from 'drizzle-orm';
import type { MapType, MapStatus } from '../src/modules/maps/schema';

const MAPS_PATH = 'C:/Users/oheng/OneDrive/Documents/Personal/收藏清单 - 地图.xlsx';
const ATLAS_PATH = 'C:/Users/oheng/OneDrive/Documents/Personal/收藏清单 - 地图集.xlsx';

function parseYear(val: unknown): number | null {
  if (typeof val === 'number' && Number.isFinite(val) && val >= 1400 && val <= 2100) {
    return Math.round(val);
  }
  return null;
}

function parseMonth(val: unknown): number | null {
  if (typeof val === 'number' && Number.isFinite(val) && val >= 1 && val <= 12) {
    return Math.round(val);
  }
  return null;
}

function formatPrice(val: unknown): string | null {
  if (typeof val === 'number' && Number.isFinite(val) && val >= 0) {
    return val.toFixed(2);
  }
  return null;
}

function detectMapType(title: string | null, isAtlas = false): MapType {
  if (isAtlas) return 'ATLAS';
  if (!title) return 'THEMATIC';
  const t = String(title).toUpperCase();
  if (t.includes('图集') || t.includes('ATLAS') || t.includes('地图集')) return 'ATLAS';
  if (
    t.includes('交通') ||
    t.includes('公路') ||
    t.includes('差旅') ||
    t.includes('路线') ||
    t.includes('线网') ||
    t.includes('自驾')
  ) {
    return 'ROAD';
  }
  if (
    t.includes('市区') ||
    t.includes('市街') ||
    t.includes('市图') ||
    t.includes('城市') ||
    t.includes('街区') ||
    t.includes('市游')
  ) {
    return 'CITY';
  }
  if (t.includes('地形') || t.includes('地势') || t.includes('等高线')) return 'TOPOGRAPHIC';
  if (t.includes('航空') || t.includes('航线')) return 'AERONAUTICAL';
  if (t.includes('海') || t.includes('海区') || t.includes('航海') || t.includes('海港'))
    return 'NAUTICAL';
  if (
    t.includes('历史') ||
    t.includes('古迹') ||
    t.includes('战役') ||
    t.includes('百年') ||
    t.includes('老地图')
  ) {
    return 'HISTORICAL';
  }
  return 'THEMATIC';
}

async function run() {
  console.log('=== Starting Maps & Atlases Import ===');

  // Reset table for clean import
  console.log('Resetting maps table for clean import...');
  await db.delete(maps);
  await db.execute(sql`SELECT setval(pg_get_serial_sequence('maps', 'item_number'), 1, false);`);
  console.log('Reset maps item_number serial sequence to 1.');

  const toInsert: Array<typeof maps.$inferInsert> = [];

  // 1. Process 地图.xlsx
  if (existsSync(MAPS_PATH)) {
    console.log(`\nReading: ${MAPS_PATH}`);
    const sheets = await readXlsxFile(MAPS_PATH);

    for (const sheet of sheets) {
      const isDuplicateSheet = sheet.sheet.includes('重复') || sheet.sheet.includes('待处理');
      const sheetStatus: MapStatus = isDuplicateSheet ? 'FOR_SALE' : 'COLLECTION';
      const headers = sheet.data[0] || [];
      const rows = sheet.data.slice(1).filter(r => r[0] || r[1]);

      const isbnIdx = headers.indexOf('ISBN');
      const seriesIdx = headers.indexOf('系列');
      const notesIdx = headers.indexOf('备注');

      console.log(`  Processing sheet "${sheet.sheet}": ${rows.length} records...`);

      rows.forEach(r => {
        const desc = r[0] ? String(r[0]).trim() : '未命名地图';
        const pubYear = parseYear(r[1]);
        const pubMonth = parseMonth(r[2]);
        const printYear = parseYear(r[3]);
        const printMonth = parseMonth(r[4]);
        const country = r[5] ? String(r[5]).trim() : '中国';
        const province = r[6] ? String(r[6]).trim() : null;
        const city = r[7] ? String(r[7]).trim() : null;
        const facePrice = formatPrice(r[8]);
        const buyPrice = formatPrice(r[9]);
        const notesRaw = notesIdx !== -1 && r[notesIdx] ? String(r[notesIdx]).trim() : null;
        const isbn = isbnIdx !== -1 && r[isbnIdx] ? String(r[isbnIdx]).trim() : null;
        const series = seriesIdx !== -1 && r[seriesIdx] ? String(r[seriesIdx]).trim() : null;

        const mapType = detectMapType(desc);
        const region = [province, city].filter(Boolean).join('·') || null;

        // Structured Edition string: e.g. "1976年12月版 / 1980年7月印"
        const edParts: string[] = [];
        if (pubYear) {
          edParts.push(`${pubYear}年${pubMonth ? `${pubMonth}月` : ''}版`);
        }
        if (printYear) {
          edParts.push(`${printYear}年${printMonth ? `${printMonth}月` : ''}印`);
        }
        const edition = edParts.join(' / ') || null;

        // Condition
        let condition: string | null = null;
        if (
          notesRaw &&
          (notesRaw.includes('新') ||
            notesRaw.includes('品相') ||
            notesRaw.includes('缺') ||
            notesRaw.includes('旧'))
        ) {
          condition = notesRaw;
        }

        const noteLines: string[] = [];
        noteLines.push(`所属账期/分类: ${sheet.sheet}`);
        if (notesRaw && notesRaw !== condition) noteLines.push(`备注: ${notesRaw}`);
        if (series) noteLines.push(`系列: ${series}`);
        if (isDuplicateSheet) noteLines.push('标记: 待处理/重复备选');

        toInsert.push({
          name: desc,
          mapType,
          publishedYear: pubYear || printYear,
          publishedMonth: pubMonth,
          printYear,
          printMonth,
          series,
          isbn,
          originalPrice: facePrice,
          material: 'PAPER',
          country,
          province,
          city,
          region,
          condition,
          edition,
          purchasePrice: buyPrice,
          currentValue: buyPrice,
          status: sheetStatus,
          notes: noteLines.join('\n'),
        });
      });
    }
  }

  // 2. Process 地图集.xlsx (Sheet 1)
  if (existsSync(ATLAS_PATH)) {
    console.log(`\nReading: ${ATLAS_PATH}`);
    const sheets = await readXlsxFile(ATLAS_PATH);
    const myAtlas = sheets[0];
    const rows = myAtlas.data.slice(1).filter(r => r[0] || r[1]);
    console.log(`  Processing "我的地图集": ${rows.length} records...`);

    rows.forEach(r => {
      const desc = r[0] ? String(r[0]).trim() : '未命名地图集';
      const pubYear = parseYear(r[1]);
      const pubMonth = parseMonth(r[2]);
      const printYear = parseYear(r[3]);
      const printMonth = parseMonth(r[4]);
      const country = r[5] ? String(r[5]).trim() : null;
      const province = r[6] ? String(r[6]).trim() : null;
      const city = r[7] ? String(r[7]).trim() : null;
      const facePrice = formatPrice(r[8]);
      const buyPrice = formatPrice(r[9]);
      const curVal = formatPrice(r[10]) || buyPrice;
      const condRaw = r[11] ? String(r[11]).trim() : null;
      const notesRaw = r[12] ? String(r[12]).trim() : null;
      const isbn = r[13] ? String(r[13]).trim() : null;

      const region = [province, city].filter(Boolean).join('·') || null;

      const edParts: string[] = [];
      if (pubYear) edParts.push(`${pubYear}年${pubMonth ? `${pubMonth}月` : ''}版`);
      if (printYear) edParts.push(`${printYear}年${printMonth ? `${printMonth}月` : ''}印`);
      const edition = edParts.join(' / ') || null;

      const noteLines: string[] = [];
      noteLines.push('类别: 精品历史世界地图集');
      if (notesRaw) noteLines.push(`备注: ${notesRaw}`);

      toInsert.push({
        name: desc,
        mapType: 'ATLAS',
        publishedYear: pubYear || printYear,
        publishedMonth: pubMonth,
        printYear,
        printMonth,
        isbn,
        originalPrice: facePrice,
        material: 'PAPER',
        country,
        province,
        city,
        region,
        condition: condRaw ? `${condRaw}品` : null,
        edition,
        purchasePrice: buyPrice,
        currentValue: curVal,
        status: 'COLLECTION',
        notes: noteLines.join('\n'),
      });
    });
  }

  console.log(`\nReady to insert ${toInsert.length} maps & atlases into database...`);

  // Batch insert in chunks of 50 for optimal performance
  const CHUNK_SIZE = 50;
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += CHUNK_SIZE) {
    const chunk = toInsert.slice(i, i + CHUNK_SIZE);
    await db.insert(maps).values(chunk);
    inserted += chunk.length;
    process.stdout.write(`\rImported ${inserted}/${toInsert.length} maps...`);
  }

  console.log(`\n\n=== Maps & Atlases Import Completed ===`);
  console.log(`Successfully imported: ${inserted}/${toInsert.length} records.`);

  // Summary
  const all = await db.select().from(maps);
  const byType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  for (const m of all) {
    byType[m.mapType] = (byType[m.mapType] || 0) + 1;
    byStatus[m.status] = (byStatus[m.status] || 0) + 1;
  }
  console.log('\n--- Database Maps Summary ---');
  console.log(`Total in DB: ${all.length}`);
  console.log('By Type:');
  for (const [t, c] of Object.entries(byType)) console.log(`  ${t}: ${c}`);
  console.log('By Status:');
  for (const [st, c] of Object.entries(byStatus)) console.log(`  ${st}: ${c}`);
}

run().catch(err => {
  console.error('Fatal error importing maps:', err);
  process.exit(1);
});
