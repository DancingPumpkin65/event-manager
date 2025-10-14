import { Response } from 'express';
import { participantsService } from './participants.service';
import { asyncHandler } from '../../middleware/error.middleware';
import { AppError } from '../../middleware/error.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
  createParticipantSchema,
  updateParticipantSchema,
  participantQuerySchema,
  bulkParticipantSchema,
} from './participants.types';

class ParticipantsController {
  /**
   * Get all participants with filtering and pagination
   * GET /api/participants
   */
  getParticipants = asyncHandler(async (req: AuthRequest, res: Response) => {
    const queryParams = participantQuerySchema.parse(req.query);

    // Data Scoping: If staff, force eventId to match their assigned event
    if (req.user?.type === 'staff' && req.user.eventId) {
      queryParams.eventId = req.user.eventId;
    }

    const result = await participantsService.getParticipants(queryParams);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  });

  /**
   * Get participants for a specific event
   * GET /api/events/:eventId/participants
   */
  getEventParticipants = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { eventId } = req.params;

    // Data Scoping: If staff, ensure they are accessing their own event
    if (req.user?.type === 'staff' && req.user.eventId && req.user.eventId !== eventId) {
      throw new AppError('Unauthorized access to this event participants', 403);
    }

    const participants = await participantsService.getEventParticipants(eventId);

    res.status(200).json({
      status: 'success',
      data: participants,
    });
  });

  /**
   * Get single participant by ID
   * GET /api/participants/:id
   */
  getParticipantById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const participant = await participantsService.getParticipantById(id);

    // Data Scoping: If staff, ensure participant belongs to their event
    if (req.user?.type === 'staff' && req.user.eventId && participant.eventId !== req.user.eventId) {
      throw new AppError('Unauthorized access to this participant', 403);
    }

    res.status(200).json({
      status: 'success',
      data: participant,
    });
  });

  /**
   * Create new participant
   * POST /api/participants
   */
  createParticipant = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const validatedData = createParticipantSchema.parse(req.body);
    const participant = await participantsService.createParticipant(validatedData);

    res.status(201).json({
      status: 'success',
      data: participant,
    });
  });

  /**
   * Bulk create participants from Excel/JSON
   * POST /api/participants/bulk
   */
  bulkCreateParticipants = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const validatedData = bulkParticipantSchema.parse(req.body);
    const result = await participantsService.bulkCreateParticipants(validatedData);

    res.status(201).json({
      status: 'success',
      data: result,
      message: `Successfully imported ${result.success} participants. ${result.failed} failed.`,
    });
  });

  /**
   * Update existing participant
   * PATCH /api/participants/:id
   */
  updateParticipant = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { id } = req.params;
    const validatedData = updateParticipantSchema.parse(req.body);
    const participant = await participantsService.updateParticipant(id, validatedData);

    res.status(200).json({
      status: 'success',
      data: participant,
    });
  });

  /**
   * Upload participant photo
   * POST /api/participants/:id/photo
   */
  uploadPhoto = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { id } = req.params;

    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    // File path relative to uploads directory
    const photoPath = `/uploads/participants/${req.file.filename}`;

    const participant = await participantsService.updateParticipantPhoto(id, photoPath);

    res.status(200).json({
      status: 'success',
      data: participant,
      message: 'Photo uploaded successfully',
    });
  });

  /**
   * Delete participant
   * DELETE /api/participants/:id
   */
  deleteParticipant = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { id } = req.params;
    await participantsService.deleteParticipant(id);

    res.status(204).send();
  });

  updateBadgePrint = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { printedBy, badgeId } = req.body;

    if (!printedBy) {
      res.status(400).json({ message: 'Printed by is required' });
      return;
    }

    const participant = await participantsService.updateBadgePrint(id, printedBy, badgeId);

    res.json(participant);
  });

  /**
   * Validate scanned barcode/QR code
   * POST /api/participants/validate-scan
   */
  validateScan = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { barcode, eventId } = req.body;

    if (!barcode || !eventId) {
      throw new AppError('Barcode and eventId are required', 400);
    }

    // Data Scoping: If staff, ensure they are scanning for their own event
    if (req.user?.type === 'staff' && req.user.eventId && req.user.eventId !== eventId) {
      throw new AppError('Unauthorized to scan for this event', 403);
    }

    const participant = await participantsService.findByBarcodeAndEvent(
      barcode,
      eventId
    );

    if (!participant) {
      throw new AppError('Participant not found for this event', 404);
    }

    res.status(200).json({
      status: 'success',
      data: participant,
    });
  });
}

export const participantsController = new ParticipantsController();
