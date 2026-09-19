/**
 * Tests for the shared module search-condition builder.
 *
 * Guards the P2-8 fix: before it, `quilts`/`spirits` searched case-insensitively via
 * `LOWER(col)` while `paddles`/`antiques`/`maps` searched case-sensitively, and none of
 * them escaped LIKE metacharacters — so searching `%` matched every row.
 *
 * The generated SQL is asserted by compiling it with `PgDialect`, which is the only way
 * to prove the `LOWER(...)` wrapping and the `ESCAPE`-free backslash quoting are really
 * present in the statement Postgres will receive.
 */

import { describe, expect, it } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';

import { quilts } from '@/db/schema';
import {
  containsInsensitive,
  containsInsensitiveFilter,
  escapeLikePattern,
  searchAnyColumn,
} from '@/lib/data/search';

const dialect = new PgDialect();

function compile(query: Parameters<typeof dialect.sqlToQuery>[0]) {
  return dialect.sqlToQuery(query);
}

describe('escapeLikePattern', () => {
  it('leaves an ordinary term untouched', () => {
    expect(escapeLikePattern('down quilt')).toBe('down quilt');
  });

  it('escapes the multi-character wildcard', () => {
    // Unescaped, `%` would match every row.
    expect(escapeLikePattern('100%')).toBe('100\\%');
  });

  it('escapes the single-character wildcard', () => {
    // Unescaped, `a_b` would also match `axb`.
    expect(escapeLikePattern('a_b')).toBe('a\\_b');
  });

  it('escapes backslashes before the wildcards it introduces', () => {
    // Order matters: escaping `%` first would double-escape these backslashes.
    expect(escapeLikePattern('\\')).toBe('\\\\');
    expect(escapeLikePattern('a\\%b')).toBe('a\\\\\\%b');
  });

  it('escapes every occurrence, not just the first', () => {
    expect(escapeLikePattern('%%__')).toBe('\\%\\%\\_\\_');
  });
});

describe('containsInsensitive', () => {
  it('lower-cases both sides and anchors the term with wildcards', () => {
    const { sql, params } = compile(containsInsensitive(quilts.name, 'Down'));

    expect(sql.toLowerCase()).toContain('lower(');
    expect(sql.toLowerCase()).toContain('like');
    expect(params).toContain('%down%');
  });

  it('neutralises LIKE wildcards in the term', () => {
    const { params } = compile(containsInsensitive(quilts.name, '100%'));

    // The pattern must contain a literal, escaped percent sign rather than a bare one.
    expect(params).toContain('%100\\%%');
  });
});

describe('searchAnyColumn', () => {
  it('returns undefined for a missing term', () => {
    expect(searchAnyColumn([quilts.name], undefined)).toBeUndefined();
  });

  it('returns undefined for a blank term', () => {
    // Important: an empty pattern would otherwise be `%%`, matching every row.
    expect(searchAnyColumn([quilts.name], '')).toBeUndefined();
    expect(searchAnyColumn([quilts.name], '   ')).toBeUndefined();
  });

  it('returns undefined when no columns are supplied', () => {
    expect(searchAnyColumn([], 'down')).toBeUndefined();
  });

  it('trims the term before matching', () => {
    const { params } = compile(searchAnyColumn([quilts.name], '  down  ') as never);

    expect(params).toContain('%down%');
  });

  it('builds a single condition for one column', () => {
    const { sql } = compile(searchAnyColumn([quilts.name], 'down') as never);

    expect(sql).not.toContain(' or ');
  });

  it('joins several columns with OR', () => {
    const { sql, params } = compile(
      searchAnyColumn([quilts.name, quilts.color, quilts.notes], 'down') as never
    );

    expect(sql).toContain(' or ');
    // Three columns, one lower-cased pattern each.
    expect(params.filter(value => value === '%down%')).toHaveLength(3);
  });

  it('applies the same term to every column', () => {
    const { params } = compile(searchAnyColumn([quilts.name, quilts.color], 'Down') as never);

    expect(params).toEqual(['%down%', '%down%']);
  });
});

describe('containsInsensitiveFilter', () => {
  it('returns undefined for a missing or blank value', () => {
    expect(containsInsensitiveFilter(quilts.brand, undefined)).toBeUndefined();
    expect(containsInsensitiveFilter(quilts.brand, '')).toBeUndefined();
    expect(containsInsensitiveFilter(quilts.brand, '  ')).toBeUndefined();
  });

  it('builds a case-insensitive contains condition for a real value', () => {
    const { sql, params } = compile(containsInsensitiveFilter(quilts.brand, 'Acme') as never);

    expect(sql.toLowerCase()).toContain('lower(');
    expect(params).toContain('%acme%');
  });
});
