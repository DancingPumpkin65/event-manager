export interface BadgeOutput {
  id: string;
  badgeId: string | null;
  participantFields?: Record<string, any>;
  staffFields?: Record<string, any>;
  badgePrintedAt: Date | null;
  badgePrintedBy: string | null;
  eventId: string;
  eventName: string;
  type: 'participant' | 'staff';
  barcode: string;
}

export interface CreateBadgeInput {
  participantId?: string;
  staffId?: string;
}

export interface ListBadgesFilter {
  eventId?: string;
  participantId?: string;
  staffId?: string;
  printed?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'badgePrintedAt';
  order?: 'asc' | 'desc';
}
