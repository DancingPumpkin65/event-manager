import { Router } from 'express';
import { coursesController } from './courses.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { uploadExcel } from '../../middleware/upload.middleware';

const router = Router();

// Protected routes - require authentication for all access to support data scoping
router.get(
  '/',
  authenticate,
  authorize('course', 'read'),
  coursesController.getCourses
);

router.get(
  '/:id',
  authenticate,
  authorize('course', 'read'),
  coursesController.getCourseById
);

router.post(
  '/',
  authenticate,
  authorize('course', 'create'),
  coursesController.createCourse
);

router.patch(
  '/:id',
  authenticate,
  authorize('course', 'update'),
  coursesController.updateCourse
);

router.delete(
  '/:id',
  authenticate,
  authorize('course', 'delete'),
  coursesController.deleteCourse
);

router.post(
  '/register',
  authenticate,
  authorize('course', 'update'), // or maybe a specific permission? using update for now
  coursesController.registerParticipant
);

router.post(
  '/:id/registrations/import',
  authenticate,
  authorize('course', 'update'),
  uploadExcel.single('file'),
  coursesController.importRegistrations
);

export default router;
