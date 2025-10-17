import { Response } from 'express';
import { sallesService } from './salles.service';
import { asyncHandler } from '../../middleware/error.middleware';
import { AppError } from '../../middleware/error.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
  createSalleSchema,
  updateSalleSchema,
  salleQuerySchema,
} from './salles.types';

class SallesController {
  /**
   * Get all salles with filtering and pagination
   * GET /api/salles
   */
  getSalles = asyncHandler(async (req: AuthRequest, res: Response) => {
    const queryParams = salleQuerySchema.parse(req.query);

    // Data Scoping: If staff, force eventId to match their assigned event
    if (req.user?.type === 'staff' && req.user.eventId) {
      queryParams.eventId = req.user.eventId;
    }

    const result = await sallesService.getSalles(queryParams);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  });

  /**
   * Get halls for a specific event
   * GET /api/salles/event/:eventId
   */
  getEventSalles = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { eventId } = req.params;

    // Data Scoping: If staff, ensure they are accessing halls for their own event
    if (req.user?.type === 'staff' && req.user.eventId && req.user.eventId !== eventId) {
      throw new AppError('Unauthorized access to this event halls', 403);
    }

    const salles = await sallesService.getEventSalles(eventId);

    res.status(200).json({
      status: 'success',
      data: salles,
    });
  });

  /**
   * Get single salle by ID
   * GET /api/salles/:id
   */
  getSalleById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const salle = await sallesService.getSalleById(id);

    // Data Scoping: If staff, ensure hall belongs to their event
    if (req.user?.type === 'staff' && req.user.eventId && salle.eventId !== req.user.eventId) {
      throw new AppError('Unauthorized access to this hall', 403);
    }

    res.status(200).json({
      status: 'success',
      data: salle,
    });
  });

  /**
   * Create new salle
   * POST /api/salles
   */
  createSalle = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const validatedData = createSalleSchema.parse(req.body);
    const salle = await sallesService.createSalle(validatedData);

    res.status(201).json({
      status: 'success',
      data: salle,
    });
  });

  /**
   * Update existing salle
   * PATCH /api/salles/:id
   */
  updateSalle = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { id } = req.params;
    const validatedData = updateSalleSchema.parse(req.body);
    const salle = await sallesService.updateSalle(id, validatedData);

    res.status(200).json({
      status: 'success',
      data: salle,
    });
  });

  /**
   * Delete salle
   * DELETE /api/salles/:id
   */
  deleteSalle = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { id } = req.params;
    await sallesService.deleteSalle(id);

    res.status(204).send();
  });

}

export const sallesController = new SallesController();
