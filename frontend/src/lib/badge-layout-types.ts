/**
 * Badge Layout Configuration Types
 * Supports dynamic text elements from participantFields and barcode positioning
 */

export type PaperSize = 'A4' | 'A6';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

/**
 * A text element on the badge that displays a participant field value
 */
export interface BadgeTextElement {
  id: string;
  fieldName: string; // Name of the participant field to display
  label: string; // Human-readable label for the editor
  position: Position;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  align: 'left' | 'center' | 'right';
}

/**
 * Barcode element configuration
 */
export interface BadgeBarcodeElement {
  position: Position;
  size: Size;
  showText: boolean;
}

/**
 * Complete badge layout configuration
 */
export interface BadgeLayoutConfig {
  paperSize: PaperSize;
  showBorder: boolean;
  textElements: BadgeTextElement[];
  barcode: BadgeBarcodeElement;
}

// Paper dimensions in mm
export const PAPER_DIMENSIONS: Record<PaperSize, Size> = {
  A4: { width: 210, height: 297 },
  A6: { width: 105, height: 148 },
};

// Default layout configuration
export const DEFAULT_BADGE_LAYOUT: BadgeLayoutConfig = {
  paperSize: 'A6',
  showBorder: true,
  textElements: [
    {
      id: 'name-top',
      fieldName: 'firstName,lastName', // Comma-separated for combined fields
      label: 'Full Name (Top)',
      position: { x: 52.5, y: 40 },
      fontSize: 14,
      fontWeight: 'bold',
      align: 'center',
    },
  ],
  barcode: {
    position: { x: 20, y: 100 },
    size: { width: 65, height: 25 },
    showText: true,
  },
};

// Storage key for localStorage persistence
export const BADGE_LAYOUT_STORAGE_KEY = 'badge-layout-config';

/**
 * Load layout config from localStorage
 */
export function loadLayoutConfig(): BadgeLayoutConfig {
  try {
    const stored = localStorage.getItem(BADGE_LAYOUT_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure backward compatibility
      if (parsed.textElements && parsed.barcode) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('[BadgeLayout] Failed to load config from localStorage:', error);
  }
  return DEFAULT_BADGE_LAYOUT;
}

/**
 * Save layout config to localStorage
 */
export function saveLayoutConfig(config: BadgeLayoutConfig): void {
  try {
    localStorage.setItem(BADGE_LAYOUT_STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.warn('[BadgeLayout] Failed to save config to localStorage:', error);
  }
}

/**
 * Generate a unique ID for new elements
 */
export function generateElementId(): string {
  return `elem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
