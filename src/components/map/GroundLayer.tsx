import React from 'react';
import type { Zone } from '@/data/world';
import { getTileTypeFromMap, isRoadCenterInZone, getZonePalette } from '@/data/world';
import { iso, diamond, TILE_W, TILE_H } from './constants';

// Road diamond: slightly inset for lane feel but still continuous
function roadDiamond(cx: number, cy: number): string {
  const w = TILE_W * 0.48;
  const h = TILE_H * 0.48;
  return `${cx},${cy - h} ${cx + w},${cy} ${cx},${cy + h} ${cx - w},${cy}`;
}

// Street furniture positions for Plaza district (36x36 grid)
const LAMPPOST_POSITIONS = [
  { gx: 2, gy: 16 }, { gx: 10, gy: 16 }, { gx: 24, gy: 16 }, { gx: 32, gy: 16 },
  { gx: 16, gy: 2 }, { gx: 16, gy: 10 }, { gx: 16, gy: 22 }, { gx: 16, gy: 30 },
  { gx: 12, gy: 6 }, { gx: 12, gy: 20 }, { gx: 28, gy: 22 },
];

const BENCH_POSITIONS = [
  { gx: 14, gy: 8, dir: 'h' as const },
  { gx: 14, gy: 20, dir: 'h' as const },
  { gx: 26, gy: 18, dir: 'v' as const },
  { gx: 6, gy: 2, dir: 'h' as const },
  { gx: 24, gy: 2, dir: 'h' as const },
  { gx: 12, gy: 26, dir: 'v' as const },
];

const PLANTER_POSITIONS = [
  { gx: 14, gy: 6 }, { gx: 14, gy: 20 },
  { gx: 28, gy: 22 }, { gx: 10, gy: 28 }, { gx: 14, gy: 34 },
];

const TRASHCAN_POSITIONS = [
  { gx: 0, gy: 16 }, { gx: 35, gy: 16 },
  { gx: 16, gy: 0 }, { gx: 16, gy: 35 },
];

// ─── Decorative tree types ───
function renderBushCluster(pos: { x: number; y: number }, key: string, scale = 1) {
  return (
    <g key={key}>
      <ellipse cx={pos.x - 3 * scale} cy={pos.y - 4 * scale} rx={4 * scale} ry={3 * scale}
        fill="hsl(128,32%,32%)" opacity={0.8} />
      <ellipse cx={pos.x + 2 * scale} cy={pos.y - 5 * scale} rx={5 * scale} ry={3.5 * scale}
        fill="hsl(132,35%,36%)" opacity={0.75} />
      <ellipse cx={pos.x} cy={pos.y - 6 * scale} rx={3.5 * scale} ry={2.5 * scale}
        fill="hsl(135,38%,40%)" opacity={0.7} />
    </g>
  );
}

function renderLargeTree(pos: { x: number; y: number }, key: string, variant: number) {
  const trunkH = 12 + (variant % 3) * 2;
  const crownR = 6 + (variant % 2) * 2;
  const hue = 125 + (variant * 7) % 20;
  return (
    <g key={key}>
      {/* Shadow on ground */}
      <ellipse cx={pos.x + 3} cy={pos.y + 1} rx={7} ry={3} fill="hsl(0,0%,0%)" opacity={0.12} />
      {/* Trunk */}
      <line x1={pos.x} y1={pos.y} x2={pos.x} y2={pos.y - trunkH}
        stroke="hsl(25,28%,28%)" strokeWidth={2} strokeLinecap="round" />
      {/* Crown layers */}
      <circle cx={pos.x} cy={pos.y - trunkH - 2} r={crownR} fill={`hsl(${hue},30%,34%)`} opacity={0.85} />
      <circle cx={pos.x - 2} cy={pos.y - trunkH - 4} r={crownR * 0.75} fill={`hsl(${hue + 5},34%,38%)`} opacity={0.75} />
      <circle cx={pos.x + 2} cy={pos.y - trunkH - 1} r={crownR * 0.6} fill={`hsl(${hue + 10},32%,40%)`} opacity={0.65} />
    </g>
  );
}

