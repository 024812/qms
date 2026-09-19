import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { quiltStatusEnum } from '@/db/schema';
import { isQuiltStatus } from '@/lib/database/types';
import {
  QUILT_STATUSES,
  QuiltStatus,
  QuiltStatusSchema,
  createQuiltSchema,
  quiltFiltersSchema,
} from '@/lib/validations/quilt';

/**
 * Blueprint §4.2 requires the DB enum, the Zod enum, the UI option list and the
 * stats dimensions to describe exactly the same set of values.
 *
 * That invariant used to be maintained by hand, and it drifted: `quilt_status`
 * had four values in Postgres while the Zod schema, the Agent tool schemas and
 * the i18n catalogues only knew three. These tests make the parity mechanical —
 * adding a status to `QuiltStatus` without propagating it now fails here rather
 * than in production.
 */

const sorted = (values: readonly string[]) => [...values].sort();

function readStatusMessages(locale: 'en' | 'zh'): string[] {
  const file = path.resolve(process.cwd(), 'messages', `${locale}.json`);
  const messages = JSON.parse(readFileSync(file, 'utf8')) as {
    status: Record<string, string>;
  };
  return Object.keys(messages.status);
}

describe('quilt status enum parity', () => {
  it('keeps the runtime list in sync with the QuiltStatus object', () => {
    expect(sorted(QUILT_STATUSES)).toEqual(sorted(Object.values(QuiltStatus)));
  });

  it('keeps the Zod enum in sync with the runtime list', () => {
    expect(sorted(QuiltStatusSchema.options)).toEqual(sorted(QUILT_STATUSES));
  });

  it('keeps the Postgres enum in sync with the runtime list', () => {
    expect(sorted(quiltStatusEnum.enumValues)).toEqual(sorted(QUILT_STATUSES));
  });

  it.each(['en', 'zh'] as const)('keeps the %s catalogue in sync with the runtime list', locale => {
    expect(sorted(readStatusMessages(locale))).toEqual(sorted(QUILT_STATUSES));
  });

  it('has no duplicate values in the runtime list', () => {
    expect(new Set(QUILT_STATUSES).size).toBe(QUILT_STATUSES.length);
  });
});

describe('quilt status acceptance', () => {
  it.each(QUILT_STATUSES)('accepts %s as a filter value', status => {
    expect(quiltFiltersSchema.safeParse({ status }).success).toBe(true);
  });

  it.each(QUILT_STATUSES)('accepts %s as a create payload status', status => {
    const result = createQuiltSchema.safeParse({
      season: 'WINTER',
      lengthCm: 200,
      widthCm: 180,
      weightGrams: 2000,
      fillMaterial: 'Down',
      color: 'White',
      location: 'Closet',
      currentStatus: status,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currentStatus).toBe(status);
    }
  });

  it('rejects an unknown status', () => {
    expect(quiltFiltersSchema.safeParse({ status: 'AVAILABLE' }).success).toBe(false);
    expect(createQuiltSchema.safeParse({ currentStatus: 'AVAILABLE' }).success).toBe(false);
  });

  it('defaults to STORAGE when no status is supplied', () => {
    const result = createQuiltSchema.safeParse({
      season: 'SUMMER',
      lengthCm: 200,
      widthCm: 180,
      weightGrams: 500,
      fillMaterial: 'Cotton',
      color: 'Blue',
      location: 'Closet',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currentStatus).toBe('STORAGE');
    }
  });
});

describe('isQuiltStatus type guard', () => {
  it.each(QUILT_STATUSES)('accepts %s', status => {
    expect(isQuiltStatus(status)).toBe(true);
  });

  it.each(['AVAILABLE', '', 'in_use', null, undefined, 42, {}])('rejects %s', value => {
    expect(isQuiltStatus(value)).toBe(false);
  });
});
