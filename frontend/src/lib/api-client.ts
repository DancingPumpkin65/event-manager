/**
 * API Client for making authenticated requests to backend server functions
 * Authentication is handled via HttpOnly cookies - no localStorage token storage
 */

import type { LoginInput, LoginOutput, SessionOutput, AdminUser, StaffLoginOutput } from '@/features/auth/types';
import type { CreateEventInput, UpdateEventInput, EventOutput } from '@/features/event/types';
import type { CreateSalleInput, UpdateSalleInput, SalleOutput } from '@/features/salle/types';
import type { CreateParticipantInput, UpdateParticipantInput, ParticipantOutput, FieldValue } from '@/features/participant/types';
import type { CreateCourseInput, CourseOutput, CourseRegistrationResponse } from '@/features/course/types';
import type { CreateBadgeInput, BadgeOutput, ListBadgesFilter } from '@/features/badge/types';
import type { CreateAttendanceInput, AttendanceOutput, ListAttendanceFilter, AttendanceStats } from '@/features/attendance/types';
import type { CreateStaffInput, UpdateStaffInput, UpdateBadgePrintInput, Staff, StaffLoginInput } from '@/features/staff/types';
import { ApiError } from './api-error';
import type { EventStatsResponse, ParticipantListResponse } from '@/features/event-stats/types';



/**
 * Base API client with cookie-based authentication support
 * Tokens are stored in HttpOnly cookies and sent automatically by the browser
 */