function renderConiferTree(pos: { x: number; y: number }, key: string, scale = 1) {
  const h = 18 * scale;
  return (
    <g key={key}>
      <ellipse cx={pos.x + 2} cy={pos.y + 1} rx={4 * scale} ry={2 * scale} fill="hsl(0,0%,0%)" opacity={0.1} />
      <line x1={pos.x} y1={pos.y} x2={pos.x} y2={pos.y - h}
        stroke="hsl(25,25%,25%)" strokeWidth={1.5 * scale} strokeLinecap="round" />
      {[0, 1, 2, 3].map(i => {
        const ty = pos.y - h * 0.3 - i * h * 0.17;
        const w = (4 - i) * 2.5 * scale;
        return (
          <polygon key={i}
            points={`${pos.x},${ty - 3 * scale} ${pos.x - w},${ty + 2 * scale} ${pos.x + w},${ty + 2 * scale}`}
            fill={`hsl(${140 + i * 3},28%,${28 + i * 3}%)`} opacity={0.8} />
        );
      })}
    </g>
  );
}

function renderFlowerBed(pos: { x: number; y: number }, key: string, seed: number) {
  const colors = [
    'hsl(340,55%,55%)', 'hsl(45,70%,60%)', 'hsl(280,40%,55%)',
    'hsl(15,60%,55%)', 'hsl(200,50%,60%)', 'hsl(60,65%,55%)',
  ];
  return (
    <g key={key}>
      {/* Soil bed */}
      <ellipse cx={pos.x} cy={pos.y} rx={6} ry={3} fill="hsl(25,22%,30%)" opacity={0.5} />
      {/* Flowers */}
      {[-3, -1, 1, 3].map((off, i) => (
        <g key={i}>
          <line x1={pos.x + off} y1={pos.y - 1} x2={pos.x + off} y2={pos.y - 4 - (i % 2)}
            stroke="hsl(130,25%,35%)" strokeWidth={0.6} />
          <circle cx={pos.x + off} cy={pos.y - 5 - (i % 2)} r={1.5}
            fill={colors[(seed + i) % colors.length]} opacity={0.8} />
        </g>
      ))}
    </g>
  );
}

// ─── Edge hedge (perimeter greenery like reference) ───
function renderEdgeHedge(gx: number, gy: number, gridSize: number, tiles: React.ReactNode[]) {
  const isEdge = gx === 0 || gy === 0 || gx === gridSize - 1 || gy === gridSize - 1;
  if (!isEdge) return;
  const pos = iso(gx, gy);
  const seed = gx * 13 + gy * 7;
  // Different densities on edges
  if (seed % 3 !== 0) return;
  
  tiles.push(
    <g key={`hedge_${gx}_${gy}`}>
      <ellipse cx={pos.x} cy={pos.y - 3} rx={5} ry={2.5}
        fill={`hsl(${125 + seed % 15},30%,${30 + seed % 8}%)`} opacity={0.75} />
      <ellipse cx={pos.x + 2} cy={pos.y - 4} rx={3.5} ry={2}
        fill={`hsl(${130 + seed % 12},34%,${34 + seed % 6}%)`} opacity={0.65} />
    </g>
  );
}

