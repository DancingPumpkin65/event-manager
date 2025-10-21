import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import {
    EventStatsResponse,
    ParticipantListResponse,
    CourseWithAttendees,
    BadgeTypeBreakdown,
    CourseAttendee,
} from './event-stats.types';

class EventStatsService {
    /**
     * Get comprehensive event statistics
     */
    async getEventStats(eventId: string): Promise<EventStatsResponse> {
        // Verify event exists
        const event = await prisma.event.findUnique({
            where: { id: eventId },
        });

        if (!event) {
            throw new AppError('Event not found', 404);
        }

        // Count by status
        const totalRegistered = await prisma.participant.count({
            where: { eventId },
        });

        const badgesPrinted = await prisma.participant.count({
            where: { eventId, status: 'CONFIRMED' },
        });

        const badgesNotPrinted = await prisma.participant.count({
            where: { eventId, status: 'PENDING' },
        });

        // Get breakdown by badge type for CONFIRMED only
        const confirmedParticipants = await prisma.participant.findMany({
            where: { eventId, status: 'CONFIRMED' },
            select: { participantFields: true },
        });

        const typeCountMap: Record<string, number> = {};
        confirmedParticipants.forEach((p) => {
            const fields = p.participantFields as Record<string, any>;
            // Find field that looks like "type badge"
            const typeKey = Object.keys(fields).find(
                (k) => k.toLowerCase().includes('type') && k.toLowerCase().includes('badge')
            );
            const typeValue = typeKey ? String(fields[typeKey] || 'Unknown').trim() : 'Unknown';
            typeCountMap[typeValue] = (typeCountMap[typeValue] || 0) + 1;
        });

        const badgesPrintedByType: BadgeTypeBreakdown[] = Object.entries(typeCountMap).map(
            ([type, count]) => ({ type, count })
        );

        // Get courses with attendees
        const coursesWithAttendees = await this.getCoursesWithAttendees(eventId);

        return {
            totalRegistered,
            badgesPrinted,
            badgesNotPrinted,
            badgesPrintedByType,
            coursesWithAttendees,
        };
    }

    /**
   * Get participants by status (CONFIRMED or PENDING)
   * Returns raw participantFields for frontend to handle display
   */
    async getParticipantsByStatus(
        eventId: string,
        status: 'CONFIRMED' | 'PENDING',
        page: number = 1,
        limit: number = 10
    ): Promise<ParticipantListResponse> {
        const isAll = limit === -1;
        const skip = isAll ? 0 : (page - 1) * limit;

        const total = await prisma.participant.count({
            where: { eventId, status },
        });

        const participants = await prisma.participant.findMany({
            where: { eventId, status },
            skip: isAll ? undefined : skip,
            take: isAll ? undefined : limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                badgeId: true,
                participantFields: true,
                badgePrintedAt: true,
                status: true,
            },
        });

        // Return raw data - frontend will handle field display
        const mapped = participants.map((p) => ({
            id: p.id,
            badgeId: p.badgeId,
            participantFields: p.participantFields as Record<string, any>,
            badgePrintedAt: p.badgePrintedAt,
            status: p.status,
        }));

        return {
            participants: mapped as any,
            total,
            page: isAll ? 1 : page,
            limit: isAll ? total : limit,
            totalPages: isAll ? 1 : Math.ceil(total / limit),
        };
    }

    /**
     * Get all courses with their attendees
     */
    async getCoursesWithAttendees(eventId: string): Promise<CourseWithAttendees[]> {
        const courses = await prisma.course.findMany({
            where: { eventId },
            orderBy: { startDate: 'asc' },
            include: {
                halls: {
                    include: {
                        hall: { select: { hallFields: true } },
                    },
                },
                attendance: {
                    include: {
                        participant: {
                            select: {
                                badgeId: true,
                                participantFields: true,
                            },
                        },
                    },
                },
            },
        });

        return courses.map((course) => {
            const fields = (course.courseFields as Record<string, any>) || {};
            const hallName = course.halls[0]?.hall?.hallFields
                ? (course.halls[0].hall.hallFields as any).name || 'Unknown'
                : 'No Hall';

            const attendees: CourseAttendee[] = course.attendance.map((att) => {
                const pFields = (att.participant?.participantFields as Record<string, any>) || {};
                return {
                    badgeId: att.participant?.badgeId || null,
                    nom: pFields.nom || pFields['Nom'] || pFields.lastName || '-',
                    prenom: pFields.prenom || pFields['Prenom'] || pFields.firstName || '-',
                };
            });

            return {
                id: course.id,
                title: fields.title || 'Untitled Course',
                hallName,
                startTime: course.startDate,
                endTime: course.endDate,
                sessionType: fields.sessionType || fields['Type session'] || 'C',
                programNum: fields.programNum || fields['Num Prog'] || '',
                attendeeCount: course.attendance.length,
                attendees,
            };
        });
    }
}

export const eventStatsService = new EventStatsService();
