import type { Quilt } from '@/lib/validations/quilt';

type QuiltImageFields = Pick<Quilt, 'mainImage' | 'attachmentImages'>;

const MAX_IMAGE_BYTES = 80 * 1024; // 80KB per image

export function normalizeQuiltImage(image?: string | null): string | null {
  if (!image) {
    return null;
  }

  return image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;
}

function getBase64ByteLength(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] || dataUrl;
  return (base64.length * 3) / 4;
}

export async function compressDataUrl(dataUrl: string): Promise<string> {
  if (getBase64ByteLength(dataUrl) <= MAX_IMAGE_BYTES) {
    return dataUrl;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 800;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      let quality = 0.7;
      let result = canvas.toDataURL('image/webp', quality);
      const maxChars = MAX_IMAGE_BYTES * (4 / 3);
      while (result.length > maxChars && quality > 0.2) {
        quality -= 0.05;
        result = canvas.toDataURL('image/webp', quality);
      }
      resolve(result);
    };
    img.onerror = () => reject(new Error('Failed to load image for compression'));
    img.src = dataUrl;
  });
}

export async function ensureImagesCompressed(images: string[]): Promise<string[]> {
  return Promise.all(images.map(img => compressDataUrl(img)));
}

export function getQuiltImageList(quilt?: Partial<QuiltImageFields> | null): string[] {
  const images: string[] = [];
  const mainImage = normalizeQuiltImage(quilt?.mainImage);

  if (mainImage) {
    images.push(mainImage);
  }

  if (Array.isArray(quilt?.attachmentImages)) {
    for (const attachment of quilt.attachmentImages) {
      const normalizedAttachment = normalizeQuiltImage(attachment);

      if (normalizedAttachment) {
        images.push(normalizedAttachment);
      }
    }
  }

  return images;
}

export function getQuiltImagePayload(images: string[]): {
  mainImage: string | null;
  attachmentImages: string[];
} {
  return {
    mainImage: images[0] ?? null,
    attachmentImages: images.length > 1 ? images.slice(1) : [],
  };
}

export function areQuiltImageListsEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((image, index) => image === right[index]);
}
