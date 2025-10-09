import { z } from 'zod';

// Validation schemas
export const createStaffSchema = z.object({
  eventId: z.string().uuid('Invalid event ID'),
  staffFields: z.record(z.string(), z.any()),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const updateStaffSchema = z.object({
  staffFields: z.record(z.string(), z.any()).optional(),
  username: z.string().min(3).optional(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .optional(),
});

export const staffLoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  eventId: z.string().uuid('Invalid event ID'),
});

export const staffQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  eventId: z.string().uuid().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['username', 'createdAt']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  badgePrinted: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
});

export const printStaffBadgeSchema = z.object({
  staffId: z.string().uuid('Invalid staff ID'),
  printedBy: z.string().min(1, 'Printed by is required'),
});

// TypeScript types
export type CreateStaffDto = z.infer<typeof createStaffSchema>;
export type UpdateStaffDto = z.infer<typeof updateStaffSchema>;
export type StaffLoginDto = z.infer<typeof staffLoginSchema>;
export type StaffQueryDto = z.infer<typeof staffQuerySchema>;
export type PrintStaffBadgeDto = z.infer<typeof printStaffBadgeSchema>;

export interface StaffResponse {
  id: string;
  eventId: string;
  staffFields: Record<string, any>;
  username: string;
  badgeId?: string | null;
  badgePrintedAt?: Date | null;
  badgePrintedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  event?: {
    id: string;
    name: string;
  };
}

export interface StaffListResponse {
  staff: StaffResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StaffAuthResponse {
  staff: Omit<StaffResponse, 'password'>;
  accessToken: string;
  event: {
    id: string;
    name: string;
  };
}
