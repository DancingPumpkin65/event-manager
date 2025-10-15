import { z } from 'zod';

// Validation schemas
export const createSalleSchema = z.object({
  eventId: z.string().uuid('Invalid event ID'),
  hallFields: z.record(z.string(), z.any()).optional(),
});

export const updateSalleSchema = z.object({
  eventId: z.string().uuid('Invalid event ID').optional(),
  hallFields: z.record(z.string(), z.any()).optional(),
});

export const salleQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  eventId: z.string().uuid().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

// TypeScript types
export type CreateSalleDto = z.infer<typeof createSalleSchema>;
export type UpdateSalleDto = z.infer<typeof updateSalleSchema>;
export type SalleQueryDto = z.infer<typeof salleQuerySchema>;

export interface SalleResponse {
  id: string;
  eventId: string;
  hallFields?: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
  event?: {
    id: string;
    name: string;
  };
  _count?: {
    courseHalls: number;
    attendance: number;
  };
}

export interface SalleListResponse {
  salles: SalleResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
