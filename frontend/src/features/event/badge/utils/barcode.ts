/**
 * Generate barcode for badge
 * Uses a simple format: EVENT_ID-PARTICIPANT_ID-COURSE_ID-TIMESTAMP
 */

export function generateBarcode(
  eventId: string,
  participantId: string,
  courseId: string
): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const eventPart = eventId.slice(-6).toUpperCase();
  const participantPart = participantId.slice(-6).toUpperCase();
  const coursePart = courseId.slice(-6).toUpperCase();
  
  return `${eventPart}-${participantPart}-${coursePart}-${timestamp}`;
}

/**
 * Validate barcode format
 */
export function validateBarcode(barcode: string): boolean {
  const pattern = /^[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+$/;
  return pattern.test(barcode);
}

/**
 * Parse barcode to extract information
 */
export function parseBarcode(barcode: string): {
  eventPart: string;
  participantPart: string;
  coursePart: string;
  timestamp: string;
} | null {
  if (!validateBarcode(barcode)) {
    return null;
  }

  const parts = barcode.split('-');
  return {
    eventPart: parts[0],
    participantPart: parts[1],
    coursePart: parts[2],
    timestamp: parts[3],
  };
}
