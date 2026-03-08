import React from 'react';
import type { Building } from '@/data/world';
import { iso, WALL_H_UNIT } from './constants';

interface Props {
  b: Building;
  onClick: () => void;
}

/**
 * Renders unique landmark visuals that replace the generic BuildingRenderer.
 * Each landmark is a hand-crafted SVG illustration.
 */
export const LandmarkRenderer: React.FC<Props> = React.memo(({ b, onClick }) => {
  switch (b.landmarkType) {
    case 'clock_tower':
      return <ClockTowerLandmark b={b} onClick={onClick} />;
    case 'lighthouse':
      return <LighthouseLandmark b={b} onClick={onClick} />;
    case 'neon_obelisk':
      return <NeonObeliskLandmark b={b} onClick={onClick} />;
    case 'golden_pavilion':
      return <GoldenPavilionLandmark b={b} onClick={onClick} />;
    default:
      return null;
  }
});
LandmarkRenderer.displayName = 'LandmarkRenderer';

// ═══════════════════════════════════════════
// CAMPUS: Clock Tower — Ivy-covered brick tower with clock face & bell
// ═══════════════════════════════════════════
const ClockTowerLandmark: React.FC<Props> = ({ b, onClick }) => {
  const base = iso(b.gridX + b.width / 2, b.gridY + b.height / 2);
  const cx = base.x;
  const cy = base.y;
  const towerH = 85;
  const towerW = 12;

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      {/* Ground shadow */}
      <ellipse cx={cx + 4} cy={cy + 3} rx={18} ry={8} fill="hsl(0,0%,0%)" opacity={0.2} />

      {/* Foundation — stone base */}
      <polygon points={`${cx - 16},${cy} ${cx + 16},${cy} ${cx + 14},${cy - 8} ${cx - 14},${cy - 8}`}
        fill="hsl(25,18%,38%)" stroke="hsl(25,14%,30%)" strokeWidth={0.6} />
      {/* Steps */}
      {[0, 1, 2].map(i => (
        <rect key={i} x={cx - 14 + i * 2} y={cy - i * 2.5} width={28 - i * 4} height={2.5} rx={0.3}
          fill={`hsl(25,15%,${42 + i * 3}%)`} fillOpacity={0.7} />
      ))}

      {/* Main tower body — brick */}
      <rect x={cx - towerW} y={cy - towerH} width={towerW * 2} height={towerH - 8} rx={1}
        fill="hsl(8,32%,42%)" stroke="hsl(8,28%,32%)" strokeWidth={0.8} />
      {/* Right face (darker) */}
      <polygon points={`${cx + towerW},${cy - 8} ${cx + towerW + 6},${cy - 4} ${cx + towerW + 6},${cy - towerH + 4} ${cx + towerW},${cy - towerH}`}
        fill="hsl(8,28%,34%)" stroke="hsl(8,24%,28%)" strokeWidth={0.5} />

      {/* Brick pattern */}
      {[...Array(12)].map((_, i) => (
        <line key={`br_${i}`} x1={cx - towerW + 1} y1={cy - 12 - i * 6}
          x2={cx + towerW - 1} y2={cy - 12 - i * 6}
          stroke="hsl(8,22%,36%)" strokeWidth={0.3} strokeOpacity={0.4} />
      ))}

      {/* Windows — arched */}
      {[1, 2, 3, 4].map(floor => {
        const wy = cy - 15 - floor * 15;
        return (
          <g key={`w_${floor}`}>
            <rect x={cx - 4} y={wy - 5} width={8} height={7} rx={1}
              fill="hsl(200,25%,55%)" fillOpacity={0.35} stroke="hsl(25,15%,48%)" strokeWidth={0.4} />
            <path d={`M${cx - 4},${wy - 5} Q${cx},${wy - 9} ${cx + 4},${wy - 5}`}
              fill="hsl(200,25%,55%)" fillOpacity={0.25} stroke="hsl(25,15%,48%)" strokeWidth={0.4} />
          </g>
        );
      })}

      {/* Clock face */}
      <circle cx={cx} cy={cy - towerH + 12} r={8}
        fill="hsl(45,40%,85%)" stroke="hsl(43,50%,45%)" strokeWidth={1.2} />
      <circle cx={cx} cy={cy - towerH + 12} r={7}
        fill="hsl(45,30%,92%)" stroke="hsl(43,45%,55%)" strokeWidth={0.5} />
      {/* Hour markers */}
      {[...Array(12)].map((_, i) => {
        const a = (i * 30 - 90) * Math.PI / 180;
        const r = 5.5;
        return <circle key={i} cx={cx + Math.cos(a) * r} cy={cy - towerH + 12 + Math.sin(a) * r}
          r={0.6} fill="hsl(43,40%,35%)" />;
      })}
      {/* Clock hands */}
      <line x1={cx} y1={cy - towerH + 12} x2={cx} y2={cy - towerH + 12 - 5}
        stroke="hsl(0,0%,15%)" strokeWidth={0.8} strokeLinecap="round" />
      <line x1={cx} y1={cy - towerH + 12} x2={cx + 3.5} y2={cy - towerH + 12 + 1}
        stroke="hsl(0,0%,15%)" strokeWidth={0.6} strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate"
          from={`0 ${cx} ${cy - towerH + 12}`} to={`360 ${cx} ${cy - towerH + 12}`}
          dur="60s" repeatCount="indefinite" />
      </line>

      {/* Ivy vines climbing up */}
      {[-1, 1].map(side => (
        <g key={`ivy_${side}`}>
          {[0, 1, 2, 3, 4].map(i => (
            <circle key={i}
              cx={cx + side * (towerW - 2) + (i % 2) * side * 2}
              cy={cy - 10 - i * 12}
              r={3 + (i % 2)} fill={`hsl(${130 + i * 5},28%,${35 + i * 3}%)`} fillOpacity={0.6} />
          ))}
        </g>
      ))}

      {/* Pointed roof / spire */}
      <polygon points={`${cx - towerW - 1},${cy - towerH} ${cx + towerW + 1},${cy - towerH} ${cx},${cy - towerH - 20}`}
        fill="hsl(8,22%,30%)" stroke="hsl(8,18%,24%)" strokeWidth={0.6} />
      <polygon points={`${cx + towerW + 1},${cy - towerH} ${cx + towerW + 7},${cy - towerH + 4} ${cx + 2},${cy - towerH - 18}`}
        fill="hsl(8,18%,26%)" stroke="hsl(8,14%,20%)" strokeWidth={0.4} />

      {/* Bell at top */}
      <ellipse cx={cx} cy={cy - towerH - 16} rx={3} ry={2}
        fill="hsl(43,55%,55%)" stroke="hsl(43,45%,40%)" strokeWidth={0.5} />

      {/* Name label */}
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize={4}
        fill="hsl(8,30%,55%)" fontFamily="serif" fontWeight={700} opacity={0.7}>
        🕐 CLOCK TOWER
      </text>
    </g>
  );
};

