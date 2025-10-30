import { useState } from 'react';
import { Button } from '@/components/ui';
import DynamicFormFields from '@/features/shared/components/dynamic-form-fields';
import type { ParticipantFieldDefinition } from '@/features/event/types';
import type { ParticipantOutput } from '@/features/participant/types';
import { useCreateParticipant } from '@/features/participant/hooks/query-options';
import { apiClient } from '@/lib/api-client';

interface AddParticipantFormProps {
    courseId: string;
    eventId: string;
    participants: ParticipantOutput[];
    participantFields: ParticipantFieldDefinition[];
    onSuccess: () => void;
}

export function AddParticipantForm({ courseId, eventId, participants, participantFields, onSuccess }: AddParticipantFormProps) {
    const [participantFieldsData, setParticipantFieldsData] = useState<Record<string, any>>({});
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const createParticipantMutation = useCreateParticipant();

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

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateFields()) return;

        setMessage(null);
        setLoading(true);

        try {
            const emailField = participantFields.find(f => f.type === 'email')?.name || 'email';
            const email = participantFieldsData[emailField];

            let participantId: string | undefined;

            // 1. Check if participant exists locally (optional optimization)
            const existingParticipant = participants.find(p =>
                (p.participantFields as any)?.[emailField]?.toLowerCase() === email?.toLowerCase().trim()
            );

            if (existingParticipant) {
                participantId = existingParticipant.id;
            } else {
                // 2. Create new participant
                const newParticipant = await createParticipantMutation.mutateAsync({
                    eventId,
                    participantFields: participantFieldsData,
                    status: 'PENDING'
                });
                participantId = newParticipant.id;
            }

            if (!participantId) throw new Error('Could not identify participant');

            // 3. Register to course
            await apiClient.registerParticipant(participantId, courseId);

            setMessage({
                type: 'success',
                text: existingParticipant
                    ? `Successfully registered existing participant: ${participantFieldsData['firstName'] || email}`
                    : `Successfully created and registered new participant: ${participantFieldsData['firstName'] || email}`
            });

            // Reset form
            setParticipantFieldsData({});
            onSuccess();
        } catch (err) {
            setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Registration failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleRegister} className="space-y-4">
            <DynamicFormFields
                fields={participantFields}
                values={participantFieldsData}
                onChange={setParticipantFieldsData}
                errors={fieldErrors}
            />

            <div className="flex justify-end pt-2">
                <Button type="submit" disabled={loading}>
                    {loading ? 'Processing...' : 'Add & Register'}
                </Button>
            </div>

            {message && (
                <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}
        </form>
    )
}
