import { Router } from 'express';
import { eventsController } from './events.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { participantsController } from '../participants/participants.controller';

const router = Router();

router.get(
  '/',
  authenticate,
  authorize('event', 'read'),
  eventsController.getEvents
);

router.get(
  '/:id',
  authenticate,
  authorize('event', 'read'),
  eventsController.getEventById
);

router.get(
  '/:id/stats',
  authenticate,
  authorize('event', 'read'),
  eventsController.getEventStats
);

router.get(
  '/:eventId/participants',
  authenticate,
  authorize('event', 'read'),
  participantsController.getEventParticipants
);

router.post(
  '/',
  authenticate,
  authorize('event', 'create'),
  eventsController.createEvent
);

router.patch(
  '/:id',
  authenticate,
  authorize('event', 'update'),
  eventsController.updateEvent
);

router.delete(
  '/:id',
  authenticate,
  authorize('event', 'delete'),
  eventsController.deleteEvent
);

export default router;
