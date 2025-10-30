import { useState } from 'react';
import type { ParticipantOutput } from '@/features/participant/types';
import type { ParticipantFieldDefinition } from '@/features/event/types';
import { AddParticipantForm } from './add-participant-form';
import { ImportRegistrationsForm } from './import-registrations-form';

interface ManageRegistrationsFormProps {
    courseId: string;
    eventId: string;
    participants: ParticipantOutput[];
    participantFields: ParticipantFieldDefinition[];
    onSuccess: () => void;
}

export function ManageRegistrationsForm({ courseId, eventId, participants, participantFields, onSuccess }: ManageRegistrationsFormProps) {
    const [activeTab, setActiveTab] = useState<'import' | 'manual'>('manual');

    return (
        <div className="space-y-4">
            <div className="flex border-b border-gray-200">
                <button
                    className={`flex-1 py-2 text-sm font-medium ${activeTab === 'manual' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('manual')}
                >
                    Add Participant
                </button>
                <button
                    className={`flex-1 py-2 text-sm font-medium ${activeTab === 'import' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('import')}
                >
                    Upload (Excel)
                </button>
            </div>

            <div>
                {activeTab === 'manual' ? (
                    <AddParticipantForm
                        courseId={courseId}
                        eventId={eventId}
                        participants={participants}
                        participantFields={participantFields}
                        onSuccess={onSuccess}
                    />
                ) : (
                    <ImportRegistrationsForm
                        courseId={courseId}
                        participantFields={participantFields}
                        onSuccess={onSuccess}
                    />
                )}
            </div>
        </div>
    );
}
