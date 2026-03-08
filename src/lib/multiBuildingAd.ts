// ===== MULTI-BUILDING AD SYSTEM =====
// Adjacent buildings can share a continuous brand canvas across walls/roofs

import type { Building } from '@/data/world';

export type MultiBuildingFace = 'south' | 'east' | 'roof';

export interface MultiBuildingAd {
  id: string;
  brandName: string;
  brandColor: string;       // HSL color
  brandInitial: string;
  tagline: string;
  buildingIds: string[];    // ordered left-to-right or top-to-bottom
  face: MultiBuildingFace;  // which face the continuous canvas spans
}

/** Check if two buildings are adjacent on their south walls (same Y-bottom, touching X) */
function areSouthAdjacent(a: Building, b: Building): boolean {
  const aBottom = a.gridY + a.height;
  const bBottom = b.gridY + b.height;
  if (aBottom !== bBottom) return false;
  // a's right edge touches b's left edge (or vice versa)
  const aRight = a.gridX + a.width;
  const bRight = b.gridX + b.width;
  return aRight === b.gridX || bRight === a.gridX;
}

/** Check if two buildings are adjacent on their east walls (same X-right, touching Y) */
function areEastAdjacent(a: Building, b: Building): boolean {
  const aRight = a.gridX + a.width;
  const bRight = b.gridX + b.width;
  if (aRight !== bRight) return false;
  // a's bottom edge touches b's top edge (or vice versa)
  const aBottom = a.gridY + a.height;
  const bBottom = b.gridY + b.height;
  return aBottom === b.gridY || bBottom === a.gridY;
}

/** Check if two buildings share a roof edge (touching on any side) */
function areRoofAdjacent(a: Building, b: Building): boolean {
  // Same row, touching horizontally
  const hTouch = (a.gridY === b.gridY && a.height === b.height) &&
    (a.gridX + a.width === b.gridX || b.gridX + b.width === a.gridX);
  // Same column, touching vertically
  const vTouch = (a.gridX === b.gridX && a.width === b.width) &&
    (a.gridY + a.height === b.gridY || b.gridY + b.height === a.gridY);
  return hTouch || vTouch;
}

/** Find all groups of adjacent buildings for a given face */
export function findAdjacentGroups(
  buildings: Building[],
  face: MultiBuildingFace
): Building[][] {
  const isAdjacent = face === 'south' ? areSouthAdjacent
    : face === 'east' ? areEastAdjacent
    : areRoofAdjacent;

  const visited = new Set<string>();
  const groups: Building[][] = [];

  for (const b of buildings) {
    if (visited.has(b.id)) continue;
    // BFS to find connected cluster
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
      // Sort by position for consistent rendering
      cluster.sort((a, b) => (a.gridX + a.gridY) - (b.gridX + b.gridY));
      groups.push(cluster);
    }
  }
  return groups;
}

/** Pre-defined multi-building ad placements for demo */
export const DEMO_MULTI_BUILDING_ADS: MultiBuildingAd[] = [
  // NW block: Lab + Café share south wall facing boulevard
  {
    id: 'mba_nw_south',
    brandName: 'NovaTech',
    brandColor: 'hsl(210,60%,55%)',
    brandInitial: 'N',
    tagline: 'Future, simplified.',
    buildingIds: ['lab', 'cafe'],
    face: 'south',
  },
  // SW block: Library + Tavern share south wall
  {
    id: 'mba_sw_south',
    brandName: 'BrewBean',
    brandColor: 'hsl(25,55%,45%)',
    brandInitial: 'B',
    tagline: '매일의 커피, 매일의 영감',
    buildingIds: ['library', 'tavern'],
    face: 'south',
  },
  // SE block: Observatory + Arcade share east wall
  {
    id: 'mba_se_east',
    brandName: 'Lumière',
    brandColor: 'hsl(320,40%,55%)',
    brandInitial: 'L',
    tagline: 'Wear the light.',
    buildingIds: ['observatory', 'arcade'],
    face: 'east',
  },
  // NE block: Oracle + Newsstand share east wall (vertically stacked)
  {
    id: 'mba_ne_east',
    brandName: 'FinFlow',
    brandColor: 'hsl(215,45%,50%)',
    brandInitial: 'F',
    tagline: 'Smart money moves.',
    buildingIds: ['oracle', 'newsstand'],
    face: 'east',
  },
  // SE block: Garden + TechLab share south wall (roof canvas)
  {
    id: 'mba_se_roof',
    brandName: 'EduSpark',
    brandColor: 'hsl(145,40%,45%)',
    brandInitial: 'E',
    tagline: '배움에 불꽃을',
    buildingIds: ['garden', 'tech_lab'],
    face: 'roof',
  },
];
