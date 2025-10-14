import { Router } from 'express';
import { participantsController } from './participants.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { uploadParticipantPhoto } from '../../middleware/upload.middleware';

const router = Router();

router.get(
  '/',
  authenticate,
  authorize('participant', 'read'),
  participantsController.getParticipants
);

router.get(
  '/:id',
  authenticate,
  authorize('participant', 'read'),
  participantsController.getParticipantById
);

router.post(
  '/',
  authenticate,
  authorize('participant', 'create'),
  participantsController.createParticipant
);

router.post(
  '/bulk',
  authenticate,
  authorize('participant', 'create'),
  participantsController.bulkCreateParticipants
);

router.patch(
  '/:id',
  authenticate,
  authorize('participant', 'update'),
  participantsController.updateParticipant
);

router.post(
  '/:id/photo',
  authenticate,
  authorize('participant', 'update'),
  uploadParticipantPhoto.single('photo'),
  participantsController.uploadPhoto
);

router.patch(
  '/:id/badge-print',
  authenticate,
  authorize('participant', 'update'),
  participantsController.updateBadgePrint
);

router.post(
  '/validate-scan',
  authenticate,
  authorize('participant', 'read'),
  participantsController.validateScan
);

router.delete(
  '/:id',
  authenticate,
  authorize('participant', 'delete'),
  participantsController.deleteParticipant
);

export default router;
