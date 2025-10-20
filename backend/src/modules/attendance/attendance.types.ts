import { z } from 'zod';

// Validation schemas
export const checkInSchema = z.object({
  participantId: z.string().uuid('Invalid participant ID'),
  eventId: z.string().uuid('Invalid event ID'),
  hallId: z.string().uuid('Invalid hall ID').optional(),
  courseId: z.string().uuid('Invalid course ID').optional(),
});

export const checkOutSchema = z.object({
  participantId: z.string().uuid('Invalid participant ID'),
  eventId: z.string().uuid('Invalid event ID'),
});

export const attendanceQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  eventId: z.string().uuid().optional(),
  participantId: z.string().uuid().optional(),
  sortBy: z.enum(['checkInTime', 'createdAt']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

export const scanSchema = z.object({
  badgeId: z.string().min(1, 'Badge ID is required'),
  eventId: z.string().uuid('Invalid event ID'),
  hallId: z.string().uuid('Invalid hall ID').optional(),
  courseId: z.string().uuid('Course ID is required'),
  scannedByStaffId: z.string().uuid('Invalid staff ID').optional(),
});

// TypeScript types
export type CheckInDto = z.infer<typeof checkInSchema>;
export type CheckOutDto = z.infer<typeof checkOutSchema>;
export type AttendanceQueryDto = z.infer<typeof attendanceQuerySchema>;
export type ScanDto = z.infer<typeof scanSchema>;

export interface AttendanceResponse {
  id: string;
  participantId: string;
  eventId: string;
  hallId?: string | null;
  courseId?: string | null;
  checkInTime?: Date | null;
  checkOutTime?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  participant?: {
    id: string;
    participantFields: Record<string, any>;
  };
  event?: {
    id: string;
    name: string;
  };
  hall?: {
    id: string;
    name: string;
  } | null;
  course?: {
    id: string;
    name: string;
  } | null;
}

export interface AttendanceListResponse {
  attendances: AttendanceResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CourseAttendanceStat {
  id: string;
  title: string;
  assignedHalls: string[];
  attendeeCount: number;
  // Extended fields
  startTime?: Date;
  endTime?: Date;
  sessionType?: string;
  programNum?: string; // e.g. "2"
  hallName?: string; // Primary hall
}

export interface AttendanceStats {
  totalRegistered: number;
  totalStaff: number;
  badgesPrinted: number;
  badgesNotPrinted: number;
  badgesPrintedByType: Record<string, number>; // New: Group by type
  checkedIn: number;
  checkedOut: number;
  notCheckedIn: number;
  attendanceRate: number;
  courseStats: CourseAttendanceStat[];
}
