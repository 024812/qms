'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileSpreadsheet, Database, Loader2 } from 'lucide-react';
import { ImportUpload } from '@/components/import/ImportUpload';
import { toast } from '@/lib/toast';
import dynamic from 'next/dynamic';

// 动态导入组件
const ImportPreview = dynamic(
  () => import('@/components/import/ImportPreview').then(mod => ({ default: mod.ImportPreview })),
  { loading: () => <div className="text-center py-8">加载预览中...</div> }
);

const ImportResults = dynamic(
  () => import('@/components/import/ImportResults').then(mod => ({ default: mod.ImportResults })),
  { loading: () => <div className="text-center py-8">加载结果中...</div> }
);

type ImportStep = 'upload' | 'preview' | 'results';

interface ImportResults {
  success: boolean;
  imported: number;
  skipped: number;
  errors: Array<{
    row: number;
    message: string;
    field?: string;
    data?: unknown;
  }>;
  summary: {
    totalRows: number;
    successfulImports: number;
    duplicates: number;
    validationErrors: number;
  };
}

interface ImportData {
  fileName: string;
  fileData: string;
  preview?: unknown;
  results?: ImportResults;
}

export default function ImportExportPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('export');
  const [loading, setLoading] = useState<string | null>(null);

  // Import state
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const [importData, setImportData] = useState<ImportData | null>(null);

  // Export functions
  const downloadReport = async (reportType: string, format: 'json' | 'csv' = 'csv') => {
    try {
      setLoading(reportType);

      const response = await fetch(`/api/reports?type=${reportType}&format=${format}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch {
      // Use toast instead of alert for better UX
      toast.error(t('reports.export.downloadFailed'));
    } finally {
      setLoading(null);
    }
  };

  // Import functions
  const handleFileUpload = (fileName: string, fileData: string) => {
    setImportData({ fileName, fileData });
    setCurrentStep('preview');
  };

  const handlePreviewComplete = (preview: {
    summary?: { totalRows?: number; duplicates?: number };
    errors?: Array<{ row: number; message: string; field?: string }>;
    preview?: Array<{
      itemNumber: number;
      name: string;
      season: string;
      color?: string;
      brand?: string;
      location?: string;
    }>;
  }) => {
    if (importData) {
      setImportData({ ...importData, preview });
    }
  };

  const handleImportComplete = (results: ImportResults) => {
    if (importData) {
      setImportData({ ...importData, results });
    }
    setCurrentStep('results');
  };

  const handleStartOver = () => {
    setImportData(null);
    setCurrentStep('upload');
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'import' | 'export')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            {t('reports.tabs.import')}
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            {t('reports.tabs.export')}
          </TabsTrigger>
        </TabsList>

        {/* Import Tab */}
        <TabsContent value="import" className="space-y-6 mt-6">
          {currentStep === 'upload' && <ImportUpload onFileUpload={handleFileUpload} />}

          {currentStep === 'preview' && importData && (
            <ImportPreview
              fileName={importData.fileName}
              fileData={importData.fileData}
              onPreviewComplete={handlePreviewComplete}
              onImportComplete={handleImportComplete}
            />
          )}

          {currentStep === 'results' && importData?.results && (
            <ImportResults
              results={importData.results}
              fileName={importData.fileName}
              onStartOver={handleStartOver}
              onGoToDashboard={() => (window.location.href = '/')}
            />
          )}
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-6 mt-6">
          {/* Export Options Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                {t('reports.export.title')}
              </CardTitle>
              <CardDescription>{t('reports.export.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => downloadReport('inventory', 'csv')}
                className="w-full justify-start h-auto py-4"
                variant="outline"
                disabled={loading === 'inventory'}
              >
                {loading === 'inventory' ? (
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-5 h-5 mr-3" />
                )}
                <div className="text-left flex-1">
                  <div className="font-semibold">
                    {locale === 'zh' ? '导出为 CSV' : 'Export as CSV'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {locale === 'zh'
                      ? '适用于Excel和其他表格软件'
                      : 'For Excel and spreadsheet software'}
                  </div>
                </div>
              </Button>

              <Button
                onClick={() => downloadReport('inventory', 'json')}
                className="w-full justify-start h-auto py-4"
                variant="outline"
                disabled={loading === 'inventory'}
              >
                {loading === 'inventory' ? (
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                ) : (
                  <Database className="w-5 h-5 mr-3" />
                )}
                <div className="text-left flex-1">
                  <div className="font-semibold">
                    {locale === 'zh' ? '导出为 JSON' : 'Export as JSON'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {locale === 'zh'
                      ? '适用于数据备份和程序处理'
                      : 'For data backup and processing'}
                  </div>
                </div>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
