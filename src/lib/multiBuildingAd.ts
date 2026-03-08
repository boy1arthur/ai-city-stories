// ===== MULTI-BUILDING AD SYSTEM =====
// Adjacent buildings share continuous brand canvases
// Hybrid visibility: exterior walls → direct render, occluded walls → floating banner

import type { Building } from '@/data/world';

export type MultiBuildingFace = 'south' | 'east';

export interface MultiBuildingAd {
  id: string;
  brandName: string;
  brandColor: string;
  brandInitial: string;
  tagline: string;
  buildingIds: string[];
  face: MultiBuildingFace;
}

/** Detect if a south wall (at wallY) is occluded by any building in front of it */
export function isSouthWallOccluded(
  wallMinX: number, wallMaxX: number, wallY: number,
  allBuildings: Building[], excludeIds: Set<string>
): boolean {
  // A south wall at wallY is occluded if there's a building whose gridY <= wallY
  // and gridY + height > wallY, overlapping on X range, and it's in front (higher gridY side)
  for (const b of allBuildings) {
    if (excludeIds.has(b.id)) continue;
    // Building starts at or exactly where the wall is, and extends south (higher gridY)
    if (b.gridY >= wallY && b.gridY <= wallY + 2) {
      // Check X overlap
      const bLeft = b.gridX;
      const bRight = b.gridX + b.width;
      if (bRight > wallMinX && bLeft < wallMaxX) {
        return true; // This building is directly in front of the south wall
      }
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
    // Building starts at or near the wall X and extends east
    if (b.gridX >= wallX && b.gridX <= wallX + 2) {
      const bTop = b.gridY;
      const bBottom = b.gridY + b.height;
      if (bBottom > wallMinY && bTop < wallMaxY) {
        return true;
      }
    }
  }
  return false;
}

/** Get wall extents for visibility check */
export function getAdWallExtents(ad: MultiBuildingAd, buildings: Building[]): {
  minX: number; maxX: number; minY: number; maxY: number; wallEdge: number;
} {
  const blds = ad.buildingIds
    .map(id => buildings.find(b => b.id === id))
    .filter(Boolean) as Building[];

  if (ad.face === 'south') {
    const wallY = Math.max(...blds.map(b => b.gridY + b.height));
    return {
      minX: Math.min(...blds.map(b => b.gridX)),
      maxX: Math.max(...blds.map(b => b.gridX + b.width)),
      minY: Math.min(...blds.map(b => b.gridY)),
      maxY: wallY,
      wallEdge: wallY,
    };
  } else {
    const wallX = Math.max(...blds.map(b => b.gridX + b.width));
    return {
      minX: Math.min(...blds.map(b => b.gridX)),
      maxX: wallX,
      minY: Math.min(...blds.map(b => b.gridY)),
      maxY: Math.max(...blds.map(b => b.gridY + b.height)),
      wallEdge: wallX,
    };
  }
}

/** Check if this ad's wall is visible or occluded */
export function isAdOccluded(ad: MultiBuildingAd, allBuildings: Building[]): boolean {
  const blds = ad.buildingIds
    .map(id => allBuildings.find(b => b.id === id))
    .filter(Boolean) as Building[];
  const excludeIds = new Set(ad.buildingIds);
  const ext = getAdWallExtents(ad, allBuildings);

  if (ad.face === 'south') {
    return isSouthWallOccluded(ext.minX, ext.maxX, ext.wallEdge, allBuildings, excludeIds);
  } else {
    return isEastWallOccluded(ext.wallEdge, ext.minY, ext.maxY, allBuildings, excludeIds);
  }
}

// ===== DEMO PLACEMENTS =====
export const DEMO_MULTI_BUILDING_ADS: MultiBuildingAd[] = [
  // ═══ 12시 (NW) — NovaTech on Lab+Café south wall only (Arena has naming_rights) ═══
  {
    id: 'mba_nw_south',
    brandName: 'NovaTech',
    brandColor: 'hsl(210,60%,55%)',
    brandInitial: 'N',
    tagline: 'Future, simplified.',
    buildingIds: ['lab', 'cafe'],
    face: 'south',
  },

  // ═══ 3시 (NE) — Media Strip ═══
  {
    id: 'mba_ne_south',
    brandName: 'FinFlow',
    brandColor: 'hsl(215,45%,50%)',
    brandInitial: 'F',
    tagline: 'Smart money moves.',
    buildingIds: ['feed_tower', 'newsstand'],
    face: 'south',
  },
  {
    id: 'mba_ne_east',
    brandName: 'FinFlow',
    brandColor: 'hsl(215,45%,50%)',
    brandInitial: 'F',
    tagline: 'Smart money moves.',
    buildingIds: ['oracle', 'newsstand'],
    face: 'east',
  },

  // ═══ 9시 (SW) — Culture Quarter ═══
  {
    id: 'mba_sw_south',
    brandName: 'BrewBean',
    brandColor: 'hsl(25,55%,45%)',
    brandInitial: 'B',
    tagline: '매일의 커피, 매일의 영감',
    buildingIds: ['library', 'tavern'],
    face: 'south',
  },
  {
    id: 'mba_sw_east',
    brandName: 'EduSpark',
    brandColor: 'hsl(145,40%,45%)',
    brandInitial: 'E',
    tagline: '배움에 불꽃을',
    buildingIds: ['tavern', 'museum'],
    face: 'east',
  },

  // ═══ 6시 (SE) — Innovation Hub ═══
  {
    id: 'mba_se_south',
    brandName: 'Lumière',
    brandColor: 'hsl(320,40%,55%)',
    brandInitial: 'L',
    tagline: 'Wear the light.',
    buildingIds: ['observatory', 'arcade'],
    face: 'south',
  },
  {
    id: 'mba_se_east',
    brandName: 'Lumière',
    brandColor: 'hsl(320,40%,55%)',
    brandInitial: 'L',
    tagline: 'Wear the light.',
    buildingIds: ['arcade', 'tech_lab'],
    face: 'east',
  },
  {
    id: 'mba_se_south2',
    brandName: 'EduSpark',
    brandColor: 'hsl(145,40%,45%)',
    brandInitial: 'E',
    tagline: '배움에 불꽃을',
    buildingIds: ['garden', 'tech_lab'],
    face: 'south',
  },
];
