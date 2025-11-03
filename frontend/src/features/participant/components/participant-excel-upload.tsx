import { useState } from 'react';
import { parseExcelFile, validateParticipantRow } from '@/lib/excel-utils';
import type { ExcelRow } from '@/lib/excel-utils';
import type { ParticipantFieldDefinition } from '@/features/event/types';
import { Button, Input } from '@/components/ui';

interface ParticipantExcelUploadProps {
  eventId: string;
  participantFields: ParticipantFieldDefinition[];
  onImport: (participants: Array<{ eventId: string; participantFields: Record<string, any> }>) => Promise<void>;
  onCancel: () => void;
}

export default function ParticipantExcelUpload({
  eventId,
  participantFields,
  onImport,
}: ParticipantExcelUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ExcelRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrors([]);
    setPreview([]);

    try {
      const rows = await parseExcelFile(selectedFile);
      setPreview(rows.slice(0, 5)); // Show first 5 rows as preview

      // Validate required fields
      const requiredFieldNames = participantFields
        .filter(f => f.required)
        .map(f => f.label);

      const validationErrors: string[] = [];
      rows.forEach((row, index) => {
        const result = validateParticipantRow(row, requiredFieldNames);
        if (!result.valid) {
          validationErrors.push(`Row ${index + 2}: ${result.errors.join(', ')}`);
        }
      });

      if (validationErrors.length > 0) {
        setErrors(validationErrors.slice(0, 10)); // Show first 10 errors
      }
    } catch (error: any) {
      setErrors([error.message || 'Failed to parse file']);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      setLoading(true);
      setErrors([]);

      const rows = await parseExcelFile(file);
      
      // Map Excel rows to participant format
      const participants = rows.map(row => {
        const participantFieldsData: Record<string, any> = {};
        
        participantFields.forEach(field => {
          const value = row[field.label];
          if (value !== undefined && value !== '') {
            participantFieldsData[field.name] = value;
          }
        });

        return {
          eventId,
          participantFields: participantFieldsData,
        };
      });

      await onImport(participants);
    } catch (error: any) {
      setErrors([error.message || 'Failed to import participants']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium text-gray-900">Upload Excel File</h4>
        <div className="mb-4 mt-2">
            <label className="block text-xs font-medium mb-1 text-gray-500">Expected Columns (for matching):</label>
            <div className="flex flex-wrap gap-2">
                {participantFields.filter(f => f.name !== 'email').map(f => (
                    <span key={f.name} className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">{f.label}</span>
                ))}
            </div>
        </div>

        <Input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="mt-1 block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-gray-50 file:text-gray-700
            hover:file:bg-gray-100 file:cursor-pointer cursor-pointer"        
        />
        <p className="mt-1 text-xs text-gray-500">Supported formats: .xlsx, .xls, .csv</p>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <h4 className="text-sm font-semibold text-red-800 mb-2">Validation Errors:</h4>
          <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {preview.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Preview (first 5 rows):</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  {Object.keys(preview[0]).map(key => (
                    <th key={key} className="px-3 py-2 text-left border-b border-gray-300">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    {Object.values(row).map((value, cellIndex) => (
                      <td key={cellIndex} className="px-3 py-2">
                        {String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button
          variant='success'
          onClick={handleImport}
          disabled={!file || errors.length > 0 || loading}
        >
          {loading ? 'Importing...' : `Import ${preview.length > 0 ? preview.length : ''} Participants`}
        </Button>
      </div>
    </div>
  );
}
