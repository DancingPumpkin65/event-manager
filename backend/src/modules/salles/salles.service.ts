import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import {
  CreateSalleDto,
  UpdateSalleDto,
  SalleQueryDto,
  SalleResponse,
  SalleListResponse,
} from './salles.types';

class SallesService {
  /**
   * Get all halls with filtering, pagination, and sorting
   */
  async getSalles(query: SalleQueryDto): Promise<SalleListResponse> {
    const {
      page = 1,
      limit = 10,
      eventId,
      search,
      sortBy = 'createdAt',
      order = 'asc',
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (eventId) {
      where.eventId = eventId;
    }

    // Search in hallFields JSON if search is provided
    if (search) {
      where.hallFields = {
        path: ['name'],
        string_contains: search,
        mode: 'insensitive',
      };
    }

    // Get total count
    const total = await prisma.hall.count({ where: eventId ? { eventId } : {} });

    // Get halls
    const salles = await prisma.hall.findMany({
      where: eventId ? { eventId } : {},
      skip,
      take: limit,
      orderBy: { [sortBy]: order },
      include: {
        event: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            courseHalls: true,
            attendance: true,
          },
        },
      },
    });

    return {
      salles: salles as SalleResponse[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get halls for a specific event
   */
  async getEventSalles(eventId: string): Promise<SalleResponse[]> {
    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    const salles = await prisma.hall.findMany({
      where: { eventId },
      include: {
        event: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            courseHalls: true,
            attendance: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return salles as SalleResponse[];
  }

  /**
   * Get single hall by ID
   */
  async getSalleById(id: string): Promise<SalleResponse> {
    const salle = await prisma.hall.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            courseHalls: true,
            attendance: true,
          },
        },
      },
    });

    if (!salle) {
      throw new AppError('Hall not found', 404);
    }

    return salle as SalleResponse;
  }

  /**
   * Create new hall
   */
  async createSalle(data: CreateSalleDto): Promise<SalleResponse> {
    const { eventId, hallFields } = data;

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    // Create hall
    const salle = await prisma.hall.create({
      data: {
        eventId,
        hallFields: hallFields || undefined,
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            courseHalls: true,
            attendance: true,
          },
        },
      },
    });

    return salle as SalleResponse;
  }

  /**
   * Update existing hall
   */
  async updateSalle(id: string, data: UpdateSalleDto): Promise<SalleResponse> {
    // Check if hall exists
    const existingSalle = await prisma.hall.findUnique({
      where: { id },
    });

    if (!existingSalle) {
      throw new AppError('Hall not found', 404);
    }

    // Update hall
    const salle = await prisma.hall.update({
      where: { id },
      data: {
        hallFields: data.hallFields,
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            courseHalls: true,
            attendance: true,
          },
        },
      },
    });

    return salle as SalleResponse;
  }

  /**
   * Delete hall
   */
  async deleteSalle(id: string): Promise<void> {
    const salle = await prisma.hall.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            courseHalls: true,
            attendance: true,
          },
        },
      },
    });

    if (!salle) {
      throw new AppError('Hall not found', 404);
    }

    // Check if hall has courses or attendance records
    if (salle._count.courseHalls > 0 || salle._count.attendance > 0) {
      throw new AppError(
        'Cannot delete hall with existing courses or attendance records.',
        400
      );
    }

    await prisma.hall.delete({
      where: { id },
    });
  }
}

export const sallesService = new SallesService();
