import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import {
  CreateParticipantDto,
  UpdateParticipantDto,
  ParticipantQueryDto,
  BulkParticipantDto,
  ParticipantResponse,
  ParticipantListResponse,
  BulkUploadResult,
} from './participants.types';

class ParticipantsService {
  /**
   * Get all participants with filtering, pagination, and sorting
   * Uses PostgreSQL JSON text search for efficient database-level filtering
   */
  async getParticipants(query: ParticipantQueryDto): Promise<ParticipantListResponse> {
    const {
      page = 1,
      limit = 10,
      eventId,
      status,
      search,
      sortBy = 'createdAt',
      order = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (eventId) {
      where.eventId = eventId;
    }

    if (status) {
      where.status = status;
    }

    // Use PostgreSQL JSON text search for efficient filtering
    if (search) {
      const searchLower = search.toLowerCase();
      const searchPattern = `%${searchLower}%`;
      
      // Build dynamic WHERE conditions for raw query
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (eventId) {
        conditions.push(`"eventId" = $${paramIndex}`);
        params.push(eventId);
        paramIndex++;
      }

      if (status) {
        conditions.push(`status = $${paramIndex}::"RegistrationStatus"`);
        params.push(status);
        paramIndex++;
      }

      // Add JSON text search condition
      conditions.push(`LOWER("participantFields"::text) LIKE $${paramIndex}`);
      params.push(searchPattern);
      paramIndex++;

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Count total matching records
      const countResult = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
        `SELECT COUNT(*) as count FROM participants ${whereClause}`,
        ...params
      );
      const total = Number(countResult[0]?.count || 0);

      // Fetch paginated results with event join
      params.push(limit, skip);
      const participants = await prisma.$queryRawUnsafe<any[]>(
        `SELECT 
          p.id, p."eventId", p."participantFields", p.status, 
          p."badgeId", p."badgePrintedAt", p."badgePrintedBy",
          p."createdAt", p."updatedAt",
          json_build_object(
            'id', e.id,
            'name', e.name,
            'startDate', e."startDate",
            'endDate', e."endDate"
          ) as event
        FROM participants p
        LEFT JOIN events e ON p."eventId" = e.id
        ${whereClause.replace(/participants/g, 'p').replace(/"eventId"/g, 'p."eventId"').replace(/"participantFields"/g, 'p."participantFields"').replace(/status/g, 'p.status')}
        ORDER BY p."createdAt" ${order === 'asc' ? 'ASC' : 'DESC'}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        ...params
      );

      return {
        participants: participants as ParticipantResponse[],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }

    // No search - use efficient Prisma pagination with parallel queries
    const [total, participants] = await Promise.all([
      prisma.participant.count({ where }),
      prisma.participant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
        include: {
          event: {
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
            },
          },
        },
      }),
    ]);

    return {
      participants: participants as ParticipantResponse[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get participants for a specific event
   */
  async getEventParticipants(eventId: string): Promise<ParticipantResponse[]> {
    // Parallelize event check and participants fetch
    const [event, participants] = await Promise.all([
      prisma.event.findUnique({
        where: { id: eventId },
      }),
      prisma.participant.findMany({
        where: { eventId },
        include: {
          event: {
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    return participants as ParticipantResponse[];
  }

  /**
   * Get single participant by ID
   */
  async getParticipantById(id: string): Promise<ParticipantResponse> {
    const participant = await prisma.participant.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    if (!participant) {
      throw new AppError('Participant not found', 404);
    }

    return participant as ParticipantResponse;
  }

  /**
   * Create new participant
   */
  async createParticipant(data: CreateParticipantDto): Promise<ParticipantResponse> {
    const { eventId, participantFields, status } = data;

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    // Create participant
    const participant = await prisma.participant.create({
      data: {
        eventId,
        participantFields: participantFields as any,
        status: status || 'PENDING' as any,
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

    return participant as ParticipantResponse;
  }

  /**
   * Bulk create participants from Excel import
   */
  async bulkCreateParticipants(data: BulkParticipantDto): Promise<BulkUploadResult> {
    const { eventId, participants: participantsData } = data;

    // Parallelize event check and existing participants fetch
    const [event, existingParticipants] = await Promise.all([
      prisma.event.findUnique({
        where: { id: eventId },
      }),
      prisma.participant.findMany({
        where: { eventId },
        select: { id: true, participantFields: true },
      }),
    ]);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    const result: BulkUploadResult = {
      success: 0,
      failed: 0,
      errors: [],
      participants: [],
    };

    // Extract emails and names from existing participants
    const existingEmails = new Set<string>();
    const existingNames = new Set<string>(); // nom_prenom

    const eventParticipantFields = (event.participantFields as any[]) || [];
    const nomFieldDef = eventParticipantFields.find(f => ['nom', 'lastname', 'last name'].includes(f.label.toLowerCase()));
    const prenomFieldDef = eventParticipantFields.find(f => ['prenom', 'firstname', 'first name'].includes(f.label.toLowerCase()));

    existingParticipants.forEach((p) => {
      const fields = p.participantFields as Record<string, any>;
      if (fields?.email) existingEmails.add(String(fields.email).toLowerCase());

      // Build name key
      let nomVal = nomFieldDef ? fields[nomFieldDef.name] : (fields.nom || fields.lastName || fields.lastname);
      let prenomVal = prenomFieldDef ? fields[prenomFieldDef.name] : (fields.prenom || fields.firstName || fields.firstname);

      // Fallback if schema empty
      if (!nomVal && !prenomVal && !eventParticipantFields.length) {
        nomVal = fields.lastName;
        prenomVal = fields.firstName;
      }

      if (nomVal && prenomVal) {
        const key = `${String(nomVal).trim().toLowerCase()}_${String(prenomVal).trim().toLowerCase()}`;
        existingNames.add(key);
      }
    });

    // Get current participant count
    let participantCount = existingParticipants.length;

    // Process each participant
    for (let i = 0; i < participantsData.length; i++) {
      const participantData = participantsData[i];
      const rowNumber = i + 2; // Excel row (assuming header in row 1)

      try {
        const fields = participantData.participantFields as Record<string, any>;

        // Check for duplicate email
        const emailToCheck = fields?.email;
        if (emailToCheck && existingEmails.has(String(emailToCheck).toLowerCase())) {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            email: emailToCheck,
            error: 'Email already registered for this event',
          });
          continue;
        }

        // Check for duplicate Name
        let nomVal = nomFieldDef ? fields[nomFieldDef.name] : (fields.nom || fields.lastName || fields.lastname);
        let prenomVal = prenomFieldDef ? fields[prenomFieldDef.name] : (fields.prenom || fields.firstName || fields.firstname);

        // Fallback for input data
        if (!nomVal && !prenomVal && !eventParticipantFields.length) {
          nomVal = fields.lastName;
          prenomVal = fields.firstName;
        }

        if (nomVal && prenomVal) {
          const key = `${String(nomVal).trim().toLowerCase()}_${String(prenomVal).trim().toLowerCase()}`;
          if (existingNames.has(key)) {
            result.failed++;
            result.errors.push({
              row: rowNumber,
              email: emailToCheck || 'N/A',
              error: `Participant already exists: ${nomVal} ${prenomVal}`,
            });
            continue;
          }
          // Add to set to prevent duplicates within the batch
          existingNames.add(key);
        }

        // Create participant
        const participant = await prisma.participant.create({
          data: {
            eventId,
            participantFields: participantData.participantFields as any,
            status: 'PENDING' as any,
          },
          include: {
            event: {
              select: {
                id: true,
                name: true,
                startDate: true,
                endDate: true,
              },
            },
          },
        });

        result.success++;
        result.participants.push(participant as ParticipantResponse);
        if (emailToCheck) {
          existingEmails.add(emailToCheck.toLowerCase());
        }
        participantCount++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          row: rowNumber,
          email: participantData.participantFields?.email || 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return result;
  }

  /**
   * Update existing participant
   */
  async updateParticipant(
    id: string,
    data: UpdateParticipantDto
  ): Promise<ParticipantResponse> {
    // Check if participant exists
    const existingParticipant = await prisma.participant.findUnique({
      where: { id },
    });

    if (!existingParticipant) {
      throw new AppError('Participant not found', 404);
    }

    // Note: Email uniqueness checking would require querying all participants
    // and checking participantFields JSON, which is not efficient

    // Update participant
    const participant = await prisma.participant.update({
      where: { id },
      data,
      include: {
        event: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    return participant as ParticipantResponse;
  }

  /**
   * Update participant photo (stored in dynamicFields)
   */
  async updateParticipantPhoto(id: string, photoPath: string): Promise<ParticipantResponse> {
    const participant = await prisma.participant.findUnique({
      where: { id },
    });

    if (!participant) {
      throw new AppError('Participant not found', 404);
    }

    const participantFields = (participant.participantFields as Record<string, any>) || {};
    participantFields.photo = photoPath;

    const updatedParticipant = await prisma.participant.update({
      where: { id },
      data: { participantFields: participantFields as any },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    return updatedParticipant as ParticipantResponse;
  }

  /**
   * Delete participant
   */
  async deleteParticipant(id: string): Promise<void> {
    const participant = await prisma.participant.findUnique({
      where: { id },
    });

    if (!participant) {
      throw new AppError('Participant not found', 404);
    }

    await prisma.participant.delete({
      where: { id },
    });
  }
  /**
   * Update badge print information
   */
  async updateBadgePrint(
    id: string,
    printedBy: string,
    badgeId?: string
  ): Promise<ParticipantResponse> {
    const participant = await prisma.participant.findUnique({
      where: { id },
    });

    if (!participant) {
      throw new AppError('Participant not found', 404);
    }

    const updated = await prisma.participant.update({
      where: { id },
      data: {
        badgeId: badgeId || undefined,
        badgePrintedAt: new Date(),
        badgePrintedBy: printedBy,
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    return updated as ParticipantResponse;
  }

  /**
   * Find participant by barcode/ID and event
   * Uses PostgreSQL JSON search to avoid loading all participants into memory
   */
  async findByBarcodeAndEvent(
    barcode: string,
    eventId: string
  ): Promise<ParticipantResponse | null> {
    // First try to find by ID or badgeId (indexed lookups)
    let participant = await prisma.participant.findFirst({
      where: {
        eventId: eventId,
        OR: [
          { id: barcode },
          { badgeId: barcode },
        ],
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    // If not found by ID/badgeId, use PostgreSQL JSON search at database level
    // This avoids loading all participants into memory
    if (!participant) {
      const barcodeLower = barcode.toLowerCase();
      
      // Use PostgreSQL JSON text search - searches if barcode value exists in JSON
      const participants = await prisma.$queryRawUnsafe<any[]>(
        `SELECT 
          p.id, p."eventId", p."participantFields", p.status, 
          p."badgeId", p."badgePrintedAt", p."badgePrintedBy",
          p."createdAt", p."updatedAt",
          json_build_object(
            'id', e.id,
            'name', e.name,
            'startDate', e."startDate",
            'endDate', e."endDate"
          ) as event
        FROM participants p
        LEFT JOIN events e ON p."eventId" = e.id
        WHERE p."eventId" = $1
        AND LOWER(p."participantFields"::text) LIKE $2
        LIMIT 1`,
        eventId,
        `%${barcodeLower}%`
      );

      participant = participants[0] || null;
    }

    return participant as ParticipantResponse | null;
  }
}

export const participantsService = new ParticipantsService();
