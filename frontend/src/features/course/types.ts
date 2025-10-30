/**
 * Course feature types
 */

export interface CreateCourseInput {
  eventId: string;
  courseFields: Record<string, any>;
  startDate: Date;
  endDate: Date;
  hallIds?: string[];
  requiresRegistration?: boolean;
}

export interface UpdateCourseInput {
  id: string;
  startDate?: Date | string;
  endDate?: Date | string;
  courseFields?: Record<string, any>;
  hallIds?: string[];
  requiresRegistration?: boolean;
}

export interface CourseOutput {
  id: string;
  eventId: string;
  startDate: Date;
  endDate: Date;
  courseFields: Record<string, any>;
  requiresRegistration: boolean;
  halls?: Array<{
    hallId: string;
    hall: {
      id: string;
      hallFields: Record<string, any>;
    };
  }>;
  _count?: {
    attendance: number;
    registrations?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterParticipantInput {
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
    error: string;
  }>;
}
