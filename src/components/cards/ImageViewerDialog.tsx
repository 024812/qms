'use client';

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, RotateCw, X, RotateCcwIcon } from 'lucide-react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface ImageViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  alt?: string;
}

const ZOOM_STEP = 0.25;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 5;

export function ImageViewerDialog({
  open,
  onOpenChange,
  imageSrc,
  alt = 'Image',
}: ImageViewerDialogProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = useCallback(() => {
    setZoom(z => Math.min(z + ZOOM_STEP, MAX_ZOOM));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(z => Math.max(z - ZOOM_STEP, MIN_ZOOM));
  }, []);

  const handleRotateLeft = useCallback(() => {
    setRotation(r => r - 90);
  }, []);

  const handleRotateRight = useCallback(() => {
    setRotation(r => r + 90);
  }, []);

  const handleReset = useCallback(() => {
    setZoom(1);
    setRotation(0);
  }, []);

  // Reset state when dialog closes
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setZoom(1);
        setRotation(0);
      }
      onOpenChange(newOpen);
    },
    [onOpenChange]
  );

  // Handle scroll to zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom(z => Math.min(z + ZOOM_STEP, MAX_ZOOM));
    } else {
      setZoom(z => Math.max(z - ZOOM_STEP, MIN_ZOOM));
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 border-none bg-black/95 backdrop-blur-xl overflow-hidden [&>button]:hidden"
        aria-describedby={undefined}
      >
        <VisuallyHidden>
          <DialogTitle>{alt}</DialogTitle>
        </VisuallyHidden>

        {/* Toolbar */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 bg-black/70 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10 rounded-full"
            onClick={handleZoomOut}
            disabled={zoom <= MIN_ZOOM}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          <span className="text-xs text-white/70 min-w-[3rem] text-center font-mono select-none">
            {Math.round(zoom * 100)}%
          </span>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10 rounded-full"
            onClick={handleZoomIn}
            disabled={zoom >= MAX_ZOOM}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          <div className="w-px h-5 bg-white/20 mx-1" />

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10 rounded-full"
            onClick={handleRotateLeft}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10 rounded-full"
            onClick={handleRotateRight}
          >
            <RotateCw className="h-4 w-4" />
          </Button>

          <div className="w-px h-5 bg-white/20 mx-1" />

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10 rounded-full"
            onClick={handleReset}
            title="Reset"
          >
            <RotateCcwIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 z-50 h-8 w-8 text-white/80 hover:text-white hover:bg-white/10 rounded-full"
          onClick={() => handleOpenChange(false)}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Image container */}
        <div
          className="flex items-center justify-center w-[90vw] h-[90vh] overflow-auto cursor-grab active:cursor-grabbing"
          onWheel={handleWheel}
        >
          <img
            src={imageSrc}
            alt={alt}
            className="max-w-none select-none transition-transform duration-200 ease-out"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
            }}
            draggable={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
