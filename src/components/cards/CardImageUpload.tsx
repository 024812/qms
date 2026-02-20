import { useRef, useState } from 'react';
import { Camera, Upload, X, RefreshCw, Eye } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

import { compressAndEncodeImage, validateImageFile } from '@/lib/image-utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ImageViewerDialog } from './ImageViewerDialog';

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
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImage, setViewerImage] = useState('');

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    file: File,
    setImage: (image: string) => void,
    setUploading: (uploading: boolean) => void
  ) => {
    setUploading(true);
    try {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(validation.error || t('validationError'));
        return;
      }
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
    if (files?.[0]) handleFileSelect(files[0], onFrontImageChange, setIsUploadingFront);
  };

  const handleBackFileSelect = (files: FileList | null) => {
    if (files?.[0]) handleFileSelect(files[0], onBackImageChange, setIsUploadingBack);
  };

  // Helper to render the upload/view area
  const renderUploadArea = (
    image: string,
    setImage: (img: string) => void,
    inputRef: React.RefObject<HTMLInputElement | null>,
    isUploading: boolean,
    label: string
  ) => {
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        inputRef.current?.click();
      }
    };

    return (
      <div className="relative w-full h-full rounded-xl overflow-hidden group">
        {image ? (
          <>
            {/* Image Preview */}
            <motion.img
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              src={image}
              alt={label}
              className="w-full h-full object-cover"
            />

            {/* Hover Actions Overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setViewerImage(image);
                  setViewerOpen(true);
                }}
                className="bg-transparent border-white/20 text-white hover:bg-white/20"
              >
                <Eye className="w-4 h-4 mr-2" />
                {t('view')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => inputRef.current?.click()}
                className="bg-transparent border-white/20 text-white hover:bg-white/20"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {t('change')}
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setImage('')}
                className="bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500/40"
              >
                <X className="w-4 h-4 mr-2" />
                {t('remove')}
              </Button>
            </div>
          </>
        ) : (
          <div
            role="button"
            tabIndex={0}
            className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl bg-white/5 hover:bg-white/10 hover:border-cyan-500/50 transition-all cursor-pointer group-hover:shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)] focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            onClick={() => inputRef.current?.click()}
            onKeyDown={handleKeyDown}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              {isUploading ? (
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-400 relative z-10" />
              ) : (
                <Camera className="w-10 h-10 text-slate-400 group-hover:text-cyan-400 transition-colors relative z-10" />
              )}
            </div>

            <p className="mt-3 text-xs font-medium text-slate-400 group-hover:text-cyan-300 pointer-events-none">
              {isUploading ? t('uploading') : label}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col">
      <Tabs defaultValue="front" className="w-full h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-2 bg-black/40 border border-white/10 mb-2 p-1 rounded-lg">
          <TabsTrigger
            value="front"
            className="data-[state=active]:bg-cyan-950/50 data-[state=active]:text-cyan-400 data-[state=active]:border-cyan-900/50 text-xs"
          >
            {t('frontLabel')}
          </TabsTrigger>
          <TabsTrigger
            value="back"
            className="data-[state=active]:bg-violet-950/50 data-[state=active]:text-violet-400 data-[state=active]:border-violet-900/50 text-xs"
          >
            {t('backLabel')}
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 relative min-h-0 bg-zinc-900/50 rounded-xl border border-white/5 p-1">
          <TabsContent value="front" className="h-full m-0 data-[state=active]:flex flex-col">
            {renderUploadArea(
              frontImage,
              onFrontImageChange,
              frontInputRef,
              isUploadingFront,
              t('frontHint')
            )}
            <input
              ref={frontInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={e => handleFrontFileSelect(e.target.files)}
              className="hidden"
            />
          </TabsContent>

          <TabsContent value="back" className="h-full m-0 data-[state=active]:flex flex-col">
            {renderUploadArea(
              backImage,
              onBackImageChange,
              backInputRef,
              isUploadingBack,
              t('backHint')
            )}
            <input
              ref={backInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={e => handleBackFileSelect(e.target.files)}
              className="hidden"
            />
          </TabsContent>
        </div>
      </Tabs>

      {/* Mobile/Desktop Hint */}
      <div className="mt-2 flex justify-between px-1">
        <p className="text-[10px] text-slate-500 flex items-center gap-1">
          <Camera className="w-3 h-3" />
          Mobile Cam Ready
        </p>
        <p className="text-[10px] text-slate-500 flex items-center gap-1">
          <Upload className="w-3 h-3" />
          Drag & Drop
        </p>
      </div>

      <ImageViewerDialog
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        imageSrc={viewerImage}
        alt="Card Image"
      />
    </div>
  );
}
