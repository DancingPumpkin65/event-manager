// Attendance type definition

export interface AttendanceOutput {
  id: string;
  participantId: string;
  eventId: string;
  hallId?: string | null;
  courseId?: string | null;
  checkInTime?: string;
  checkOutTime?: string | null;
  scannedByStaffId?: string | null;
  createdAt: string;
  updatedAt: string;
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
    hallFields: Record<string, any>;
  } | null;
  course?: {
    id: string;
    courseFields: Record<string, any>;
  } | null;
}

export interface CreateAttendanceInput {
  badgeId: string;
  eventId: string;
  courseId?: string;
  hallId?: string;
}

export interface ListAttendanceFilter {
  eventId?: string;
  participantId?: string;
  courseId?: string;
  hallId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'checkInTime' | 'createdAt';
  order?: 'asc' | 'desc';
}

export interface CourseAttendanceStat {
  id: string;
  title: string;
  assignedHalls: string[];
  attendeeCount: number;
  startTime?: string;
  endTime?: string;
  sessionType?: string;
  programNum?: string;
  hallName?: string;
}

export interface AttendanceStats {
  totalRegistered: number;
  totalStaff: number;
  badgesPrinted: number;
  badgesNotPrinted: number;
  badgesPrintedByType: Record<string, number>;
  checkedIn: number;
  checkedOut: number;
  notCheckedIn: number;
  attendanceRate: number;
  courseStats: CourseAttendanceStat[];
}
