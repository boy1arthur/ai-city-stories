import React from 'react';
import type { Zone } from '@/data/world';
import { getTileTypeFromMap, isRoadCenterInZone, getZonePalette } from '@/data/world';
import { iso, diamond, TILE_W, TILE_H } from './constants';

// Street furniture positions for Plaza district (aligned to corrected layout)
const LAMPPOST_POSITIONS = [
  { gx: 1, gy: 8 }, { gx: 5, gy: 8 }, { gx: 12, gy: 8 }, { gx: 16, gy: 8 },
  { gx: 8, gy: 1 }, { gx: 8, gy: 5 }, { gx: 8, gy: 11 }, { gx: 8, gy: 15 },
  { gx: 6, gy: 3 }, { gx: 6, gy: 10 }, { gx: 13, gy: 11 },
];

const BENCH_POSITIONS = [
  { gx: 7, gy: 6, dir: 'h' as const },
  { gx: 7, gy: 10, dir: 'h' as const },
  { gx: 13, gy: 9, dir: 'v' as const },
  { gx: 3, gy: 1, dir: 'h' as const },
  { gx: 12, gy: 1, dir: 'h' as const },
  { gx: 6, gy: 13, dir: 'v' as const },
];

const PLANTER_POSITIONS = [
  { gx: 7, gy: 3 }, { gx: 7, gy: 10 },
  { gx: 13, gy: 11 }, { gx: 1, gy: 15 }, { gx: 8, gy: 17 },
];

const TRASHCAN_POSITIONS = [
  { gx: 0, gy: 8 }, { gx: 17, gy: 8 },
  { gx: 8, gy: 0 }, { gx: 8, gy: 17 },
];

