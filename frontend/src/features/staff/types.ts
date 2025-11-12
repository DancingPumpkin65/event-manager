export interface Staff {
  id: string;
  eventId: string;
  username: string;
  staffFields: Record<string, any>;
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

export interface CreateStaffInput {
  eventId: string;
  staffFields: Record<string, any>;
  username: string;
  password: string;
}

export interface UpdateStaffInput {
  staffFields?: Record<string, any>;
  username?: string;
  password?: string;
}

export interface UpdateBadgePrintInput {
  badgeId: string;
  printedBy: string;
}

export interface StaffLoginInput {
  username: string;
  password: string;
  eventId: string;
}

export interface StaffLoginResponse {
  accessToken: string;
  staff: Omit<Staff, 'password'>;
  event: {
    id: string;
    name: string;
  };
}

export interface StaffListResponse {
  staff: Staff[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
