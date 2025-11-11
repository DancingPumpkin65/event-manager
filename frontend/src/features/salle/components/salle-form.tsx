import { useState } from 'react';
import { Button } from '@/components/ui';
import DynamicFormFields from '@/features/shared/components/dynamic-form-fields';
import type { CreateSalleInput } from '../types';
import type { ParticipantFieldDefinition } from '@/features/event/types';

interface SalleFormProps {
  eventId: string;
  hallFields: ParticipantFieldDefinition[];
  initialData?: Record<string, any>;
  onSubmit: (data: CreateSalleInput) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export default function SalleForm({
  eventId,
  hallFields,
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Create Hall',
}: SalleFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData || {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFormChange = (newValues: Record<string, any>) => {
    setFormData(newValues);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit({
        eventId,
        hallFields: formData,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save hall');
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
        fields={hallFields}
        values={formData}
        onChange={handleFormChange}
      />

      <div className="flex gap-3 justify-end pt-4 border-t">
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
