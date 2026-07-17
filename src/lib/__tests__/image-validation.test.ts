import { describe, expect, it } from 'vitest';

import {
  attachmentImagesSchema,
  imageReferenceSchema,
  MAX_ATTACHMENT_IMAGES,
  MAX_IMAGE_DATA_URL_LENGTH,
} from '@/lib/validations/image';

describe('stored image validation', () => {
  it('accepts supported data URLs and HTTP(S) URLs', () => {
    expect(imageReferenceSchema.safeParse('data:image/webp;base64,AAAA').success).toBe(true);
    expect(imageReferenceSchema.safeParse('https://example.com/image.webp').success).toBe(true);
  });

  it('rejects executable, malformed, and oversized image references', () => {
    expect(imageReferenceSchema.safeParse('data:image/svg+xml;base64,AAAA').success).toBe(false);
    const executableUrl = ['java', 'script:alert(1)'].join('');
    expect(imageReferenceSchema.safeParse(executableUrl).success).toBe(false);
    expect(imageReferenceSchema.safeParse('x'.repeat(MAX_IMAGE_DATA_URL_LENGTH + 1)).success).toBe(
      false
    );
  });

  it('limits attachment counts', () => {
    const images = Array.from(
      { length: MAX_ATTACHMENT_IMAGES + 1 },
      () => 'data:image/png;base64,AAAA'
    );
    expect(attachmentImagesSchema.safeParse(images).success).toBe(false);
  });
});
