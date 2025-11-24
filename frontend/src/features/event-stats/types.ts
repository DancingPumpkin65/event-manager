// Frontend types for event-stats feature

export interface BadgeTypeBreakdown {
    type: string;
    count: number;
}

export interface ParticipantBadgeInfo {
    id: string;
    badgeId: string | null;
    participantFields: Record<string, any>;
    badgePrintedAt: string | null;
    status: string;
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
    startTime: string;
    endTime: string;
    sessionType: string;
    programNum: string;
    attendeeCount: number;
    attendees: CourseAttendee[];
}

export interface EventStatsResponse {
    totalRegistered: number;
    badgesPrinted: number;
    badgesNotPrinted: number;
    badgesPrintedByType: BadgeTypeBreakdown[];
    coursesWithAttendees: CourseWithAttendees[];
}
