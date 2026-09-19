/**
 * Shared search-condition builder for module DALs.
 *
 * Every module DAL must express keyword search through this helper, so that two
 * behaviours stay identical across modules:
 *
 * 1. **Case-insensitivity.** Both the term and the column are lower-cased, so the same
 *    query behaves the same on Postgres no matter how the data was entered. Previously
 *    `quilts`/`spirits` wrapped columns in `LOWER()` while `paddles`/`antiques`/`maps`
 *    did not, so a search for `down` matched `Down` in one module and missed it in another.
 *
 * 2. **LIKE wildcard neutralisation.** In a user search term, `%` and `_` are ordinary
 *    characters, not operators. Unescaped, a search for `%` matches every row and `a_b`
 *    matches `axb`, which is both wrong and a cheap way to force a full scan.
 *
 * Keep search semantics here and nowhere else; blueprint §10.3 forbids parallel
 * implementations of the same behaviour.
 */

import { type SQL, like, or, sql } from 'drizzle-orm';
import { type PgColumn } from 'drizzle-orm/pg-core';

/** Postgres uses backslash as the default `LIKE` escape character. */
const LIKE_ESCAPE_CHAR = '\\';

/**
 * Escape the `LIKE` metacharacters in a user-supplied search term.
 *
 * Backslash is escaped first — otherwise escaping `%` would double-escape the
 * backslashes introduced by a literal `\` in the input.
 */
export function escapeLikePattern(term: string): string {
  return term
    .replace(/\\/g, `${LIKE_ESCAPE_CHAR}${LIKE_ESCAPE_CHAR}`)
    .replace(/%/g, `${LIKE_ESCAPE_CHAR}%`)
    .replace(/_/g, `${LIKE_ESCAPE_CHAR}_`);
}

/**
 * Build a case-insensitive "contains" condition for a single text column,
 * evaluated as `LOWER(column) LIKE '%term%'`.
 */
export function containsInsensitive(column: PgColumn, term: string): SQL {
  const pattern = `%${escapeLikePattern(term.toLowerCase())}%`;
  return like(sql`LOWER(${column})`, pattern);
}

/**
 * Build an OR of case-insensitive "contains" conditions across several columns.
 *
 * Returns `undefined` for an empty term or an empty column list, so callers can skip
 * the condition entirely rather than accidentally matching every row.
 */
export function searchAnyColumn(columns: PgColumn[], term: string | undefined): SQL | undefined {
  const trimmed = term?.trim();
  if (!trimmed || columns.length === 0) {
    return undefined;
  }

  const conditions = columns.map(column => containsInsensitive(column, trimmed));
  return conditions.length === 1 ? conditions[0] : or(...conditions);
}

/**
 * Build a case-insensitive "contains" condition for an optional filter value
 * (for example a `location` or `brand` filter). Returns `undefined` when the value is
 * empty, so callers can skip it.
 */
export function containsInsensitiveFilter(
  column: PgColumn,
  value: string | undefined
): SQL | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  return containsInsensitive(column, trimmed);
}
