import { describe, expect, it } from 'vitest';
import { sanitizeApiInput, sanitizeString } from '../sanitization';

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

    it('preserves safe URLs while escaping regular text fields', () => {
      const endpoint = 'https://example.com/api?foo=1&bar=2';

      const result = sanitizeApiInput({
        endpoint,
        notes: '<script>alert("xss")</script>',
      });

      expect(result.endpoint).toBe(endpoint);
      expect(result.notes).toContain('&lt;script&gt;');
      expect(result.notes).not.toContain('<script>');
    });
  });

  describe('sanitizeString', () => {
    it('continues to escape plain text input', () => {
      expect(sanitizeString(' <b>70/30 & ready</b> ')).toBe(
        '&lt;b&gt;70&#x2F;30 &amp; ready&lt;&#x2F;b&gt;'
      );
    });
  });
});
