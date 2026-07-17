import { z } from 'zod';

export const MAX_STORED_IMAGE_BYTES = 512 * 1024;
export const MAX_ATTACHMENT_IMAGES = 5;
export const MAX_IMAGE_DATA_URL_LENGTH = Math.ceil((MAX_STORED_IMAGE_BYTES * 4) / 3) + 128;

const DATA_IMAGE_PATTERN = /^data:image\/(?:jpeg|jpg|png|gif|webp);base64,[A-Za-z0-9+/=]+$/i;

export const imageReferenceSchema = z
  .string()
  .max(MAX_IMAGE_DATA_URL_LENGTH, 'Image data is too large')
  .refine(value => {
    if (DATA_IMAGE_PATTERN.test(value)) return true;

    try {
      const url = new URL(value);
      return value.length <= 2048 && (url.protocol === 'https:' || url.protocol === 'http:');
    } catch {
      return false;
    }
  }, 'Image must be a supported data URL or HTTP(S) URL');

export const attachmentImagesSchema = z
  .array(imageReferenceSchema)
  .max(MAX_ATTACHMENT_IMAGES, `At most ${MAX_ATTACHMENT_IMAGES} attachment images are allowed`);
