import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import {
  CreateCourseDto,
  UpdateCourseDto,
  CourseQueryDto,
  CourseResponse,
  CourseListResponse,
  BulkRegistrationResult
} from './courses.types';
import * as XLSX from 'xlsx';

class CoursesService {
  async getCourses(query: CourseQueryDto): Promise<CourseListResponse> {
    const {
      page = 1,
      limit = 10,
      eventId,
      sortBy = 'startDate',
      order = 'asc',
    } = query;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (eventId) {
      where.eventId = eventId;
    }

    // Note: search on JSON fields is limited in Prisma
    // For now, we filter by eventId only

    const total = await prisma.course.count({ where });
    const courses = await prisma.course.findMany({
      where,
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

    return {
      courses: courses as CourseResponse[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getCourseById(id: string): Promise<CourseResponse> {
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            name: true,
          },
        },
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

    if (!course) {
      throw new AppError('Course not found', 404);
    }

    return course as CourseResponse;
  }

  async createCourse(data: CreateCourseDto): Promise<CourseResponse> {
    const { eventId, startDate, endDate, courseFields, hallIds } = data;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    const course = await prisma.course.create({
      data: {
        eventId,
        startDate,
        endDate,
        courseFields: courseFields || undefined,
        requiresRegistration: data.requiresRegistration ?? false,
        halls: hallIds
          ? {
            create: hallIds.map((hallId) => ({ hallId })),
          }
          : undefined,
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
          },
        },
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

    return course as CourseResponse;
  }

  async updateCourse(id: string, data: UpdateCourseDto): Promise<CourseResponse> {
    const { hallIds, ...updateData } = data;

    const course = await prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      throw new AppError('Course not found', 404);
    }

    // If hallIds are provided, update hall associations
    if (hallIds !== undefined) {
      // Delete existing halls
      await prisma.courseHall.deleteMany({
        where: { courseId: id },
      });

      // Create new halls
      if (hallIds.length > 0) {
        await prisma.courseHall.createMany({
          data: hallIds.map((hallId) => ({
            courseId: id,
            hallId,
          })),
        });
      }
    }

    // Update course
    const updated = await prisma.course.update({
      where: { id },
      data: updateData,
      include: {
        event: {
          select: {
            id: true,
            name: true,
          },
        },
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

    return updated as CourseResponse;
  }

  async deleteCourse(id: string): Promise<void> {
    const course = await prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      throw new AppError('Course not found', 404);
    }

    await prisma.course.delete({
      where: { id },
    });
  }

  async registerParticipant(courseId: string, participantId: string): Promise<void> {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new AppError('Course not found', 404);
    }

    if (!course.requiresRegistration) {
      // If course does not require registration, do nothing or explicitly allow
      return;
    }

    // Check if duplicate
    const existing = await prisma.courseRegistration.findUnique({
      where: {
        participantId_courseId: {
          participantId,
          courseId,
        },
      },
    });

    if (existing) {
      throw new AppError('Participant already registered for this course', 409);
    }

    await prisma.courseRegistration.create({
      data: {
        participantId,
        courseId,
        status: 'CONFIRMED',
      },
    });
  }

  async processBulkRegistration(courseId: string, buffer: Buffer): Promise<BulkRegistrationResult> {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { event: true },
    });

    if (!course) {
      throw new AppError('Course not found', 404);
    }

    // 1. Parse Excel
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<any>(sheet);

    // 2. Get all participants for this event to match against
    const participants = await prisma.participant.findMany({
      where: { eventId: course.eventId },
      select: { id: true, participantFields: true },
    });

    const result: BulkRegistrationResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    // Helper map for fast lookup
    const emailMap = new Map<string, string>();
    const nameMap = new Map<string, string>(); // nom_prenom -> id

    // Identify Schema-based keys for Nom/Prenom
    const eventParticipantFields = (course.event.participantFields as any[]) || [];
    const nomFieldDef = eventParticipantFields.find(f => ['nom', 'lastname', 'last name'].includes(f.label.toLowerCase()));
    const prenomFieldDef = eventParticipantFields.find(f => ['prenom', 'firstname', 'first name'].includes(f.label.toLowerCase()));

    participants.forEach((p) => {
      const fields = p.participantFields as any;
      const email = fields?.email;
      if (email) {
        emailMap.set(String(email).toLowerCase(), p.id);
      }

      // Get values based on Schema Definition (or fallback)
      let nomVal = nomFieldDef ? fields[nomFieldDef.name] : (fields.nom || fields.lastName || fields.lastname);
      let prenomVal = prenomFieldDef ? fields[prenomFieldDef.name] : (fields.prenom || fields.firstName || fields.firstname);

      // Special fallback if schema missing
      if (!nomVal && !prenomVal && !eventParticipantFields.length) {
        nomVal = fields.lastName;
        prenomVal = fields.firstName;
      }

      if (nomVal && prenomVal) {
        const key = `${String(nomVal).trim().toLowerCase()}_${String(prenomVal).trim().toLowerCase()}`;
        nameMap.set(key, p.id);
      }
    });

    // 3. Process rows
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // Assuming header at row 1

      // Try to find email field
      const emailObj = Object.entries(row).find(([k]) => k.toLowerCase() === 'email');
      const email = emailObj ? String(emailObj[1]) : null;

      let participantId: string | undefined;

      if (email) {
        participantId = emailMap.get(email.toLowerCase());
      }

      if (!participantId) {
        // Match by "Nom" + "Prenom" columns
        const nomColKey = Object.keys(row).find(k => ['nom', 'lastname', 'last name'].includes(k.toLowerCase()));
        const prenomColKey = Object.keys(row).find(k => ['prenom', 'firstname', 'first name'].includes(k.toLowerCase()));
        const fullNameKey = Object.keys(row).find(k => ['fullname', 'full name', 'nom complet'].includes(k.toLowerCase()));

        if (nomColKey && prenomColKey) {
          const nomVal = String(row[nomColKey]).trim().toLowerCase();
          const prenomVal = String(row[prenomColKey]).trim().toLowerCase();
          const key = `${nomVal}_${prenomVal}`;
          participantId = nameMap.get(key);
        } else if (fullNameKey) {
          // fullName logic ...
          const fullName = String(row[fullNameKey]).trim().toLowerCase();
          for (const [key, id] of nameMap.entries()) {
            const [mapNom, mapPrenom] = key.split('_');
            // Check inclusion
            if (fullName.includes(mapNom) && fullName.includes(mapPrenom)) {
              participantId = id;
              break;
            }
          }
        }
      }

      // If still no participantId, we need to create one, but we need at least some identifier
      if (!email && !participantId) {
        const nomColKey = Object.keys(row).find(k => ['nom', 'lastname', 'last name'].includes(k.toLowerCase()));
        const prenomColKey = Object.keys(row).find(k => ['prenom', 'firstname', 'first name'].includes(k.toLowerCase()));
        const fullNameKey = Object.keys(row).find(k => ['fullname', 'full name', 'nom complet'].includes(k.toLowerCase()));

        if ((!nomColKey || !prenomColKey) && !fullNameKey) {
          result.failed++;
          result.errors.push({ row: rowNumber, email: email || 'N/A', error: 'Missing Email, Name (Nom/Prenom), or Full Name fields' });
          continue;
        }
      }

      if (!participantId) {
        // Auto-create participant if not found
        try {
          const participantFieldsData: Record<string, any> = {};
          const eventParticipantFields = (course.event.participantFields as any[]) || [];

          // Map Excel headers (Label) to Field Keys (Name) using the event configuration
          if (Array.isArray(eventParticipantFields) && eventParticipantFields.length > 0) {
            eventParticipantFields.forEach((field: any) => {
              // Try to find the value in the row using the label
              let value = row[field.label];

              // Fallback: Check case-insensitive if direct match fails
              if (value === undefined) {
                const rowKey = Object.keys(row).find(k => k.toLowerCase() === field.label.toLowerCase());
                if (rowKey) value = row[rowKey];
              }

              if (value !== undefined && value !== null && value !== '') {
                participantFieldsData[field.name] = value;
              }
            });
          } else {
            // Fallback if no fields defined: use raw keys
            Object.entries(row).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                participantFieldsData[key] = value;
              }
            });
          }

          // Handle Full Name splitting if separate fields missing
          const fullNameKey = Object.keys(row).find(k => ['fullname', 'full name', 'nom complet'].includes(k.toLowerCase()));
          if (fullNameKey && (!participantFieldsData['firstName'] || !participantFieldsData['lastName'])) {
            const parts = String(row[fullNameKey]).trim().split(' ');
            if (parts.length >= 2) {
              const lastName = parts.pop(); // Assume last part is last name
              const firstName = parts.join(' ');
              // Use standardized keys if not mapped differently
              if (!participantFieldsData['firstName']) participantFieldsData['firstName'] = firstName;
              if (!participantFieldsData['lastName']) participantFieldsData['lastName'] = lastName;
              // Also try 'nom' / 'prenom' keys if schema uses those
              if (!participantFieldsData['prenom']) participantFieldsData['prenom'] = firstName;
              if (!participantFieldsData['nom']) participantFieldsData['nom'] = lastName;
            }
          }

          // Ensure email is set cleanly if not already mapped
          if (!participantFieldsData['email'] && email) {
            participantFieldsData['email'] = email;
          }

          const newParticipant = await prisma.participant.create({
            data: {
              eventId: course.eventId,
              participantFields: participantFieldsData,
              status: 'PENDING',
            },
          });

          participantId = newParticipant.id;
          if (email) {
            emailMap.set(email.toLowerCase(), participantId); // Add to map for subsequent rows
          }
        } catch (err) {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            email: email || 'N/A',
            error: `Failed to create new participant: ${err instanceof Error ? err.message : 'Unknown error'}`
          });
          continue;
        }
      }

      try {
        // Check existence
        const existing = await prisma.courseRegistration.findUnique({
          where: {
            participantId_courseId: {
              participantId,
              courseId,
            },
          },
        });

        if (existing) {
          result.success++;
          continue;
        }

        await prisma.courseRegistration.create({
          data: {
            participantId,
            courseId,
            status: 'CONFIRMED',
          },
        });

        result.success++;
      } catch (err) {
        result.failed++;
        result.errors.push({
          row: rowNumber,
          email: email || 'N/A',
          error: err instanceof Error ? err.message : 'Database error'
        });
      }
    }

    return result;
  }
}

export const coursesService = new CoursesService();
