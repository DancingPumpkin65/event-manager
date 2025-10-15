import { Router } from 'express';
import * as badgesController from './badges.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', badgesController.getBadges);
router.get('/:id', badgesController.getBadgeById);

// Protected routes (ADMIN and ORGANIZER only)
router.post(
  '/generate',
  authenticate,
  authorize('participant', 'update'),
  badgesController.generateBadge
);

router.patch(
  '/:id/print',
  authenticate,
  authorize('participant', 'update'),
  badgesController.markAsPrinted
);

router.delete(
  '/:id',
  authenticate,
  authorize('participant', 'update'),
  badgesController.deleteBadge
);

export default router;
