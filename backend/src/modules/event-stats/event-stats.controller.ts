import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error.middleware';
import { eventStatsService } from './event-stats.service';
import { badgeListQuerySchema } from './event-stats.types';

class EventStatsController {
    /**
     * GET /event-stats/:eventId
     * Get comprehensive event statistics
     */
    getEventStats = asyncHandler(async (req: Request, res: Response) => {
        const { eventId } = req.params;
        const stats = await eventStatsService.getEventStats(eventId);
        res.json(stats);
    });

    /**
     * GET /event-stats/:eventId/badges
     * Get participants by badge status (CONFIRMED or PENDING)
     */
    getBadgeList = asyncHandler(async (req: Request, res: Response) => {
        const { eventId } = req.params;
        const validated = badgeListQuerySchema.parse(req.query);
        const { status, page = 1, limit = 10 } = validated;

        const result = await eventStatsService.getParticipantsByStatus(
            eventId,
            status,
            page,
            limit
        );
        res.json(result);
    });

    /**
     * GET /event-stats/:eventId/courses
     * Get courses with their attendees
     */
    getCoursesWithAttendees = asyncHandler(async (req: Request, res: Response) => {
        const { eventId } = req.params;
        const courses = await eventStatsService.getCoursesWithAttendees(eventId);
        res.json(courses);
    });
}

export const eventStatsController = new EventStatsController();