// ═══════════════════════════════════════════
// HARBOR: Grand Lighthouse — White & red beacon with rotating light beam
// ═══════════════════════════════════════════
const LighthouseLandmark: React.FC<Props> = ({ b, onClick }) => {
  const base = iso(b.gridX + b.width / 2, b.gridY + b.height / 2);
  const cx = base.x;
  const cy = base.y;
  const towerH = 90;

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      {/* Ground shadow */}
      <ellipse cx={cx + 5} cy={cy + 3} rx={20} ry={9} fill="hsl(0,0%,0%)" opacity={0.18} />

      {/* Rocky base */}
      <ellipse cx={cx} cy={cy + 2} rx={18} ry={8} fill="hsl(25,12%,42%)" opacity={0.7} />
      <ellipse cx={cx - 3} cy={cy + 1} rx={10} ry={5} fill="hsl(25,10%,46%)" opacity={0.5} />

      {/* Tower body — tapers upward */}
      <polygon points={`${cx - 14},${cy} ${cx + 14},${cy} ${cx + 8},${cy - towerH} ${cx - 8},${cy - towerH}`}
        fill="hsl(0,0%,92%)" stroke="hsl(0,0%,78%)" strokeWidth={0.8} />
      {/* Right face */}
      <polygon points={`${cx + 14},${cy} ${cx + 20},${cy - 3} ${cx + 13},${cy - towerH + 3} ${cx + 8},${cy - towerH}`}
        fill="hsl(0,0%,82%)" stroke="hsl(0,0%,72%)" strokeWidth={0.5} />

      {/* Red stripes */}
      {[0, 1, 2].map(i => {
        const y1 = cy - 15 - i * 25;
        const y2 = y1 - 8;
        const w1 = 14 - (15 + i * 25) / towerH * 6;
        const w2 = 14 - (23 + i * 25) / towerH * 6;
        return (
          <polygon key={i}
            points={`${cx - w1},${y1} ${cx + w1},${y1} ${cx + w2},${y2} ${cx - w2},${y2}`}
            fill="hsl(5,65%,48%)" fillOpacity={0.8} />
        );
      })}

      {/* Windows — small port holes */}
      {[1, 2, 3, 4, 5].map(i => {
        const wy = cy - 8 - i * 14;
        return <circle key={i} cx={cx} cy={wy} r={2.5}
          fill="hsl(200,30%,60%)" fillOpacity={0.4}
          stroke="hsl(0,0%,70%)" strokeWidth={0.4} />;
      })}

      {/* Lantern room — glass enclosure at top */}
      <rect x={cx - 10} y={cy - towerH - 10} width={20} height={12} rx={1}
        fill="hsl(45,50%,70%)" fillOpacity={0.3}
        stroke="hsl(0,0%,65%)" strokeWidth={0.6} />
      {/* Glass panes */}
      {[-6, -2, 2, 6].map(off => (
        <line key={off} x1={cx + off} y1={cy - towerH - 10} x2={cx + off} y2={cy - towerH + 2}
          stroke="hsl(0,0%,60%)" strokeWidth={0.4} strokeOpacity={0.5} />
      ))}

      {/* Gallery railing */}
      <line x1={cx - 12} y1={cy - towerH} x2={cx + 12} y2={cy - towerH}
        stroke="hsl(0,0%,50%)" strokeWidth={1} />
      {[-10, -6, -2, 2, 6, 10].map(off => (
        <line key={off} x1={cx + off} y1={cy - towerH} x2={cx + off} y2={cy - towerH + 2}
          stroke="hsl(0,0%,55%)" strokeWidth={0.5} />
      ))}

      {/* Light beam — rotating */}
      <g>
        <polygon
          points={`${cx},${cy - towerH - 4} ${cx - 50},${cy - towerH - 20} ${cx - 45},${cy - towerH - 14}`}
          fill="hsl(45,80%,70%)" fillOpacity={0.12}>
          <animateTransform attributeName="transform" type="rotate"
            from={`0 ${cx} ${cy - towerH - 4}`} to={`360 ${cx} ${cy - towerH - 4}`}
            dur="6s" repeatCount="indefinite" />
        </polygon>
      </g>
      {/* Light source glow */}
      <circle cx={cx} cy={cy - towerH - 4} r={4} fill="hsl(45,80%,75%)" fillOpacity={0.6}>
        <animate attributeName="fillOpacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx={cx} cy={cy - towerH - 4} r={8} fill="hsl(45,70%,70%)" fillOpacity={0.1}>
        <animate attributeName="fillOpacity" values="0.05;0.15;0.05" dur="2s" repeatCount="indefinite" />
      </circle>

      {/* Dome cap */}
      <ellipse cx={cx} cy={cy - towerH - 10} rx={8} ry={5}
        fill="hsl(5,55%,42%)" stroke="hsl(5,45%,32%)" strokeWidth={0.6} />
      <circle cx={cx} cy={cy - towerH - 14} r={2}
        fill="hsl(5,50%,38%)" />

      {/* Seagulls */}
      {[[-18, -60], [22, -70], [-25, -45]].map(([ox, oy], i) => (
        <path key={i} d={`M${cx + ox - 3},${cy + oy} Q${cx + ox},${cy + oy - 2} ${cx + ox + 3},${cy + oy}`}
          fill="none" stroke="hsl(0,0%,80%)" strokeWidth={0.6} strokeOpacity={0.5}>
          <animateTransform attributeName="transform" type="translate"
            values={`0,0;${i * 2},${-i};0,0`} dur={`${4 + i}s`} repeatCount="indefinite" />
        </path>
      ))}

      <text x={cx} y={cy + 14} textAnchor="middle" fontSize={4}
        fill="hsl(5,55%,50%)" fontFamily="serif" fontWeight={700} opacity={0.7}>
        🗼 LIGHTHOUSE
      </text>
    </g>
  );
};

