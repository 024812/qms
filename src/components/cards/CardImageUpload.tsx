'use client';

/**
 * Card Image Upload Component
 *
 * Specialized for sports cards with front/back image support
 * Supports camera capture on mobile devices
 */

import { useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { compressAndEncodeImage, validateImageFile } from '@/lib/image-utils';
import { Label } from '@/components/ui/label';

export interface CardImageUploadProps {
  frontImage: string;
  backImage: string;
  onFrontImageChange: (image: string) => void;
  onBackImageChange: (image: string) => void;
}

export function CardImageUpload({
  frontImage,
  backImage,
  onFrontImageChange,
  onBackImageChange,
}: CardImageUploadProps) {
  const t = useTranslations('cards.upload');
  const [isUploadingFront, setIsUploadingFront] = useState(false);
  const [isUploadingBack, setIsUploadingBack] = useState(false);
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    file: File,
    setImage: (image: string) => void,
    setUploading: (uploading: boolean) => void
  ) => {
    setUploading(true);

    try {
      // Validate file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(validation.error || t('validationError'));
        return;
      }

      // Compress and encode
      const base64 = await compressAndEncodeImage(file);
      setImage(base64);
      toast.success(t('success'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('error'));
    } finally {
      setUploading(false);
    }
  };

  const handleFrontFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    handleFileSelect(files[0], onFrontImageChange, setIsUploadingFront);
  };

  const handleBackFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    handleFileSelect(files[0], onBackImageChange, setIsUploadingBack);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm">{t('title')}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Front Image */}
        <div className="space-y-2">
          <Label>{t('frontLabel')}</Label>
          
          {frontImage ? (
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden border-2 border-gray-200 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={frontImage}
                alt={t('frontAlt')}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => onFrontImageChange('')}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => frontInputRef.current?.click()}
                disabled={isUploadingFront}
                className="w-full aspect-[3/4] rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center justify-center text-gray-500 hover:text-blue-500 disabled:opacity-50"
              >
                {isUploadingFront ? (
                  <>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                    <span className="text-xs mt-2">{t('uploading')}</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-12 h-12 mb-2" />
                    <span className="text-sm font-medium">{t('clickToUpload')}</span>
                    <span className="text-xs mt-1">{t('frontHint')}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Hidden File Input with Camera Capture */}
          <input
            ref={frontInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleFrontFileSelect(e.target.files)}
            className="hidden"
          />
        </div>

        {/* Back Image */}
        <div className="space-y-2">
          <Label>{t('backLabel')}</Label>
          
          {backImage ? (
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden border-2 border-gray-200 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={backImage}
                alt={t('backAlt')}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => onBackImageChange('')}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => backInputRef.current?.click()}
                disabled={isUploadingBack}
                className="w-full aspect-[3/4] rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center justify-center text-gray-500 hover:text-blue-500 disabled:opacity-50"
              >
                {isUploadingBack ? (
                  <>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                    <span className="text-xs mt-2">{t('uploading')}</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-12 h-12 mb-2" />
                    <span className="text-sm font-medium">{t('clickToUpload')}</span>
                    <span className="text-xs mt-1">{t('backHint')}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Hidden File Input with Camera Capture */}
          <input
            ref={backInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleBackFileSelect(e.target.files)}
            className="hidden"
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {t('mobileHint')}
      </p>
      <p className="text-xs text-muted-foreground">
        {t('desktopHint')}
      </p>
    </div>
  );
}
