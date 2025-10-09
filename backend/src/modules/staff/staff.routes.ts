import { Router } from 'express';
import { staffController } from './staff.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

// Staff login endpoint (public)
router.post('/login', staffController.login);

// All other endpoints require admin authentication
router.post('/', authenticate, authorize('staff', 'create'), staffController.createStaff);
router.get('/', authenticate, authorize('staff', 'read'), staffController.getStaffWithFilters);
router.get('/event/:eventId', authenticate, authorize('staff', 'read'), staffController.getAllStaff);
router.get('/:id', authenticate, authorize('staff', 'read'), staffController.getStaffById);
router.put('/:id', authenticate, authorize('staff', 'update'), staffController.updateStaff);
router.patch('/:id/badge-print', authenticate, authorize('staff', 'update'), staffController.updateBadgePrint);
router.delete('/:id', authenticate, authorize('staff', 'delete'), staffController.deleteStaff);

export default router;
