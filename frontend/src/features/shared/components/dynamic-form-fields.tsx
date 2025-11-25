import type { ParticipantFieldDefinition } from '@/features/event/types';

interface DynamicFormFieldsProps {
  fields: ParticipantFieldDefinition[];
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  errors?: Record<string, string>;
}

export default function DynamicFormFields({
  fields,
  values,
  onChange,
  errors = {},
}: DynamicFormFieldsProps) {
  const handleFieldChange = (fieldName: string, value: any) => {
    onChange({ ...values, [fieldName]: value });
  };

  const renderField = (field: ParticipantFieldDefinition) => {
    const value = values[field.name] || '';
    const error = errors[field.name];
    const fieldId = `field-${field.name}`;
    const errorId = `${fieldId}-error`;
    const commonClasses = `w-full px-3 py-2 border ${
      error ? 'border-red-500' : 'border-gray-300'
    } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`;

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <input
            id={fieldId}
            type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={commonClasses}
            required={field.required}
            placeholder={field.label}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
          />
        );

      case 'number':
        return (
          <input
            id={fieldId}
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={commonClasses}
            required={field.required}
            placeholder={field.label}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
          />
        );

      case 'date':
        return (
          <input
            id={fieldId}
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={commonClasses}
            required={field.required}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
          />
        );

      case 'select':
        return (
          <select
            id={fieldId}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={commonClasses}
            required={field.required}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              id={fieldId}
              type="checkbox"
              checked={value === true || value === 'true'}
              onChange={(e) => handleFieldChange(field.name, e.target.checked)}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              required={field.required}
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
            />
            <span className="text-sm text-gray-600">Yes</span>
          </div>
        );

      default:
        return (
          <input
            id={fieldId}
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={commonClasses}
            required={field.required}
            placeholder={field.label}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      {fields.map((field) => {
        const fieldId = `field-${field.name}`;
        const errorId = `${fieldId}-error`;
        const error = errors[field.name];
        
        return (
          <div key={field.name}>
            <label htmlFor={fieldId} className="block text-sm font-medium mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {renderField(field)}
            {error && (
              <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
