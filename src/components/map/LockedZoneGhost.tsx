import React from 'react';
import { ZONES } from '@/data/world';
import { iso, TILE_W, TILE_H } from './constants';

// Locked zone ghost previews positioned around the active zone
// Layout: Plaza=center, Campus=east, Harbor=south, Industrial=southeast
const ZONE_OFFSETS: Record<string, { dx: number; dy: number }> = {
  campus:      { dx: 0, dy: -38 },    // north of plaza
  harbor:      { dx: 38, dy: 0 },     // east of plaza
  industrial:  { dx: 0, dy: 38 },     // south of plaza
  residential: { dx: -38, dy: 0 },    // west of plaza
};

interface Props {
  activeZoneId: string;
}

export const LockedZoneGhost: React.FC<Props> = React.memo(({ activeZoneId }) => {
  const lockedZones = ZONES.filter(z => z.locked && z.id !== activeZoneId);
  
  return (
    <g>
      {lockedZones.map(zone => {
        const offset = ZONE_OFFSETS[zone.id];
        if (!offset) return null;
        
        const gridSize = zone.gridSize; // 36
        // Diamond corners of the ghost zone
        const nw = iso(offset.dx, offset.dy);
        const ne = iso(offset.dx + gridSize, offset.dy);
        const se = iso(offset.dx + gridSize, offset.dy + gridSize);
        const sw = iso(offset.dx, offset.dy + gridSize);
        const center = iso(offset.dx + gridSize / 2, offset.dy + gridSize / 2);

        // Theme color dimmed
        const baseColor = zone.themeColor;
        
        return (
          <g key={zone.id} style={{ pointerEvents: 'none' }}>
            {/* Ground diamond - very dim with zone theme color */}
            <polygon
              points={`${nw.x},${nw.y} ${ne.x},${ne.y} ${se.x},${se.y} ${sw.x},${sw.y}`}
              fill={baseColor}
              fillOpacity={0.06}
              stroke={baseColor}
              strokeWidth={1}
              strokeOpacity={0.15}
            />

            {/* Grid lines hint - subtle grid pattern */}
            {[0.25, 0.5, 0.75].map(t => {
              const lx1 = nw.x + (ne.x - nw.x) * t;
              const ly1 = nw.y + (ne.y - nw.y) * t;
              const lx2 = sw.x + (se.x - sw.x) * t;
              const ly2 = sw.y + (se.y - sw.y) * t;
              return (
                <line key={`h_${zone.id}_${t}`}
                  x1={lx1} y1={ly1} x2={lx2} y2={ly2}
                  stroke={baseColor} strokeWidth={0.3} strokeOpacity={0.08} />
              );
            })}
            {[0.25, 0.5, 0.75].map(t => {
              const lx1 = nw.x + (sw.x - nw.x) * t;
              const ly1 = nw.y + (sw.y - nw.y) * t;
              const lx2 = ne.x + (se.x - ne.x) * t;
              const ly2 = ne.y + (se.y - ne.y) * t;
              return (
                <line key={`v_${zone.id}_${t}`}
                  x1={lx1} y1={ly1} x2={lx2} y2={ly2}
                  stroke={baseColor} strokeWidth={0.3} strokeOpacity={0.08} />
              );
            })}

            {/* Ghost building silhouettes */}
            {zone.buildings.slice(0, 6).map((b, i) => {
              const bnw = iso(offset.dx + b.gridX, offset.dy + b.gridY);
              const bne = iso(offset.dx + b.gridX + b.width, offset.dy + b.gridY);
              const bse = iso(offset.dx + b.gridX + b.width, offset.dy + b.gridY + b.height);
              const bsw = iso(offset.dx + b.gridX, offset.dy + b.gridY + b.height);
              const wallH = 12 * b.heightLevel;
              return (
                <g key={`ghost_${zone.id}_${i}`}>
                  {/* Roof silhouette */}
                  <polygon
                    points={`${bnw.x},${bnw.y - wallH} ${bne.x},${bne.y - wallH} ${bse.x},${bse.y - wallH} ${bsw.x},${bsw.y - wallH}`}
                    fill={baseColor} fillOpacity={0.08}
                    stroke={baseColor} strokeWidth={0.4} strokeOpacity={0.12} />
                  {/* South wall silhouette */}
                  <polygon
                    points={`${bse.x},${bse.y} ${bsw.x},${bsw.y} ${bsw.x},${bsw.y - wallH} ${bse.x},${bse.y - wallH}`}
                    fill={baseColor} fillOpacity={0.05}
                    stroke={baseColor} strokeWidth={0.3} strokeOpacity={0.1} />
                  {/* East wall silhouette */}
                  <polygon
                    points={`${bne.x},${bne.y} ${bse.x},${bse.y} ${bse.x},${bse.y - wallH} ${bne.x},${bne.y - wallH}`}
                    fill={baseColor} fillOpacity={0.04}
                    stroke={baseColor} strokeWidth={0.3} strokeOpacity={0.08} />
                </g>
              );
            })}

            {/* Dark overlay */}
            <polygon
              points={`${nw.x},${nw.y} ${ne.x},${ne.y} ${se.x},${se.y} ${sw.x},${sw.y}`}
              fill="hsl(0,0%,0%)"
              fillOpacity={0.55}
            />

            {/* Zone label + lock */}
            <text x={center.x} y={center.y - 12} textAnchor="middle" fontSize={18}
              fill="hsl(0,0%,100%)" fillOpacity={0.15}>🔒</text>
            <text x={center.x} y={center.y + 4} textAnchor="middle" fontSize={9}
              fill={baseColor} fillOpacity={0.5} fontFamily="Inter" fontWeight={700}>
              {zone.emoji} {zone.name}
            </text>
            <text x={center.x} y={center.y + 16} textAnchor="middle" fontSize={5.5}
              fill="hsl(0,0%,70%)" fillOpacity={0.35} fontFamily="Inter" fontWeight={400}>
              Coming Soon
            </text>

            {/* Pulsing border glow */}
            <polygon
              points={`${nw.x},${nw.y} ${ne.x},${ne.y} ${se.x},${se.y} ${sw.x},${sw.y}`}
              fill="none"
              stroke={baseColor}
              strokeWidth={1.5}
              strokeOpacity={0.12}>
              <animate attributeName="strokeOpacity" values="0.06;0.18;0.06" dur="4s" repeatCount="indefinite" />
            </polygon>
          </g>
        );
      })}
    </g>
  );
});
LockedZoneGhost.displayName = 'LockedZoneGhost';
