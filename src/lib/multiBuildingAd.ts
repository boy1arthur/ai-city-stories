// ===== SPONSORSHIP BILLBOARD SYSTEM =====
// Tiered billboard system: premium (LED), standard (billboard), basic (wall paint)

import type { Building } from '@/data/world';

export type MultiBuildingFace = 'south' | 'east';
export type BillboardTier = 'premium' | 'standard' | 'basic';
export type BillboardPlacement = 'wall' | 'rooftop' | 'roadside' | 'plaza_screen';

export interface MultiBuildingAd {
  id: string;
  brandName: string;
  brandColor: string;
  brandInitial: string;
  tagline: string;
  buildingIds: string[];      // empty for roadside/plaza
  face: MultiBuildingFace;
  tier: BillboardTier;
  placement: BillboardPlacement;
  // For roadside/plaza placements
  gridX?: number;
  gridY?: number;
}

/** Detect if a south wall (at wallY) is occluded by any building in front of it */
export function isSouthWallOccluded(
  wallMinX: number, wallMaxX: number, wallY: number,
  allBuildings: Building[], excludeIds: Set<string>
): boolean {
  for (const b of allBuildings) {
    if (excludeIds.has(b.id)) continue;
    if (b.gridY >= wallY && b.gridY <= wallY + 2) {
      const bLeft = b.gridX;
      const bRight = b.gridX + b.width;
      if (bRight > wallMinX && bLeft < wallMaxX) return true;
    }
  }
  return false;
}

/** Detect if an east wall (at wallX) is occluded by any building to its right */
export function isEastWallOccluded(
  wallX: number, wallMinY: number, wallMaxY: number,
  allBuildings: Building[], excludeIds: Set<string>
): boolean {
  for (const b of allBuildings) {
    if (excludeIds.has(b.id)) continue;
    if (b.gridX >= wallX && b.gridX <= wallX + 2) {
      const bTop = b.gridY;
      const bBottom = b.gridY + b.height;
      if (bBottom > wallMinY && bTop < wallMaxY) return true;
    }
  }
  return false;
}

export function getAdWallExtents(ad: MultiBuildingAd, buildings: Building[]) {
  const blds = ad.buildingIds.map(id => buildings.find(b => b.id === id)).filter(Boolean) as Building[];
  if (ad.face === 'south') {
    const wallY = Math.max(...blds.map(b => b.gridY + b.height));
    return { minX: Math.min(...blds.map(b => b.gridX)), maxX: Math.max(...blds.map(b => b.gridX + b.width)), minY: Math.min(...blds.map(b => b.gridY)), maxY: wallY, wallEdge: wallY };
  } else {
    const wallX = Math.max(...blds.map(b => b.gridX + b.width));
    return { minX: Math.min(...blds.map(b => b.gridX)), maxX: wallX, minY: Math.min(...blds.map(b => b.gridY)), maxY: Math.max(...blds.map(b => b.gridY + b.height)), wallEdge: wallX };
  }
}

export function isAdOccluded(ad: MultiBuildingAd, allBuildings: Building[]): boolean {
  const excludeIds = new Set(ad.buildingIds);
  const ext = getAdWallExtents(ad, allBuildings);
  if (ad.face === 'south') return isSouthWallOccluded(ext.minX, ext.maxX, ext.wallEdge, allBuildings, excludeIds);
  else return isEastWallOccluded(ext.wallEdge, ext.minY, ext.maxY, allBuildings, excludeIds);
}

