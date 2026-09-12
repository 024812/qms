/**
 * Import Antiques & EDC Tools from Excel
 *
 * Imports from:
 *   1. 收藏清单 - 折刀工具.xlsx (Tools / Knives)
 *   2. 收藏清单 - 文玩.xlsx (Antiques / Malas / Beads)
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/import-antiques.ts
 */

import { existsSync } from 'node:fs';
import readXlsxFile from 'read-excel-file/node';
import { db } from '../src/db/index';
import { antiques } from '../src/db/schema';
import { sql } from 'drizzle-orm';
import type { AntiqueCategory, AntiqueStatus } from '../src/modules/antiques/schema';

const KNIVES_PATH = 'C:/Users/oheng/OneDrive/Documents/Personal/收藏清单 - 折刀工具.xlsx';
const ANTIQUES_PATH = 'C:/Users/oheng/OneDrive/Documents/Personal/收藏清单 - 文玩.xlsx';

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

function detectAntiqueCategory(material: string | null): AntiqueCategory {
  if (!material) return 'OTHER';
  const m = material.trim();
  if (['翡翠', '绿松石', '南红', '和田玉', '玛瑙'].some(k => m.includes(k))) {
    return 'JADE';
  }
  if (['星月', '沉香', '海黄', '沙铁', '紫檀', '菩提', '木'].some(k => m.includes(k))) {
    return 'WOOD';
  }
  if (['象牙', '猛犸', '琥珀', '蜜蜡', '砗磲'].some(k => m.includes(k))) {
    return 'OTHER';
  }
  return 'OTHER';
}

