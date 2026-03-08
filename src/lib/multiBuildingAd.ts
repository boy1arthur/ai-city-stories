// ===== MULTI-BUILDING AD SYSTEM =====
// Adjacent buildings can share a continuous brand canvas across walls/roofs

import type { Building } from '@/data/world';

export type MultiBuildingFace = 'south' | 'east' | 'roof';

export interface MultiBuildingAd {
  id: string;
  brandName: string;
  brandColor: string;
  brandInitial: string;
  tagline: string;
  buildingIds: string[];
  face: MultiBuildingFace;
}

/** Check if two buildings are adjacent on their south walls (same Y-bottom, touching X) */
function areSouthAdjacent(a: Building, b: Building): boolean {
  const aBottom = a.gridY + a.height;
  const bBottom = b.gridY + b.height;
  if (aBottom !== bBottom) return false;
  const aRight = a.gridX + a.width;
  const bRight = b.gridX + b.width;
  return aRight === b.gridX || bRight === a.gridX;
}

/** Check if two buildings are adjacent on their east walls (same X-right, touching Y) */
function areEastAdjacent(a: Building, b: Building): boolean {
  const aRight = a.gridX + a.width;
  const bRight = b.gridX + b.width;
  if (aRight !== bRight) return false;
  const aBottom = a.gridY + a.height;
  const bBottom = b.gridY + b.height;
  return aBottom === b.gridY || bBottom === a.gridY;
}

/** Find all groups of adjacent buildings for a given face */
export function findAdjacentGroups(
  buildings: Building[],
  face: MultiBuildingFace
): Building[][] {
  const isAdjacent = face === 'south' ? areSouthAdjacent : areEastAdjacent;

  const visited = new Set<string>();
  const groups: Building[][] = [];

  for (const b of buildings) {
    if (visited.has(b.id)) continue;
    const cluster: Building[] = [b];
    visited.add(b.id);
    const queue = [b];
    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const other of buildings) {
        if (visited.has(other.id)) continue;
        if (isAdjacent(current, other)) {
          visited.add(other.id);
          cluster.push(other);
          queue.push(other);
        }
      }
    }
    if (cluster.length >= 2) {
      cluster.sort((a, b) => (a.gridX + a.gridY) - (b.gridX + b.gridY));
      groups.push(cluster);
    }
  }
  return groups;
}

// ===== OPTIMIZED PLACEMENTS =====
// Isometric view: camera looks from SE(6시) toward NW(12시)
// Visible faces: South wall (faces bottom-left/9시), East wall (faces bottom-right/3시)
//
// Placement strategy per quadrant:
// 12시(NW): Arena+Café east wall, Lab+Café south wall (boulevard-facing)
// 3시(NE): FeedTower+Newsstand south wall (boulevard), Oracle+Newsstand east wall
// 9시(SW): Library+Tavern south wall, Tavern+Museum east wall
// 6시(SE): Observatory+Arcade south wall, Arcade+TechLab east wall, Garden+TechLab south wall

export const DEMO_MULTI_BUILDING_ADS: MultiBuildingAd[] = [
  // ═══ 12시 (NW) — Premium Tower Block ═══
  {
    id: 'mba_nw_east',
    brandName: 'NovaTech',
    brandColor: 'hsl(210,60%,55%)',
    brandInitial: 'N',
    tagline: 'Future, simplified.',
    buildingIds: ['arena', 'cafe'],       // east wall x=14, y: 2-14
    face: 'east',
  },
  {
    id: 'mba_nw_south',
    brandName: 'NovaTech',
    brandColor: 'hsl(210,60%,55%)',
    brandInitial: 'N',
    tagline: 'Future, simplified.',
    buildingIds: ['lab', 'cafe'],         // south wall y=14, x: 2-14
    face: 'south',
  },

  // ═══ 3시 (NE) — Media Strip ═══
  {
    id: 'mba_ne_south',
    brandName: 'FinFlow',
    brandColor: 'hsl(215,45%,50%)',
    brandInitial: 'F',
    tagline: 'Smart money moves.',
    buildingIds: ['feed_tower', 'newsstand'], // south wall y=10 (boulevard)
    face: 'south',
  },
  {
    id: 'mba_ne_east',
    brandName: 'FinFlow',
    brandColor: 'hsl(215,45%,50%)',
    brandInitial: 'F',
    tagline: 'Smart money moves.',
    buildingIds: ['oracle', 'newsstand'],     // east wall x=32, y: 2-10
    face: 'east',
  },

  // ═══ 9시 (SW) — Culture Quarter ═══
  {
    id: 'mba_sw_south',
    brandName: 'BrewBean',
    brandColor: 'hsl(25,55%,45%)',
    brandInitial: 'B',
    tagline: '매일의 커피, 매일의 영감',
    buildingIds: ['library', 'tavern'],       // south wall y=26
    face: 'south',
  },
  {
    id: 'mba_sw_east',
    brandName: 'EduSpark',
    brandColor: 'hsl(145,40%,45%)',
    brandInitial: 'E',
    tagline: '배움에 불꽃을',
    buildingIds: ['tavern', 'museum'],        // east wall x=14, y: 18-32
    face: 'east',
  },

  // ═══ 6시 (SE) — Innovation Hub ═══
  {
    id: 'mba_se_south',
    brandName: 'Lumière',
    brandColor: 'hsl(320,40%,55%)',
    brandInitial: 'L',
    tagline: 'Wear the light.',
    buildingIds: ['observatory', 'arcade'],   // south wall y=24
    face: 'south',
  },
  {
    id: 'mba_se_east',
    brandName: 'Lumière',
    brandColor: 'hsl(320,40%,55%)',
    brandInitial: 'L',
    tagline: 'Wear the light.',
    buildingIds: ['arcade', 'tech_lab'],      // east wall x=32, y: 18-30
    face: 'east',
  },
  {
    id: 'mba_se_south2',
    brandName: 'EduSpark',
    brandColor: 'hsl(145,40%,45%)',
    brandInitial: 'E',
    tagline: '배움에 불꽃을',
    buildingIds: ['garden', 'tech_lab'],      // south wall y=30 (bottommost)
    face: 'south',
  },
];
