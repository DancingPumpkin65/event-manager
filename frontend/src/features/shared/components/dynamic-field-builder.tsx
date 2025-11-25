import { useState } from 'react';
import type { ParticipantFieldDefinition } from '@/features/event/types';
import { Button, Input, Select } from '@/components/ui';
import { Plus } from 'lucide-react';

interface DynamicFieldBuilderProps {
  fields: ParticipantFieldDefinition[];
  onChange: (fields: ParticipantFieldDefinition[]) => void;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Select (Dropdown)' },
  { value: 'checkbox', label: 'Checkbox' },
] as const;

export default function DynamicFieldBuilder({ fields, onChange }: DynamicFieldBuilderProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const addField = () => {
    const newField: ParticipantFieldDefinition = {
      name: `field_${Date.now()}`,
      type: 'text',
      label: 'New Field',
      required: false,
    };
    onChange([...fields, newField]);
    setEditingIndex(fields.length);
  };

  const updateField = (index: number, updates: Partial<ParticipantFieldDefinition>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    onChange(newFields);
  };

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
    setEditingIndex(null);
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;

    const newFields = [...fields];
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
    onChange(newFields);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end items-center">
        <Button
          type="button"
          size="sm"
          onClick={addField}
          leftIcon={<Plus className="h-5 w-5 mr-2" />}
        >
          Add Field
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="text-gray-500 text-sm">
          No custom fields yet. Add fields to collect participant information.
        </p>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={index}
              className="bg-gray-50 border border-gray-200 rounded-lg p-4"
            >
              {editingIndex === index ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Input
                        type="text"
                        label="Field Name (ID)"
                        value={field.name}
                        onChange={(e) =>
                          updateField(index, { name: e.target.value.replace(/\s/g, '_') })
                        }
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="field_name"
                      />
                    </div>
                    <div>
                      <Input
                        type="text"
                        label="Field Label"
                        value={field.label}
                        onChange={(e) =>
                          updateField(index, { label: e.target.value })
                        }
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="Display Label"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Select
                        label="Field Type"
                        value={field.type}
                        onChange={(e) =>
                          updateField(index, {
                            type: e.target.value as any,
                          })
                        }
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        options={FIELD_TYPES.map((type) => ({
                          value: type.value,
                          label: type.label,
                        }))}
                      />
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center">
                        <Input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) =>
                            updateField(index, { required: e.target.checked })
                          }
                          className="mr-2"
                        />
                        <span className="text-sm font-medium">Required</span>
                      </label>
                    </div>
                  </div>

                  {field.type === 'select' && (
                    <div>
                      <Input
                        type="text"
                        label='Options'
                        value={field.options?.join(', ') || ''}
                        onChange={(e) =>
                          updateField(index, {
                            options: e.target.value.split(',').map((s) => s.trim()),
                          })
                        }
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="Option 1, Option 2, Option 3"
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => setEditingIndex(null)}
                      variant="primary"
                      size='sm'
                    >
                      Done
                    </Button>
                    <Button
                      type="button"
                      onClick={() => removeField(index)}
                      variant="danger"
                      size='sm'
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{field.label}</div>
                    <div className="text-sm text-gray-600">
                      {field.name} • {FIELD_TYPES.find((t) => t.value === field.type)?.label}
                      {field.required && ' • Required'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant='secondary'
                      onClick={() => moveField(index, 'up')}
                      disabled={index === 0}
                      className="px-2 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-30 border-none"
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      variant='secondary'
                      onClick={() => moveField(index, 'down')}
                      disabled={index === fields.length - 1}
                      className="px-2 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-30 border-none"
                    >
                      ↓
                    </Button>
                    <Button
                      type="button"
                      variant='secondary'
                      onClick={() => setEditingIndex(index)}
                      className="btn btn-secondary text-sm"
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
