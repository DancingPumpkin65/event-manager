import { z } from 'zod';
import { EventStatus } from '@prisma/client';

// Participant field definition schema
const participantFieldSchema = z.object({
  name: z.string().min(1, 'Field name is required'),
  type: z.enum(['text', 'email', 'phone', 'number', 'date', 'select', 'checkbox']),
  label: z.string().min(1, 'Field label is required'),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
});

// Badge layout schemas
const baseElementSchema = {
  id: z.string(),
  x: z.number().min(0),
  y: z.number().min(0),
};

const textElementSchema = z.object({
  ...baseElementSchema,
  type: z.literal("text"),

  content: z.string().optional(),
  fieldMapping: z.string().optional(),

  fontSize: z.number().min(1),
  fontFamily: z.string().default("helvetica"),
  color: z.string().default("#000000"),
  align: z.enum(["left", "center", "right"]).default("left"),
}).refine(
  data => data.content || data.fieldMapping,
  {
    message: "Text element must have content or fieldMapping",
  }
);

const barcodeElementSchema = z.object({
  ...baseElementSchema,
  type: z.literal("barcode"),

  fieldMapping: z.string(),
  width: z.number().min(1),
  height: z.number().min(1),

  displayValue: z.boolean().default(true),
});

const imageElementSchema = z.object({
  ...baseElementSchema,
  type: z.literal("image"),

  src: z.string(),
  width: z.number().min(1),
  height: z.number().min(1),
});

const rectangleElementSchema = z.object({
  ...baseElementSchema,
  type: z.literal("rectangle"),

  width: z.number().min(1),
  height: z.number().min(1),

  backgroundColor: z.string().optional(),
  borderWidth: z.number().min(0).default(0),
  borderColor: z.string().optional(),
});

const badgeElementSchema = z.discriminatedUnion("type", [
  textElementSchema,
  barcodeElementSchema,
  imageElementSchema,
  rectangleElementSchema,
]);

const badgeTemplateSchema = z.object({
  page: z.object({
    width: z.number().min(10),
    height: z.number().min(10),
  }),
  elements: z.array(badgeElementSchema).min(1),
});

// Validation schemas
export const createEventSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  location: z.string().optional(),
  startDate: z.string().datetime('Invalid start date format'),
  endDate: z.string().datetime('Invalid end date format'),
  status: z.nativeEnum(EventStatus).optional(),
  participantFields: z.array(participantFieldSchema).optional().default([]),
  staffFields: z.array(participantFieldSchema).optional().default([]),
  courseFields: z.array(participantFieldSchema).optional().default([]),
  hallFields: z.array(participantFieldSchema).optional().default([]),
  badgeTemplate: badgeTemplateSchema.optional(),
});

export const updateEventSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  location: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.nativeEnum(EventStatus).optional(),
  participantFields: z.array(participantFieldSchema).optional(),
  staffFields: z.array(participantFieldSchema).optional(),
  courseFields: z.array(participantFieldSchema).optional(),
  hallFields: z.array(participantFieldSchema).optional(),
  badgeTemplate: badgeTemplateSchema.optional(),
});

export const eventQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  status: z.nativeEnum(EventStatus).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'startDate', 'endDate', 'status', 'createdAt']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

// TypeScript types
export type CreateEventDto = z.infer<typeof createEventSchema>;
export type UpdateEventDto = z.infer<typeof updateEventSchema>;
export type EventQueryDto = z.infer<typeof eventQuerySchema>;
export type ParticipantField = z.infer<typeof participantFieldSchema>;
export type BadgeElement = z.infer<typeof badgeElementSchema>;
export type BadgeTemplate = z.infer<typeof badgeTemplateSchema>;

export interface EventResponse {
  id: string;
  name: string;
  location?: string | null;
  startDate: Date;
  endDate: Date;
  status: EventStatus;
  participantFields: ParticipantField[];
  staffFields: ParticipantField[];
  courseFields: ParticipantField[];
  hallFields: ParticipantField[];
  badgeTemplate?: BadgeTemplate;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    participants: number;
  };
}

export interface EventListResponse {
  events: EventResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EventStatsResponse {
  totalParticipants: number;
  attendedParticipants: number;
  attendanceRate: number;
  totalCourses: number;
  averageRating?: number;
  badgeStats: {
    participantBadgesPrinted: number;
    participantBadgesNotPrinted: number;
    staffBadgesPrinted: number;
    staffBadgesNotPrinted: number;
  };
  participantsWithBadgesPrinted: Array<{
    id: string;
    participantFields: Record<string, any>;
    badgePrintedAt: Date;
    badgePrintedBy: string;
  }>;
  participantsWithBadgesNotPrinted: Array<{
    id: string;
    participantFields: Record<string, any>;
  }>;
  staffWithBadgesPrinted: Array<{
    id: string;
    staffFields: Record<string, any>;
    username: string;
    badgePrintedAt: Date;
    badgePrintedBy: string | null;
  }>;
  coursesByTimeSlot: Array<{
    id: string;
    name: string;
    courseFields: Record<string, any>;
    startDate: Date;
    endDate: Date;
    halls: Array<{
      id: string;
      name: string;
    }>;
    attendanceCount: number;
  }>;
  badgeTemplate?: BadgeTemplate;
}
