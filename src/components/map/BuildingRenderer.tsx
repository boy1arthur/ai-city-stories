import React from 'react';
import type { Building } from '@/data/world';
import { iso, TILE_W, TILE_H, WALL_H_UNIT } from './constants';

interface Props {
  b: Building;
  namingBrand: string | null;
  wallWrapBrand: string | null;
  onClick: () => void;
}

export const BuildingRenderer: React.FC<Props> = React.memo(({ b, namingBrand, wallWrapBrand, onClick }) => {
  const wallHeight = WALL_H_UNIT * b.heightLevel;
  const nw = iso(b.gridX, b.gridY);
  const ne = iso(b.gridX + b.width, b.gridY);
  const se = iso(b.gridX + b.width, b.gridY + b.height);
  const sw = iso(b.gridX, b.gridY + b.height);
  const center = iso(b.gridX + b.width / 2, b.gridY + b.height / 2);

  const wColor = wallWrapBrand ? 'hsl(38,50%,45%)' : b.wallColor;
  const wColorDark = b.wallColor.replace(/(\d+)%\)$/, (_, n: string) => `${Math.max(0, parseInt(n) - 6)}%)`);
  const rColor = b.roofColor;
  const displayName = namingBrand ? `${namingBrand} ${b.name}` : b.name;

  // Building-type-specific window style
  const windowStyle = getWindowStyle(b.buildingType);

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      {/* Floor shadow */}
      <polygon points={`${nw.x},${nw.y + 3} ${ne.x},${ne.y + 3} ${se.x},${se.y + 3} ${sw.x},${sw.y + 3}`}
        fill="hsl(0,0%,0%)" fillOpacity={0.15} stroke="none" />

      {/* South wall */}
      <polygon points={`${se.x},${se.y} ${sw.x},${sw.y} ${sw.x},${sw.y - wallHeight} ${se.x},${se.y - wallHeight}`}
        fill={wColor} fillOpacity={0.85} stroke={wColorDark} strokeWidth={0.6} />

      {/* South wall windows */}
      {[...Array(b.width)].map((_, wi) => {
        const t = (wi + 0.5) / b.width;
        const wx = sw.x + (se.x - sw.x) * t;
        const wy = sw.y + (se.y - sw.y) * t;
        return [...Array(b.heightLevel)].map((_, hi) => {
          const winY = wy - wallHeight + (wallHeight / (b.heightLevel + 1)) * (hi + 1);
          return (
            <rect key={`sw_${wi}_${hi}`} x={wx - windowStyle.w / 2} y={winY - windowStyle.h / 2}
              width={windowStyle.w} height={windowStyle.h} rx={windowStyle.rx}
              fill={windowStyle.fill} fillOpacity={windowStyle.opacity}
              stroke={windowStyle.stroke} strokeWidth={0.3} />
          );
        });
      })}

      {/* Wall wrap overlay */}
      {wallWrapBrand && (
        <>
          <polygon points={`${se.x},${se.y} ${sw.x},${sw.y} ${sw.x},${sw.y - wallHeight} ${se.x},${se.y - wallHeight}`}
            fill="hsl(38,75%,50%)" fillOpacity={0.1} />
          <text x={(sw.x + se.x) / 2} y={(sw.y + se.y) / 2 - wallHeight / 2}
            textAnchor="middle" fontSize={7} fill="hsl(38,75%,50%)" fontFamily="Inter" fontWeight={700} opacity={0.6}>
            {wallWrapBrand}
          </text>
        </>
      )}

      {/* East wall */}
      <polygon points={`${ne.x},${ne.y} ${se.x},${se.y} ${se.x},${se.y - wallHeight} ${ne.x},${ne.y - wallHeight}`}
        fill={wColorDark} fillOpacity={0.75} stroke={wColorDark} strokeWidth={0.6} />

      {/* East wall windows */}
      {[...Array(b.height)].map((_, wi) => {
        const t = (wi + 0.5) / b.height;
        const wx = ne.x + (se.x - ne.x) * t;
        const wy = ne.y + (se.y - ne.y) * t;
        return [...Array(b.heightLevel)].map((_, hi) => {
          const winY = wy - wallHeight + (wallHeight / (b.heightLevel + 1)) * (hi + 1);
          return (
            <rect key={`ew_${wi}_${hi}`} x={wx - windowStyle.w / 2 + 0.5} y={winY - windowStyle.h / 2}
              width={windowStyle.w - 1} height={windowStyle.h} rx={windowStyle.rx}
              fill={windowStyle.fill} fillOpacity={windowStyle.opacity * 0.85}
              stroke={windowStyle.stroke} strokeWidth={0.3} />
          );
        });
      })}

      {/* Building-type-specific ground detail */}
      {b.buildingType === 'shop' && (
        // Awning on south wall
        <polygon
          points={`${sw.x},${sw.y - 4} ${se.x},${se.y - 4} ${se.x + 3},${se.y + 2} ${sw.x + 3},${sw.y + 2}`}
          fill="hsl(10,35%,45%)" fillOpacity={0.5} stroke="hsl(10,30%,35%)" strokeWidth={0.4} />
      )}
      {b.buildingType === 'campus' && (
        // Entrance steps
        <g>
          {[0, 1, 2].map(step => {
            const midX = (sw.x + se.x) / 2;
            const midY = (sw.y + se.y) / 2;
            return (
              <rect key={step} x={midX - 6 + step} y={midY + step * 2} width={12 - step * 2} height={2}
                fill="hsl(25,15%,55%)" fillOpacity={0.4} rx={0.5} />
            );
          })}
        </g>
      )}

      {/* Roof */}
      <polygon points={`${nw.x},${nw.y - wallHeight} ${ne.x},${ne.y - wallHeight} ${se.x},${se.y - wallHeight} ${sw.x},${sw.y - wallHeight}`}
        fill={rColor} fillOpacity={0.75} stroke={wColorDark} strokeWidth={0.8} strokeOpacity={0.5} />

      {/* Roof detail by shape */}
      <RoofDetail shape={b.roofShape} center={center} nw={nw} ne={ne} sw={sw} se={se}
        wallHeight={wallHeight} rColor={rColor} wColorDark={wColorDark} width={b.width} height={b.height} />

      {/* Emoji + label */}
      <text x={center.x} y={center.y - wallHeight - 4} textAnchor="middle" fontSize={12}>{b.emoji}</text>
      <text x={center.x} y={se.y + 10} textAnchor="middle" fontSize={6}
        fill="hsl(210,15%,75%)" fontFamily="Inter" fontWeight={600} opacity={0.8}>{displayName}</text>
    </g>
  );
});
BuildingRenderer.displayName = 'BuildingRenderer';

