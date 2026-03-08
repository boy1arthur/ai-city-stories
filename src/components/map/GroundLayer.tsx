import React from 'react';
import type { Zone } from '@/data/world';
import { getTileTypeFromMap, isRoadCenterInZone, getZonePalette } from '@/data/world';
import { iso, diamond } from './constants';

export const GroundLayer: React.FC<{ zone: Zone }> = React.memo(({ zone }) => {
  const tiles: React.ReactNode[] = [];
  const GRID = zone.gridSize;
  const palette = getZonePalette(zone.id);

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
        const isVert = (gx === 7 || gx === 13);
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
          (gy === 5 || gy === 10) && (gx === 7 || gx === 13);
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
        // Check if adjacent to road for curb effect
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
  return <g>{tiles}</g>;
});
GroundLayer.displayName = 'GroundLayer';
