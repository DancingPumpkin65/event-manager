import { useState } from 'react';
import DynamicFieldBuilder from '@/features/shared/components/dynamic-field-builder';
import { Button, Input, Select } from '@/components/ui';
import type { CreateEventInput, ParticipantFieldDefinition } from '../types';

interface EventFormProps {
  initialData?: Partial<CreateEventInput>;
  onSubmit: (data: CreateEventInput) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export default function EventForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Create Event',
}: EventFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [location, setLocation] = useState(initialData?.location || '');
  const [startDate, setStartDate] = useState(
    initialData?.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : ''
  );
  const [endDate, setEndDate] = useState(
    initialData?.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : ''
  );
  const [status, setStatus] = useState<'ACTIVE' | 'NOT_ACTIVE'>(
    initialData?.status || 'ACTIVE'
  );
  const [participantFields, setParticipantFields] = useState<ParticipantFieldDefinition[]>(
    initialData?.participantFields || [
      { name: 'firstName', type: 'text', label: 'First Name', required: true },
      { name: 'lastName', type: 'text', label: 'Last Name', required: true },
    ]
  );
  const [staffFields, setStaffFields] = useState<ParticipantFieldDefinition[]>(
    initialData?.staffFields || [
      { name: 'firstName', type: 'text', label: 'First Name', required: true },
      { name: 'lastName', type: 'text', label: 'Last Name', required: true },
      { name: 'email', type: 'email', label: 'Email', required: true },
    ]
  );
  const [courseFields, setCourseFields] = useState<ParticipantFieldDefinition[]>(
    initialData?.courseFields || [
      { name: 'title', type: 'text', label: 'Course Title', required: true },
      { name: 'instructor', type: 'text', label: 'Instructor', required: false },
    ]
  );
  const [hallFields, setHallFields] = useState<ParticipantFieldDefinition[]>(
    initialData?.hallFields || [
      { name: 'name', type: 'text', label: 'Hall Name', required: true },
      { name: 'capacity', type: 'number', label: 'Capacity', required: true },
    ]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit({
        name,
        location: location || undefined,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status,
        participantFields,
        staffFields,
        courseFields,
        hallFields,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="name"
            label="Event Name"
            placeholder='Choose Event Name'
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          
          <Input
            id="location"
            label="Location"
            placeholder="e.g., Convention Center, Downtown"
            value={location}
            onChange={(e) => setLocation(e.target.value)}            
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            id="startDate"
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />

          <Input
            id="endDate"
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>

        <div>
          <Select
            id="status"
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'NOT_ACTIVE')}
            required
            options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'NOT_ACTIVE', label: 'Not Active' },
            ]}
          />
        </div>

        {/* Participant Fields */}
        <div className="pt-4">
          <h3 className="text-lg font-semibold mb-2">Participant Fields</h3>
          <p className="text-sm text-gray-600">
            Define custom fields for participant registration
          </p>
          <DynamicFieldBuilder
            fields={participantFields}
            onChange={setParticipantFields}
          />
        </div>

        {/* Staff Fields */}
        <div className="pt-4">
          <h3 className="text-lg font-semibold mb-2">Staff Fields</h3>
          <p className="text-sm text-gray-600">
            Define custom fields for staff members
          </p>
          <DynamicFieldBuilder
            fields={staffFields}
            onChange={setStaffFields}
          />
        </div>

        {/* Course Fields */}
        <div className="pt-4">
          <h3 className="text-lg font-semibold mb-2">Course Fields</h3>
          <p className="text-sm text-gray-600">
            Define custom fields for course information
          </p>
          <DynamicFieldBuilder
            fields={courseFields}
            onChange={setCourseFields}
          />
        </div>

        {/* Hall Fields */}
        <div className="pt-4">
          <h3 className="text-lg font-semibold mb-2">Hall Fields</h3>
          <p className="text-sm text-gray-600">
            Define custom fields for venue halls/rooms
          </p>
          <DynamicFieldBuilder
            fields={hallFields}
            onChange={setHallFields}
          />
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
