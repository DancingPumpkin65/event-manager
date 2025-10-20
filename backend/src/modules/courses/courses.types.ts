import { z } from 'zod';

// Validation schemas
export const createCourseSchema = z.object({
  eventId: z.string().uuid('Invalid event ID'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  courseFields: z.record(z.string(), z.any()).optional(),
  hallIds: z.array(z.string().uuid()).optional(),
  requiresRegistration: z.boolean().optional(),
});

export const updateCourseSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  courseFields: z.record(z.string(), z.any()).optional(),
  hallIds: z.array(z.string().uuid()).optional(),
  requiresRegistration: z.boolean().optional(),
});

export const courseQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  eventId: z.string().uuid().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['startDate', 'createdAt']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

// TypeScript types
export type CourseQueryDto = z.infer<typeof courseQuerySchema>;

export interface CreateCourseDto {
  eventId: string;
  startDate: Date;
  endDate: Date;
  courseFields?: Record<string, any>;
  hallIds?: string[];
  requiresRegistration?: boolean;
}

export interface UpdateCourseDto {
  startDate?: Date;
  endDate?: Date;
  courseFields?: Record<string, any>;
  hallIds?: string[];
  requiresRegistration?: boolean;
}

export interface CourseRegistrationDto {
  participantId: string;
  courseId: string;
}

export interface CourseRegistrationResponse {
  id: string;
  participantId: string;
  courseId: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
}

export interface BulkRegistrationResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    email: string;
    error: string; // Failure reason
  }>;
}

export interface CourseResponse {
  id: string;
  eventId: string;
  courseFields?: Record<string, any> | null;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
  event?: {
    id: string;
    name: string;
  };
  halls?: {
    id: string;
    hall: {
      id: string;
      hallFields?: Record<string, any> | null;
    };
  }[];
  _count?: {
    attendance: number;
  };
}

export interface CourseListResponse {
  courses: CourseResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