// ===== DEMO PLACEMENTS =====
export const DEMO_MULTI_BUILDING_ADS: MultiBuildingAd[] = [
  // ══ PREMIUM (LED Screen) — tall landmark buildings ══
  { id: 'b_arena_s', brandName: 'NovaTech', brandColor: 'hsl(210,60%,55%)', brandInitial: 'N', tagline: 'Future, simplified.', buildingIds: ['arena'], face: 'south', tier: 'premium', placement: 'wall' },
  { id: 'b_feed_s', brandName: 'FinFlow', brandColor: 'hsl(215,45%,50%)', brandInitial: 'F', tagline: 'Smart money moves.', buildingIds: ['feed_tower'], face: 'south', tier: 'premium', placement: 'wall' },
  { id: 'b_oracle_s', brandName: 'FinFlow', brandColor: 'hsl(215,45%,50%)', brandInitial: 'F', tagline: 'Smart money moves.', buildingIds: ['oracle'], face: 'south', tier: 'premium', placement: 'wall' },

  // ══ STANDARD (Rooftop Billboard) — medium buildings ══
  { id: 'b_lab_s', brandName: 'NovaTech', brandColor: 'hsl(210,60%,55%)', brandInitial: 'N', tagline: 'Build the future.', buildingIds: ['lab'], face: 'south', tier: 'standard', placement: 'rooftop' },
  { id: 'b_work_s', brandName: 'NovaTech', brandColor: 'hsl(210,60%,55%)', brandInitial: 'N', tagline: 'Build it.', buildingIds: ['workshop'], face: 'south', tier: 'standard', placement: 'rooftop' },
  { id: 'b_news_s', brandName: 'EduSpark', brandColor: 'hsl(145,40%,45%)', brandInitial: 'E', tagline: '배움에 불꽃을', buildingIds: ['newsstand'], face: 'south', tier: 'standard', placement: 'rooftop' },
  { id: 'b_obs_s', brandName: 'Lumière', brandColor: 'hsl(320,40%,55%)', brandInitial: 'L', tagline: 'Wear the light.', buildingIds: ['observatory'], face: 'south', tier: 'standard', placement: 'rooftop' },
  { id: 'b_arc_s', brandName: 'Lumière', brandColor: 'hsl(320,40%,55%)', brandInitial: 'L', tagline: 'Wear the light.', buildingIds: ['arcade'], face: 'south', tier: 'standard', placement: 'rooftop' },

  // ══ BASIC (Wall Painting) — smaller buildings ══
  { id: 'b_cafe_s', brandName: 'BrewBean', brandColor: 'hsl(25,55%,45%)', brandInitial: 'B', tagline: '매일의 커피', buildingIds: ['cafe'], face: 'south', tier: 'basic', placement: 'wall' },
  { id: 'b_lib_s', brandName: 'BrewBean', brandColor: 'hsl(25,55%,45%)', brandInitial: 'B', tagline: '매일의 영감', buildingIds: ['library'], face: 'south', tier: 'basic', placement: 'wall' },
  { id: 'b_tav_s', brandName: 'BrewBean', brandColor: 'hsl(25,55%,45%)', brandInitial: 'B', tagline: '매일의 커피', buildingIds: ['tavern'], face: 'south', tier: 'basic', placement: 'wall' },
  { id: 'b_mus_s', brandName: 'Lumière', brandColor: 'hsl(320,40%,55%)', brandInitial: 'L', tagline: 'Wear the light.', buildingIds: ['museum'], face: 'south', tier: 'basic', placement: 'wall' },

  // ══ EAST WALL — mixed tiers ══
  { id: 'b_oracle_e', brandName: 'FinFlow', brandColor: 'hsl(215,45%,50%)', brandInitial: 'F', tagline: 'Smart money.', buildingIds: ['oracle'], face: 'east', tier: 'premium', placement: 'wall' },
  { id: 'b_tav_e', brandName: 'EduSpark', brandColor: 'hsl(145,40%,45%)', brandInitial: 'E', tagline: '배움에 불꽃을', buildingIds: ['tavern'], face: 'east', tier: 'basic', placement: 'wall' },
  { id: 'b_arc_e', brandName: 'EduSpark', brandColor: 'hsl(145,40%,45%)', brandInitial: 'E', tagline: '배움에 불꽃을', buildingIds: ['arcade'], face: 'east', tier: 'standard', placement: 'wall' },

  // ══ ROADSIDE STANDALONE ══
  { id: 'r_road1', brandName: 'NovaTech', brandColor: 'hsl(210,60%,55%)', brandInitial: 'N', tagline: 'Future, simplified.', buildingIds: [], face: 'south', tier: 'standard', placement: 'roadside', gridX: 16, gridY: 5 },
  { id: 'r_road2', brandName: 'BrewBean', brandColor: 'hsl(25,55%,45%)', brandInitial: 'B', tagline: '매일의 커피', buildingIds: [], face: 'south', tier: 'standard', placement: 'roadside', gridX: 16, gridY: 22 },
  { id: 'r_road3', brandName: 'Lumière', brandColor: 'hsl(320,40%,55%)', brandInitial: 'L', tagline: 'Wear the light.', buildingIds: [], face: 'south', tier: 'standard', placement: 'roadside', gridX: 5, gridY: 16 },
  { id: 'r_road4', brandName: 'EduSpark', brandColor: 'hsl(145,40%,45%)', brandInitial: 'E', tagline: '배움에 불꽃을', buildingIds: [], face: 'south', tier: 'standard', placement: 'roadside', gridX: 28, gridY: 16 },

  // ══ PLAZA CENTER SCREEN ══
  { id: 'p_center', brandName: 'NovaTech', brandColor: 'hsl(210,60%,55%)', brandInitial: 'N', tagline: 'Future, simplified.', buildingIds: [], face: 'south', tier: 'premium', placement: 'plaza_screen', gridX: 17, gridY: 17 },
];
