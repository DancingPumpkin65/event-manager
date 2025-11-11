/**
 * Salle (Hall) feature types
 */

export interface CreateSalleInput {
  eventId: string;
  hallFields: Record<string, any>;
}

export interface UpdateSalleInput {
  hallFields?: Record<string, any>;
}

export interface SalleOutput {
  id: string;
  eventId: string;
  hallFields: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    courseHalls: number;
    attendance: number;
  };
}
