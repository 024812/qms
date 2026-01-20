'use client';

/**
 * Card Image Upload Component
 *
 * Specialized for sports cards with front/back image support
 * Supports camera capture on mobile devices
 */

import { useState, useRef } from 'react';
import { X, Upload, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { compressAndEncodeImage, validateImageFile } from '@/lib/image-utils';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

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
        toast.error(validation.error || '文件验证失败');
        return;
      }

      // Compress and encode
      const base64 = await compressAndEncodeImage(file);
      setImage(base64);
      toast.success('图片已添加');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '图片上传失败');
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
      <h3 className="font-semibold text-sm">卡片图片</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Front Image */}
        <div className="space-y-2">
          <Label>正面图片（人物面）*</Label>
          
          {frontImage ? (
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden border-2 border-gray-200 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={frontImage}
                alt="卡片正面"
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
                    <span className="text-xs mt-2">上传中...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-12 h-12 mb-2" />
                    <span className="text-sm font-medium">拍照或上传</span>
                    <span className="text-xs mt-1">球星卡正面（人物面）</span>
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
          <Label>反面图片*</Label>
          
          {backImage ? (
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden border-2 border-gray-200 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={backImage}
                alt="卡片反面"
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
                    <span className="text-xs mt-2">上传中...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-12 h-12 mb-2" />
                    <span className="text-sm font-medium">拍照或上传</span>
                    <span className="text-xs mt-1">球星卡反面</span>
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
        📱 手机上点击按钮可直接调用相机拍照，或从相册选择图片
      </p>
      <p className="text-xs text-muted-foreground">
        💻 电脑上可以上传图片文件（支持 JPEG、PNG、WebP，最大 5MB）
      </p>
    </div>
  );
}
