'use client';

import React, { useCallback, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import { useTranslations } from 'next-intl';
import { Upload, FileSpreadsheet, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImportUploadProps {
  onFileUpload: (fileName: string, fileData: string) => void;
}

export function ImportUpload({ onFileUpload }: ImportUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { success, error } = useToast();
  const t = useTranslations('reports.import');

  const handleFileRead = useCallback(
    (file: File) => {
      setIsUploading(true);

      const reader = new FileReader();
      reader.onload = e => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const base64 = btoa(
            new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
          );

          onFileUpload(file.name, base64);
          success(
            t('toast.successTitle'),
            t('toast.successDesc', { name: file.name })
          );
        } catch {
          error(
            t('toast.failedTitle'),
            t('toast.failedProcess')
          );
        } finally {
          setIsUploading(false);
        }
      };

      reader.onerror = () => {
        error(
          t('toast.failedTitle'),
          t('toast.failedRead')
        );
        setIsUploading(false);
      };

      reader.readAsArrayBuffer(file);
    },
    [onFileUpload, success, error, t]
  );

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const file = files[0];

      // Validate file type
      if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
        error(
          t('toast.invalidTypeTitle'),
          t('toast.invalidTypeDesc')
        );
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        error(
          t('toast.tooLargeTitle'),
          t('toast.tooLargeDesc')
        );
        return;
      }

      handleFileRead(file);
    },
    [handleFileRead, error, t]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFileSelect(e.target.files);
    },
    [handleFileSelect]
  );

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="mr-2 h-5 w-5" />
            {t('uploadTitle')}
          </CardTitle>
          <CardDescription>{t('uploadDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
              isDragOver ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50',
              isUploading && 'opacity-50 pointer-events-none'
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            role="region"
            aria-label={t('uploadTitle')}
          >
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
              </div>

              <div>
                <p className="text-lg font-medium text-foreground">
                  {isUploading ? t('processingFile') : t('dropFile')}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('orClickToBrowse')}
                </p>
              </div>

              <div className="flex justify-center">
                <Button
                  variant="outline"
                  disabled={isUploading}
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {isUploading ? t('uploading') : t('selectFile')}
                </Button>
              </div>

              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Info className="mr-2 h-5 w-5" />
            {t('fileRequirements')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium">{t('supportedFormats')}</p>
                <p className="text-sm text-muted-foreground">{t('excelFiles')}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium">{t('maximumFileSize')}</p>
                <p className="text-sm text-muted-foreground">{t('perFile')}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium">{t('expectedColumns')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('columnDescription')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Import Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="mr-2 h-5 w-5 text-amber-600" />
            {t('importTips')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• {t('tip1')}</p>
            <p>• {t('tip2')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