function getWindowStyle(type: Building['buildingType']) {
  switch (type) {
    case 'shop': return { w: 7, h: 5, rx: 0.5, fill: 'hsl(45,30%,70%)', opacity: 0.4, stroke: 'hsl(30,15%,50%)' };
    case 'campus': return { w: 5, h: 6, rx: 1, fill: 'hsl(200,25%,60%)', opacity: 0.35, stroke: 'hsl(210,15%,50%)' };
    case 'warehouse': return { w: 8, h: 3, rx: 0, fill: 'hsl(215,8%,50%)', opacity: 0.2, stroke: 'hsl(215,6%,45%)' };
    case 'tower': return { w: 4, h: 5, rx: 0.5, fill: 'hsl(200,30%,65%)', opacity: 0.4, stroke: 'hsl(210,20%,55%)' };
    case 'civic': return { w: 6, h: 5, rx: 1, fill: 'hsl(200,25%,62%)', opacity: 0.38, stroke: 'hsl(210,15%,52%)' };
    case 'park_structure': return { w: 5, h: 4, rx: 1.5, fill: 'hsl(130,20%,55%)', opacity: 0.3, stroke: 'hsl(130,15%,45%)' };
    default: return { w: 6, h: 4, rx: 0.5, fill: 'hsl(200,25%,60%)', opacity: 0.35, stroke: 'hsl(210,15%,55%)' };
  }
}

