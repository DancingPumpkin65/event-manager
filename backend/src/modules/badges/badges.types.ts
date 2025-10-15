import { z } from 'zod';

// Validation schemas
export const generateBadgeSchema = z.object({
  participantId: z.string().uuid('Invalid participant ID').optional(),
  staffId: z.string().uuid('Invalid staff ID').optional(),
}).refine(
  data => data.participantId || data.staffId,
  { message: 'Either participantId or staffId must be provided' }
);

export const scanBarcodeSchema = z.object({
  badgeId: z.string().min(1, 'Badge ID is required'),
  eventId: z.string().uuid('Invalid event ID'),
  hallId: z.string().uuid('Invalid hall ID'),
  scannedBy: z.string().min(1, 'Scanned by is required'),
});

export const badgeQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  participantId: z.string().uuid().optional(),
  staffId: z.string().uuid().optional(),
  eventId: z.string().uuid().optional(),
  printed: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  sortBy: z.enum(['createdAt', 'badgePrintedAt']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

// TypeScript types
export type GenerateBadgeDto = z.infer<typeof generateBadgeSchema>;
export type ScanBarcodeDto = z.infer<typeof scanBarcodeSchema>;
export type BadgeQueryDto = z.infer<typeof badgeQuerySchema>;

export interface BadgeResponse {
  id: string;
  badgeId: string | null;
  participantFields?: Record<string, any>;
  staffFields?: Record<string, any>;
  badgePrintedAt: Date | null;
  badgePrintedBy: string | null;
  eventId: string;
  eventName: string;
  type: 'participant' | 'staff';
}

export interface BadgeListResponse {
  badges: BadgeResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
