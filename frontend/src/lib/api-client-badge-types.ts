import type { CreateBadgeInput, BadgeOutput, ListBadgesFilter } from '../features/badge/types';

// Add to ApiClient class
export interface ApiClient {
  // ... existing methods ...
  
  // Badge methods
  createBadge(data: CreateBadgeInput): Promise<BadgeOutput>;
  listBadges(filter?: ListBadgesFilter): Promise<BadgeOutput[]>;
  getBadge(badgeId: string): Promise<BadgeOutput>;
  getBadgeByBarcode(barcode: string): Promise<BadgeOutput>;
}
