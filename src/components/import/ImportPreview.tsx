'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import { FileSpreadsheet, AlertTriangle, CheckCircle, Eye, Upload, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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

interface ImportPreviewProps {
  fileName: string;
  fileData: string;
  onPreviewComplete: (preview: PreviewData) => void;
  onImportComplete: (results: ImportResults) => void;
}

interface PreviewData {
  summary?: {
    totalRows?: number;
    duplicates?: number;
  };
  errors?: Array<{
    row: number;
    message: string;
    field?: string;
  }>;
  preview?: Array<{
    itemNumber: number;
    name: string;
    season: string;
    color?: string;
    brand?: string;
    location?: string;
  }>;
}

export function ImportPreview({
  fileName,
  fileData,
  onPreviewComplete,
  onImportComplete,
}: ImportPreviewProps) {
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const { success, error } = useToast();

  // Preview import using fetch API
  const fetchPreview = useCallback(async () => {
    try {
      const response = await fetch('/api/import/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, fileData }),
      });

      if (!response.ok) {
        throw new Error('Preview failed');
      }

      const data = await response.json();
      setPreview(data.preview);
      onPreviewComplete(data.preview);
    } catch (err) {
      error('Preview failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [fileName, fileData, onPreviewComplete, error]);

  // Confirm import using fetch API
  const confirmImport = useCallback(async () => {
    setIsImporting(true);
    try {
      const response = await fetch('/api/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, fileData, confirmed: true }),
      });

      if (!response.ok) {
        throw new Error('Import failed');
      }

      const data = await response.json();
      success('Import completed', `Successfully imported ${data.result.imported} quilts`);
      onImportComplete(data.result as ImportResults);
    } catch (err) {
      error('Import failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsImporting(false);
    }
  }, [fileName, fileData, onImportComplete, success, error]);

  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);

  const handleConfirmImport = () => {
    confirmImport();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <p className="text-lg font-medium">Analyzing Excel file...</p>
            <p className="text-sm text-gray-600">
              Please wait while we process your file and generate a preview
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!preview) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-8 w-8 mx-auto text-red-600" />
            <p className="text-lg font-medium">Failed to preview file</p>
            <p className="text-sm text-gray-600">
              There was an error processing your Excel file. Please check the file format and try
              again.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* File Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileSpreadsheet className="mr-2 h-5 w-5" />
            Import Preview
          </CardTitle>
          <CardDescription>Review the data that will be imported from {fileName}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{preview.summary?.totalRows || 0}</p>
              <p className="text-sm text-gray-600">Total Rows</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {(preview.summary?.totalRows || 0) - (preview.errors?.length || 0)}
              </p>
              <p className="text-sm text-gray-600">Valid Rows</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{preview.errors?.length || 0}</p>
              <p className="text-sm text-gray-600">Errors</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">
                {preview.summary?.duplicates || 0}
              </p>
              <p className="text-sm text-gray-600">Duplicates</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Errors */}
      {preview.errors && preview.errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Import Errors ({preview.errors.length})
            </CardTitle>
            <CardDescription>
              The following rows have errors and will be skipped during import
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {preview.errors.slice(0, 10).map((error: any, index: number) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">
                      Row {error.row}: {error.message}
                    </p>
                    {error.field && (
                      <p className="text-xs text-red-600 mt-1">Field: {error.field}</p>
                    )}
                  </div>
                </div>
              ))}
              {preview.errors.length > 10 && (
                <p className="text-sm text-gray-600 text-center">
                  ... and {preview.errors.length - 10} more errors
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Data */}
      {preview.preview && preview.preview.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="mr-2 h-5 w-5" />
              Data Preview
            </CardTitle>
            <CardDescription>
              First few rows that will be imported (showing up to 5 rows)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item #</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Season</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.preview.slice(0, 5).map((row: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{row.itemNumber}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.season}</Badge>
                      </TableCell>
                      <TableCell>{row.color || '-'}</TableCell>
                      <TableCell>{row.brand || '-'}</TableCell>
                      <TableCell>{row.location || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">Ready to Import</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="mr-2 h-5 w-5" />
            Confirm Import
          </CardTitle>
          <CardDescription>
            {preview.errors && preview.errors.length > 0
              ? `${(preview.summary?.totalRows || 0) - preview.errors.length} valid rows will be imported. ${preview.errors.length} rows with errors will be skipped.`
              : `All ${preview.summary?.totalRows || 0} rows are ready to be imported.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button
              onClick={handleConfirmImport}
              disabled={
                isImporting ||
                (preview.summary?.totalRows || 0) - (preview.errors?.length || 0) === 0
              }
              className="flex-1"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Confirm Import
                </>
              )}
            </Button>

            <Button variant="outline" onClick={() => window.location.reload()}>
              Cancel
            </Button>
          </div>

          {preview.errors && preview.errors.length > 0 && (
            <div className="mt-4 p-3 bg-amber-50 rounded-lg">
              <p className="text-sm text-amber-800">
                <AlertTriangle className="inline h-4 w-4 mr-1" />
                Some rows contain errors and will be skipped. You can fix these issues in your Excel
                file and import again later.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
