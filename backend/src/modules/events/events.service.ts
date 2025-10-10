import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import {
  CreateEventDto,
  UpdateEventDto,
  EventQueryDto,
  EventResponse,
  EventListResponse,
  EventStatsResponse,
} from './events.types';

class EventsService {
  /**
   * Get all events with filtering, pagination, and sorting
   */
  async getEvents(query: EventQueryDto): Promise<EventListResponse> {
    const {
      page = 1,
      limit = 10,
      status,
      startDate,
      endDate,
      search,
      sortBy = 'startDate',
      order = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) {
        where.startDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.startDate.lte = new Date(endDate);
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.event.count({ where });

    // Get events
    const events = await prisma.event.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: order },
      select: {
        id: true,
        name: true,
        location: true,
        startDate: true,
        endDate: true,
        status: true,
        participantFields: true,
        staffFields: true,
        courseFields: true,
        hallFields: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            participants: true,
          },
        },
      },
    });

    // Map events to ensure participantFields is properly typed
    const mappedEvents = events.map(event => ({
      ...event,
      participantFields: (event.participantFields || []) as any[],
      staffFields: (event.staffFields || []) as any[],
      courseFields: (event.courseFields || []) as any[],
      hallFields: (event.hallFields || []) as any[],
    }));

    return {
      events: mappedEvents,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single event by ID
   */
  async getEventById(id: string): Promise<EventResponse> {
    const event = await prisma.event.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        location: true,
        startDate: true,
        endDate: true,
        status: true,
        participantFields: true,
        staffFields: true,
        courseFields: true,
        hallFields: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            participants: true,
            courses: true,
          },
        },
      },
    });

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    // Map participantFields to ensure proper typing
    return {
      ...event,
      participantFields: (event.participantFields || []) as any[],
      staffFields: (event.staffFields || []) as any[],
      courseFields: (event.courseFields || []) as any[],
      hallFields: (event.hallFields || []) as any[],
    };
  }

  /**
   * Create new event
   */
  async createEvent(data: CreateEventDto): Promise<EventResponse> {
    const { startDate, endDate, badgeTemplate, participantFields = [], staffFields = [], courseFields = [], hallFields = [], ...rest } = data;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      throw new AppError('End date must be after start date', 400);
    }

    // Create event
    const event = await prisma.event.create({
      data: {
        ...rest,
        startDate: start,
        endDate: end,
        badgeTemplate: badgeTemplate ?? {},
        participantFields: participantFields as any,
        staffFields: staffFields as any,
        courseFields: courseFields as any,
        hallFields: hallFields as any,
      },
      select: {
        id: true,
        name: true,
        location: true,
        startDate: true,
        endDate: true,
        status: true,
        participantFields: true,
        staffFields: true,
        courseFields: true,
        hallFields: true,
        badgeTemplate: true,
        createdAt: true,
        updatedAt: true,
        halls: {
          select: {
            id: true,
            hallFields: true,
          },
        },
        _count: {
          select: {
            participants: true,
          },
        },
      },
    });

    // Map fields to ensure proper typing
    return {
      ...event,
      participantFields: (event.participantFields || []) as any[],
      staffFields: (event.staffFields || []) as any[],
      courseFields: (event.courseFields || []) as any[],
      hallFields: (event.hallFields || []) as any[],
      badgeTemplate: event.badgeTemplate as any,
    };
  }

  /**
   * Update existing event
   */
  async updateEvent(id: string, data: UpdateEventDto): Promise<EventResponse> {
    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      throw new AppError('Event not found', 404);
    }

    const { startDate, endDate, badgeTemplate, participantFields, staffFields, courseFields, hallFields, ...rest } = data;

    // Prepare update data
    const updateData: any = { ...rest };

    if (badgeTemplate !== undefined) {
      updateData.badgeTemplate = badgeTemplate;
    }

    // Validate dates if provided
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : existingEvent.startDate;
      const end = endDate ? new Date(endDate) : existingEvent.endDate;

      if (start >= end) {
        throw new AppError('End date must be after start date', 400);
      }

      if (startDate) updateData.startDate = start;
      if (endDate) updateData.endDate = end;
    }

    // Update fields if provided
    if (participantFields !== undefined) {
      updateData.participantFields = participantFields as any;
    }
    if (staffFields !== undefined) {
      updateData.staffFields = staffFields as any;
    }
    if (courseFields !== undefined) {
      updateData.courseFields = courseFields as any;
    }
    if (hallFields !== undefined) {
      updateData.hallFields = hallFields as any;
    }

    // Update event
    const event = await prisma.event.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        location: true,
        startDate: true,
        endDate: true,
        status: true,
        participantFields: true,
        staffFields: true,
        courseFields: true,
        hallFields: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            participants: true,
          },
        },
      },
    });

    // Map fields to ensure proper typing
    return {
      ...event,
      participantFields: (event.participantFields || []) as any[],
      staffFields: (event.staffFields || []) as any[],
      courseFields: (event.courseFields || []) as any[],
      hallFields: (event.hallFields || []) as any[],
    };
  }

  /**
   * Delete event
   */
  async deleteEvent(id: string): Promise<void> {
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    await prisma.event.delete({
      where: { id },
    });
  }

  /**
   * Get event statistics
   */
  async getEventStats(id: string): Promise<EventStatsResponse> {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        participants: true,
        staff: true,
        attendance: true,
      },
    });

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    // Fetch courses separately to include nested relations
    const courses = await prisma.course.findMany({
      where: { eventId: id },
      include: {
        halls: {
          include: {
            hall: true,
          },
        },
        _count: {
          select: {
            attendance: true,
          },
        },
      },
    });

    const totalParticipants = event.participants.length;
    const attendedParticipants = event.attendance.filter(
      (a) => a.checkInTime !== null
    ).length;
    const attendanceRate =
      totalParticipants > 0 ? (attendedParticipants / totalParticipants) * 100 : 0;
    const totalCourses = courses.length;

    // Badge statistics
    const participantBadgesPrinted = event.participants.filter(
      (p) => p.badgePrintedAt !== null
    ).length;
    const participantBadgesNotPrinted = totalParticipants - participantBadgesPrinted;
    const staffBadgesPrinted = event.staff.filter((s) => s.badgePrintedAt !== null).length;
    const staffBadgesNotPrinted = event.staff.length - staffBadgesPrinted;

    // Participants with badges printed
    const participantsWithBadgesPrinted = event.participants
      .filter((p) => p.badgePrintedAt !== null)
      .map((p) => ({
        id: p.id,
        participantFields: p.participantFields as Record<string, any>,
        badgePrintedAt: p.badgePrintedAt!,
        badgePrintedBy: p.badgePrintedBy || 'Unknown',
      }));

    // Participants with badges not printed
    const participantsWithBadgesNotPrinted = event.participants
      .filter((p) => p.badgePrintedAt === null)
      .map((p) => ({
        id: p.id,
        participantFields: p.participantFields as Record<string, any>,
      }));

    // Staff with badges printed
    const staffWithBadgesPrinted = event.staff
      .filter((s) => s.badgePrintedAt !== null)
      .map((s) => ({
        id: s.id,
        staffFields: s.staffFields as Record<string, any>,
        username: s.username,
        badgePrintedAt: s.badgePrintedAt!,
        badgePrintedBy: s.badgePrintedBy,
      }));

    // Courses by time slot - sort by start date
    const coursesByTimeSlot = courses
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
      .map((course) => ({
        id: course.id,
        name: (course.courseFields as Record<string, any>)?.name || 'Unnamed Course',
        courseFields: course.courseFields as Record<string, any>,
        startDate: course.startDate,
        endDate: course.endDate,
        halls: course.halls.map((h) => ({
          id: h.hall.id,
          name: (h.hall.hallFields as Record<string, any>)?.name || 'Unnamed Hall',
        })),
        attendanceCount: course._count.attendance,
      }));

    return {
      totalParticipants,
      attendedParticipants,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
      totalCourses,
      badgeStats: {
        participantBadgesPrinted,
        participantBadgesNotPrinted,
        staffBadgesPrinted,
        staffBadgesNotPrinted,
      },
      participantsWithBadgesPrinted,
      participantsWithBadgesNotPrinted,
      staffWithBadgesPrinted,
      coursesByTimeSlot,
    };
  }
}

export const eventsService = new EventsService();