export const GroundLayer: React.FC<{ zone: Zone }> = React.memo(({ zone }) => {
  const tiles: React.ReactNode[] = [];
  const decorations: React.ReactNode[] = []; // rendered on top of tiles
  const GRID = zone.gridSize;
  const palette = getZonePalette(zone.id);
  const isPlaza = zone.id === 'plaza';
  const isResidential = zone.id === 'residential';

  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      const type = getTileTypeFromMap(zone.tileMap, gx, gy, GRID);
      const colors = palette[type];
      const pos = iso(gx, gy);
      const seed = gx * 17 + gy * 31;

      // Base tile — roads render as continuous asphalt with curb edges
      if (type === 'road') {
        // Full sidewalk/curb base
        tiles.push(
          <polygon key={`t_${gx}_${gy}`} points={diamond(pos.x, pos.y)}
            fill={palette.sidewalk.fill} stroke={palette.sidewalk.stroke} strokeWidth={0.3} strokeOpacity={0.3} />
        );
        // Road surface (nearly full-width for continuous feel)
        tiles.push(
          <polygon key={`rd_${gx}_${gy}`} points={roadDiamond(pos.x, pos.y)}
            fill={colors.fill} stroke="none" />
        );
      } else {
        tiles.push(
          <polygon key={`t_${gx}_${gy}`} points={diamond(pos.x, pos.y)}
            fill={colors.fill} stroke={colors.stroke} strokeWidth={0.5} strokeOpacity={0.4} />
        );
      }

      // Road center line
      if (isRoadCenterInZone(zone.tileMap, gx, gy, GRID)) {
        const isVert = (gx === 16 || gx === 17);
        tiles.push(
          <line key={`rm_${gx}_${gy}`}
            x1={isVert ? pos.x : pos.x - 6} y1={isVert ? pos.y - 3 : pos.y}
            x2={isVert ? pos.x : pos.x + 6} y2={isVert ? pos.y + 3 : pos.y}
            stroke="hsl(45,80%,75%)" strokeWidth={0.8} strokeOpacity={0.4} strokeDasharray="2 3" />
        );
      }

      // Crosswalk
      if (type === 'road' && isRoadCenterInZone(zone.tileMap, gx, gy, GRID) && (gy === 16 || gy === 17) && (gx === 16 || gx === 17)) {
        tiles.push(
          <g key={`cw_${gx}_${gy}`}>
            {[-4, -2, 0, 2, 4].map(off => (
              <line key={off} x1={pos.x + off - 1} y1={pos.y - 2} x2={pos.x + off + 1} y2={pos.y + 2}
                stroke="hsl(0,0%,85%)" strokeWidth={1.2} strokeOpacity={0.4} />
            ))}
          </g>
        );
      }

      // ─── Grass: multi-layered detail ───
      if (type === 'grass') {
        // Base texture variation
        if (seed % 4 === 0) {
          tiles.push(
            <polygon key={`gv_${gx}_${gy}`} points={diamond(pos.x, pos.y)}
              fill={`hsl(${118 + seed % 12},${20 + seed % 8}%,${30 + seed % 6}%)`}
              fillOpacity={0.3} stroke="none" />
          );
        }
        // Grass tufts
        if (seed % 5 === 0) {
          const ox = (seed % 7 - 3) * 1.5;
          const oy = (seed % 5 - 2) * 0.8;
          decorations.push(
            <g key={`tuft_${gx}_${gy}`}>
              <line x1={pos.x + ox - 1} y1={pos.y + oy} x2={pos.x + ox - 2} y2={pos.y + oy - 3}
                stroke="hsl(128,28%,38%)" strokeWidth={0.7} opacity={0.6} />
              <line x1={pos.x + ox} y1={pos.y + oy} x2={pos.x + ox} y2={pos.y + oy - 4}
                stroke="hsl(130,30%,40%)" strokeWidth={0.7} opacity={0.5} />
              <line x1={pos.x + ox + 1} y1={pos.y + oy} x2={pos.x + ox + 2} y2={pos.y + oy - 3}
                stroke="hsl(125,26%,36%)" strokeWidth={0.7} opacity={0.6} />
            </g>
          );
        }
        // Edge hedges (perimeter)
        renderEdgeHedge(gx, gy, GRID, decorations);
        
        // Scattered flowers on grass
        if (seed % 11 === 0) {
          decorations.push(renderFlowerBed(pos, `flwr_${gx}_${gy}`, seed));
        }
        // Scattered bushes on grass (not near edges with buildings)
        if (seed % 9 === 0 && gx > 1 && gx < GRID - 2 && gy > 1 && gy < GRID - 2) {
          decorations.push(renderBushCluster(pos, `bush_${gx}_${gy}`, 0.8));
        }
      }

      // ─── Park: lush trees and flowers ───
      if (type === 'park') {
        if ((gx + gy) % 2 === 0) {
          decorations.push(renderLargeTree(pos, `ltree_${gx}_${gy}`, seed));
        } else if ((gx + gy) % 3 === 0) {
          decorations.push(renderConiferTree(pos, `ctree_${gx}_${gy}`, 0.85));
        } else {
          // Low shrubs and flowers
          decorations.push(renderBushCluster(pos, `pbush_${gx}_${gy}`, 0.65));
          if (seed % 3 === 0) {
            decorations.push(renderFlowerBed(pos, `pflwr_${gx}_${gy}`, seed));
          }
        }
      }

      // Water shimmer
      if (type === 'water') {
        tiles.push(
          <g key={`ws_${gx}_${gy}`}>
            <line x1={pos.x - 6} y1={pos.y} x2={pos.x + 6} y2={pos.y}
              stroke="hsl(200,50%,55%)" strokeWidth={0.5} strokeOpacity={0.4}>
              <animate attributeName="strokeOpacity" values="0.2;0.5;0.2" dur="3s" repeatCount="indefinite" />
            </line>
            {/* Reflection highlight */}
            <ellipse cx={pos.x + (seed % 5 - 2)} cy={pos.y - 1} rx={2} ry={0.8}
              fill="hsl(200,60%,70%)" opacity={0.15} />
          </g>
        );
      }

      // Plaza stone pattern
      if (type === 'plaza_stone') {
        if ((gx + gy) % 2 === 0) {
          tiles.push(<polygon key={`pd_${gx}_${gy}`} points={diamond(pos.x, pos.y)}
            fill="hsl(35,15%,52%)" fillOpacity={0.2} stroke="none" />);
        }
        if (seed % 13 === 0) {
          decorations.push(
            <g key={`ppot_${gx}_${gy}`}>
              <rect x={pos.x - 2} y={pos.y - 2.5} width={4} height={3} rx={0.5}
                fill="hsl(20,20%,38%)" opacity={0.6} />
              <circle cx={pos.x} cy={pos.y - 4.5} r={2.5} fill="hsl(132,30%,38%)" opacity={0.7} />
            </g>
          );
        }
      }

      // Parking lot lines
      if (type === 'parking' && gx % 2 === 0) {
        tiles.push(
          <line key={`pk_${gx}_${gy}`} x1={pos.x - 4} y1={pos.y} x2={pos.x + 4} y2={pos.y}
            stroke="hsl(0,0%,70%)" strokeWidth={0.5} strokeOpacity={0.3} />
        );
      }

      // Field track lines
      if (type === 'field' && gy % 3 === 0) {
        tiles.push(
          <line key={`fl_${gx}_${gy}`} x1={pos.x - 8} y1={pos.y} x2={pos.x + 8} y2={pos.y}
            stroke="hsl(0,0%,95%)" strokeWidth={0.4} strokeOpacity={0.15} />
        );
      }

      // Sidewalk curb + greenery detail
      if (type === 'sidewalk') {
        const leftType = getTileTypeFromMap(zone.tileMap, gx - 1, gy, GRID);
        const topType = getTileTypeFromMap(zone.tileMap, gx, gy - 1, GRID);
        if (leftType === 'road') {
          tiles.push(
            <line key={`curb_l_${gx}_${gy}`}
              x1={pos.x - TILE_W / 4 - 2} y1={pos.y - 2}
              x2={pos.x - TILE_W / 4 + 2} y2={pos.y + 2}
              stroke="hsl(30,12%,60%)" strokeWidth={1} strokeOpacity={0.3} />
          );
        }
        if (topType === 'road') {
          tiles.push(
            <line key={`curb_t_${gx}_${gy}`}
              x1={pos.x - 2} y1={pos.y - TILE_H / 4 - 1}
              x2={pos.x + 2} y2={pos.y - TILE_H / 4 + 1}
              stroke="hsl(30,12%,60%)" strokeWidth={1} strokeOpacity={0.3} />
          );
        }
        // Small sidewalk tree (like reference street trees)
        if (seed % 8 === 0 && leftType === 'road') {
          decorations.push(
            <g key={`stree_${gx}_${gy}`}>
              <rect x={pos.x - 2} y={pos.y - 1} width={4} height={1.5} rx={0.5}
                fill="hsl(25,15%,35%)" opacity={0.4} />
              <line x1={pos.x} y1={pos.y - 1} x2={pos.x} y2={pos.y - 8}
                stroke="hsl(25,25%,30%)" strokeWidth={1.2} />
              <circle cx={pos.x} cy={pos.y - 9} r={4} fill="hsl(130,28%,35%)" opacity={0.75} />
              <circle cx={pos.x - 1.5} cy={pos.y - 10.5} r={2.8} fill="hsl(135,32%,40%)" opacity={0.65} />
            </g>
          );
        }
      }
    }
  }

  // ─── Street furniture (Plaza district only) ───
  if (isPlaza) {
    // Lampposts
    for (const lp of LAMPPOST_POSITIONS) {
      if (lp.gx >= GRID || lp.gy >= GRID) continue;
      const pos = iso(lp.gx, lp.gy);
      decorations.push(
        <g key={`lamp_${lp.gx}_${lp.gy}`}>
          <line x1={pos.x} y1={pos.y} x2={pos.x} y2={pos.y - 16}
            stroke="hsl(215,8%,42%)" strokeWidth={1.2} strokeLinecap="round" />
          <line x1={pos.x} y1={pos.y - 15} x2={pos.x + 4} y2={pos.y - 16}
            stroke="hsl(215,8%,42%)" strokeWidth={0.8} />
          <circle cx={pos.x + 4} cy={pos.y - 17} r={2} fill="hsl(45,70%,65%)" fillOpacity={0.6}>
            <animate attributeName="fillOpacity" values="0.4;0.7;0.4" dur="4s" repeatCount="indefinite" />
          </circle>
          <circle cx={pos.x + 4} cy={pos.y - 17} r={6} fill="hsl(45,60%,70%)" fillOpacity={0.08} />
        </g>
      );
    }

    // Benches
    for (const bench of BENCH_POSITIONS) {
      if (bench.gx >= GRID || bench.gy >= GRID) continue;
      const pos = iso(bench.gx, bench.gy);
      decorations.push(
        <g key={`bench_${bench.gx}_${bench.gy}`}>
          <rect x={pos.x - 5} y={pos.y - 2} width={10} height={2} rx={0.5}
            fill="hsl(25,30%,35%)" fillOpacity={0.7} />
          <rect x={pos.x - 5} y={pos.y - 4.5} width={10} height={1.5} rx={0.5}
            fill="hsl(25,25%,30%)" fillOpacity={0.5} />
          <line x1={pos.x - 4} y1={pos.y - 1} x2={pos.x - 4} y2={pos.y + 1}
            stroke="hsl(215,6%,35%)" strokeWidth={0.8} />
          <line x1={pos.x + 4} y1={pos.y - 1} x2={pos.x + 4} y2={pos.y + 1}
            stroke="hsl(215,6%,35%)" strokeWidth={0.8} />
        </g>
      );
    }

    // Planters
    for (const pl of PLANTER_POSITIONS) {
      if (pl.gx >= GRID || pl.gy >= GRID) continue;
      const pos = iso(pl.gx, pl.gy);
      decorations.push(
        <g key={`planter_${pl.gx}_${pl.gy}`}>
          <rect x={pos.x - 3} y={pos.y - 3} width={6} height={4} rx={1}
            fill="hsl(25,15%,40%)" fillOpacity={0.6} />
          <circle cx={pos.x} cy={pos.y - 5} r={3} fill="hsl(130,30%,40%)" fillOpacity={0.7} />
          <circle cx={pos.x - 1.5} cy={pos.y - 6.5} r={2} fill="hsl(135,35%,45%)" fillOpacity={0.6} />
        </g>
      );
    }

    // Trash cans
    for (const tc of TRASHCAN_POSITIONS) {
      if (tc.gx >= GRID || tc.gy >= GRID) continue;
      const pos = iso(tc.gx, tc.gy);
      decorations.push(
        <g key={`trash_${tc.gx}_${tc.gy}`}>
          <rect x={pos.x - 2} y={pos.y - 5} width={4} height={5} rx={0.5}
            fill="hsl(215,6%,38%)" fillOpacity={0.5} />
          <rect x={pos.x - 2.5} y={pos.y - 6} width={5} height={1.5} rx={0.5}
            fill="hsl(215,6%,42%)" fillOpacity={0.5} />
        </g>
      );
    }

  }

  return (
    <g>
      {tiles}
      {decorations}
    </g>
  );
});
GroundLayer.displayName = 'GroundLayer';
