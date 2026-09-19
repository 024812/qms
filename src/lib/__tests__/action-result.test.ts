/**
 * Tests for the shared Server Action result contract.
 *
 * The contract used to be declared once per action module: ten copies of
 * `ActionSuccess` / `ActionError` / `ActionResult`, twenty copies of the error
 * factories, four copies of `zodFieldErrors` plus twenty-eight inline
 * `error.flatten().fieldErrors as Record<string, string[]>` casts, and eleven
 * byte-identical copies of `unwrapActionResult` in the hooks. The copies had
 * drifted — the same concept was named `unauthorizedResult` in five modules and
 * `unauthorizedErrorResult` in the other five, `notFoundResult` sat alongside
 * `notFoundErrorResult`, two modules omitted `fieldErrors` from the error shape,
 * and the code → HTTP status map lived in a module that re-declared the shape
 * rather than importing it.
 *
 * The last describe block is a source scan that fails if any of those copies
 * comes back. It is the machine-checkable form of the review finding: the
 * duplication was invisible to the type checker (every copy compiled) and
 * invisible to the tests (every copy behaved), so nothing would have caught a
 * reintroduction.
 */

import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  ACTION_ERROR_CODES,
  ACTION_ERROR_STATUS,
  badRequestErrorResult,
  conflictErrorResult,
  forbiddenErrorResult,
  internalErrorResult,
  notFoundErrorResult,
  unauthorizedErrorResult,
  unwrapActionResult,
  validationErrorResult,
  zodFieldErrors,
  type ActionResult,
} from '@/lib/api/action-result';
import { actionResultToApiResponse } from '@/lib/api/action-response';

describe('action error factories', () => {
  const cases: Array<{ name: string; result: ActionResult<never>; code: string }> = [
    { name: 'badRequest', result: badRequestErrorResult('m'), code: 'BAD_REQUEST' },
    { name: 'validation', result: validationErrorResult('m'), code: 'VALIDATION_FAILED' },
    { name: 'unauthorized', result: unauthorizedErrorResult('m'), code: 'UNAUTHORIZED' },
    { name: 'forbidden', result: forbiddenErrorResult('m'), code: 'FORBIDDEN' },
    { name: 'notFound', result: notFoundErrorResult('m'), code: 'NOT_FOUND' },
    { name: 'conflict', result: conflictErrorResult('m'), code: 'ALREADY_EXISTS' },
    { name: 'internal', result: internalErrorResult('m'), code: 'INTERNAL_ERROR' },
  ];

  for (const { name, result, code } of cases) {
    it(`${name} emits ${code} and never reports success`, () => {
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(code);
        expect(result.error.message).toBe('m');
      }
    });
  }

  it('keeps conflictErrorResult on ALREADY_EXISTS so the wire contract is unchanged', () => {
    // The helper is named "conflict" but has always emitted ALREADY_EXISTS (409).
    // Renaming the code here would be a breaking API change for callers.
    const result = conflictErrorResult('Quilt already has an active usage record');

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe('ALREADY_EXISTS');
  });

  it('omits fieldErrors entirely when none are supplied', () => {
    const withoutFields = validationErrorResult('m');
    const withFields = validationErrorResult('m', { name: ['required'] });

    expect(withoutFields.success).toBe(false);
    if (!withoutFields.success) expect('fieldErrors' in withoutFields.error).toBe(false);

    expect(withFields.success).toBe(false);
    if (!withFields.success) expect(withFields.error.fieldErrors).toEqual({ name: ['required'] });
  });

  it('defaults the unauthorized message but accepts an override', () => {
    const fallback = unauthorizedErrorResult();
    const explicit = unauthorizedErrorResult('Requires admin privileges');

    expect(fallback.success).toBe(false);
    if (!fallback.success) expect(fallback.error.message).toBe('Unauthorized');
    expect(explicit.success).toBe(false);
    if (!explicit.success) expect(explicit.error.message).toBe('Requires admin privileges');
  });
});

