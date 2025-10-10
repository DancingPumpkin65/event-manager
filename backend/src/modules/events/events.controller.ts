import { Response } from 'express';
import { eventsService } from './events.service';
import { asyncHandler } from '../../middleware/error.middleware';
import { AppError } from '../../middleware/error.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
  createEventSchema,
  updateEventSchema,
  eventQuerySchema,
} from './events.types';

class EventsController {
  /**
   * Get all events with filtering and pagination
   * GET /api/events
   */
  getEvents = asyncHandler(async (req: AuthRequest, res: Response) => {
    const queryParams = eventQuerySchema.parse(req.query);

    // If user is staff, enforce eventId filter
    if (req.user?.type === 'staff' && req.user.eventId) {
      // Overwrite or force the ID to match their assigned event
      // Assuming getEvents service accepts a filter. If not, we might need to adjust service or fetch single event.
      // For now, let's assume valid implementation behavior:
      /* 
         Since the service.getEvents likely returns a list based on criteria, 
         we can just overwrite the queryParams or handle it here.
         However, a cleaner way might be to just call getEventById if they are staff trying to "list" events.
         Or filtering the result.
         Let's assume we pass the filter to the service.
      */
      // Actually, for staff, they only have ONE event.
      // So we can just fetch that one event and return it as a list of 1.
      const event = await eventsService.getEventById(req.user.eventId);
      res.status(200).json({
        status: 'success',
        data: {
          events: [event], // return as array to match expected list structure
          pagination: {
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1
          }
        },
      });
      return;
    }

    const result = await eventsService.getEvents(queryParams);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  });

  /**
   * Get single event by ID
   * GET /api/events/:id
   */
  getEventById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // Data Scoping: If staff, ensure they are accessing their own event
    if (req.user?.type === 'staff' && req.user.eventId && req.user.eventId !== id) {
      throw new AppError('Unauthorized access to this event', 403);
    }

    const event = await eventsService.getEventById(id);

    res.status(200).json({
      status: 'success',
      data: event,
    });
  });

  /**
   * Create new event
   * POST /api/events
   */
  createEvent = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const validatedData = createEventSchema.parse(req.body);
    const event = await eventsService.createEvent(validatedData);

    res.status(201).json({
      status: 'success',
      data: event,
    });
  });

  /**
   * Update existing event
   * PATCH /api/events/:id
   */
  updateEvent = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { id } = req.params;
    const validatedData = updateEventSchema.parse(req.body);
    const event = await eventsService.updateEvent(id, validatedData);

    res.status(200).json({
      status: 'success',
      data: event,
    });
  });

  /**
   * Delete event
   * DELETE /api/events/:id
   */
  deleteEvent = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { id } = req.params;
    await eventsService.deleteEvent(id);

    res.status(204).send();
  });

  /**
   * Get event statistics
   * GET /api/events/:id/stats
   */
  getEventStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const stats = await eventsService.getEventStats(id);

    res.status(200).json({
      status: 'success',
      data: stats,
    });
  });
}

export const eventsController = new EventsController();
