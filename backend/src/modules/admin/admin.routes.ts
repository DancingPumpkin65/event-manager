import { Router } from 'express';
import { adminController } from './admin.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

/**
 * All admin routes require authentication and Event Read permissions (Admin)
 */
router.use(authenticate);
router.use(authorize('event', 'read'));

/**
 * GET /api/admin/dashboard/stats
 * Get dashboard statistics (total events, active events, participants, staff, recent events)
 */
router.get('/dashboard/stats', adminController.getDashboardStats.bind(adminController));

export default router;
