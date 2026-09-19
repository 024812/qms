/**
 * One-off data repair: decode HTML entities that older input sanitisation wrote
 * into the database.
 *
 * Background
 * ----------
 * `sanitizeApiInput` (and friends) used to HTML-escape every string *before*
 * persisting it. So a user typing `A & B` got `A &amp; B` stored, and because
 * React already escapes text nodes on render, the page then showed
 * `A &amp;amp; B`. Search terms were mangled too: `70/30` was stored as
 * `70&#x2F;30`.
 *
 * The input layer has been fixed (`src/lib/sanitization.ts` now normalises only),
 * so no new rows are affected. This script repairs the rows written before the
 * fix by decoding exactly **one** level of entities.
 *
 * One level, not all of them
 * -------------------------
 * `&amp;lt;` must become `&lt;`, not `<` — the user's original text was `&lt;`.
 * The decode chain therefore applies `&amp;` **last**, so its output is never
 * re-scanned by the other replacements. The same reasoning drives the single-pass
 * regex used in `src/lib/sanitization.ts`'s test suite.
 *
 * Usage
 * -----
 *   # Report only (default) — lists affected columns with sample values.
 *   npx tsx --env-file=.env.local scripts/fix-html-escaped-text.ts
 *
 *   # Write the repairs. Prints a per-column summary and a total.
 *   npx tsx --env-file=.env.local scripts/fix-html-escaped-text.ts --apply
 *
 * Notes
 * -----
 * - `updated_at` is deliberately left untouched: this restores fidelity, it is
 *   not a user edit.
 * - Review the dry-run sample output before applying. A value that legitimately
 *   contained the literal text `&amp;` will also be decoded.
 */

import { sql } from 'drizzle-orm';

import { db } from '../src/db/index';

/** Columns whose content must never be rewritten by this script. */
const SKIP_COLUMN_PATTERNS: readonly RegExp[] = [
  /^id$/,
  /_id$/,
  /_url$/,
  /_image$/,
  /_images$/,
  /^main_image$/,
  /^attachment_images$/,
  /^image$/,
  /^email$/,
  /^token$/,
  /^access_token$/,
  /^refresh_token$/,
  /^id_token$/,
  /^password$/,
  /^hashed_password$/,
  /^key_hash$/,
  /^key_prefix$/,
  /^input_hash$/,
  /^cache_key$/,
  /^value$/, // auth_verification / system_settings — may hold JSON, not prose
  /^identifier$/,
];

/** Business tables whose free-text columns went through the API sanitiser. */
const BUSINESS_TABLES: readonly string[] = [
  'users',
  'user_api_keys',
  'quilts',
  'usage_records',
  'maintenance_records',
  'antiques',
  'maps',
  'cards',
  'paddles',
  'spirits',
  'system_settings',
  'notifications',
  'seasonal_recommendations',
];

/**
 * Entity → character. Everything except `&amp;` is applied first, in any order;
 * `&amp;` is appended last so it runs outermost. See the file header.
 */
const ENTITY_MAP: ReadonlyArray<readonly [entity: string, decoded: string]> = [
  ['&lt;', '<'],
  ['&gt;', '>'],
  ['&quot;', '"'],
  ['&#x27;', "'"],
  ['&#39;', "'"],
  ['&#x2F;', '/'],
  ['&#96;', '`'],
  ['&#x3D;', '='],
  ['&amp;', '&'],
];

/** Matches any entity this script knows how to decode. */
const ENTITY_REGEX = '&(amp|lt|gt|quot|#x27|#39|#x2F|#96|#x3D);';

const IDENTIFIER_RE = /^[a-z_][a-z0-9_]*$/;

function quoteIdentifier(name: string): string {
  if (!IDENTIFIER_RE.test(name)) {
    throw new Error(`Refusing to use unsafe SQL identifier: ${JSON.stringify(name)}`);
  }
  return `"${name}"`;
}

function stringLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

/**
 * Build `replace(replace(col, ...), '&amp;', '&')`.
 *
 * The first entity pushed becomes the innermost call, so it executes first; the
 * last one pushed is outermost and executes last. `&amp;` is pushed last on
 * purpose.
 */
