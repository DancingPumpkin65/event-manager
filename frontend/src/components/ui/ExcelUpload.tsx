import { useState, useRef } from 'react';
import { Button, Card, Alert } from '@/components/ui';
import { importFromExcel, validateExcelFile, generateExcelTemplate, type ExcelColumn, type ExcelImportResult } from '@/lib/excel-utils';

export interface ExcelUploadProps<T> {
  columns: ExcelColumn[];
  onUpload: (data: T[]) => Promise<void>;
  templateName?: string;
  maxSizeMB?: number;
  title?: string;
  description?: string;
}

export function ExcelUpload<T extends Record<string, any>>({
  columns,
  onUpload,
  templateName = 'import-template',
  maxSizeMB = 5,
  title = 'Import from Excel',
  description = 'Upload an Excel file to import data',
}: ExcelUploadProps<T>) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ExcelImportResult<T> | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setUploadError('');
    setResult(null);

    // Validate file
    const validation = validateExcelFile(selectedFile, maxSizeMB);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file');
      return;
    }

    setFile(selectedFile);

    // Parse file
    setIsProcessing(true);
    try {
      const importResult = await importFromExcel<T>(selectedFile, columns);
      setResult(importResult);

      if (importResult.errors.length === 0) {
        // Auto-upload if no errors
        await handleUpload(importResult.data);
      }
    } catch (error: any) {
      setUploadError(error.message || 'Failed to parse file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpload = async (data: T[]) => {
    setIsProcessing(true);
    try {
      await onUpload(data);
      setFile(null);
      setResult(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      setUploadError(error.message || 'Failed to upload data');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadTemplate = async () => {
    await generateExcelTemplate(columns, templateName);
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setUploadError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <Card.Header>
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
      </Card.Header>
      
      <Card.Body>
        <div className="space-y-4">
          {/* Download Template Button */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-3">
              <svg className="w-10 h-10 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="font-medium text-blue-900">Download Template</p>
                <p className="text-sm text-blue-700">Get the Excel template with correct column headers</p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownloadTemplate}
              leftIcon={
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              }
            >
              Download
            </Button>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Excel File
            </label>
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                disabled={isProcessing}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  file:cursor-pointer cursor-pointer
                  disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {file && (
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  Clear
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Maximum file size: {maxSizeMB}MB. Supported formats: .xlsx, .xls
            </p>
          </div>

          {/* Processing State */}
          {isProcessing && (
            <Alert type="info">
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Processing file...</span>
              </div>
            </Alert>
          )}

          {/* Upload Error */}
          {uploadError && (
            <Alert type="error" onClose={() => setUploadError('')}>
              {uploadError}
            </Alert>
          )}

          {/* Parse Result */}
          {result && !isProcessing && (
            <div className="space-y-3">
              {/* Success Message */}
              {result.errors.length === 0 && (
                <Alert type="success">
                  <strong>Success!</strong> Imported {result.data.length} row(s) successfully.
                </Alert>
              )}

              {/* Errors */}
              {result.errors.length > 0 && (
                <Alert type="error">
                  <div>
                    <strong>Found {result.errors.length} error(s):</strong>
                    <ul className="mt-2 space-y-1 text-sm">
                      {result.errors.slice(0, 5).map((error, index) => (
                        <li key={index}>
                          Row {error.row}: {error.message}
                        </li>
                      ))}
                      {result.errors.length > 5 && (
                        <li className="italic">...and {result.errors.length - 5} more errors</li>
                      )}
                    </ul>
                  </div>
                </Alert>
              )}

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <Alert type="warning">
                  <div>
                    <strong>{result.warnings.length} warning(s):</strong>
                    <ul className="mt-2 space-y-1 text-sm">
                      {result.warnings.slice(0, 3).map((warning, index) => (
                        <li key={index}>
                          Row {warning.row}: {warning.message}
                        </li>
                      ))}
                      {result.warnings.length > 3 && (
                        <li className="italic">...and {result.warnings.length - 3} more warnings</li>
                      )}
                    </ul>
                  </div>
                </Alert>
              )}

              {/* Data Preview */}
              {result.data.length > 0 && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Preview ({result.data.length} rows)
                  </p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          {columns.map(col => (
                            <th key={col.field} className="px-3 py-2 text-left font-medium text-gray-700">
                              {col.header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.data.slice(0, 3).map((row, index) => (
                          <tr key={index} className="border-b">
                            {columns.map(col => (
                              <td key={col.field} className="px-3 py-2 text-gray-600">
                                {String(row[col.field] || '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {result.data.length > 3 && (
                      <p className="text-xs text-gray-500 mt-2">
                        ...and {result.data.length - 3} more rows
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card.Body>

      {result && result.errors.length > 0 && (
        <Card.Footer>
          <Button variant="secondary" onClick={handleReset}>
            Try Again
          </Button>
        </Card.Footer>
      )}
    </Card>
  );
}

export default ExcelUpload;
