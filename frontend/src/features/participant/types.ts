/**
 * Participant feature types
 */

/**
 * Valid field value types for participant custom fields
 */
export type FieldValue = string | number | boolean | Date | null | undefined;

export interface CreateParticipantInput {
  eventId: string;
  participantFields: Record<string, FieldValue>;
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
}

export interface UpdateParticipantInput {
  id: string;
  participantFields?: Record<string, FieldValue>;
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
}

export type RegistrationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface ParticipantOutput {
  id: string;
  eventId: string;
  participantFields: Record<string, FieldValue>;
  status: RegistrationStatus;
  badgeId?: string | null;
  badgePrintedAt?: Date | null;
  badgePrintedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImportParticipantInput {
  eventId: string;
  participants: Array<{
    participantFields: Record<string, FieldValue>;
  }>;
}
