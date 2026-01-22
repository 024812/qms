'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';
import type { Quilt } from '@/types/quilt';

interface QuiltImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quilt: Quilt | null;
}

export function QuiltImageDialog({ open, onOpenChange, quilt }: QuiltImageDialogProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Collect all images (main image + attachment images)
  const allImages: string[] = [];
  if (quilt?.mainImage) {
    allImages.push(quilt.mainImage);
  }
  if (quilt?.attachmentImages && quilt.attachmentImages.length > 0) {
    allImages.push(...quilt.attachmentImages);
  }

  const hasMultipleImages = allImages.length > 1;

  // Keyboard navigation
  useEffect(() => {
    if (!open || !hasMultipleImages) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentIndex(prev => (prev === 0 ? allImages.length - 1 : prev - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentIndex(prev => (prev === allImages.length - 1 ? 0 : prev + 1));
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setCurrentIndex(0);
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, hasMultipleImages, allImages.length, onOpenChange]);

  if (!quilt) return null;

  // If no images, show empty state
  if (allImages.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {quilt.name} - {t('quilts.dialogs.images.title')}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
            <p>{t('quilts.dialogs.images.noImages')}</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentImage = allImages[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex(prev => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  const handleClose = () => {
    setCurrentIndex(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>
            <span>{quilt.name}</span>
            {hasMultipleImages && (
              <span className="ml-3 text-sm font-normal text-muted-foreground">
                {currentIndex + 1} / {allImages.length}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          {/* Main Image Display */}
          <div
            className="relative w-full bg-muted"
            style={{ minHeight: '400px', maxHeight: '70vh' }}
          >
            <Image
              src={currentImage}
              alt={`${quilt.name} - ${t('quilts.dialogs.images.title')} ${currentIndex + 1}`}
              fill
              className="object-contain"
              sizes="(max-width: 1280px) 100vw, 1280px"
              priority
            />
          </div>

          {/* Navigation Buttons */}
          {hasMultipleImages && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full shadow-lg"
                onClick={handlePrevious}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full shadow-lg"
                onClick={handleNext}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </>
          )}

          {/* Image Type Badge */}
          <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs">
            {currentIndex === 0 && quilt.mainImage
              ? t('quilts.dialogs.images.main')
              : t('quilts.dialogs.images.attachment', { index: currentIndex })}
          </div>
        </div>

        {/* Thumbnail Navigation */}
        {hasMultipleImages && (
          <div className="px-6 pb-6">
            <div className="flex gap-2 overflow-x-auto py-2">
              {allImages.map((image, index) => (
                <button
                  key={`thumbnail-${image}`}
                  onClick={() => setCurrentIndex(index)}
                  className={`relative flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${
                    index === currentIndex
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-transparent hover:border-muted-foreground/30'
                  }`}
                >
                  <Image
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                    loading="lazy"
                  />
                  {index === 0 && quilt.mainImage && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5">
                      {locale === 'zh' ? '主图' : 'Main'}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Keyboard Navigation Hint */}
        {hasMultipleImages && (
          <div className="px-6 pb-4 text-xs text-muted-foreground text-center">
            {t('quilts.dialogs.images.navigationHint')}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
