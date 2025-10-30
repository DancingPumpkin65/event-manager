import { useState } from 'react';
import type { CreateCourseInput } from '../types';
import type { SalleOutput } from '@/features/salle/types';
import type { ParticipantFieldDefinition } from '@/features/event/types';
import DynamicFormFields from '@/features/shared/components/dynamic-form-fields';

interface CourseFormProps {
  eventId: string;
  courseFields: ParticipantFieldDefinition[];
  salles: SalleOutput[];
  initialData?: {
    courseFields?: Record<string, any>;
    startDate?: Date;
    endDate?: Date;
    hallIds?: string[];
    requiresRegistration?: boolean;
  };
  onSubmit: (data: CreateCourseInput) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export default function CourseForm({
  eventId,
  courseFields,
  salles,
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Create Course',
}: CourseFormProps) {
  const [courseFieldsData, setCourseFieldsData] = useState<Record<string, any>>(
    initialData?.courseFields || {}
  );
  const [startDate, setStartDate] = useState(
    initialData?.startDate ? new Date(initialData.startDate).toISOString().slice(0, 16) : ''
  );
  const [endDate, setEndDate] = useState(
    initialData?.endDate ? new Date(initialData.endDate).toISOString().slice(0, 16) : ''
  );
  const [selectedHallIds, setSelectedHallIds] = useState<string[]>(initialData?.hallIds || []);
  const [requiresRegistration, setRequiresRegistration] = useState(initialData?.requiresRegistration || false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleHallToggle = (hallId: string) => {
    setSelectedHallIds((prev) =>
      prev.includes(hallId) ? prev.filter((id) => id !== hallId) : [...prev, hallId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate required fields
    for (const field of courseFields) {
      if (field.required && !courseFieldsData[field.name]) {
        setError(`${field.label} is required`);
        return;
      }
    }

    if (!startDate || !endDate) {
      setError('Start and End dates are required');
      return;
    }

    setLoading(true);

    try {
      await onSubmit({
        eventId,
        courseFields: courseFieldsData,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        hallIds: selectedHallIds.length > 0 ? selectedHallIds : undefined,
        requiresRegistration,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Dynamic Course Fields */}
      {courseFields.length > 0 && (
        <DynamicFormFields
          fields={courseFields}
          values={courseFieldsData}
          onChange={setCourseFieldsData}
        />
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium mb-1">
            Start Date & Time *
          </label>
          <input
            id="startDate"
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="endDate" className="block text-sm font-medium mb-1">
            End Date & Time *
          </label>
          <input
            id="endDate"
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          id="requiresRegistration"
          type="checkbox"
          checked={requiresRegistration}
          onChange={(e) => setRequiresRegistration(e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="requiresRegistration" className="text-sm font-medium">
          Requires Registration
        </label>
        <span className="text-xs text-gray-500">
          (Only registered participants can check in)
        </span>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Assign Halls
        </label>
        <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3 space-y-2">
          {salles.length === 0 ? (
            <p className="text-sm text-gray-500">No halls available</p>
          ) : (
            salles.map((salle) => (
              <label key={salle.id} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedHallIds.includes(salle.id)}
                  onChange={() => handleHallToggle(salle.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">
                  {salle.hallFields?.name || `Hall ${salle.id.slice(0, 8)}`}
                  {salle.hallFields?.capacity && (
                    <span className="text-gray-500"> (Capacity: {salle.hallFields.capacity})</span>
                  )}
                </span>
              </label>
            ))
          )}
        </div>
        {selectedHallIds.length > 0 && (
          <p className="mt-2 text-sm text-gray-600">
            Selected {selectedHallIds.length} hall{selectedHallIds.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