describe('error code → HTTP status', () => {
  it('maps every code', () => {
    for (const code of ACTION_ERROR_CODES) {
      expect(ACTION_ERROR_STATUS[code]).toBeGreaterThanOrEqual(400);
    }
  });

  it('does not carry a status for a code that cannot be emitted', () => {
    expect(Object.keys(ACTION_ERROR_STATUS).sort()).toEqual([...ACTION_ERROR_CODES].sort());
  });

  it('maps validation and bad-request to 400 and internal to 500', () => {
    expect(ACTION_ERROR_STATUS.VALIDATION_FAILED).toBe(400);
    expect(ACTION_ERROR_STATUS.BAD_REQUEST).toBe(400);
    expect(ACTION_ERROR_STATUS.UNAUTHORIZED).toBe(401);
    expect(ACTION_ERROR_STATUS.FORBIDDEN).toBe(403);
    expect(ACTION_ERROR_STATUS.NOT_FOUND).toBe(404);
    expect(ACTION_ERROR_STATUS.ALREADY_EXISTS).toBe(409);
    expect(ACTION_ERROR_STATUS.INTERNAL_ERROR).toBe(500);
  });
});

describe('zodFieldErrors', () => {
  it('flattens a Zod error into the fieldErrors shape', () => {
    const parsed = z.object({ name: z.string().min(1) }).safeParse({ name: '' });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const fieldErrors = zodFieldErrors(parsed.error);
      expect(Object.keys(fieldErrors)).toContain('name');
    }
  });
});

describe('unwrapActionResult', () => {
  it('returns the payload on success', () => {
    expect(unwrapActionResult({ success: true, data: { id: 'x' } })).toEqual({ id: 'x' });
  });

  it('throws the error message on failure', () => {
    expect(() => unwrapActionResult({ success: false, error: { message: 'nope' } })).toThrow('nope');
  });
});