const RoofDetail: React.FC<{
  shape: Building['roofShape'];
  center: { x: number; y: number };
  nw: { x: number; y: number };
  ne: { x: number; y: number };
  sw: { x: number; y: number };
  se: { x: number; y: number };
  wallHeight: number;
  rColor: string;
  wColorDark: string;
  width: number;
  height: number;
}> = ({ shape, center, nw, ne, sw, wallHeight, rColor, wColorDark, width, height }) => {
  switch (shape) {
    case 'gabled':
      return (
        <polygon points={`${(nw.x + sw.x) / 2},${(nw.y + sw.y) / 2 - wallHeight - 8} ${nw.x},${nw.y - wallHeight} ${sw.x},${sw.y - wallHeight}`}
          fill={rColor} fillOpacity={0.5} stroke={wColorDark} strokeWidth={0.6} />
      );
    case 'hip':
      return (
        <>
          <polygon points={`${center.x},${center.y - wallHeight - 6} ${nw.x},${nw.y - wallHeight} ${ne.x},${ne.y - wallHeight}`}
            fill={rColor} fillOpacity={0.45} stroke={wColorDark} strokeWidth={0.5} />
          <polygon points={`${center.x},${center.y - wallHeight - 6} ${sw.x},${sw.y - wallHeight} ${nw.x},${nw.y - wallHeight}`}
            fill={rColor} fillOpacity={0.55} stroke={wColorDark} strokeWidth={0.5} />
        </>
      );
    case 'antenna':
      return (
        <g>
          <line x1={center.x} y1={center.y - wallHeight} x2={center.x} y2={center.y - wallHeight - 18}
            stroke="hsl(215,8%,55%)" strokeWidth={1.2} />
          <circle cx={center.x} cy={center.y - wallHeight - 20} r={1.5} fill="hsl(0,60%,50%)" opacity={0.7}>
            <animate attributeName="opacity" values="0.4;0.9;0.4" dur="2s" repeatCount="indefinite" />
          </circle>
        </g>
      );
    case 'dome':
      return (
        <ellipse cx={center.x} cy={center.y - wallHeight - 3}
          rx={Math.min(width, height) * TILE_W * 0.13} ry={Math.min(width, height) * TILE_H * 0.13 + 4}
          fill={rColor} fillOpacity={0.5} stroke={wColorDark} strokeWidth={0.6} />
      );
    case 'garden':
      return (
        <g>{[...Array(3)].map((_, i) => (
          <circle key={i} cx={center.x + (i - 1) * 10} cy={center.y - wallHeight - 3} r={4} fill="hsl(130,28%,40%)" fillOpacity={0.7} />
        ))}</g>
      );
    case 'gear':
      return (
        <circle cx={center.x} cy={center.y - wallHeight - 3} r={5}
          fill="none" stroke="hsl(215,8%,50%)" strokeWidth={1.2} strokeOpacity={0.5} strokeDasharray="3 2">
          <animateTransform attributeName="transform" type="rotate" from={`0 ${center.x} ${center.y - wallHeight - 3}`} to={`360 ${center.x} ${center.y - wallHeight - 3}`} dur="20s" repeatCount="indefinite" />
        </circle>
      );
    case 'lantern':
      return (
        <circle cx={center.x} cy={center.y - wallHeight - 4} r={2.5} fill="hsl(40,70%,55%)" fillOpacity={0.4}>
          <animate attributeName="fillOpacity" values="0.25;0.55;0.25" dur="2.5s" repeatCount="indefinite" />
        </circle>
      );
    case 'telescope':
      return (
        <g>
          <line x1={center.x - 5} y1={center.y - wallHeight} x2={center.x + 3} y2={center.y - wallHeight - 12}
            stroke="hsl(215,10%,50%)" strokeWidth={1.8} strokeLinecap="round" />
          <circle cx={center.x + 4} cy={center.y - wallHeight - 13} r={2} fill="hsl(200,20%,55%)" fillOpacity={0.5} />
        </g>
      );
    default:
      return null;
  }
};
