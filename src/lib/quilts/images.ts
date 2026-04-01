import type { Quilt } from '@/lib/validations/quilt';

type QuiltImageFields = Pick<Quilt, 'mainImage' | 'attachmentImages'>;

export function normalizeQuiltImage(image?: string | null): string | null {
  if (!image) {
    return null;
  }

  return image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;
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
