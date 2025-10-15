import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import {
  GenerateBadgeDto,
  BadgeQueryDto,
  BadgeResponse,
  BadgeListResponse,
} from './badges.types';
import { randomBytes } from 'crypto';

class BadgesService {
  /**
   * Get all badges (participants and staff with badgeId)
   */
  async getBadges(query: BadgeQueryDto): Promise<BadgeListResponse> {
    const {
      page = 1,
      limit = 10,
      participantId,
      staffId,
      eventId,
      printed,
      sortBy = 'createdAt',
      order = 'desc',
    } = query;

    const skip = (page - 1) * limit;
    const badges: BadgeResponse[] = [];

    // Query participants with badges
    if (!staffId) {
      const participantWhere: any = {
        badgeId: { not: null },
      };

      if (participantId) {
        participantWhere.id = participantId;
      }

      if (eventId) {
        participantWhere.eventId = eventId;
      }

      if (printed !== undefined) {
        participantWhere.badgePrintedAt = printed ? { not: null } : null;
      }

      const participants = await prisma.participant.findMany({
        where: participantWhere,
        skip: !staffId ? skip : 0,
        take: !staffId ? Math.ceil(limit / 2) : limit,
        orderBy: { [sortBy]: order },
        include: {
          event: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      badges.push(
        ...participants.map((p) => ({
          id: p.id,
          badgeId: p.badgeId,
          participantFields: p.participantFields as Record<string, any>,
          badgePrintedAt: p.badgePrintedAt,
          badgePrintedBy: p.badgePrintedBy,
          eventId: p.eventId,
          eventName: p.event.name,
          type: 'participant' as const,
        }))
      );
    }

    // Query staff with badges
    if (!participantId) {
      const staffWhere: any = {
        badgeId: { not: null },
      };

      if (staffId) {
        staffWhere.id = staffId;
      }

      if (eventId) {
        staffWhere.eventId = eventId;
      }

      if (printed !== undefined) {
        staffWhere.badgePrintedAt = printed ? { not: null } : null;
      }

      const staff = await prisma.staff.findMany({
        where: staffWhere,
        skip: !participantId ? skip : 0,
        take: !participantId ? Math.ceil(limit / 2) : limit,
        orderBy: { [sortBy]: order },
        include: {
          event: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      badges.push(
        ...staff.map((s) => ({
          id: s.id,
          badgeId: s.badgeId,
          staffFields: s.staffFields as Record<string, any>,
          badgePrintedAt: s.badgePrintedAt,
          badgePrintedBy: s.badgePrintedBy,
          eventId: s.eventId,
          eventName: s.event.name,
          type: 'staff' as const,
        }))
      );
    }

    // Get total count
    const participantCount = !staffId
      ? await prisma.participant.count({
          where: {
            badgeId: { not: null },
            ...(eventId && { eventId }),
            ...(printed !== undefined && {
              badgePrintedAt: printed ? { not: null } : null,
            }),
          },
        })
      : 0;

    const staffCount = !participantId
      ? await prisma.staff.count({
          where: {
            badgeId: { not: null },
            ...(eventId && { eventId }),
            ...(printed !== undefined && {
              badgePrintedAt: printed ? { not: null } : null,
            }),
          },
        })
      : 0;

    const total = participantCount + staffCount;

    return {
      badges,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get badge by ID (participant or staff)
   */
  async getBadgeById(id: string): Promise<BadgeResponse> {
    // Try to find as participant
    const participant = await prisma.participant.findFirst({
      where: { 
        id,
        badgeId: { not: null }
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (participant) {
      return {
        id: participant.id,
        badgeId: participant.badgeId,
        participantFields: participant.participantFields as Record<string, any>,
        badgePrintedAt: participant.badgePrintedAt,
        badgePrintedBy: participant.badgePrintedBy,
        eventId: participant.eventId,
        eventName: participant.event.name,
        type: 'participant',
      };
    }

    // Try to find as staff
    const staff = await prisma.staff.findFirst({
      where: { 
        id,
        badgeId: { not: null }
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (staff) {
      return {
        id: staff.id,
        badgeId: staff.badgeId,
        staffFields: staff.staffFields as Record<string, any>,
        badgePrintedAt: staff.badgePrintedAt,
        badgePrintedBy: staff.badgePrintedBy,
        eventId: staff.eventId,
        eventName: staff.event.name,
        type: 'staff',
      };
    }

    throw new AppError('Badge not found', 404);
  }

  /**
   * Generate badge for participant or staff
   */
  async generateBadge(data: GenerateBadgeDto): Promise<BadgeResponse> {
    const { participantId, staffId } = data;

    if (participantId) {
      // Generate badge for participant
      const participant = await prisma.participant.findUnique({
        where: { id: participantId },
        include: {
          event: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!participant) {
        throw new AppError('Participant not found', 404);
      }

      if (participant.badgeId) {
        throw new AppError('Badge already exists for this participant', 409);
      }

      // Generate unique badge ID
      const badgeId = `P-${randomBytes(8).toString('hex').toUpperCase()}`;

      const updated = await prisma.participant.update({
        where: { id: participantId },
        data: { badgeId },
        include: {
          event: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return {
        id: updated.id,
        badgeId: updated.badgeId,
        participantFields: updated.participantFields as Record<string, any>,
        badgePrintedAt: updated.badgePrintedAt,
        badgePrintedBy: updated.badgePrintedBy,
        eventId: updated.eventId,
        eventName: updated.event.name,
        type: 'participant',
      };
    }

    if (staffId) {
      // Generate badge for staff
      const staff = await prisma.staff.findUnique({
        where: { id: staffId },
        include: {
          event: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!staff) {
        throw new AppError('Staff not found', 404);
      }

      if (staff.badgeId) {
        throw new AppError('Badge already exists for this staff member', 409);
      }

      // Generate unique badge ID
      const badgeId = `S-${randomBytes(8).toString('hex').toUpperCase()}`;

      const updated = await prisma.staff.update({
        where: { id: staffId },
        data: { badgeId },
        include: {
          event: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return {
        id: updated.id,
        badgeId: updated.badgeId,
        staffFields: updated.staffFields as Record<string, any>,
        badgePrintedAt: updated.badgePrintedAt,
        badgePrintedBy: updated.badgePrintedBy,
        eventId: updated.eventId,
        eventName: updated.event.name,
        type: 'staff',
      };
    }

    throw new AppError('Either participantId or staffId must be provided', 400);
  }

  /**
   * Mark badge as printed
   */
  async markAsPrinted(id: string, printedBy: string): Promise<BadgeResponse> {
    // Try participant
    const participant = await prisma.participant.findFirst({
      where: { 
        id,
        badgeId: { not: null }
      },
    });

    if (participant) {
      const updated = await prisma.participant.update({
        where: { id },
        data: {
          badgePrintedAt: new Date(),
          badgePrintedBy: printedBy,
        },
        include: {
          event: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return {
        id: updated.id,
        badgeId: updated.badgeId,
        participantFields: updated.participantFields as Record<string, any>,
        badgePrintedAt: updated.badgePrintedAt,
        badgePrintedBy: updated.badgePrintedBy,
        eventId: updated.eventId,
        eventName: updated.event.name,
        type: 'participant',
      };
    }

    // Try staff
    const staff = await prisma.staff.findFirst({
      where: { 
        id,
        badgeId: { not: null }
      },
    });

    if (staff) {
      const updated = await prisma.staff.update({
        where: { id },
        data: {
          badgePrintedAt: new Date(),
          badgePrintedBy: printedBy,
        },
        include: {
          event: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return {
        id: updated.id,
        badgeId: updated.badgeId,
        staffFields: updated.staffFields as Record<string, any>,
        badgePrintedAt: updated.badgePrintedAt,
        badgePrintedBy: updated.badgePrintedBy,
        eventId: updated.eventId,
        eventName: updated.event.name,
        type: 'staff',
      };
    }

    throw new AppError('Badge not found', 404);
  }

  /**
   * Delete badge (remove badgeId from participant/staff)
   */
  async deleteBadge(id: string): Promise<void> {
    // Try participant
    const participant = await prisma.participant.findFirst({
      where: { 
        id,
        badgeId: { not: null }
      },
    });

    if (participant) {
      await prisma.participant.update({
        where: { id },
        data: {
          badgeId: null,
          badgePrintedAt: null,
          badgePrintedBy: null,
        },
      });
      return;
    }

    // Try staff
    const staff = await prisma.staff.findFirst({
      where: { 
        id,
        badgeId: { not: null }
      },
    });

    if (staff) {
      await prisma.staff.update({
        where: { id },
        data: {
          badgeId: null,
          badgePrintedAt: null,
          badgePrintedBy: null,
        },
      });
      return;
    }

    throw new AppError('Badge not found', 404);
  }
}

export const badgesService = new BadgesService();
