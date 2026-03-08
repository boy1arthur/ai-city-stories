// ===== SLOT SYSTEM =====
// Universal slot schema for all monetization surfaces in the city

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
  ownerName?: string;        // Display name for patron or brand
  ownerMessage?: string;     // Short message (patron tile)
  aiHookId?: string;
  triggerType?: TriggerType;
  displayConfig?: Record<string, unknown>;
}

// ===== INITIAL PLAZA SLOTS (10 total) =====

export const PLAZA_SLOTS: Slot[] = [
  // ── BRAND_BUILDING (2) ──
  {
    id: 'slot_brand_arena',
    zone: 'plaza',
    type: 'BRAND_BUILDING',
    location: { buildingId: 'arena', face: 'roof' },
    label: 'Arena 프리미엄 — 네이밍 라이츠 + 옥상 보드',
    ownerType: 'empty',
    triggerType: 'click',
  },
  {
    id: 'slot_brand_feed',
    zone: 'plaza',
    type: 'BRAND_BUILDING',
    location: { buildingId: 'feed_tower', face: 'side' },
    label: 'Feed Tower — 대형 벽면 + 옥상 안테나',
    ownerType: 'empty',
    triggerType: 'click',
  },

  // ── PATRON_TILE (5) — 교차로(16,16) 주변 벤치/도로 ──
  {
    id: 'slot_patron_bench_1',
    zone: 'plaza',
    type: 'PATRON_TILE',
    location: { tile: { x: 15, y: 15 } },
    label: '교차로 NW 벤치',
    ownerType: 'patron',
    ownerId: 'demo_patron_1',
    ownerName: '김태희',
    ownerMessage: 'AI 시티의 첫 번째 후원자 🌟',
    triggerType: 'proximity',
  },
  {
    id: 'slot_patron_bench_2',
    zone: 'plaza',
    type: 'PATRON_TILE',
    location: { tile: { x: 18, y: 15 } },
    label: '교차로 NE 벤치',
    ownerType: 'patron',
    ownerId: 'demo_patron_2',
    ownerName: '이준혁',
    ownerMessage: '커피 한 잔의 여유를 ☕',
    triggerType: 'proximity',
  },
  {
    id: 'slot_patron_bench_3',
    zone: 'plaza',
    type: 'PATRON_TILE',
    location: { tile: { x: 15, y: 18 } },
    label: '교차로 SW 벤치',
    ownerType: 'empty',
    triggerType: 'click',
  },
  {
    id: 'slot_patron_bench_4',
    zone: 'plaza',
    type: 'PATRON_TILE',
    location: { tile: { x: 18, y: 18 } },
    label: '교차로 SE 벤치',
    ownerType: 'empty',
    triggerType: 'click',
  },
  {
    id: 'slot_patron_bench_5',
    zone: 'plaza',
    type: 'PATRON_TILE',
    location: { tile: { x: 16, y: 14 } },
    label: '교차로 북측 도로 타일',
    ownerType: 'patron',
    ownerId: 'demo_patron_3',
    ownerName: '박서연',
    ownerMessage: '꿈을 코딩하는 도시 💻',
    triggerType: 'proximity',
  },

  // ── PRODUCT_PPL (2) ──
  {
    id: 'slot_ppl_cafe',
    zone: 'plaza',
    type: 'PRODUCT_PPL',
    location: { buildingId: 'cafe', face: 'front' },
    label: 'Café 메뉴판 / 컵 슬리브 PPL',
    ownerType: 'empty',
    triggerType: 'click',
  },
  {
    id: 'slot_ppl_tavern',
    zone: 'plaza',
    type: 'PRODUCT_PPL',
    location: { buildingId: 'tavern', face: 'front' },
    label: 'Tavern 포스터 / 네온 간판 PPL',
    ownerType: 'empty',
    triggerType: 'click',
  },

  // ── BRAND_SCREEN (1, 예비) ──
  {
    id: 'slot_screen_workshop',
    zone: 'plaza',
    type: 'BRAND_SCREEN',
    location: { buildingId: 'workshop', face: 'side' },
    label: 'Workshop 중형 디지털 스크린 (Times Square 티저)',
    ownerType: 'empty',
    triggerType: 'click',
  },
];

// Helper: get slots by zone
export function getSlotsByZone(zone: SlotZone): Slot[] {
  // For now, only plaza has slots
  if (zone === 'plaza') return PLAZA_SLOTS;
  return [];
}

// Helper: get patron tiles for rendering
export function getPatronTiles(zone: SlotZone): Slot[] {
  return getSlotsByZone(zone).filter(s => s.type === 'PATRON_TILE');
}

// Helper: get empty slots (available for purchase)
export function getEmptySlots(zone: SlotZone): Slot[] {
  return getSlotsByZone(zone).filter(s => s.ownerType === 'empty');
}
