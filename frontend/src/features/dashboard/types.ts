import type { EventOutput } from '@/features/event/types';

export interface DashboardStats {
  totalEvents: number;
  activeEvents: number;
  totalParticipants: number;
  totalStaff: number;
  recentEvents: EventOutput[];
}
