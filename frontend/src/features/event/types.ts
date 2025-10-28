/**
 * Event feature types
 */

export interface CreateEventInput {
  name: string;
  location?: string;
  startDate: Date;
  endDate: Date;
  status?: 'ACTIVE' | 'NOT_ACTIVE';
  participantFields: ParticipantFieldDefinition[];
  staffFields?: ParticipantFieldDefinition[];
  courseFields?: ParticipantFieldDefinition[];
  hallFields?: ParticipantFieldDefinition[];
}

export interface UpdateEventInput {
  id: string;
  name?: string;
  location?: string;
  startDate?: Date;
  endDate?: Date;
  status?: 'ACTIVE' | 'NOT_ACTIVE';
  participantFields?: ParticipantFieldDefinition[];
  staffFields?: ParticipantFieldDefinition[];
  courseFields?: ParticipantFieldDefinition[];
  hallFields?: ParticipantFieldDefinition[];
  badgeLayout?: BadgeTemplate;
}

export type EventStatus = 'ACTIVE' | 'NOT_ACTIVE';

export interface EventOutput {
  id: string;
  name: string;
  location?: string | null;
  startDate: Date;
  endDate: Date; 
  status: EventStatus;
  participantFields: ParticipantFieldDefinition[];
  staffFields: ParticipantFieldDefinition[];
  courseFields: ParticipantFieldDefinition[];
  hallFields: ParticipantFieldDefinition[];
  badgeLayout?: BadgeTemplate;
  badgeTemplate?: BadgeTemplate;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    participants: number;
  };
}

export interface BadgeTemplate {
  page: {
    width: number;
    height: number;
  };
  elements: BadgeElement[];
}

export type BadgeElement =
  | { type: 'text'; id: string; x: number; y: number; content?: string; fieldMapping?: string; fontSize: number; fontFamily: string; color: string; align: 'left' | 'center' | 'right' }
  | { type: 'barcode'; id: string; x: number; y: number; fieldMapping: string; width: number; height: number; displayValue: boolean }
  | { type: 'image'; id: string; x: number; y: number; src: string; width: number; height: number }
  | { type: 'rectangle'; id: string; x: number; y: number; width: number; height: number; backgroundColor?: string; borderWidth: number; borderColor?: string };

export interface ParticipantFieldDefinition {
  name: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'date' | 'select' | 'checkbox';
  label: string;
  required: boolean;
  options?: string[];
}

export interface ListEventsFilter {
  status?: EventStatus;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}
