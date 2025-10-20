import { Router } from 'express';
import { attendanceController } from './attendance.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

router.get(
  '/',
  authenticate,
  authorize('attendance', 'read'),
  attendanceController.getAttendances
);

router.get(
  '/events/:eventId/stats',
  authenticate,
  authorize('attendance', 'read'),
  attendanceController.getEventStats
);

router.post(
  '/scan',
  authenticate,
  authorize('attendance', 'create'),
  attendanceController.scan
);

export default router;