export const GroundLayer: React.FC<{ zone: Zone }> = React.memo(({ zone }) => {
  const tiles: React.ReactNode[] = [];
  const GRID = zone.gridSize;
  const palette = getZonePalette(zone.id);
  const isPlaza = zone.id === 'plaza';

  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      const type = getTileTypeFromMap(zone.tileMap, gx, gy, GRID);
      const colors = palette[type];
      const pos = iso(gx, gy);

      // Base tile
      tiles.push(
        <polygon key={`t_${gx}_${gy}`} points={diamond(pos.x, pos.y)}
          fill={colors.fill} stroke={colors.stroke} strokeWidth={0.5} strokeOpacity={0.4} />
      );

      // Road center line
      if (isRoadCenterInZone(zone.tileMap, gx, gy, GRID)) {
        const isVert = (gx === 8);
        tiles.push(
          <line key={`rm_${gx}_${gy}`}
            x1={isVert ? pos.x : pos.x - 6} y1={isVert ? pos.y - 3 : pos.y}
            x2={isVert ? pos.x : pos.x + 6} y2={isVert ? pos.y + 3 : pos.y}
            stroke="hsl(45,80%,75%)" strokeWidth={0.8} strokeOpacity={0.4} strokeDasharray="2 3" />
        );
      }

      // Crosswalk markings at intersections
      if (type === 'road') {
        const isIntersection =
          isRoadCenterInZone(zone.tileMap, gx, gy, GRID) &&
          (gy === 8) && (gx === 8);
        if (isIntersection) {
          tiles.push(
            <g key={`cw_${gx}_${gy}`}>
              {[-4, -2, 0, 2, 4].map(off => (
                <line key={off} x1={pos.x + off - 1} y1={pos.y - 2} x2={pos.x + off + 1} y2={pos.y + 2}
                  stroke="hsl(0,0%,85%)" strokeWidth={1.2} strokeOpacity={0.4} />
              ))}
            </g>
          );
        }
      }

      // Grass detail dots
      if (type === 'grass' && ((gx * 7 + gy * 13) % 5 === 0)) {
        const ox = ((gx * 3 + gy * 7) % 11 - 5) * 1.2;
        const oy = ((gx * 5 + gy * 3) % 7 - 3) * 0.8;
        tiles.push(<circle key={`gd_${gx}_${gy}`} cx={pos.x + ox} cy={pos.y + oy} r={1.2} fill="hsl(125,25%,38%)" opacity={0.5} />);
      }

      // Park trees
      if (type === 'park' && ((gx + gy) % 3 === 0)) {
        tiles.push(
          <g key={`tree_${gx}_${gy}`}>
            <line x1={pos.x} y1={pos.y} x2={pos.x} y2={pos.y - 10} stroke="hsl(25,30%,30%)" strokeWidth={1.5} />
            <circle cx={pos.x} cy={pos.y - 12} r={5} fill="hsl(130,30%,38%)" opacity={0.85} />
            <circle cx={pos.x - 2} cy={pos.y - 14} r={3.5} fill="hsl(135,35%,42%)" opacity={0.75} />
          </g>
        );
      }

      // Water shimmer
      if (type === 'water') {
        tiles.push(
          <line key={`ws_${gx}_${gy}`} x1={pos.x - 6} y1={pos.y} x2={pos.x + 6} y2={pos.y}
            stroke="hsl(200,50%,55%)" strokeWidth={0.5} strokeOpacity={0.4}>
            <animate attributeName="strokeOpacity" values="0.2;0.5;0.2" dur="3s" repeatCount="indefinite" />
          </line>
        );
      }

      // Plaza stone pattern
      if (type === 'plaza_stone' && (gx + gy) % 2 === 0) {
        tiles.push(<polygon key={`pd_${gx}_${gy}`} points={diamond(pos.x, pos.y)} fill="hsl(35,15%,52%)" fillOpacity={0.2} stroke="none" />);
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

      // Sidewalk curb detail
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
      }
    }
  }

  // ─── Street furniture (Plaza district only) ───
  if (isPlaza) {
    // Lampposts
    for (const lp of LAMPPOST_POSITIONS) {
      if (lp.gx >= GRID || lp.gy >= GRID) continue;
      const pos = iso(lp.gx, lp.gy);
      tiles.push(
        <g key={`lamp_${lp.gx}_${lp.gy}`}>
          {/* Pole */}
          <line x1={pos.x} y1={pos.y} x2={pos.x} y2={pos.y - 16}
            stroke="hsl(215,8%,42%)" strokeWidth={1.2} strokeLinecap="round" />
          {/* Arm */}
          <line x1={pos.x} y1={pos.y - 15} x2={pos.x + 4} y2={pos.y - 16}
            stroke="hsl(215,8%,42%)" strokeWidth={0.8} />
          {/* Light */}
          <circle cx={pos.x + 4} cy={pos.y - 17} r={2} fill="hsl(45,70%,65%)" fillOpacity={0.6}>
            <animate attributeName="fillOpacity" values="0.4;0.7;0.4" dur="4s" repeatCount="indefinite" />
          </circle>
          {/* Light glow */}
          <circle cx={pos.x + 4} cy={pos.y - 17} r={5} fill="hsl(45,60%,70%)" fillOpacity={0.1} />
        </g>
      );
    }

    // Benches
    for (const bench of BENCH_POSITIONS) {
      if (bench.gx >= GRID || bench.gy >= GRID) continue;
      const pos = iso(bench.gx, bench.gy);
      tiles.push(
        <g key={`bench_${bench.gx}_${bench.gy}`}>
          {/* Seat */}
          <rect x={pos.x - 5} y={pos.y - 2} width={10} height={2} rx={0.5}
            fill="hsl(25,30%,35%)" fillOpacity={0.7} />
          {/* Back */}
          <rect x={pos.x - 5} y={pos.y - 4.5} width={10} height={1.5} rx={0.5}
            fill="hsl(25,25%,30%)" fillOpacity={0.5} />
          {/* Legs */}
          <line x1={pos.x - 4} y1={pos.y - 1} x2={pos.x - 4} y2={pos.y + 1}
            stroke="hsl(215,6%,35%)" strokeWidth={0.8} />
          <line x1={pos.x + 4} y1={pos.y - 1} x2={pos.x + 4} y2={pos.y + 1}
            stroke="hsl(215,6%,35%)" strokeWidth={0.8} />
        </g>
      );
    }

    // Planters (small flower pots / green boxes)
    for (const pl of PLANTER_POSITIONS) {
      if (pl.gx >= GRID || pl.gy >= GRID) continue;
      const pos = iso(pl.gx, pl.gy);
      tiles.push(
        <g key={`planter_${pl.gx}_${pl.gy}`}>
          {/* Pot */}
          <rect x={pos.x - 3} y={pos.y - 3} width={6} height={4} rx={1}
            fill="hsl(25,15%,40%)" fillOpacity={0.6} />
          {/* Plant */}
          <circle cx={pos.x} cy={pos.y - 5} r={3} fill="hsl(130,30%,40%)" fillOpacity={0.7} />
          <circle cx={pos.x - 1.5} cy={pos.y - 6.5} r={2} fill="hsl(135,35%,45%)" fillOpacity={0.6} />
        </g>
      );
    }

    // Trash cans
    for (const tc of TRASHCAN_POSITIONS) {
      if (tc.gx >= GRID || tc.gy >= GRID) continue;
      const pos = iso(tc.gx, tc.gy);
      tiles.push(
        <g key={`trash_${tc.gx}_${tc.gy}`}>
          <rect x={pos.x - 2} y={pos.y - 5} width={4} height={5} rx={0.5}
            fill="hsl(215,6%,38%)" fillOpacity={0.5} />
          <rect x={pos.x - 2.5} y={pos.y - 6} width={5} height={1.5} rx={0.5}
            fill="hsl(215,6%,42%)" fillOpacity={0.5} />
        </g>
      );
    }
  }

  return <g>{tiles}</g>;
});
GroundLayer.displayName = 'GroundLayer';