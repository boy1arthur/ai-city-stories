import React from 'react';
import { ZONES } from '@/data/world';
import { iso, TILE_W, TILE_H } from './constants';

// Plaza=center, locked zones surround it on 4 sides
const ZONE_OFFSETS: Record<string, { dx: number; dy: number }> = {
  campus:      { dx: 0, dy: -38 },    // north
  harbor:      { dx: 38, dy: 0 },     // east
  industrial:  { dx: 0, dy: 38 },     // south
  residential: { dx: -38, dy: 0 },    // west
};

// Landmark silhouettes per zone theme (drawn in iso space relative to zone offset)
interface Landmark {
  label: string;
  draw: (ox: number, oy: number, color: string) => React.ReactNode;
}

const ZONE_LANDMARKS: Record<string, Landmark[]> = {
  campus: [
    {
      label: 'Clock Tower',
      draw: (ox, oy, color) => {
        // Tall narrow tower with clock face
        const base = iso(ox + 18, oy + 20);
        const w = 3, h = 5;
        const wallH = 85;
        const bnw = iso(ox + 18 - w/2, oy + 20 - h/2);
        const bne = iso(ox + 18 + w/2, oy + 20 - h/2);
        const bse = iso(ox + 18 + w/2, oy + 20 + h/2);
        const bsw = iso(ox + 18 - w/2, oy + 20 + h/2);
        return (
          <g key="campus_tower">
            {/* Tower body */}
            <polygon points={`${bse.x},${bse.y} ${bsw.x},${bsw.y} ${bsw.x},${bsw.y - wallH} ${bse.x},${bse.y - wallH}`}
              fill={color} fillOpacity={0.1} stroke={color} strokeWidth={0.5} strokeOpacity={0.2} />
            <polygon points={`${bne.x},${bne.y} ${bse.x},${bse.y} ${bse.x},${bse.y - wallH} ${bne.x},${bne.y - wallH}`}
              fill={color} fillOpacity={0.07} stroke={color} strokeWidth={0.5} strokeOpacity={0.15} />
            {/* Roof */}
            <polygon points={`${bnw.x},${bnw.y - wallH} ${bne.x},${bne.y - wallH} ${bse.x},${bse.y - wallH} ${bsw.x},${bsw.y - wallH}`}
              fill={color} fillOpacity={0.12} stroke={color} strokeWidth={0.5} strokeOpacity={0.2} />
            {/* Spire */}
            <line x1={base.x} y1={base.y - wallH} x2={base.x} y2={base.y - wallH - 20}
              stroke={color} strokeWidth={1} strokeOpacity={0.2} />
            {/* Clock circle */}
            <circle cx={(bse.x + bsw.x) / 2} cy={(bse.y + bsw.y) / 2 - wallH * 0.75} r={5}
              fill="none" stroke={color} strokeWidth={0.5} strokeOpacity={0.18} />
          </g>
        );
      },
    },
    {
      label: 'Library',
      draw: (ox, oy, color) => {
        const w = 8, h = 6, wallH = 35;
        const bnw = iso(ox + 8, oy + 26);
        const bne = iso(ox + 8 + w, oy + 26);
        const bse = iso(ox + 8 + w, oy + 26 + h);
        const bsw = iso(ox + 8, oy + 26 + h);
        return (
          <g key="campus_lib">
            <polygon points={`${bse.x},${bse.y} ${bsw.x},${bsw.y} ${bsw.x},${bsw.y - wallH} ${bse.x},${bse.y - wallH}`}
              fill={color} fillOpacity={0.08} stroke={color} strokeWidth={0.4} strokeOpacity={0.15} />
            <polygon points={`${bne.x},${bne.y} ${bse.x},${bse.y} ${bse.x},${bse.y - wallH} ${bne.x},${bne.y - wallH}`}
              fill={color} fillOpacity={0.06} stroke={color} strokeWidth={0.4} strokeOpacity={0.12} />
            {/* Columned entrance hint */}
            {[0.2, 0.4, 0.6, 0.8].map(t => {
              const cx = bsw.x + (bse.x - bsw.x) * t;
              const cy = bsw.y + (bse.y - bsw.y) * t;
              return <line key={`col_${t}`} x1={cx} y1={cy} x2={cx} y2={cy - wallH}
                stroke={color} strokeWidth={0.3} strokeOpacity={0.12} />;
            })}
            <polygon points={`${bnw.x},${bnw.y - wallH} ${bne.x},${bne.y - wallH} ${bse.x},${bse.y - wallH} ${bsw.x},${bsw.y - wallH}`}
              fill={color} fillOpacity={0.1} stroke={color} strokeWidth={0.4} strokeOpacity={0.18} />
          </g>
        );
      },
    },
  ],
  harbor: [
    {
      label: 'Crane',
      draw: (ox, oy, color) => {
        const base = iso(ox + 12, oy + 18);
        const armEnd = iso(ox + 22, oy + 18);
        const topH = 90;
        return (
          <g key="harbor_crane">
            {/* Vertical mast */}
            <line x1={base.x} y1={base.y} x2={base.x} y2={base.y - topH}
              stroke={color} strokeWidth={1.5} strokeOpacity={0.2} />
            {/* Horizontal arm */}
            <line x1={base.x - 15} y1={base.y - topH} x2={armEnd.x + 20} y2={base.y - topH}
              stroke={color} strokeWidth={1} strokeOpacity={0.18} />
            {/* Diagonal support */}
            <line x1={base.x} y1={base.y - topH * 0.3} x2={armEnd.x + 20} y2={base.y - topH}
              stroke={color} strokeWidth={0.5} strokeOpacity={0.12} />
            <line x1={base.x} y1={base.y - topH * 0.3} x2={base.x - 15} y2={base.y - topH}
              stroke={color} strokeWidth={0.5} strokeOpacity={0.12} />
            {/* Hanging cable */}
            <line x1={armEnd.x + 10} y1={base.y - topH} x2={armEnd.x + 10} y2={base.y - topH + 25}
              stroke={color} strokeWidth={0.4} strokeOpacity={0.15} strokeDasharray="2,2" />
            {/* Base structure */}
            <rect x={base.x - 8} y={base.y - 6} width={16} height={6}
              fill={color} fillOpacity={0.08} stroke={color} strokeWidth={0.4} strokeOpacity={0.12} />
          </g>
        );
      },
    },
    {
      label: 'Container Stack',
      draw: (ox, oy, color) => {
        const containers = [
          { gx: 22, gy: 24, w: 6, h: 3, stack: 3 },
          { gx: 24, gy: 28, w: 5, h: 3, stack: 2 },
        ];
        return (
          <g key="harbor_containers">
            {containers.map((c, ci) => {
              const cse = iso(ox + c.gx + c.w, oy + c.gy + c.h);
              const csw = iso(ox + c.gx, oy + c.gy + c.h);
              const cne = iso(ox + c.gx + c.w, oy + c.gy);
              const unitH = 8;
              return Array.from({ length: c.stack }).map((_, si) => {
                const yOff = si * unitH;
                return (
                  <g key={`cont_${ci}_${si}`}>
                    <polygon points={`${cse.x},${cse.y - yOff} ${csw.x},${csw.y - yOff} ${csw.x},${csw.y - yOff - unitH} ${cse.x},${cse.y - yOff - unitH}`}
                      fill={color} fillOpacity={0.06 + si * 0.02} stroke={color} strokeWidth={0.4} strokeOpacity={0.12} />
                    <polygon points={`${cne.x},${cne.y - yOff} ${cse.x},${cse.y - yOff} ${cse.x},${cse.y - yOff - unitH} ${cne.x},${cne.y - yOff - unitH}`}
                      fill={color} fillOpacity={0.04 + si * 0.01} stroke={color} strokeWidth={0.3} strokeOpacity={0.1} />
                  </g>
                );
              });
            })}
          </g>
        );
      },
    },
  ],
  industrial: [
    {
      label: 'Smoke Stack',
      draw: (ox, oy, color) => {
        const base1 = iso(ox + 14, oy + 16);
        const base2 = iso(ox + 20, oy + 16);
        const h1 = 75, h2 = 60;
        return (
          <g key="ind_stacks">
            {/* Chimney 1 */}
            <line x1={base1.x} y1={base1.y} x2={base1.x} y2={base1.y - h1}
              stroke={color} strokeWidth={3} strokeOpacity={0.15} strokeLinecap="round" />
            <line x1={base1.x} y1={base1.y} x2={base1.x} y2={base1.y - h1}
              stroke={color} strokeWidth={1} strokeOpacity={0.25} />
            {/* Chimney 2 */}
            <line x1={base2.x} y1={base2.y} x2={base2.x} y2={base2.y - h2}
              stroke={color} strokeWidth={2.5} strokeOpacity={0.12} strokeLinecap="round" />
            <line x1={base2.x} y1={base2.y} x2={base2.x} y2={base2.y - h2}
              stroke={color} strokeWidth={0.8} strokeOpacity={0.2} />
            {/* Smoke wisps */}
            <circle cx={base1.x + 3} cy={base1.y - h1 - 8} r={4} fill={color} fillOpacity={0.04}>
              <animate attributeName="cy" values={`${base1.y - h1 - 8};${base1.y - h1 - 22};${base1.y - h1 - 8}`} dur="5s" repeatCount="indefinite" />
              <animate attributeName="r" values="4;7;4" dur="5s" repeatCount="indefinite" />
              <animate attributeName="fillOpacity" values="0.04;0.01;0.04" dur="5s" repeatCount="indefinite" />
            </circle>
            {/* Factory base */}
            <rect x={base1.x - 20} y={base1.y - 10} width={base2.x - base1.x + 40} height={10}
              fill={color} fillOpacity={0.06} stroke={color} strokeWidth={0.4} strokeOpacity={0.1} />
          </g>
        );
      },
    },
    {
      label: 'Warehouse',
      draw: (ox, oy, color) => {
        const w = 10, h = 7, wallH = 30;
        const bnw = iso(ox + 22, oy + 24);
        const bne = iso(ox + 22 + w, oy + 24);
        const bse = iso(ox + 22 + w, oy + 24 + h);
        const bsw = iso(ox + 22, oy + 24 + h);
        return (
          <g key="ind_warehouse">
            <polygon points={`${bse.x},${bse.y} ${bsw.x},${bsw.y} ${bsw.x},${bsw.y - wallH} ${bse.x},${bse.y - wallH}`}
              fill={color} fillOpacity={0.07} stroke={color} strokeWidth={0.4} strokeOpacity={0.13} />
            <polygon points={`${bne.x},${bne.y} ${bse.x},${bse.y} ${bse.x},${bse.y - wallH} ${bne.x},${bne.y - wallH}`}
              fill={color} fillOpacity={0.05} stroke={color} strokeWidth={0.4} strokeOpacity={0.1} />
            {/* Saw-tooth roof */}
            {[0, 0.33, 0.66].map(t => {
              const rx = bsw.x + (bse.x - bsw.x) * t;
              const ry = bsw.y + (bse.y - bsw.y) * t - wallH;
              const rx2 = bsw.x + (bse.x - bsw.x) * (t + 0.33);
              const ry2 = bsw.y + (bse.y - bsw.y) * (t + 0.33) - wallH;
              return <line key={`saw_${t}`} x1={rx} y1={ry - 6} x2={rx2} y2={ry2}
                stroke={color} strokeWidth={0.5} strokeOpacity={0.15} />;
            })}
          </g>
        );
      },
    },
  ],
  residential: [
    {
      label: 'Apartment Tower',
      draw: (ox, oy, color) => {
        const w = 5, h = 6, wallH = 65;
        const bnw = iso(ox + 16, oy + 14);
        const bne = iso(ox + 16 + w, oy + 14);
        const bse = iso(ox + 16 + w, oy + 14 + h);
        const bsw = iso(ox + 16, oy + 14 + h);
        return (
          <g key="res_tower">
            <polygon points={`${bse.x},${bse.y} ${bsw.x},${bsw.y} ${bsw.x},${bsw.y - wallH} ${bse.x},${bse.y - wallH}`}
              fill={color} fillOpacity={0.09} stroke={color} strokeWidth={0.5} strokeOpacity={0.18} />
            <polygon points={`${bne.x},${bne.y} ${bse.x},${bse.y} ${bse.x},${bse.y - wallH} ${bne.x},${bne.y - wallH}`}
              fill={color} fillOpacity={0.06} stroke={color} strokeWidth={0.4} strokeOpacity={0.13} />
            <polygon points={`${bnw.x},${bnw.y - wallH} ${bne.x},${bne.y - wallH} ${bse.x},${bse.y - wallH} ${bsw.x},${bsw.y - wallH}`}
              fill={color} fillOpacity={0.1} stroke={color} strokeWidth={0.5} strokeOpacity={0.18} />
            {/* Window grid */}
            {[0.2, 0.4, 0.6, 0.8].map(wy =>
              [0.25, 0.5, 0.75].map(wx => {
                const winX = bsw.x + (bse.x - bsw.x) * wx;
                const winY = bsw.y + (bse.y - bsw.y) * wx - wallH * wy;
                return <rect key={`win_${wy}_${wx}`} x={winX - 1.5} y={winY - 1} width={3} height={2}
                  fill={color} fillOpacity={0.08} />;
              })
            )}
          </g>
        );
      },
    },
    {
      label: 'Park Pavilion',
      draw: (ox, oy, color) => {
        const cx = iso(ox + 24, oy + 26);
        return (
          <g key="res_park">
            {/* Trees */}
            {[[-2, -1], [2, 1], [0, 3]].map(([dx, dy], i) => {
              const t = iso(ox + 24 + dx, oy + 26 + dy);
              return (
                <g key={`tree_${i}`}>
                  <line x1={t.x} y1={t.y} x2={t.x} y2={t.y - 14} stroke={color} strokeWidth={0.6} strokeOpacity={0.15} />
                  <circle cx={t.x} cy={t.y - 17} r={5} fill={color} fillOpacity={0.06} stroke={color} strokeWidth={0.3} strokeOpacity={0.1} />
                </g>
              );
            })}
            {/* Pavilion roof */}
            <polygon points={`${cx.x},${cx.y - 22} ${cx.x + 15},${cx.y - 14} ${cx.x},${cx.y - 6} ${cx.x - 15},${cx.y - 14}`}
              fill={color} fillOpacity={0.07} stroke={color} strokeWidth={0.4} strokeOpacity={0.12} />
            {/* Pillars */}
            {[[-8, -14], [8, -14]].map(([dx, dy], i) =>
              <line key={`pil_${i}`} x1={cx.x + dx} y1={cx.y + dy + 8} x2={cx.x + dx} y2={cx.y + dy}
                stroke={color} strokeWidth={0.5} strokeOpacity={0.12} />
            )}
          </g>
        );
      },
    },
  ],
};

