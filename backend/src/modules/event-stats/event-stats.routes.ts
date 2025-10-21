import { Router } from 'express';
import { eventStatsController } from './event-stats.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.get(
    '/:eventId',
    authenticate,
    authorize('event', 'read'),
    eventStatsController.getEventStats
);

router.get(
    '/:eventId/badges',
    authenticate,
    authorize('participant', 'read'),
    eventStatsController.getBadgeList
);

router.get(
    '/:eventId/courses',
    authenticate,
    authorize('course', 'read'),
    eventStatsController.getCoursesWithAttendees
);

export default router;
