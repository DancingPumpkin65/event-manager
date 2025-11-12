
import { useState } from 'react';
import DynamicFormFields from '@/features/shared/components/dynamic-form-fields';
import type { CreateStaffInput, UpdateStaffInput, Staff } from '../types';
import type { ParticipantFieldDefinition } from '@/features/event/types';
import { Button } from '@/components/ui';

interface StaffFormProps {
  eventId: string;
  staffFieldDefinitions: ParticipantFieldDefinition[];
  initialData?: Staff;
  onSubmit: (data: CreateStaffInput | UpdateStaffInput) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export default function StaffForm({
  eventId,
  staffFieldDefinitions,
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Add Staff',
}: StaffFormProps) {
  const [staffFieldsData, setStaffFieldsData] = useState<Record<string, any>>(
    initialData?.staffFields || {}
  );
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Staff');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateFields = (): boolean => {
    const errors: Record<string, string> = {};
    staffFieldDefinitions.forEach((field) => {
      const value = staffFieldsData[field.name];
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
    if (!username) {
      errors.username = 'Username is required';
    }
    if (!initialData && !password) {
      errors.password = 'Password is required for new staff';
    }
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
      const data: any = initialData
        ? {
            staffFields: staffFieldsData,
            username,
            ...(password && { password }),
            ...(role && { role }),
          }
        : {
            eventId,
            staffFields: staffFieldsData,
            username,
            password,
            ...(role && { role }),
          };
      await onSubmit(data);
    } catch (err: any) {
      setError(err.message || 'Failed to save staff');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>
      )}
      <DynamicFormFields
        fields={staffFieldDefinitions}
        values={staffFieldsData}
        onChange={setStaffFieldsData}
        errors={fieldErrors}
      />
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">Login Credentials</h3>
        <div>
          <label htmlFor="staff-username" className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
          <input
            id="staff-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input w-full px-3 py-2 border border-gray-300 rounded-md"
            required
            aria-invalid={!!fieldErrors.username}
            aria-describedby={fieldErrors.username ? 'staff-username-error' : undefined}
          />
          {fieldErrors.username && (
            <p id="staff-username-error" className="mt-1 text-sm text-red-600" role="alert">
              {fieldErrors.username}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="staff-password" className="block text-sm font-medium text-gray-700 mb-1">
            Password {initialData ? '(leave blank to keep unchanged)' : '*'}
          </label>
          <input
            id="staff-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input w-full px-3 py-2 border border-gray-300 rounded-md"
            required={!initialData}
            placeholder={initialData ? 'Leave blank to keep current password' : ''}
            aria-invalid={!!fieldErrors.password}
            aria-describedby={fieldErrors.password ? 'staff-password-error' : undefined}
          />
          {fieldErrors.password && (
            <p id="staff-password-error" className="mt-1 text-sm text-red-600" role="alert">
              {fieldErrors.password}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="staff-role" className="block text-sm font-medium text-gray-700 mb-1">Role (Optional)</label>
          <input
            id="staff-role"
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="input w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="e.g., Security, Reception, Coordinator"
          />
        </div>
      </div>
      <div className="flex gap-3 pt-4">
        <Button disabled={loading} variant='primary'>
          {loading ? 'Saving...' : submitLabel}
        </Button>
        <Button onClick={onCancel} variant='secondary'>
          Cancel
        </Button>
      </div>
    </form>
  );
}