// Road connection points: from plaza edge toward each locked zone
// Plaza grid is 0-36, road spine at grid 16-17 (tile col/row 8, doubled)
function renderConnectingRoad(zoneId: string, offset: { dx: number; dy: number }, color: string): React.ReactNode {
  const roadColor = 'hsl(220,6%,35%)';
  const dashArray = '4,6';
  const segments: { x1: number; y1: number; x2: number; y2: number }[] = [];

  // Two lanes: grid 16 and 17
  switch (zoneId) {
    case 'campus': { // north
      segments.push({ ...pts(iso(16, 0), iso(offset.dx + 16, offset.dy + 36)) });
      segments.push({ ...pts(iso(17, 0), iso(offset.dx + 17, offset.dy + 36)) });
      break;
    }
    case 'harbor': { // east
      segments.push({ ...pts(iso(36, 16), iso(offset.dx, offset.dy + 16)) });
      segments.push({ ...pts(iso(36, 17), iso(offset.dx, offset.dy + 17)) });
      break;
    }
    case 'industrial': { // south
      segments.push({ ...pts(iso(16, 36), iso(offset.dx + 16, offset.dy)) });
      segments.push({ ...pts(iso(17, 36), iso(offset.dx + 17, offset.dy)) });
      break;
    }
    case 'residential': { // west
      segments.push({ ...pts(iso(0, 16), iso(offset.dx + 36, offset.dy + 16)) });
      segments.push({ ...pts(iso(0, 17), iso(offset.dx + 36, offset.dy + 17)) });
      break;
    }
  }

  return (
    <g key={`road_${zoneId}`}>
      {segments.map((s, i) => (
        <line key={`rs_${i}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
          stroke={roadColor} strokeWidth={2} strokeOpacity={0.2}
          strokeDasharray={dashArray} strokeLinecap="round" />
      ))}
      {/* Road edge glow */}
      {segments.map((s, i) => (
        <line key={`rg_${i}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
          stroke={color} strokeWidth={0.5} strokeOpacity={0.08}
          strokeDasharray={dashArray} strokeLinecap="round" />
      ))}
    </g>
  );
}

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
        
        const gridSize = zone.gridSize;
        const nw = iso(offset.dx, offset.dy);
        const ne = iso(offset.dx + gridSize, offset.dy);
        const se = iso(offset.dx + gridSize, offset.dy + gridSize);
        const sw = iso(offset.dx, offset.dy + gridSize);
        const center = iso(offset.dx + gridSize / 2, offset.dy + gridSize / 2);
        const baseColor = zone.themeColor;
        const landmarks = ZONE_LANDMARKS[zone.id] || [];
        
        return (
          <g key={zone.id} style={{ pointerEvents: 'none' }}>
            {/* Connecting road from Plaza */}
            {renderConnectingRoad(zone.id, offset, baseColor)}

            {/* Ground diamond */}
            <polygon
              points={`${nw.x},${nw.y} ${ne.x},${ne.y} ${se.x},${se.y} ${sw.x},${sw.y}`}
              fill={baseColor}
              fillOpacity={0.06}
              stroke={baseColor}
              strokeWidth={1}
              strokeOpacity={0.15}
            />

            {/* Subtle grid lines */}
            {[0.25, 0.5, 0.75].map(t => {
              const lx1 = nw.x + (ne.x - nw.x) * t;
              const ly1 = nw.y + (ne.y - nw.y) * t;
              const lx2 = sw.x + (se.x - sw.x) * t;
              const ly2 = sw.y + (se.y - sw.y) * t;
              return <line key={`h_${zone.id}_${t}`} x1={lx1} y1={ly1} x2={lx2} y2={ly2}
                stroke={baseColor} strokeWidth={0.3} strokeOpacity={0.08} />;
            })}
            {[0.25, 0.5, 0.75].map(t => {
              const lx1 = nw.x + (sw.x - nw.x) * t;
              const ly1 = nw.y + (sw.y - nw.y) * t;
              const lx2 = ne.x + (se.x - ne.x) * t;
              const ly2 = ne.y + (se.y - ne.y) * t;
              return <line key={`v_${zone.id}_${t}`} x1={lx1} y1={ly1} x2={lx2} y2={ly2}
                stroke={baseColor} strokeWidth={0.3} strokeOpacity={0.08} />;
            })}

            {/* Landmark silhouettes */}
            {landmarks.map((lm, i) => (
              <React.Fragment key={`lm_${zone.id}_${i}`}>
                {lm.draw(offset.dx, offset.dy, baseColor)}
              </React.Fragment>
            ))}

            {/* Dark overlay */}
            <polygon
              points={`${nw.x},${nw.y} ${ne.x},${ne.y} ${se.x},${se.y} ${sw.x},${sw.y}`}
              fill="hsl(0,0%,0%)"
              fillOpacity={0.5}
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
