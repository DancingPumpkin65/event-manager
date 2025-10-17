import { Router } from 'express';
import { sallesController } from './salles.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, authorize('hall', 'read'), sallesController.getSalles);
router.get('/event/:eventId', authenticate, authorize('hall', 'read'), sallesController.getEventSalles);
router.get('/:id', authenticate, authorize('hall', 'read'), sallesController.getSalleById);

router.post(
  '/',
  authenticate,
  authorize('hall', 'create'),
  sallesController.createSalle
);

router.patch(
  '/:id',
  authenticate,
  authorize('hall', 'update'),
  sallesController.updateSalle
);

router.delete(
  '/:id',
  authenticate,
  authorize('hall', 'delete'),
  sallesController.deleteSalle
);

export default router;
