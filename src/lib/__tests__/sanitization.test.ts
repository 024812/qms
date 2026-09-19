import { describe, expect, it } from 'vitest';
import { escapeHtml, sanitizeApiInput, sanitizeSearchQuery, sanitizeString } from '../sanitization';

/**
 * Regression tests for the double-encoding defect.
 *
 * The input layer used to HTML-escape every string, so `A & B` was persisted as
 * `A &amp; B` and rendered as `A &amp;amp; B`. These tests pin the corrected
 * contract: normalise on the way in, escape only when building HTML output.
 */
describe('sanitization', () => {
  describe('sanitizeApiInput', () => {
    it('preserves image data URLs in strings, arrays, and nested objects', () => {
      const mainImage = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==';
      const attachmentImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==';

      const result = sanitizeApiInput({
        mainImage,
        attachmentImages: [attachmentImage],
        nested: {
          frontImage: mainImage,
        },
      });

      expect(result.mainImage).toBe(mainImage);
      expect(result.attachmentImages).toEqual([attachmentImage]);
      expect((result.nested as { frontImage: string }).frontImage).toBe(mainImage);
    });

    it('stores business text verbatim instead of HTML-escaping it', () => {
      const result = sanitizeApiInput({
        endpoint: 'https://example.com/api?foo=1&bar=2',
        notes: 'A & B — 70/30 blend, "quilted" <by hand>',
      });

      expect(result.endpoint).toBe('https://example.com/api?foo=1&bar=2');
      expect(result.notes).toBe('A & B — 70/30 blend, "quilted" <by hand>');
      expect(result.notes).not.toContain('&amp;');
      expect(result.notes).not.toContain('&lt;');
    });

    it('does not double-encode when the stored value is later escaped for rendering', () => {
      const stored = sanitizeApiInput({ notes: 'A & B' }).notes;

      expect(stored).toBe('A & B');
      expect(escapeHtml(stored)).toBe('A &amp; B');
      // The old behaviour would have produced `A &amp;amp; B` here.
      expect(escapeHtml(stored)).not.toContain('&amp;amp;');
    });

    it('trims and drops control characters but keeps tabs and newlines', () => {
      const result = sanitizeApiInput({
        notes: '  line one\nline two\tindented\u0000\u0007\u001b  ',
      });

      expect(result.notes).toBe('line one\nline two\tindented');
    });

    it('normalises strings inside arrays and nested objects', () => {
      const result = sanitizeApiInput({
        tags: ['  alpha  ', 'beta\u0000'],
        nested: { label: '  <raw>  ' },
      });

      expect(result.tags).toEqual(['alpha', 'beta']);
      expect((result.nested as { label: string }).label).toBe('<raw>');
    });

    it('leaves non-string values untouched', () => {
      const purchaseDate = new Date('2026-01-02T03:04:05.000Z');
      const result = sanitizeApiInput({
        count: 7,
        active: true,
        purchaseDate,
        missing: null,
      });

      expect(result.count).toBe(7);
      expect(result.active).toBe(true);
      expect(result.purchaseDate).toBe(purchaseDate);
      expect(result.missing).toBeNull();
    });
  });

  describe('sanitizeString', () => {
    it('normalises plain text without escaping it', () => {
      expect(sanitizeString(' <b>70/30 & ready</b> ')).toBe('<b>70/30 & ready</b>');
    });
  });

  describe('sanitizeSearchQuery', () => {
    it('keeps characters that are meaningful in a search term', () => {
      expect(sanitizeSearchQuery('  AT&T  ')).toBe('AT&T');
      expect(sanitizeSearchQuery(`O'Brien "quilt"`)).toBe(`O'Brien "quilt"`);
      expect(sanitizeSearchQuery('<script>')).toBe('<script>');
    });

    it('caps the term at 100 characters', () => {
      expect(sanitizeSearchQuery('a'.repeat(150))).toHaveLength(100);
    });

    it('returns an empty string for non-string input', () => {
      expect(sanitizeSearchQuery(undefined)).toBe('');
      expect(sanitizeSearchQuery(42)).toBe('');
    });

    it('preserves LIKE wildcards for the SQL layer to escape', () => {
      // `src/lib/data/search.ts` is responsible for escaping `%` and `_`.
      expect(sanitizeSearchQuery('50% wool_blanket')).toBe('50% wool_blanket');
    });
  });

  describe('escapeHtml', () => {
    it('still escapes when building an HTML string', () => {
      expect(escapeHtml('<b>70/30 & ready</b>')).toBe(
        '&lt;b&gt;70&#x2F;30 &amp; ready&lt;&#x2F;b&gt;'
      );
    });
  });
});