function buildDecodeExpression(columnRef: string): string {
  let expression = columnRef;

  for (const [entity, decoded] of ENTITY_MAP) {
    if (entity === '&amp;') continue;
    expression = `replace(${expression}, ${stringLiteral(entity)}, ${stringLiteral(decoded)})`;
  }

  return `replace(${expression}, '&amp;', '&')`;
}

async function query<T>(rawSql: string): Promise<T[]> {
  const result = (await db.execute(sql.raw(rawSql))) as unknown;

  if (Array.isArray(result)) {
    return result as T[];
  }

  const maybeRows = (result as { rows?: unknown } | null)?.rows;
  return Array.isArray(maybeRows) ? (maybeRows as T[]) : [];
}

interface Target {
  table: string;
  column: string;
}

async function discoverTargets(): Promise<Target[]> {
  const rows = await query<{ table_name: string; column_name: string }>(`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND data_type IN ('text', 'character varying')
      AND table_name IN (${BUSINESS_TABLES.map(stringLiteral).join(', ')})
    ORDER BY table_name, ordinal_position
  `);

  return rows
    .filter(row => !SKIP_COLUMN_PATTERNS.some(pattern => pattern.test(row.column_name)))
    .map(row => ({ table: row.table_name, column: row.column_name }));
}

async function countAffected(target: Target): Promise<number> {
  const table = quoteIdentifier(target.table);
  const column = quoteIdentifier(target.column);

  const rows = await query<{ n: number }>(`
    SELECT count(*)::int AS n
    FROM ${table}
    WHERE ${column} ~ ${stringLiteral(ENTITY_REGEX)}
  `);

  return rows[0]?.n ?? 0;
}

async function sampleAffected(target: Target, limit: number): Promise<string[]> {
  const table = quoteIdentifier(target.table);
  const column = quoteIdentifier(target.column);

  const rows = await query<{ sample: string }>(`
    SELECT ${column} AS sample
    FROM ${table}
    WHERE ${column} ~ ${stringLiteral(ENTITY_REGEX)}
    LIMIT ${limit}
  `);

  return rows.map(row => row.sample);
}

async function repair(target: Target): Promise<number> {
  const table = quoteIdentifier(target.table);
  const column = quoteIdentifier(target.column);
  const expression = buildDecodeExpression(column);

  await db.execute(
    sql.raw(`
      UPDATE ${table}
      SET ${column} = ${expression}
      WHERE ${column} ~ ${stringLiteral(ENTITY_REGEX)}
    `)
  );

  // `db.execute` does not surface a row count uniformly across drivers, so
  // re-count what is left instead of trusting a driver-specific field.
  const remaining = await countAffected(target);
  return remaining;
}

function truncate(value: string, max = 90): string {
  const single = value.replace(/\s+/g, ' ');
  return single.length > max ? `${single.slice(0, max)}…` : single;
}

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply');

  console.log(
    apply
      ? 'Mode: APPLY — affected rows will be rewritten.\n'
      : 'Mode: REPORT — no writes. Pass --apply to repair.\n'
  );

  const targets = await discoverTargets();
  const affected: Array<{ target: Target; count: number }> = [];

  for (const target of targets) {
    const count = await countAffected(target);
    if (count > 0) {
      affected.push({ target, count });
    }
  }

  if (affected.length === 0) {
    console.log('No HTML-escaped values found. Nothing to do.');
    return;
  }

  console.log(`Found ${affected.length} affected column(s):\n`);

  for (const { target, count } of affected) {
    console.log(`  ${target.table}.${target.column}: ${count} row(s)`);
    const samples = await sampleAffected(target, 3);
    for (const sample of samples) {
      console.log(`      e.g. ${truncate(sample)}`);
    }
  }

  if (!apply) {
    console.log('\nRe-run with --apply to decode these values.');
    return;
  }

  console.log('\nRepairing…\n');

  let total = 0;

  for (const { target, count } of affected) {
    const remaining = await repair(target);
    total += count;
    console.log(`  ${target.table}.${target.column}: ${count} rewritten, ${remaining} remaining`);
  }

  console.log(`\nDone. ${total} row(s) rewritten across ${affected.length} column(s).`);
  console.log('Verify by re-running without --apply — it should report nothing to do.');
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('\nFailed:', error instanceof Error ? error.message : error);
    process.exit(1);
  });