class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  }

  /**
   * Clear any legacy localStorage tokens (migration helper)
   */
  clearLegacyTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('staffToken');
    localStorage.removeItem('staffInfo');
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
    retry = true
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        headers,
        credentials: 'include', // Always include cookies
      });

      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401 && retry) {
        try {
          await this.refreshAccessToken();
          // Retry original request with new cookie
          return this.request<T>(path, options, false);
        } catch {
          // Refresh failed, redirect to login
          throw new ApiError('Session expired. Please login again.', 401);
        }
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new ApiError(
          error.message || 'Request failed',
          response.status,
          error
        );
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      return response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      // Network error or other fetch errors
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error',
        0
      );
    }
  }

  private async refreshAccessToken(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Cookie contains refresh token
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }
    // New access token is set as cookie by backend
  }

  // Auth endpoints
  async login(input: LoginInput): Promise<{ user: LoginOutput }> {
    const response = await this.request<{ status: string; data: { admin: LoginOutput } }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      false // Don't retry on 401 for login
    );
    // Clear any legacy tokens
    this.clearLegacyTokens();
    return {
      user: response.data.admin,
    };
  }

  async register(input: { email: string; password: string; firstName: string; lastName: string; username: string }): Promise<{ user: LoginOutput }> {
    const response = await this.request<{ status: string; data: { admin: LoginOutput } }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      false
    );
    // Clear any legacy tokens
    this.clearLegacyTokens();
    return {
      user: response.data.admin,
    };
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      // Clear any legacy tokens
      this.clearLegacyTokens();
    }
  }

  async getSession(): Promise<SessionOutput> {
    try {
      const response = await this.request<{ status: string; data: { user: AdminUser | StaffLoginOutput } }>('/auth/me');
      const user = response.data.user;
      // Robust check for staff user: checks for eventId (always present for staff) or staffFields
      const isStaff = 'eventId' in user || 'staffFields' in user;

      return {
        authenticated: true,
        user: user,
        userType: isStaff ? 'staff' : 'admin',
      };
    } catch (error) {
      // If session check fails, user is not authenticated
      if (error instanceof ApiError && error.statusCode === 401) {
        return {
          authenticated: false,
          user: null,
          userType: null,
        };
      }
      throw error;
    }
  }


  // Event endpoints
  async createEvent(input: CreateEventInput): Promise<EventOutput> {
    const response = await this.request<{ status: string; data: EventOutput }>('/events', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    const event = response.data;
    return {
      ...event,
      participantFields: event.participantFields || [],
    };
  }

  async listEvents(isActive?: boolean, page: number = 1, limit: number = 10): Promise<{ events: EventOutput[]; total: number; totalPages: number; page: number; limit: number }> {
    const params = new URLSearchParams();
    if (isActive !== undefined) params.append('status', isActive ? 'ACTIVE' : 'NOT_ACTIVE');
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    const query = params.toString();
    const response = await this.request<{ status: string; data: { events: EventOutput[]; total: number; page: number; limit: number; totalPages: number } }>(`/events${query ? `?${query}` : ''}`);

    // Fallback if backend doesn't return paginated structure yet (for partial implementation)
    const events = (response.data.events || []).map(event => ({
      ...event,
      participantFields: event.participantFields || [],
    }));

    return {
      events,
      total: response.data.total || events.length,
      totalPages: response.data.totalPages || 1,
      page: response.data.page || page,
      limit: response.data.limit || limit
    };
  }

  async getEvent(eventId: string): Promise<EventOutput> {
    const response = await this.request<{ status: string; data: EventOutput }>(`/events/${eventId}`);
    const event = response.data;
    return {
      ...event,
      participantFields: event.participantFields || [],
    };
  }

  async updateEvent(input: UpdateEventInput): Promise<EventOutput> {
    const { id, ...rest } = input;
    const response = await this.request<{ status: string; data: EventOutput }>(`/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(rest),
    });
    const event = response.data;
    return {
      ...event,
      participantFields: event.participantFields || [],
    };
  }

  async deleteEvent(eventId: string): Promise<{ success: boolean }> {
    await this.request(`/events/${eventId}`, {
      method: 'DELETE',
    });
    return { success: true };
  }

  async getEventStats(eventId: string): Promise<EventStatsResponse> {
    return this.request(`/events/${eventId}/stats`);
  }

  // Salle endpoints
  async createSalle(input: CreateSalleInput): Promise<SalleOutput> {
    const response = await this.request<{ status: string; data: SalleOutput }>('/salles', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return response.data;
  }

  async listSalles(
    page: number = 1,
    limit: number = 10,
    eventId?: string,
    search?: string,
    sortBy?: string,
    order?: 'asc' | 'desc'
  ): Promise<{ salles: SalleOutput[]; total: number; totalPages: number; page: number; limit: number }> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (eventId) params.append('eventId', eventId);
    if (search) params.append('search', search);
    if (sortBy) params.append('sortBy', sortBy);
    if (order) params.append('order', order);

    const response = await this.request<{ status: string; data: { salles: SalleOutput[]; total: number; page: number; limit: number; totalPages: number } }>(`/salles?${params.toString()}`);
    return {
      salles: response.data.salles || [],
      total: response.data.total || (response.data.salles?.length || 0),
      totalPages: response.data.totalPages || 1,
      page: response.data.page || page,
      limit: response.data.limit || limit
    };
  }

  async getSalle(salleId: string): Promise<SalleOutput> {
    const response = await this.request<{ status: string; data: SalleOutput }>(`/salles/${salleId}`);
    return response.data;
  }

  async updateSalle(salleId: string, input: UpdateSalleInput): Promise<SalleOutput> {
    const response = await this.request<{ status: string; data: SalleOutput }>(`/salles/${salleId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    return response.data;
  }

  async deleteSalle(salleId: string): Promise<{ success: boolean }> {
    await this.request(`/salles/${salleId}`, {
      method: 'DELETE',
    });
    return { success: true };
  }

  // Participant endpoints
  async createParticipant(input: CreateParticipantInput): Promise<ParticipantOutput> {
    const response = await this.request<{ status: string; data: ParticipantOutput }>('/participants', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return response.data;
  }

  async listParticipants(
    eventId: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: string,
    badgePrinted?: boolean,
    sortBy?: string,
    order?: 'asc' | 'desc'
  ): Promise<{ participants: ParticipantOutput[]; total: number; totalPages: number; page: number; limit: number }> {
    const params = new URLSearchParams();
    params.append('eventId', eventId);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search', search);
    if (status && status !== 'ALL') params.append('status', status);
    if (badgePrinted !== undefined) params.append('badgePrinted', badgePrinted.toString());
    if (sortBy) params.append('sortBy', sortBy);
    if (order) params.append('order', order);

    const response = await this.request<{ status: string; data: { participants: ParticipantOutput[]; total: number; page: number; limit: number; totalPages: number } }>(`/participants?${params.toString()}`);
    return {
      participants: response.data.participants || [],
      total: response.data.total || (response.data.participants?.length || 0),
      totalPages: response.data.totalPages || 1,
      page: response.data.page || page,
      limit: response.data.limit || limit
    };
  }

  async getParticipant(participantId: string): Promise<ParticipantOutput> {
    const response = await this.request<{ status: string; data: ParticipantOutput }>(`/participants/${participantId}`);
    return response.data;
  }

  async updateParticipant(input: UpdateParticipantInput): Promise<ParticipantOutput> {
    return this.request<ParticipantOutput>(`/participants/${input.id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  }

  async deleteParticipant(participantId: string): Promise<{ success: boolean }> {
    await this.request(`/participants/${participantId}`, {
      method: 'DELETE',
    });
    return { success: true };
  }

  async updateParticipantBadgePrint(participantId: string, printedBy: string, badgeId?: string): Promise<ParticipantOutput> {
    const response = await this.request<{ status: string; data: ParticipantOutput }>(`/participants/${participantId}/badge-print`, {
      method: 'PATCH',
      body: JSON.stringify({ printedBy, badgeId }),
    });
    return response.data || response as any;
  }

  async validateScan(barcode: string, eventId: string): Promise<ParticipantOutput> {
    const response = await this.request<{ status: string; data: ParticipantOutput }>('/participants/validate-scan', {
      method: 'POST',
      body: JSON.stringify({ barcode, eventId }),
    });
    return response.data;
  }

  async bulkCreateParticipants(eventId: string, participants: Array<{ participantFields: Record<string, FieldValue> }>): Promise<{
    success: number;
    failed: number;
    errors: Array<{ row: number; email?: string; error: string }>;
  }> {
    const response = await this.request<{ status: string; data: any; message: string }>('/participants/bulk', {
      method: 'POST',
      body: JSON.stringify({
        eventId,
        participants,
      }),
    });
    return response.data;
  }

  // Course endpoints
  async createCourse(input: CreateCourseInput): Promise<CourseOutput> {
    const response = await this.request<{ status: string; data: CourseOutput }>('/courses', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return response.data;
  }

  async listCourses(
    eventId: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
    sortBy?: string,
    order?: 'asc' | 'desc'
  ): Promise<{ courses: CourseOutput[]; total: number; totalPages: number; page: number; limit: number }> {
    const params = new URLSearchParams();
    params.append('eventId', eventId);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search', search);
    if (sortBy) params.append('sortBy', sortBy);
    if (order) params.append('order', order);

    const response = await this.request<{ status: string; data: { courses: CourseOutput[]; total: number; page: number; limit: number; totalPages: number } }>(`/courses?${params.toString()}`);
    return {
      courses: response.data.courses || [],
      total: response.data.total || (response.data.courses?.length || 0),
      totalPages: response.data.totalPages || 1,
      page: response.data.page || page,
      limit: response.data.limit || limit
    };
  }

  async updateCourse(courseId: string, input: Partial<CreateCourseInput>): Promise<CourseOutput> {
    const response = await this.request<{ status: string; data: CourseOutput }>(`/courses/${courseId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    return response.data;
  }

  async deleteCourse(courseId: string): Promise<{ success: boolean }> {
    await this.request(`/courses/${courseId}`, {
      method: 'DELETE',
    });
    return { success: true };
  }

  async registerParticipant(participantId: string, courseId: string): Promise<CourseRegistrationResponse> {
    return this.request<CourseRegistrationResponse>('/courses/register', {
      method: 'POST',
      body: JSON.stringify({ participantId, courseId }),
    });
  }

  async unregisterParticipant(participantId: string, courseId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/courses/unregister', {
      method: 'POST',
      body: JSON.stringify({ participantId, courseId }),
    });
  }

  async getCourseRegistrations(courseId: string): Promise<ParticipantOutput[]> {
    return this.request<ParticipantOutput[]>(`/courses/${courseId}/registrations`);
  }

  async importCourseRegistrations(courseId: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    // We intentionally do NOT set Content-Type header so browser sets it with boundary
    const response = await fetch(`${this.baseUrl}/courses/${courseId}/registrations/import`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiError(error.message || 'Upload failed', response.status, error);
    }

    const json = await response.json();
    return json.data;
  }

  // Badge operations
  async createBadge(data: CreateBadgeInput): Promise<BadgeOutput> {
    return this.request<BadgeOutput>('/badges/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listBadges(filter?: ListBadgesFilter): Promise<BadgeOutput[]> {
    const params = new URLSearchParams();
    if (filter?.eventId) params.append('eventId', filter.eventId);
    if (filter?.participantId) params.append('participantId', filter.participantId);

    const query = params.toString();
    const response = await this.request<{ badges: BadgeOutput[] }>(`/badges${query ? `?${query}` : ''}`);
    return response.badges || [];
  }

  async getBadge(badgeId: string): Promise<BadgeOutput> {
    return this.request<BadgeOutput>(`/badges/${badgeId}`);
  }

  async getBadgeByBarcode(barcode: string): Promise<BadgeOutput> {
    return this.request<BadgeOutput>(`/badges/barcode/${encodeURIComponent(barcode)}`);
  }

  async markBadgeAsPrinted(badgeId: string): Promise<BadgeOutput> {
    return this.request<BadgeOutput>(`/badges/${badgeId}/print`, {
      method: 'PATCH',
    });
  }

  // Attendance operations
  async createAttendance(data: CreateAttendanceInput): Promise<{ attendance: AttendanceOutput; message: string }> {
    const response = await this.request<{ status: string; data: AttendanceOutput; message: string }>('/attendance/scan', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return { attendance: response.data, message: response.message };
  }


  async listAttendance(filter?: ListAttendanceFilter): Promise<{ attendances: AttendanceOutput[]; total: number; totalPages: number; page: number; limit: number }> {
    const params = new URLSearchParams();
    if (filter?.eventId) params.append('eventId', filter.eventId);
    if (filter?.participantId) params.append('participantId', filter.participantId);
    if (filter?.courseId) params.append('courseId', filter.courseId);
    if (filter?.hallId) params.append('hallId', filter.hallId);
    if (filter?.page) params.append('page', filter.page.toString());
    if (filter?.limit) params.append('limit', filter.limit.toString());
    if (filter?.sortBy) params.append('sortBy', filter.sortBy);
    if (filter?.order) params.append('order', filter.order);

    const query = params.toString();
    const response = await this.request<{ status: string; data: { attendances: AttendanceOutput[]; total: number; page: number; limit: number; totalPages: number } }>(`/attendance${query ? `?${query}` : ''}`);

    return {
      attendances: response.data.attendances || [],
      total: response.data.total || (response.data.attendances?.length || 0),
      totalPages: response.data.totalPages || 1,
      page: response.data.page || (filter?.page || 1),
      limit: response.data.limit || (filter?.limit || 10)
    };
  }

  async getAttendanceStats(eventId: string): Promise<AttendanceStats> {
    const response = await this.request<{ status: string; data: AttendanceStats }>(`/attendance/events/${eventId}/stats`);
    return response.data;
  }

  // Staff operations
  async createStaff(data: CreateStaffInput): Promise<Staff> {
    return this.request<Staff>('/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listStaffForEvent(eventId: string): Promise<Staff[]> {
    return this.request<Staff[]>(`/staff/event/${eventId}`);
  }

  async listStaffWithFilters(eventId: string, filters?: { search?: string; badgePrinted?: boolean; sortBy?: 'username' | 'createdAt'; order?: 'asc' | 'desc' }): Promise<Staff[]> {
    const params = new URLSearchParams({ eventId });
    if (filters?.search) params.append('search', filters.search);
    if (filters?.badgePrinted !== undefined) params.append('badgePrinted', filters.badgePrinted.toString());
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.order) params.append('order', filters.order);
    return this.request<Staff[]>(`/staff?${params.toString()}`);
  }

  async getStaff(staffId: string): Promise<Staff> {
    return this.request<Staff>(`/staff/${staffId}`);
  }

  async updateStaff(staffId: string, data: UpdateStaffInput): Promise<Staff> {
    return this.request<Staff>(`/staff/${staffId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateStaffBadgePrint(staffId: string, data: UpdateBadgePrintInput): Promise<Staff> {
    return this.request<Staff>(`/staff/${staffId}/badge-print`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteStaff(staffId: string): Promise<{ success: boolean }> {
    await this.request(`/staff/${staffId}`, {
      method: 'DELETE',
    });
    return { success: true };
  }

  async staffLogin(data: StaffLoginInput): Promise<{ staff: Staff }> {
    const response = await this.request<{ status: string; data: { staff: Staff } }>('/staff/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }, false);
    // Clear any legacy tokens
    this.clearLegacyTokens();
    return response.data;
  }

  async updateStaffPassword(currentPassword: string, newPassword: string): Promise<{ success: boolean }> {
    await this.request('/staff/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return { success: true };
  }

  // Hall (Salle) operations for events
  async listHallsForEvent(eventId: string): Promise<SalleOutput[]> {
    const response = await this.request<{ status: string; data: SalleOutput[] }>(`/salles/event/${eventId}`);
    return response.data || [];
  }

  async getDashboardStats(): Promise<{
    totalEvents: number;
    activeEvents: number;
    totalParticipants: number;
    totalStaff: number;
    recentEvents: EventOutput[];
  }> {
    const response = await this.request<{ status: string; data: any }>('/admin/dashboard/stats');
    return response.data;
  }

  // ========== EVENT STATS ==========
  async getEventStatsSummary(eventId: string): Promise<{
    totalRegistered: number;
    badgesPrinted: number;
    badgesNotPrinted: number;
    badgesPrintedByType: { type: string; count: number }[];
    coursesWithAttendees: any[];
  }> {
    return this.request<EventStatsResponse>(`/event-stats/${eventId}`);
  }

  async getBadgeList(
    eventId: string,
    status: 'CONFIRMED' | 'PENDING',
    page: number = 1,
    limit: number = 10
  ): Promise<{
    participants: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const params = new URLSearchParams();
    params.append('status', status);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    return this.request<ParticipantListResponse>(`/event-stats/${eventId}/badges?${params.toString()}`);
  }

  async getCoursesWithAttendees(eventId: string): Promise<any[]> {
    return this.request(`/event-stats/${eventId}/courses`);
  }
}

export const apiClient = new ApiClient();
export { ApiError };
