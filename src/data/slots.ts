// ===== SLOT TYPE DEFINITIONS =====
// All slot data now lives in Lovable Cloud DB.
// This file contains only type definitions and helpers.

export type SlotZone = 'plaza' | 'campus' | 'harbor' | 'industrial' | 'residential';
export type SlotType = 'BRAND_BUILDING' | 'BRAND_SCREEN' | 'PRODUCT_PPL' | 'PATRON_TILE';
export type OwnerType = 'brand' | 'patron' | 'empty';
export type TriggerType = 'click' | 'proximity' | 'sit' | 'timer';

export interface SlotLocation {
  buildingId?: string;
  face?: 'front' | 'side' | 'roof';
  tile?: { x: number; y: number };
}

export interface Slot {
  id: string;
  zone: SlotZone;
  type: SlotType;
  location: SlotLocation;
  label: string;
  ownerType: OwnerType;
  ownerId?: string;
  ownerName?: string;
  ownerMessage?: string;
  aiHookId?: string;
  triggerType?: TriggerType;
  displayConfig?: Record<string, unknown>;
}
