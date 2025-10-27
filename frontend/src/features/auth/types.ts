/**
 * Auth feature types
 */

export interface LoginInput {
  username: string;
  password: string;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}

export interface LoginOutput {
  admin: AdminUser;
  accessToken: string;
  refreshToken: string;
}

// Staff Login
export interface StaffLoginInput {
  username: string;
  password: string;
  eventId: string;
}

export interface StaffLoginOutput {
  id: string;
  username: string;
  eventId: string;
  staffFields: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface SessionOutput {
  authenticated: boolean;
  user: AdminUser | StaffLoginOutput | null;
  userType: 'admin' | 'staff' | null;
}

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthContext {
  accessToken?: string;
  refreshToken?: string;
}

export interface AuthenticatedContext extends AuthContext {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    salleId?: string | null;
  };
}

export type UserRole = 'ADMIN' | 'ORGANIZER' | 'USER';