// ═══════════════════════════════════════════
// INDUSTRIAL: Neon Obelisk — Cyberpunk mega-structure with pulsing neon
// ═══════════════════════════════════════════
const NeonObeliskLandmark: React.FC<Props> = ({ b, onClick }) => {
  const base = iso(b.gridX + b.width / 2, b.gridY + b.height / 2);
  const cx = base.x;
  const cy = base.y;
  const towerH = 100;

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      {/* Neon ground glow */}
      <ellipse cx={cx} cy={cy + 3} rx={25} ry={10} fill="hsl(280,60%,50%)" opacity={0.08}>
        <animate attributeName="opacity" values="0.05;0.12;0.05" dur="3s" repeatCount="indefinite" />
      </ellipse>

      {/* Dark base platform */}
      <polygon points={`${cx - 20},${cy} ${cx + 20},${cy} ${cx + 18},${cy - 5} ${cx - 18},${cy - 5}`}
        fill="hsl(260,10%,12%)" stroke="hsl(280,60%,40%)" strokeWidth={0.5} strokeOpacity={0.6} />

      {/* Main obelisk body — ultra dark */}
      <polygon points={`${cx - 12},${cy - 5} ${cx + 12},${cy - 5} ${cx + 4},${cy - towerH} ${cx - 4},${cy - towerH}`}
        fill="hsl(260,12%,10%)" stroke="hsl(280,50%,30%)" strokeWidth={0.6} />
      {/* Right face */}
      <polygon points={`${cx + 12},${cy - 5} ${cx + 18},${cy - 2} ${cx + 8},${cy - towerH + 4} ${cx + 4},${cy - towerH}`}
        fill="hsl(260,10%,8%)" stroke="hsl(280,45%,25%)" strokeWidth={0.4} />

      {/* Horizontal neon lines */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
        const y = cy - 12 - i * 11;
        const progress = (12 + i * 11) / towerH;
        const halfW = 12 - progress * 8;
        const hue = 280 + i * 15;
        return (
          <line key={i} x1={cx - halfW} y1={y} x2={cx + halfW} y2={y}
            stroke={`hsl(${hue % 360},70%,55%)`} strokeWidth={1.2} strokeOpacity={0.7}>
            <animate attributeName="strokeOpacity"
              values={`${0.3 + (i % 3) * 0.1};${0.8 - (i % 2) * 0.1};${0.3 + (i % 3) * 0.1}`}
              dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
          </line>
        );
      })}

      {/* Vertical neon strips on edges */}
      {[-1, 1].map(side => (
        <g key={side}>
          <line x1={cx + side * 12} y1={cy - 5} x2={cx + side * 4} y2={cy - towerH}
            stroke="hsl(180,70%,50%)" strokeWidth={0.8} strokeOpacity={0.5}>
            <animate attributeName="strokeOpacity" values="0.3;0.7;0.3" dur="2.5s" repeatCount="indefinite" />
          </line>
        </g>
      ))}

      {/* Digital screens on face */}
      {[0, 1, 2].map(i => {
        const y = cy - 20 - i * 22;
        const hw = 8 - i * 1.5;
        const colors = ['hsl(340,65%,50%)', 'hsl(180,65%,45%)', 'hsl(50,70%,55%)'];
        return (
          <g key={`scr_${i}`}>
            <rect x={cx - hw} y={y - 6} width={hw * 2} height={10} rx={0.5}
              fill={colors[i]} fillOpacity={0.15}
              stroke={colors[i]} strokeWidth={0.5} strokeOpacity={0.6} />
            {/* Scan line effect */}
            <line x1={cx - hw + 1} y1={y} x2={cx + hw - 1} y2={y}
              stroke="hsl(0,0%,100%)" strokeWidth={0.3} strokeOpacity={0.2}>
              <animate attributeName="y1" values={`${y - 5};${y + 3};${y - 5}`} dur={`${1.5 + i * 0.5}s`} repeatCount="indefinite" />
              <animate attributeName="y2" values={`${y - 5};${y + 3};${y - 5}`} dur={`${1.5 + i * 0.5}s`} repeatCount="indefinite" />
            </line>
          </g>
        );
      })}

      {/* Apex — glowing crystal */}
      <polygon points={`${cx - 4},${cy - towerH} ${cx + 4},${cy - towerH} ${cx},${cy - towerH - 15}`}
        fill="hsl(280,50%,25%)" stroke="hsl(280,70%,55%)" strokeWidth={1}>
        <animate attributeName="fill" values="hsl(280,50%,25%);hsl(280,60%,35%);hsl(280,50%,25%)" dur="3s" repeatCount="indefinite" />
      </polygon>
      {/* Apex glow */}
      <circle cx={cx} cy={cy - towerH - 12} r={5} fill="hsl(280,70%,60%)" fillOpacity={0.15}>
        <animate attributeName="fillOpacity" values="0.08;0.25;0.08" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx={cx} cy={cy - towerH - 12} r={2} fill="hsl(280,70%,65%)" fillOpacity={0.5}>
        <animate attributeName="fillOpacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
      </circle>

      {/* Floating holographic ring */}
      <ellipse cx={cx} cy={cy - towerH + 20} rx={16} ry={4}
        fill="none" stroke="hsl(180,60%,50%)" strokeWidth={0.6} strokeOpacity={0.3}>
        <animate attributeName="strokeOpacity" values="0.1;0.4;0.1" dur="4s" repeatCount="indefinite" />
        <animateTransform attributeName="transform" type="translate"
          values="0,0;0,-3;0,0" dur="4s" repeatCount="indefinite" />
      </ellipse>

      <text x={cx} y={cy + 14} textAnchor="middle" fontSize={4}
        fill="hsl(280,60%,60%)" fontFamily="monospace" fontWeight={700} opacity={0.7}>
        ⚡ NEON OBELISK
      </text>
    </g>
  );
};

