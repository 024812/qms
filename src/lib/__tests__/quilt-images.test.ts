import { describe, expect, it } from 'vitest';
import {
  areQuiltImageListsEqual,
  getQuiltImageList,
  getQuiltImagePayload,
  normalizeQuiltImage,
} from '../quilts/images';

describe('quilt image helpers', () => {
  it('normalizes stored base64 images to data urls', () => {
    expect(normalizeQuiltImage('data:image/jpeg;base64,abc')).toBe('data:image/jpeg;base64,abc');
    expect(normalizeQuiltImage('abc123')).toBe('data:image/jpeg;base64,abc123');
    expect(normalizeQuiltImage(null)).toBeNull();
  });

  it('builds a normalized image list from quilt image fields', () => {
    expect(
      getQuiltImageList({
        mainImage: 'main-base64',
        attachmentImages: ['data:image/png;base64,one', 'two'],
      })
    ).toEqual([
      'data:image/jpeg;base64,main-base64',
      'data:image/png;base64,one',
      'data:image/jpeg;base64,two',
    ]);
  });

  it('builds an image payload for the images api', () => {
    expect(getQuiltImagePayload([])).toEqual({
      mainImage: null,
      attachmentImages: [],
    });

    expect(getQuiltImagePayload(['main', 'detail-1', 'detail-2'])).toEqual({
      mainImage: 'main',
      attachmentImages: ['detail-1', 'detail-2'],
    });
  });

  it('compares image lists in order', () => {
    expect(areQuiltImageListsEqual(['a', 'b'], ['a', 'b'])).toBe(true);
    expect(areQuiltImageListsEqual(['a', 'b'], ['b', 'a'])).toBe(false);
    expect(areQuiltImageListsEqual(['a'], ['a', 'b'])).toBe(false);
  });
});