async function run() {
  console.log('=== Starting Antiques & Tools Import ===');

  // Reset table for clean import
  console.log('Resetting antiques table for clean import...');
  await db.delete(antiques);
  await db.execute(
    sql`SELECT setval(pg_get_serial_sequence('antiques', 'item_number'), 1, false);`
  );
  console.log('Reset antiques item_number serial sequence to 1.');

  const toInsert: Array<typeof antiques.$inferInsert> = [];

  // 1. Process 折刀工具.xlsx
  if (existsSync(KNIVES_PATH)) {
    console.log(`\nReading: ${KNIVES_PATH}`);
    const sheets = await readXlsxFile(KNIVES_PATH);
    const rows = sheets[0].data.slice(1).filter(r => r[0] || r[1] || r[2]);
    console.log(`Found ${rows.length} valid knife / tool rows.`);

    rows.forEach((r, idx) => {
      const statusStr = r[0] ? String(r[0]).trim() : '';
      const brand = r[1] ? String(r[1]).trim() : '';
      const model = r[2] ? String(r[2]).trim() : '';
      const desc = r[3] ? String(r[3]).trim() : '';
      const totalLen = r[4];
      const closedLen = r[5];
      const bladeLen = r[6];
      const bladeThick = r[7];
      const bladeSteel = r[8] ? String(r[8]).trim() : null;
      const handleMat = r[9] ? String(r[9]).trim() : null;
      const hardness = r[10] ? String(r[10]).trim() : null;
      const weight = r[11];
      const lock = r[12] ? String(r[12]).trim() : null;
      const buyDate = r[13];
      const buyPrice = r[14];
      const vendor = r[15] ? String(r[15]).trim() : null;
      const sellDate = r[16];
      const sellPrice = r[17];
      const priceDiff = r[18];
      const holdingDays = r[19];

      // Formulate name
      const nameParts = [brand, model, desc].filter(Boolean);
      const name = nameParts.join(' ').replace(/\s+/g, ' ').trim();

      const status: AntiqueStatus =
        statusStr === '已卖出' ? 'SOLD' : statusStr === '使用中' ? 'COLLECTION' : 'COLLECTION';

      // Dimensions: total length in mm -> cm
      const lengthCm =
        typeof totalLen === 'number' && totalLen > 0 ? (totalLen / 10).toFixed(2) : null;
      const weightG = typeof weight === 'number' && weight > 0 ? weight.toFixed(2) : null;

      // Structured Notes
      const noteParts: string[] = [];
      const specList = [
        totalLen ? `全长: ${totalLen}mm` : null,
        closedLen ? `闭合长: ${closedLen}mm` : null,
        bladeLen ? `刃长: ${bladeLen}mm` : null,
        bladeThick ? `刃厚: ${bladeThick}mm` : null,
        hardness ? `硬度: ${hardness}` : null,
      ].filter(Boolean);
      if (specList.length > 0) noteParts.push(`规格参数: ${specList.join('，')}`);

      if (lock) noteParts.push(`锁定方式: ${lock}`);
      if (bladeSteel || handleMat) {
        noteParts.push(
          `材质配置: ${bladeSteel ? `刃材[${bladeSteel}]` : ''} ${handleMat ? `柄材[${handleMat}]` : ''}`.trim()
        );
      }

      if (sellDate || (sellPrice !== null && sellPrice !== undefined)) {
        const trans = [
          sellDate ? `卖出日期: ${formatDate(sellDate)}` : null,
          sellPrice !== null && sellPrice !== undefined ? `卖出价: ￥${sellPrice}` : null,
          priceDiff !== null && priceDiff !== undefined ? `盈亏: ￥${priceDiff}` : null,
          holdingDays ? `持有时间: ${holdingDays}天` : null,
        ].filter(Boolean);
        noteParts.push(`交易统计: ${trans.join('，')}`);
      }

      const purchasePrice = formatPrice(buyPrice);
      const soldPrice = formatPrice(sellPrice);
      const currentValue =
        typeof sellPrice === 'number' && sellPrice >= 0 ? formatPrice(sellPrice) : purchasePrice;

      // Material combination string
      const material = [
        bladeSteel ? `刃材:${bladeSteel}` : null,
        handleMat ? `柄材:${handleMat}` : null,
      ]
        .filter(Boolean)
        .join(' / ');

      toInsert.push({
        name,
        category: 'TOOL',
        brand: brand || null,
        model: model || null,
        subCategory: lock || '折刀',
        material: material || null,
        bladeSteel,
        handleMaterial: handleMat,
        lockType: lock,
        condition: desc || null,
        lengthCm,
        weightG,
        acquiredFrom: vendor,
        acquiredDate: formatDate(buyDate),
        purchasePrice,
        currentValue,
        soldPrice,
        soldDate: formatDate(sellDate),
        status,
        notes: noteParts.length > 0 ? noteParts.join('\n') : null,
      });
    });
  }

  // 2. Process 文玩.xlsx
  if (existsSync(ANTIQUES_PATH)) {
    console.log(`\nReading: ${ANTIQUES_PATH}`);
    const sheets = await readXlsxFile(ANTIQUES_PATH);
    const rows = sheets[0].data.slice(1).filter(r => r[0] || r[1] || r[2]);
    console.log(`Found ${rows.length} valid antique rows.`);

    rows.forEach((r, idx) => {
      const statusStr = r[0] ? String(r[0]).trim() : '';
      const type = r[1] ? String(r[1]).trim() : '';
      const material = r[2] ? String(r[2]).trim() : '';
      const desc = r[3] ? String(r[3]).trim() : '';
      const cert = r[4] ? String(r[4]).trim() : null;
      const len = r[5];
      const wid = r[6];
      const thk = r[7];
      const weight = r[8];
      const buyDate = r[9];
      const buyPrice = r[10];
      const vendor = r[11] ? String(r[11]).trim() : null;
      const sellDate = r[12];
      const sellPrice = r[13];
      const priceDiff = r[14];
      const holdingDays = r[15];
      const group = r[16] ? String(r[16]).trim() : null;

      const nameParts = [material, type, desc].filter(Boolean);
      const name = nameParts.join(' ').replace(/\s+/g, ' ').trim();

      const category = detectAntiqueCategory(material);
      const status: AntiqueStatus = statusStr === '已卖出' ? 'SOLD' : 'COLLECTION';

      // Dimensions: in mm -> cm
      const lengthCm = typeof len === 'number' && len > 0 ? (len / 10).toFixed(2) : null;
      const widthCm = typeof wid === 'number' && wid > 0 ? (wid / 10).toFixed(2) : null;
      const heightCm = typeof thk === 'number' && thk > 0 ? (thk / 10).toFixed(2) : null;
      const weightG = typeof weight === 'number' && weight > 0 ? weight.toFixed(2) : null;

      const noteParts: string[] = [];
      if (group) noteParts.push(`配套归属: ${group}`);
      if (len || wid || thk) {
        const d = [
          len ? `长${len}mm` : null,
          wid ? `宽${wid}mm` : null,
          thk ? `厚${thk}mm` : null,
        ].filter(Boolean);
        noteParts.push(`尺寸规格: ${d.join(' × ')}`);
      }
      if (cert) noteParts.push(`附件/证书: ${cert}`);
      if (sellDate || (sellPrice !== null && sellPrice !== undefined)) {
        const trans = [
          sellDate ? `卖出日期: ${formatDate(sellDate)}` : null,
          sellPrice !== null && sellPrice !== undefined ? `卖出价: ￥${sellPrice}` : null,
          priceDiff !== null && priceDiff !== undefined ? `盈亏: ￥${priceDiff}` : null,
          holdingDays ? `持有时间: ${holdingDays}天` : null,
        ].filter(Boolean);
        noteParts.push(`交易统计: ${trans.join('，')}`);
      }

      const purchasePrice = formatPrice(buyPrice);
      const soldPrice = formatPrice(sellPrice);
      const currentValue =
        typeof sellPrice === 'number' && sellPrice >= 0 ? formatPrice(sellPrice) : purchasePrice;

      toInsert.push({
        name,
        category,
        subCategory: type || null,
        material: material || null,
        setGroup: group,
        condition: desc || null,
        certificate: cert,
        lengthCm,
        widthCm,
        heightCm,
        weightG,
        acquiredFrom: vendor,
        acquiredDate: formatDate(buyDate),
        purchasePrice,
        currentValue,
        soldPrice,
        soldDate: formatDate(sellDate),
        status,
        notes: noteParts.length > 0 ? noteParts.join('\n') : null,
      });
    });
  }

  console.log(`\nReady to insert ${toInsert.length} total items into antiques...`);

  let count = 0;
  for (const item of toInsert) {
    try {
      await db.insert(antiques).values(item);
      count++;
      process.stdout.write(`\rImported ${count}/${toInsert.length} antiques...`);
    } catch (err) {
      console.error(`\nFailed to insert antique "${item.name}":`, err);
    }
  }

  console.log(`\n\n=== Antiques Import Completed ===`);
  console.log(`Successfully imported: ${count}/${toInsert.length} records.`);

  // Summary
  const all = await db.select().from(antiques);
  const byCat: Record<string, number> = {};
  for (const a of all) {
    byCat[a.category] = (byCat[a.category] || 0) + 1;
  }
  console.log('\n--- Database Antiques Summary ---');
  console.log(`Total in DB: ${all.length}`);
  for (const [cat, cnt] of Object.entries(byCat)) {
    console.log(`  ${cat}: ${cnt}`);
  }
}

run().catch(err => {
  console.error('Fatal error importing antiques:', err);
  process.exit(1);
});
