import { z } from 'zod';

// Query schema for stats
export const eventStatsQuerySchema = z.object({
    eventId: z.string().uuid('Invalid event ID'),
});

// Query schema for badge list
export const badgeListQuerySchema = z.object({
    status: z.enum(['CONFIRMED', 'PENDING']),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^-?\d+$/).transform(Number).optional(),
});

// TypeScript types
export type EventStatsQueryDto = z.infer<typeof eventStatsQuerySchema>;
export type BadgeListQueryDto = z.infer<typeof badgeListQuerySchema>;

export interface BadgeTypeBreakdown {
    type: string;
    count: number;
}

export interface ParticipantBadgeInfo {
    id: string;
    badgeId: string | null;
    nom: string;
    prenom: string;
    ville: string;
    sponsor: string;
    typeBadge: string;
    specialite: string;
    badgePrintedAt: Date | null;
}

export interface ParticipantListResponse {
    participants: ParticipantBadgeInfo[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface CourseAttendee {
    badgeId: string | null;
    nom: string;
    prenom: string;
}

export interface CourseWithAttendees {
    id: string;
    title: string;
    hallName: string;
    startTime: Date;
    endTime: Date;
    sessionType: string;
    programNum: string;
    attendeeCount: number;
    attendees: CourseAttendee[];
}

export interface EventStatsResponse {
    totalRegistered: number;
    badgesPrinted: number;      // status = CONFIRMED
    badgesNotPrinted: number;   // status = PENDING
    badgesPrintedByType: BadgeTypeBreakdown[];
    coursesWithAttendees: CourseWithAttendees[];
}
