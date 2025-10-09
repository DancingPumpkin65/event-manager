import prisma from '../../config/database';
import bcrypt from 'bcryptjs';
import { AppError } from '../../middleware/error.middleware';

export interface CreateStaffInput {
  eventId: string;
  staffFields: Record<string, any>;
  username: string;
  password: string;
}

export interface UpdateStaffInput {
  staffFields?: Record<string, any>;
  username?: string;
  password?: string;
}

export interface UpdateBadgePrintInput {
  badgeId: string;
  printedBy: string;
}

export const staffService = {
  async createStaff(input: CreateStaffInput) {
    const hashedPassword = await bcrypt.hash(input.password, 10);

    return prisma.staff.create({
      data: {
        eventId: input.eventId,
        staffFields: input.staffFields,
        username: input.username,
        password: hashedPassword,
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
  },

  async getAllStaff(eventId: string) {
    return prisma.staff.findMany({
      where: { eventId },
      include: {
        event: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getStaffWithFilters(eventId: string, filters: { search?: string; badgePrinted?: boolean }) {
    const where: any = { eventId };

    // Apply search filter (name, email, username)
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      where.OR = [
        { username: { contains: searchTerm, mode: 'insensitive' } },
        { staffFields: { path: ['firstName'], string_contains: searchTerm } },
        { staffFields: { path: ['lastName'], string_contains: searchTerm } },
        { staffFields: { path: ['email'], string_contains: searchTerm } },
      ];
    }

    // Apply badge printed filter
    if (filters.badgePrinted !== undefined) {
      if (filters.badgePrinted) {
        where.badgePrintedAt = { not: null };
      } else {
        where.badgePrintedAt = null;
      }
    }

    return prisma.staff.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getStaffById(id: string) {
    return prisma.staff.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  async getStaffByUsername(eventId: string, username: string) {
    return prisma.staff.findFirst({
      where: {
        eventId,
        username,
      },
    });
  },

  async updateStaff(id: string, input: UpdateStaffInput) {
    const staff = await prisma.staff.findUnique({ where: { id } });
    if (!staff) {
      throw new AppError('Staff not found', 404);
    }

    const data: any = {
      ...input,
    };

    if (input.password) {
      data.password = await bcrypt.hash(input.password, 10);
    }

    if (input.username) {
      // Check if username already exists for this event
      const existingStaff = await prisma.staff.findUnique({
        where: {
          eventId_username: {
            eventId: staff.eventId,
            username: input.username,
          },
        },
      });

      if (existingStaff && existingStaff.id !== id) {
        throw new AppError('Username already taken for this event', 400);
      }
    }

    return prisma.staff.update({
      where: { id },
      data,
      include: {
        event: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  async updateBadgePrint(id: string, input: UpdateBadgePrintInput) {
    return prisma.staff.update({
      where: { id },
      data: {
        badgeId: input.badgeId,
        badgePrintedAt: new Date(),
        badgePrintedBy: input.printedBy,
      },
    });
  },

  async deleteStaff(id: string) {
    return prisma.staff.delete({
      where: { id },
    });
  },

  async validateStaffCredentials(eventId: string, username: string, password: string) {
    const staff = await this.getStaffByUsername(eventId, username);

    if (!staff) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, staff.password);

    if (!isValidPassword) {
      return null;
    }

    return staff;
  },
};
