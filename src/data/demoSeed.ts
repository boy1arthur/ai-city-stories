// ===== DEMO SEED DATA =====
// Pre-configured brands and ad placements for demo/showcase mode

import type { AdSlot, BrandCategory } from '@/data/world';

export interface VirtualBrand {
  name: string;
  category: BrandCategory;
  color: string;
  tagline: string;
}

export const VIRTUAL_BRANDS: VirtualBrand[] = [
  { name: 'NovaTech', category: 'tech', color: 'hsl(210,60%,55%)', tagline: 'Future, simplified.' },
  { name: 'BrewBean', category: 'food', color: 'hsl(25,55%,45%)', tagline: '매일의 커피, 매일의 영감' },
  { name: 'Lumière', category: 'fashion', color: 'hsl(320,40%,55%)', tagline: 'Wear the light.' },
  { name: 'EduSpark', category: 'education', color: 'hsl(145,40%,45%)', tagline: '배움에 불꽃을' },
  { name: 'FinFlow', category: 'finance', color: 'hsl(215,45%,50%)', tagline: 'Smart money moves.' },
];

/** Apply demo ad placements to a set of ad slots */
export function applyDemoSeed(slots: AdSlot[]): AdSlot[] {
  // Map of slotId patterns to brand assignments
  const assignments: Array<{ buildingId: string; type: string; brand: string; brandCategory: BrandCategory; impressions: number }> = [
    // NovaTech — Arena는 BRAND_BUILDING 슬롯이므로 naming_rights 제외
    // BrewBean — Tavern billboard + Garden kiosk
    { buildingId: 'tavern', type: 'billboard', brand: 'BrewBean', brandCategory: 'food', impressions: 156 },
    { buildingId: 'garden', type: 'kiosk', brand: 'BrewBean', brandCategory: 'food', impressions: 98 },
    // Lumière — Central Plaza wall wrap + bus stop
    { buildingId: 'plaza', type: 'wall_wrap', brand: 'Lumière', brandCategory: 'fashion', impressions: 264 },
    { buildingId: 'plaza', type: 'bus_stop', brand: 'Lumière', brandCategory: 'fashion', impressions: 112 },
    // EduSpark — Library billboard + bus stop
    { buildingId: 'library', type: 'billboard', brand: 'EduSpark', brandCategory: 'education', impressions: 203 },
    { buildingId: 'library', type: 'bus_stop', brand: 'EduSpark', brandCategory: 'education', impressions: 77 },
    // FinFlow — Oracle kiosk + wall wrap
    { buildingId: 'oracle', type: 'kiosk', brand: 'FinFlow', brandCategory: 'finance', impressions: 91 },
    { buildingId: 'oracle', type: 'wall_wrap', brand: 'FinFlow', brandCategory: 'finance', impressions: 145 },
  ];

  return slots.map(slot => {
    const match = assignments.find(
      a => slot.buildingId === a.buildingId && slot.type === a.type && !slot.brand
    );
    if (match) {
      return { ...slot, brand: match.brand, brandCategory: match.brandCategory, impressions: match.impressions };
    }
    return slot;
  });
}
