import { useState } from 'react';
import DynamicFormFields from '@/features/shared/components/dynamic-form-fields';
import type { CreateParticipantInput } from '../types';
import type { ParticipantFieldDefinition } from '@/features/event/types';
import { Button } from '@/components/ui';

interface ParticipantFormProps {
  eventId: string;
  participantFields: ParticipantFieldDefinition[];
  initialData?: Partial<CreateParticipantInput>;
  onSubmit: (data: CreateParticipantInput) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export default function ParticipantForm({
  eventId,
  participantFields,
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Add Participant',
}: ParticipantFormProps) {
  const [participantFieldsData, setParticipantFieldsData] = useState<Record<string, any>>(
    initialData?.participantFields || {}
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateFields = (): boolean => {
    const errors: Record<string, string> = {};
    
    participantFields.forEach((field) => {
      const value = participantFieldsData[field.name];
      
      if (field.required && (!value || value === '')) {
        errors[field.name] = `${field.label} is required`;
      }
      
      if (value && field.type === 'email' && !value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        errors[field.name] = 'Invalid email format';
      }
      
      if (value && field.type === 'number' && isNaN(Number(value))) {
        errors[field.name] = 'Must be a number';
      }
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateFields()) {
      return;
    }

    setError('');
    setLoading(true);

    try {
      await onSubmit({
        eventId,
        participantFields: participantFieldsData,
        status: 'CONFIRMED',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save participant');
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

      <DynamicFormFields
        fields={participantFields}
        values={participantFieldsData}
        onChange={setParticipantFieldsData}
        errors={fieldErrors}
      />

      <div className="flex-end gap-3 pt-4">
        <Button
          variant='primary'
          disabled={loading}
        >
          {loading ? 'Saving...' : submitLabel}
        </Button>
        <Button
          variant='secondary'
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
