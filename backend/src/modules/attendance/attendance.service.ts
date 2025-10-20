import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import {
  CheckInDto,
  CheckOutDto,
  AttendanceQueryDto,
  AttendanceResponse,
  AttendanceListResponse,
  AttendanceStats,
  ScanDto,
} from './attendance.types';

class AttendanceService {
  async scan(data: ScanDto): Promise<{ attendance: AttendanceResponse; message: string; alreadyScanned: boolean }> {
    const { badgeId, eventId, hallId, courseId, scannedByStaffId } = data;

    const participant = await prisma.participant.findUnique({
      where: { badgeId },
    });

    if (!participant || participant.eventId !== eventId) {
      if (participant) {
        throw new AppError('Participant not registered for this event', 400);
      }
      throw new AppError('Participant not found', 404);
    }

    // 2. Check for restricted course registration
    if (courseId) {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });

      if (course?.requiresRegistration) {
        const registration = await prisma.courseRegistration.findUnique({
          where: {
            participantId_courseId: {
              participantId: participant.id,
              courseId,
            },
          },
        });

        if (!registration || registration.status !== 'CONFIRMED') {
          throw new AppError('Participant not registered for this restricted course', 400);
        }
      }
    }

    // 3. Check for existing attendance (Immutability Check)
    // We check if an attendance record already exists for this participant + event + course
    // Use findFirst to avoid potential unique constraint naming mismatches
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        participantId: participant.id,
        courseId: courseId
      },
      include: {
        participant: { select: { id: true, participantFields: true } },
        event: { select: { id: true, name: true } },
        hall: { select: { id: true, hallFields: true } },
        course: { select: { id: true, courseFields: true } },
      }
    });

    if (existingAttendance) {
      return {
        attendance: existingAttendance as AttendanceResponse,
        message: 'Already scanned for this course',
        alreadyScanned: true
      };
    }

    const newAttendance = await prisma.attendance.create({
      data: {
        participantId: participant.id,
        eventId,
        hallId: hallId || null,
        courseId: courseId,
        scannedByStaffId: scannedByStaffId || null,
        checkInTime: new Date(),
      },
      include: {
        participant: {
          select: { id: true, participantFields: true }
        },
        event: {
          select: { id: true, name: true }
        },
        hall: {
          select: { id: true, hallFields: true }
        },
        course: {
          select: { id: true, courseFields: true }
        }
      }
    });

    return {
      attendance: newAttendance as AttendanceResponse,
      message: 'Scan successful',
      alreadyScanned: false
    };
  }

  async getAttendances(query: AttendanceQueryDto): Promise<AttendanceListResponse> {
    const {
      page = 1,
      limit = 10,
      eventId,
      participantId,
      sortBy = 'checkInTime',
      order = 'desc',
    } = query;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (eventId) {
      where.eventId = eventId;
    }

    if (participantId) {
      where.participantId = participantId;
    }

    const total = await prisma.attendance.count({ where });
    const attendances = await prisma.attendance.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: order },
      include: {
        participant: {
          select: {
            id: true,
            participantFields: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
          },
        },
        hall: {
          select: {
            id: true,
            hallFields: true,
          },
        },
        course: {
          select: {
            id: true,
            courseFields: true,
          },
        },
      },
    });

    return {
      attendances: attendances as AttendanceResponse[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async checkIn(data: CheckInDto): Promise<AttendanceResponse> {
    const { participantId, eventId, hallId, courseId } = data;

    // Parallelize participant and event verification
    const [participant, event] = await Promise.all([
      prisma.participant.findUnique({
        where: { id: participantId },
      }),
      prisma.event.findUnique({
        where: { id: eventId },
      }),
    ]);

    if (!participant) {
      throw new AppError('Participant not found', 404);
    }

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    // Check if participant is registered for this event
    if (participant.eventId !== eventId) {
      throw new AppError('Participant is not registered for this event', 400);
    }

    // Check if attendance record already exists
    let attendance = await prisma.attendance.findFirst({
      where: {
        participantId,
        eventId,
      },
    });

    if (attendance) {
      if (attendance.checkInTime) {
        throw new AppError('Participant already checked in', 400);
      }

      // Update existing record with check-in time
      attendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          checkInTime: new Date(),
          hallId: hallId || null,
          courseId: courseId || null,
        },
        include: {
          participant: {
            select: {
              id: true,
              participantFields: true,
            },
          },
          event: {
            select: {
              id: true,
              name: true,
            },
          },
          hall: {
            select: {
              id: true,
              hallFields: true,
            },
          },
          course: {
            select: {
              id: true,
              courseFields: true,
            },
          },
        },
      });
    } else {
      // Create new attendance record
      attendance = await prisma.attendance.create({
        data: {
          participantId,
          eventId,
          hallId: hallId || null,
          courseId: courseId || null,
          checkInTime: new Date(),
        },
        include: {
          participant: {
            select: {
              id: true,
              participantFields: true,
            },
          },
          event: {
            select: {
              id: true,
              name: true,
            },
          },
          hall: {
            select: {
              id: true,
              hallFields: true,
            },
          },
          course: {
            select: {
              id: true,
              courseFields: true,
            },
          },
        },
      });
    }

    return attendance as AttendanceResponse;
  }

  async checkOut(data: CheckOutDto): Promise<AttendanceResponse> {
    const { participantId, eventId } = data;

    // Find attendance record
    const attendance = await prisma.attendance.findFirst({
      where: {
        participantId,
        eventId,
      },
    });

    if (!attendance) {
      throw new AppError('Attendance record not found. Participant must check in first.', 404);
    }

    if (!attendance.checkInTime) {
      throw new AppError('Participant must check in before checking out', 400);
    }

    if (attendance.checkOutTime) {
      throw new AppError('Participant already checked out', 400);
    }

    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: { checkOutTime: new Date() },
      include: {
        participant: {
          select: {
            id: true,
            participantFields: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
          },
        },
        hall: {
          select: {
            id: true,
            hallFields: true,
          },
        },
        course: {
          select: {
            id: true,
            courseFields: true,
          },
        },
      },
    });

    return updatedAttendance as AttendanceResponse;
  }

  async getEventStats(eventId: string): Promise<AttendanceStats> {
    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    const totalRegistered = await prisma.participant.count({
      where: { eventId },
    });

    const totalStaff = await prisma.staff.count({
      where: { eventId },
    });

    const badgesPrinted = await prisma.participant.count({
      where: {
        eventId,
        badgePrintedAt: { not: null }
      },
    });

    const badgesNotPrinted = await prisma.participant.count({
      where: {
        eventId,
        badgePrintedAt: null
      },
    });

    // Get distinct values for badge types for printed badges
    const printedParticipants = await prisma.participant.findMany({
      where: {
        eventId,
        badgePrintedAt: { not: null },
      },
      select: {
        participantFields: true,
      },
    });

    const badgesPrintedByType: Record<string, number> = {};
    printedParticipants.forEach((p) => {
      const fields = p.participantFields as Record<string, any>;
      // Try to find a field resembling "Type Badge"
      const typeKey = Object.keys(fields).find(k => k.toLowerCase().includes('type') && k.toLowerCase().includes('badge')) || 'Unknown';
      const typeValue = fields[typeKey] ? String(fields[typeKey]).trim() : 'Unknown';

      badgesPrintedByType[typeValue] = (badgesPrintedByType[typeValue] || 0) + 1;
    });

    // Get Course Stats with details
    const courses = await prisma.course.findMany({
      where: { eventId },
      include: {
        halls: {
          include: {
            hall: { select: { hallFields: true } }
          }
        },
        _count: {
          select: { attendance: true }
        }
      },
      orderBy: { startDate: 'asc' } // Detailed list usually ordered by time
    });

    const courseStats = courses.map(course => {
      const fields = (course.courseFields as any) || {};
      const title = fields.title || 'Untitled Course';
      const assignedHalls = course.halls.map(ch => (ch.hall.hallFields as any)?.name || 'Unknown Hall');

      // Extract detailed fields if they exist in schema or are standardized
      // Usually startDate/endDate are top-level columns in Prisma schema
      const startTime = course.startDate;
      const endTime = course.endDate;
      const sessionType = fields.sessionType || fields['Type session'] || 'Unknown';
      const programNum = fields.programNum || fields['Num Prog'] || '';

      return {
        id: course.id,
        title,
        assignedHalls,
        attendeeCount: course._count.attendance,
        startTime,
        endTime,
        sessionType,
        programNum,
        hallName: assignedHalls[0] || 'Unknown Hall'
      };
    });

    const checkedIn = await prisma.attendance.count({
      where: {
        eventId,
      },
    });

    const checkedOut = await prisma.attendance.count({
      where: {
        eventId,
        checkOutTime: { not: null },
      },
    });

    const notCheckedIn = totalRegistered - checkedIn;
    const attendanceRate = totalRegistered > 0 ? (checkedIn / totalRegistered) * 100 : 0;

    return {
      totalRegistered,
      totalStaff,
      badgesPrinted,
      badgesNotPrinted,
      badgesPrintedByType, // Add calculated breakdown
      checkedIn,
      checkedOut,
      notCheckedIn,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
      courseStats,
    };
  }
}

export const attendanceService = new AttendanceService();