describe('actionResultToApiResponse', () => {
  it('returns a success envelope', () => {
    const response = actionResultToApiResponse({ success: true, data: { id: 'x' } });

    expect(response.status).toBe(200);
  });

  it('maps an error code to its HTTP status', () => {
    expect(actionResultToApiResponse(notFoundErrorResult('missing')).status).toBe(404);
    expect(actionResultToApiResponse(conflictErrorResult('dup')).status).toBe(409);
    expect(actionResultToApiResponse(internalErrorResult('boom')).status).toBe(500);
  });

  it('surfaces fieldErrors under error.details.errors', async () => {
    const response = actionResultToApiResponse(validationErrorResult('bad', { name: ['required'] }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.details.errors).toEqual({ name: ['required'] });
  });
});

describe('no module re-declares the action result contract', () => {
  /**
   * Declarations that must exist only in `src/lib/api/action-result.ts`.
   * Matched at the start of a line so prose mentions in comments are ignored.
   */
  const FORBIDDEN = [
    /^(export\s+)?interface ActionSuccess\b/,
    /^(export\s+)?interface ActionError\b/,
    /^(export\s+)?type ActionResult\b/,
    /^(export\s+)?function validationErrorResult\b/,
    /^(export\s+)?function notFoundErrorResult\b/,
    /^(export\s+)?function notFoundResult\b/,
    /^(export\s+)?function internalErrorResult\b/,
    /^(export\s+)?function unauthorizedErrorResult\b/,
    /^(export\s+)?function unauthorizedResult\b/,
    /^(export\s+)?function conflictErrorResult\b/,
    /^(export\s+)?function badRequestErrorResult\b/,
    /^(export\s+)?function badRequestResult\b/,
    /^(export\s+)?function zodFieldErrors\b/,
    /^(export\s+)?function unwrapActionResult\b/,
  ];

  const SOURCE_ROOT = path.resolve(process.cwd(), 'src');
  const SCANNED_DIRS = ['app/actions', 'hooks'];
  const ALLOWED = [path.resolve(SOURCE_ROOT, 'lib/api/action-result.ts')];

  function walk(dir: string): string[] {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(full);
      return /\.tsx?$/.test(entry.name) ? [full] : [];
    });
  }

  /**
   * Blanks out import statements before scanning.
   *
   * Now that every consumer imports the forbidden names from the shared module,
   * a multi-line import puts each member on its own line — `  type ActionResult,`
   * reads exactly like a declaration, and anchoring the pattern to the start of
   * the line does not help because a member line *does* start with one. Imports
   * are replaced with spaces rather than deleted so reported line numbers stay
   * accurate.
   */
  function blankImports(source: string): string {
    return source.replace(/^import\b[\s\S]*?from\s*['"][^'"]*['"];?/gm, block =>
      block.replace(/[^\n]/g, ' ')
    );
  }

  it('finds no duplicate declaration in the action and hook layers', () => {
    const offenders: string[] = [];

    for (const relative of SCANNED_DIRS) {
      for (const file of walk(path.join(SOURCE_ROOT, relative))) {
        if (ALLOWED.includes(file)) continue;

        const lines = blankImports(fs.readFileSync(file, 'utf8')).split('\n');
        lines.forEach((line, index) => {
          if (FORBIDDEN.some(pattern => pattern.test(line.trim()))) {
            offenders.push(`${path.relative(SOURCE_ROOT, file)}:${index + 1}`);
          }
        });
      }
    }

    expect(offenders).toEqual([]);
  });

  it('flags a real declaration but not an import of the same name', () => {
    // Positive control: without this the scan could pass by matching nothing at
    // all, and the false positive below would go unnoticed again.
    const matches = (source: string) =>
      blankImports(source)
        .split('\n')
        .filter(line => FORBIDDEN.some(pattern => pattern.test(line.trim())));

    const duplicate = 'export function validationErrorResult(message: string) {}';
    const importer = [
      'import {',
      '  validationErrorResult,',
      '  type ActionResult,',
      "} from '@/lib/api/action-result';",
    ].join('\n');

    expect(matches(duplicate)).toHaveLength(1);
    expect(matches(importer)).toEqual([]);
  });

  it('keeps the inline zod error cast inside the shared helper', () => {
    // Assembled at runtime so this test file does not flag itself.
    const INLINE_CAST = ['flatten()', 'fieldErrors'].join('.');
    // Comment lines are prose: the finding may legitimately be described there.
    const COMMENT = /^\s*(\/\/|\*|\/\*)/;
    const offenders: string[] = [];

    for (const file of walk(SOURCE_ROOT)) {
      if (ALLOWED.includes(file)) continue;

      const lines = fs.readFileSync(file, 'utf8').split('\n');
      lines.forEach((line, index) => {
        if (COMMENT.test(line)) return;
        if (line.includes(INLINE_CAST)) {
          offenders.push(`${path.relative(SOURCE_ROOT, file)}:${index + 1}`);
        }
      });
    }

    expect(offenders).toEqual([]);
  });

  it('flags a code line but not a comment describing the pattern', () => {
    // Positive control, same reasoning as the declaration scan above.
    const INLINE_CAST = ['flatten()', 'fieldErrors'].join('.');
    const COMMENT = /^\s*(\/\/|\*|\/\*)/;
    const flagged = (line: string) => !COMMENT.test(line) && line.includes(INLINE_CAST);

    expect(flagged(`        ${INLINE_CAST} as Record<string, string[]>`)).toBe(true);
    expect(flagged(`   * inline ${INLINE_CAST} casts were removed`)).toBe(false);
  });

  it('scans a non-empty set of files, so the guard cannot pass vacuously', () => {
    const scanned = SCANNED_DIRS.flatMap(relative =>
      walk(path.join(SOURCE_ROOT, relative))
    );

    expect(scanned.length).toBeGreaterThan(10);
  });
});
