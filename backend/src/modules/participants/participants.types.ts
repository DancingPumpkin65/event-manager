import { z } from 'zod';
import { RegistrationStatus } from '@prisma/client';

// Validation schemas
export const createParticipantSchema = z.object({
  eventId: z.string().uuid('Invalid event ID'),
  participantFields: z.record(z.string(), z.any()),
  status: z.nativeEnum(RegistrationStatus).optional(),
});

export const updateParticipantSchema = z.object({
  participantFields: z.record(z.string(), z.any()).optional(),
  status: z.nativeEnum(RegistrationStatus).optional(),
});

export const participantQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  eventId: z.string().uuid().optional(),
  status: z.nativeEnum(RegistrationStatus).optional(),
  search: z.string().optional(),
  badgePrinted: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  sortBy: z.enum(['createdAt', 'status']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

export const bulkParticipantSchema = z.object({
  eventId: z.string().uuid('Invalid event ID'),
  participants: z.array(
    z.object({
      participantFields: z.record(z.string(), z.any()),
    })
  ).min(1, 'At least one participant required'),
});

// TypeScript types
export type CreateParticipantDto = z.infer<typeof createParticipantSchema>;
export type UpdateParticipantDto = z.infer<typeof updateParticipantSchema>;
export type ParticipantQueryDto = z.infer<typeof participantQuerySchema>;
export type BulkParticipantDto = z.infer<typeof bulkParticipantSchema>;

export interface ParticipantResponse {
  id: string;
  eventId: string;
  participantFields: Record<string, any>;
  status: RegistrationStatus;
  badgeId: string | null;
  badgePrintedAt: Date | null;
  badgePrintedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  event?: {
    id: string;
    name: string;
  };
}

export interface ParticipantListResponse {
  participants: ParticipantResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BulkUploadResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    email: string;
    error: string;
  }>;
  participants: ParticipantResponse[];
}
