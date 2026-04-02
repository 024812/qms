'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  BarChart3,
  Home,
  RotateCcw,
  FileSpreadsheet,
} from 'lucide-react';

interface ImportResultsProps {
  results: {
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
  };
  fileName: string;
  onStartOver: () => void;
  onGoToDashboard: () => void;
}

export function ImportResults({
  results,
  fileName,
  onStartOver,
  onGoToDashboard,
}: ImportResultsProps) {
  const successRate =
    results.summary.totalRows > 0
      ? Math.round((results.summary.successfulImports / results.summary.totalRows) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            {results.success ? (
              <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="mr-2 h-5 w-5 text-red-600" />
            )}
            Import {results.success ? 'Completed' : 'Failed'}
          </CardTitle>
          <CardDescription>Import results for {fileName}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{results.summary.totalRows}</p>
              <p className="text-sm text-muted-foreground">Total Rows</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {results.summary.successfulImports}
              </p>
              <p className="text-sm text-muted-foreground">Imported</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{results.errors.length}</p>
              <p className="text-sm text-muted-foreground">Errors</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">{results.summary.duplicates}</p>
              <p className="text-sm text-muted-foreground">Duplicates</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Success Rate</span>
              <span className="text-sm text-muted-foreground">{successRate}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  successRate >= 80
                    ? 'bg-green-500'
                    : successRate >= 60
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
                style={{ width: `${successRate}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Summary */}
      {results.success && results.summary.successfulImports > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-green-600">
              <CheckCircle className="mr-2 h-5 w-5" />
              Successfully Imported
            </CardTitle>
            <CardDescription>
              {results.summary.successfulImports} quilts have been added to your collection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileSpreadsheet className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Quilts Added</p>
                    <p className="text-sm text-green-600">
                      {results.summary.successfulImports} new quilts in your collection
                    </p>
                  </div>
                </div>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Complete
                </Badge>
              </div>

              {results.summary.duplicates > 0 && (
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="font-medium text-amber-800">Duplicates Skipped</p>
                      <p className="text-sm text-amber-600">
                        {results.summary.duplicates} quilts already exist in your collection
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                    Skipped
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Errors */}
      {results.errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Import Errors ({results.errors.length})
            </CardTitle>
            <CardDescription>
              The following rows could not be imported due to errors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {results.errors.slice(0, 10).map(error => (
                <div
                  key={`import-error-${error.row}-${error.field ?? 'general'}`}
                  className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg"
                >
                  <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
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
              {results.errors.length > 10 && (
                <p className="text-sm text-muted-foreground text-center">
                  ... and {results.errors.length - 10} more errors
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>What&apos;s Next?</CardTitle>
          <CardDescription>Choose your next action</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button onClick={onGoToDashboard} className="h-auto p-4">
              <div className="flex flex-col items-center space-y-2">
                <Home className="h-6 w-6" />
                <div className="text-center">
                  <p className="font-medium">Go to Dashboard</p>
                  <p className="text-xs text-muted-foreground">View your updated collection</p>
                </div>
              </div>
            </Button>

            <Button variant="outline" onClick={onStartOver} className="h-auto p-4">
              <div className="flex flex-col items-center space-y-2">
                <RotateCcw className="h-6 w-6" />
                <div className="text-center">
                  <p className="font-medium">Import Another File</p>
                  <p className="text-xs text-muted-foreground">Start a new import process</p>
                </div>
              </div>
            </Button>
          </div>

          {results.success && results.summary.successfulImports > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-3">
                <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Your collection has been updated!
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Visit the dashboard to see your new quilts and updated statistics.
                  </p>
                </div>
              </div>
            </div>
          )}

          {results.errors.length > 0 && (
            <div className="mt-4 p-3 bg-amber-50 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Some rows had errors</p>
                  <p className="text-xs text-amber-600 mt-1">
                    You can fix the errors in your Excel file and import those rows again later.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
