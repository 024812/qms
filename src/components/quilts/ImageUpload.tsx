'use client';

/**
 * Image Upload Component
 *
 * Supports multiple image upload with preview, drag-and-drop reordering, and deletion
 */

import { useState, useRef, DragEvent } from 'react';
import { X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { compressAndEncodeImage, validateImageFile } from '@/lib/image-utils';

export interface ImageUploadProps {
  images: string[]; // Base64 strings
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  label?: string;
  showMainImage?: boolean;
}

export function ImageUpload({
  images,
  onImagesChange,
  maxImages = 5,
  label,
  showMainImage = true,
}: ImageUploadProps) {
  const t = useTranslations();
  const [isUploading, setIsUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      toast.error(t('quilts.dialogs.imageUpload.maxImagesError', { max: maxImages }));
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    setIsUploading(true);

    try {
      const newImages: string[] = [];

      for (const file of filesToProcess) {
        // Validate file
        const validation = validateImageFile(file);
        if (!validation.valid) {
          toast.error(validation.error || t('quilts.dialogs.imageUpload.validationError'));
          continue;
        }

        // Compress and encode
        const base64 = await compressAndEncodeImage(file);
        newImages.push(base64);
      }

      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages]);
        toast.success(
          t('quilts.dialogs.imageUpload.addedSuccess', { count: newImages.length })
        );
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('quilts.dialogs.imageUpload.uploadError'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    toast.success(t('quilts.dialogs.imageUpload.deleteSuccess'));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newImages = [...images];
    const [draggedImage] = newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);

    onImagesChange(newImages);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label || t('quilts.dialogs.imageUpload.label')}</label>
        <span className="text-xs text-gray-500">
          {images.length} / {maxImages}
        </span>
      </div>

      {/* Image Grid */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
        role="list"
        aria-label={t('quilts.dialogs.imageUpload.label')}
      >
        {images.map((image, imageIndex) => (
          // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
          <div
            key={`${image.substring(0, 30)}-${imageIndex}`}
            draggable
            onDragStart={() => handleDragStart(imageIndex)}
            onDragOver={handleDragOver}
            onDrop={e => handleDrop(e, imageIndex)}
            onDragEnd={handleDragEnd}
            role="listitem"
            aria-label={`${t('quilts.dialogs.images.attachment', { index: imageIndex + 1 })} ${
              showMainImage && imageIndex === 0 ? t('quilts.dialogs.images.main') : ''
            }. ${t('quilts.dialogs.imageUpload.dragHint')}`}
            className={`
              relative aspect-square rounded-lg overflow-hidden border-2 
              ${draggedIndex === imageIndex ? 'opacity-50 border-blue-500' : 'border-gray-200'}
              hover:border-blue-400 transition-all cursor-move group
            `}
          >
            {/* Main Image Badge */}
            {showMainImage && imageIndex === 0 && (
              <div className="absolute top-2 left-2 z-10">
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  {t('quilts.dialogs.images.main')}
                </span>
              </div>
            )}

            {/* Image */}
            {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/no-noninteractive-element-interactions */}
            <img
              src={image}
              alt={t('quilts.dialogs.images.attachment', { index: imageIndex + 1 })}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ zIndex: 1 }}
              onError={e => {
                e.currentTarget.src =
                  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" font-family="system-ui" font-size="14" fill="%239ca3af" text-anchor="middle" dy=".3em"%3EError%3C/text%3E%3C/svg%3E';
              }}
            />

            {/* Delete Button */}
            <button
              type="button"
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                handleDelete(imageIndex);
              }}
              className="
                absolute top-2 right-2 z-30
                bg-red-500 text-white rounded-full p-1
                opacity-0 group-hover:opacity-100 transition-opacity
                hover:bg-red-600
              "
              aria-label={t('quilts.dialogs.imageUpload.deleteImage')}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Drag Indicator */}
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none transition-all"
              style={{
                zIndex: 20,
                backgroundColor: 'transparent',
              }}
            >
              <span className="text-white opacity-0 group-hover:opacity-100 text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                {t('quilts.dialogs.imageUpload.dragHint')}
              </span>
            </div>
          </div>
        ))}

        {/* Upload Button */}
        {images.length < maxImages && (
          <button
            type="button"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            disabled={isUploading}
            className="
              aspect-square rounded-lg border-2 border-dashed border-gray-300
              hover:border-blue-400 hover:bg-blue-50
              transition-all flex flex-col items-center justify-center
              text-gray-500 hover:text-blue-500
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                <span className="text-xs mt-2">{t('quilts.dialogs.imageUpload.uploading')}</span>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 mb-2" />
                <span className="text-xs">{t('quilts.dialogs.imageUpload.clickToUpload')}</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        onChange={e => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Help Text */}
      <p className="text-xs text-gray-500">
        {t('quilts.dialogs.imageUpload.helpText')}
      </p>
    </div>
  );
}