// ═══════════════════════════════════════════
// RESIDENTIAL: Golden Pavilion — Elegant zen-inspired structure with reflecting pool
// ═══════════════════════════════════════════
const GoldenPavilionLandmark: React.FC<Props> = ({ b, onClick }) => {
  const base = iso(b.gridX + b.width / 2, b.gridY + b.height / 2);
  const cx = base.x;
  const cy = base.y;

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      {/* Reflecting pool */}
      <ellipse cx={cx} cy={cy + 6} rx={28} ry={10}
        fill="hsl(195,25%,32%)" stroke="hsl(30,12%,40%)" strokeWidth={0.5} opacity={0.6} />
      {/* Water shimmer */}
      <ellipse cx={cx - 5} cy={cy + 4} rx={18} ry={5}
        fill="hsl(195,30%,40%)" opacity={0.15}>
        <animate attributeName="opacity" values="0.1;0.2;0.1" dur="3s" repeatCount="indefinite" />
      </ellipse>

      {/* Stone platform */}
      <polygon points={`${cx - 22},${cy} ${cx + 22},${cy} ${cx + 20},${cy - 4} ${cx - 20},${cy - 4}`}
        fill="hsl(30,10%,48%)" stroke="hsl(30,8%,38%)" strokeWidth={0.5} />

      {/* Pillars — 6 columns */}
      {[-15, -9, -3, 3, 9, 15].map((off, i) => (
        <g key={i}>
          <rect x={cx + off - 1} y={cy - 40} width={2} height={36} rx={0.3}
            fill="hsl(35,16%,52%)" stroke="hsl(35,12%,42%)" strokeWidth={0.3} />
          {/* Capital detail */}
          <rect x={cx + off - 2} y={cy - 42} width={4} height={3} rx={0.5}
            fill="hsl(35,18%,48%)" />
        </g>
      ))}

      {/* First floor */}
      <polygon points={`${cx - 24},${cy - 40} ${cx + 24},${cy - 40} ${cx + 22},${cy - 43} ${cx - 22},${cy - 43}`}
        fill="hsl(43,45%,48%)" stroke="hsl(43,40%,38%)" strokeWidth={0.5} />

      {/* Second floor pillars */}
      {[-10, -4, 4, 10].map((off, i) => (
        <rect key={i} x={cx + off - 0.8} y={cy - 65} width={1.6} height={22} rx={0.2}
          fill="hsl(35,16%,52%)" stroke="hsl(35,12%,42%)" strokeWidth={0.2} />
      ))}

      {/* Second floor platform */}
      <polygon points={`${cx - 18},${cy - 65} ${cx + 18},${cy - 65} ${cx + 16},${cy - 68} ${cx - 16},${cy - 68}`}
        fill="hsl(43,48%,50%)" stroke="hsl(43,42%,40%)" strokeWidth={0.5} />

      {/* Golden roof — first tier (curved) */}
      <path d={`M${cx - 26},${cy - 40} Q${cx},${cy - 50} ${cx + 26},${cy - 40}`}
        fill="hsl(43,55%,52%)" fillOpacity={0.85} stroke="hsl(43,50%,38%)" strokeWidth={0.6} />
      {/* Roof edge */}
      <line x1={cx - 26} y1={cy - 40} x2={cx + 26} y2={cy - 40}
        stroke="hsl(43,50%,42%)" strokeWidth={0.8} />

      {/* Golden roof — second tier */}
      <path d={`M${cx - 20},${cy - 65} Q${cx},${cy - 75} ${cx + 20},${cy - 65}`}
        fill="hsl(43,58%,55%)" fillOpacity={0.85} stroke="hsl(43,52%,42%)" strokeWidth={0.6} />

      {/* Apex finial */}
      <line x1={cx} y1={cy - 75} x2={cx} y2={cy - 82}
        stroke="hsl(43,50%,45%)" strokeWidth={1.2} />
      <circle cx={cx} cy={cy - 83} r={2.5}
        fill="hsl(43,60%,60%)" stroke="hsl(43,55%,45%)" strokeWidth={0.5} />
      {/* Golden glow */}
      <circle cx={cx} cy={cy - 83} r={6} fill="hsl(43,55%,60%)" fillOpacity={0.08}>
        <animate attributeName="fillOpacity" values="0.05;0.12;0.05" dur="4s" repeatCount="indefinite" />
      </circle>

      {/* Reflection in pool */}
      <path d={`M${cx - 16},${cy + 6} Q${cx},${cy + 2} ${cx + 16},${cy + 6}`}
        fill="none" stroke="hsl(43,40%,50%)" strokeWidth={0.5} strokeOpacity={0.2}>
        <animate attributeName="strokeOpacity" values="0.1;0.25;0.1" dur="3s" repeatCount="indefinite" />
      </path>

      {/* Garden trees beside pavilion */}
      {[-30, 30].map((off, i) => (
        <g key={i}>
          <line x1={cx + off} y1={cy - 2} x2={cx + off} y2={cy - 14}
            stroke="hsl(30,15%,40%)" strokeWidth={1.2} />
          <circle cx={cx + off} cy={cy - 16} r={5}
            fill="hsl(140,20%,36%)" opacity={0.6} />
          <circle cx={cx + off - 1.5} cy={cy - 18} r={3.5}
            fill="hsl(140,22%,40%)" opacity={0.5} />
        </g>
      ))}

      <text x={cx} y={cy + 20} textAnchor="middle" fontSize={4}
        fill="hsl(43,45%,50%)" fontFamily="serif" fontWeight={700} opacity={0.7}>
        🏯 GOLDEN PAVILION
      </text>
    </g>
  );
};
