import { useState } from 'react';
import { Button, Input } from '@/components/ui';
import { parseExcelFile } from '@/lib/excel-utils';
import { apiClient } from '@/lib/api-client';
import type { ParticipantFieldDefinition } from '@/features/event/types';

interface ImportRegistrationsFormProps {
    courseId: string;
    participantFields: ParticipantFieldDefinition[];
    onSuccess: () => void;
}

export function ImportRegistrationsForm({ courseId, participantFields, onSuccess }: ImportRegistrationsFormProps) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [preview, setPreview] = useState<any[]>([]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
            setResult(null);
            setValidationErrors([]);
            setPreview([]);

            try {
                const rows = await parseExcelFile(selectedFile);
                setPreview(rows.slice(0, 3)); // Preview 3 rows

                // Validate: Require either Email OR (Name + First Name)
                const errors: string[] = [];
                rows.forEach((row, index) => {
                    const rowKeys = Object.keys(row).map(k => k.toLowerCase());
                    const hasEmail = rowKeys.some(k => k === 'email');

                    const hasFirstName = rowKeys.some(k => ['prenom', 'firstname', 'first name'].includes(k));
                    const hasLastName = rowKeys.some(k => ['nom', 'lastname', 'last name'].includes(k));

                    if (!hasEmail && (!hasFirstName || !hasLastName)) {
                        errors.push(`Row ${index + 2}: Missing identification (Email OR Name+First Name required)`);
                    }
                });

                if (errors.length > 0) {
                    setValidationErrors(errors.slice(0, 10));
                }

            } catch (err) {
                setError('Failed to parse file for validation.');
            }
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);

        try {
            const res = await apiClient.importCourseRegistrations(courseId, file);
            setResult(res);
            if (res.failed === 0) {
                onSuccess();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            {!result ? (
                <>
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

                    {validationErrors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                            <h4 className="text-sm font-semibold text-red-800 mb-2">Validation Errors (File may fail):</h4>
                            <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                                {validationErrors.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {preview.length > 0 && (
                        <div className="bg-gray-50 p-2 rounded text-xs border">
                            <p className="font-semibold mb-1">Preview:</p>
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead>
                                        <tr>{Object.keys(preview[0]).map(k => <th key={k} className="text-left p-1">{k}</th>)}</tr>
                                    </thead>
                                    <tbody>
                                        {preview.map((row, i) => (
                                            <tr key={i} className="border-t">
                                                {Object.values(row).map((v: any, j) => <td key={j} className="p-1">{v}</td>)}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant='success' onClick={handleUpload} disabled={!file || uploading || validationErrors.length > 0}>
                            {uploading ? 'Uploading...' : 'Upload Participants'}
                        </Button>
                    </div>
                </>
            ) : (
                <div className="space-y-4">
                    <div className={`p-4 rounded-md ${result.failed === 0 ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>
                        <h4 className="font-bold">Import Completed</h4>
                        <p>Successfully registered: {result.success}</p>
                        <p>Failed: {result.failed}</p>
                    </div>

                    {result.errors.length > 0 && (
                        <div className="max-h-60 overflow-y-auto border rounded-md p-2 text-xs">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="text-left bg-gray-50">
                                        <th className="p-1">Row</th>
                                        <th className="p-1">Email</th>
                                        <th className="p-1">Error</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.errors.map((err: any, idx: number) => (
                                        <tr key={idx} className="border-t">
                                            <td className="p-1">{err.row}</td>
                                            <td className="p-1">{err.email}</td>
                                            <td className="p-1 text-red-600">{err.error}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
