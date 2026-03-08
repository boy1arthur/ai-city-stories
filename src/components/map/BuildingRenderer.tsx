import React from 'react';
import type { Building } from '@/data/world';
import { iso, TILE_W, TILE_H, WALL_H_UNIT } from './constants';

interface BrandSkin {
  name: string;
  color: string; // hsl string
}

interface Props {
  b: Building;
  namingBrand: string | null;
  wallWrapBrand: string | null;
  brandSkin: BrandSkin | null;
  onClick: () => void;
}

export const BuildingRenderer: React.FC<Props> = React.memo(({ b, namingBrand, wallWrapBrand, brandSkin, onClick }) => {
  const wallHeight = WALL_H_UNIT * b.heightLevel;
  const nw = iso(b.gridX, b.gridY);
  const ne = iso(b.gridX + b.width, b.gridY);
  const se = iso(b.gridX + b.width, b.gridY + b.height);
  const sw = iso(b.gridX, b.gridY + b.height);
  const center = iso(b.gridX + b.width / 2, b.gridY + b.height / 2);

  // If brand skin is active, override wall/roof colors
  const hasSkin = !!brandSkin;
  const skinColor = brandSkin?.color || '';
  const skinDark = hasSkin ? skinColor.replace(/(\d+)%\)$/, (_, n: string) => `${Math.max(0, parseInt(n) - 15)}%)`) : '';
  const skinLight = hasSkin ? skinColor.replace(/(\d+)%\)$/, (_, n: string) => `${Math.min(95, parseInt(n) + 10)}%)`) : '';

  const wColor = hasSkin ? skinDark : (wallWrapBrand ? 'hsl(38,50%,45%)' : b.wallColor);
  const wColorDark = hasSkin
    ? skinColor.replace(/(\d+)%\)$/, (_, n: string) => `${Math.max(0, parseInt(n) - 22)}%)`)
    : b.wallColor.replace(/(\d+)%\)$/, (_, n: string) => `${Math.max(0, parseInt(n) - 8)}%)`);
  const wColorLight = hasSkin ? skinLight : b.wallColor.replace(/(\d+)%\)$/, (_, n: string) => `${Math.min(95, parseInt(n) + 6)}%)`);
  const rColor = hasSkin ? skinColor.replace(/(\d+)%\)$/, (_, n: string) => `${Math.max(0, parseInt(n) - 18)}%)`) : b.roofColor;
  const displayName = namingBrand ? `${namingBrand} ${b.name}` : b.name;
  const winStyle = getWindowStyle(b.buildingType);
  const seed = b.gridX * 17 + b.gridY * 31;

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      {/* ── Ambient occlusion (soft ground shadow) ── */}
      <polygon points={`${nw.x},${nw.y + 4} ${ne.x},${ne.y + 4} ${se.x},${se.y + 4} ${sw.x},${sw.y + 4}`}
        fill="hsl(0,0%,0%)" fillOpacity={0.2} stroke="none" />
      <polygon points={`${nw.x},${nw.y + 2} ${ne.x},${ne.y + 2} ${se.x},${se.y + 2} ${sw.x},${sw.y + 2}`}
        fill="hsl(0,0%,0%)" fillOpacity={0.1} stroke="none" />

      {/* ── Foundation / base strip ── */}
      <polygon points={`${sw.x},${sw.y} ${se.x},${se.y} ${se.x},${se.y - 2} ${sw.x},${sw.y - 2}`}
        fill="hsl(220,5%,35%)" fillOpacity={0.6} stroke="none" />
      <polygon points={`${ne.x},${ne.y} ${se.x},${se.y} ${se.x},${se.y - 2} ${ne.x},${ne.y - 2}`}
        fill="hsl(220,5%,30%)" fillOpacity={0.6} stroke="none" />

      {/* ── South wall ── */}
      <polygon points={`${se.x},${se.y} ${sw.x},${sw.y} ${sw.x},${sw.y - wallHeight} ${se.x},${se.y - wallHeight}`}
        fill={wColor} stroke={wColorDark} strokeWidth={0.6} />

      {/* South wall floor lines */}
      {[...Array(b.heightLevel)].map((_, fi) => {
        const ratio = (fi + 1) / (b.heightLevel + 0.5);
        const y1 = sw.y - wallHeight * ratio;
        const y2 = se.y - wallHeight * ratio;
        return (
          <line key={`sfl_${fi}`}
            x1={sw.x} y1={y1} x2={se.x} y2={y2}
            stroke={wColorDark} strokeWidth={0.4} strokeOpacity={0.35} />
        );
      })}

      {/* South wall windows */}
      {[...Array(b.width)].map((_, wi) => {
        const t = (wi + 0.5) / b.width;
        const wx = sw.x + (se.x - sw.x) * t;
        const wy = sw.y + (se.y - sw.y) * t;
        return [...Array(b.heightLevel)].map((_, hi) => {
          const winY = wy - wallHeight + (wallHeight / (b.heightLevel + 1)) * (hi + 1);
          const glowAnim = (wi + hi) % 3 === 0;
          return (
            <g key={`sw_${wi}_${hi}`}>
              {/* Window frame */}
              <rect x={wx - winStyle.w / 2 - 0.5} y={winY - winStyle.h / 2 - 0.5}
                width={winStyle.w + 1} height={winStyle.h + 1} rx={winStyle.rx + 0.3}
                fill={wColorDark} fillOpacity={0.3} />
              {/* Window glass */}
              <rect x={wx - winStyle.w / 2} y={winY - winStyle.h / 2}
                width={winStyle.w} height={winStyle.h} rx={winStyle.rx}
                fill={winStyle.fill} fillOpacity={winStyle.opacity}
                stroke={winStyle.stroke} strokeWidth={0.3} />
              {/* Glass reflection highlight */}
              <rect x={wx - winStyle.w / 2 + 0.5} y={winY - winStyle.h / 2 + 0.5}
                width={winStyle.w * 0.35} height={winStyle.h * 0.5} rx={0.3}
                fill="hsl(0,0%,100%)" fillOpacity={0.08} />
              {/* Window interior glow (some windows lit) */}
              {glowAnim && (
                <rect x={wx - winStyle.w / 2} y={winY - winStyle.h / 2}
                  width={winStyle.w} height={winStyle.h} rx={winStyle.rx}
                  fill={hasSkin ? skinColor : 'hsl(45,60%,70%)'} fillOpacity={hasSkin ? 0.2 : 0.12}>
                  <animate attributeName="fillOpacity" values={hasSkin ? '0.1;0.3;0.1' : '0.06;0.18;0.06'} dur={`${3 + (wi % 2)}s`} repeatCount="indefinite" />
                </rect>
              )}
            </g>
          );
        });
      })}

      {/* Wall wrap overlay */}
      {wallWrapBrand && (
        <>
          <polygon points={`${se.x},${se.y} ${sw.x},${sw.y} ${sw.x},${sw.y - wallHeight} ${se.x},${se.y - wallHeight}`}
            fill="hsl(38,75%,50%)" fillOpacity={0.12} />
          <text x={(sw.x + se.x) / 2} y={(sw.y + se.y) / 2 - wallHeight / 2}
            textAnchor="middle" fontSize={7} fill="hsl(38,75%,50%)" fontFamily="Inter" fontWeight={700} opacity={0.6}>
            {wallWrapBrand}
          </text>
        </>
      )}

      {/* ── East wall ── */}
      <polygon points={`${ne.x},${ne.y} ${se.x},${se.y} ${se.x},${se.y - wallHeight} ${ne.x},${ne.y - wallHeight}`}
        fill={wColorDark} stroke={wColorDark} strokeWidth={0.6} />

      {/* East wall floor lines */}
      {[...Array(b.heightLevel)].map((_, fi) => {
        const ratio = (fi + 1) / (b.heightLevel + 0.5);
        const y1 = ne.y - wallHeight * ratio;
        const y2 = se.y - wallHeight * ratio;
        return (
          <line key={`efl_${fi}`}
            x1={ne.x} y1={y1} x2={se.x} y2={y2}
            stroke="hsl(0,0%,0%)" strokeWidth={0.3} strokeOpacity={0.2} />
        );
      })}

      {/* East wall windows */}
      {[...Array(b.height)].map((_, wi) => {
        const t = (wi + 0.5) / b.height;
        const wx = ne.x + (se.x - ne.x) * t;
        const wy = ne.y + (se.y - ne.y) * t;
        return [...Array(b.heightLevel)].map((_, hi) => {
          const winY = wy - wallHeight + (wallHeight / (b.heightLevel + 1)) * (hi + 1);
          const glowAnim = (wi + hi + 1) % 3 === 0;
          return (
            <g key={`ew_${wi}_${hi}`}>
              <rect x={wx - winStyle.w / 2 + 0.5 - 0.5} y={winY - winStyle.h / 2 - 0.5}
                width={winStyle.w} height={winStyle.h + 1} rx={winStyle.rx + 0.3}
                fill="hsl(0,0%,0%)" fillOpacity={0.15} />
              <rect x={wx - winStyle.w / 2 + 0.5} y={winY - winStyle.h / 2}
                width={winStyle.w - 1} height={winStyle.h} rx={winStyle.rx}
                fill={winStyle.fill} fillOpacity={winStyle.opacity * 0.8}
                stroke={winStyle.stroke} strokeWidth={0.3} />
              {glowAnim && (
                <rect x={wx - winStyle.w / 2 + 0.5} y={winY - winStyle.h / 2}
                  width={winStyle.w - 1} height={winStyle.h} rx={winStyle.rx}
                  fill={hasSkin ? skinColor : 'hsl(40,55%,65%)'} fillOpacity={hasSkin ? 0.18 : 0.1}>
                  <animate attributeName="fillOpacity" values={hasSkin ? '0.08;0.25;0.08' : '0.05;0.15;0.05'} dur={`${3.5 + (wi % 2)}s`} repeatCount="indefinite" />
                </rect>
              )}
            </g>
          );
        });
      })}

      {/* ── Building-type-specific details ── */}
      <BuildingTypeDetail b={b} sw={sw} se={se} ne={ne} nw={nw} center={center} wallHeight={wallHeight} wColorDark={wColorDark} wColorLight={wColorLight} seed={seed} />

      {/* ── Roof ── */}
      <polygon points={`${nw.x},${nw.y - wallHeight} ${ne.x},${ne.y - wallHeight} ${se.x},${se.y - wallHeight} ${sw.x},${sw.y - wallHeight}`}
        fill={rColor} stroke={wColorDark} strokeWidth={0.8} />

      {/* Roof edge highlight (top-left) */}
      <line x1={nw.x} y1={nw.y - wallHeight} x2={ne.x} y2={ne.y - wallHeight}
        stroke="hsl(0,0%,100%)" strokeWidth={0.4} strokeOpacity={0.12} />
      <line x1={nw.x} y1={nw.y - wallHeight} x2={sw.x} y2={sw.y - wallHeight}
        stroke="hsl(0,0%,100%)" strokeWidth={0.3} strokeOpacity={0.08} />

      {/* Roof surface detail */}
      <RoofSurfaceDetail b={b} nw={nw} ne={ne} se={se} sw={sw} wallHeight={wallHeight} rColor={rColor} />

      {/* Roof detail by shape */}
      <RoofDetail shape={b.roofShape} center={center} nw={nw} ne={ne} sw={sw} se={se}
        wallHeight={wallHeight} rColor={rColor} wColorDark={wColorDark} width={b.width} height={b.height} />

      {/* ═══ FLAGSHIP BRAND SKIN OVERLAYS ═══ */}
      {hasSkin && (
        <g>
          {/* Neon edge lines — vertical corners */}
          <line x1={sw.x} y1={sw.y} x2={sw.x} y2={sw.y - wallHeight}
            stroke={skinColor} strokeWidth={1.5} strokeOpacity={0.7} />
          <line x1={se.x} y1={se.y} x2={se.x} y2={se.y - wallHeight}
            stroke={skinColor} strokeWidth={2} strokeOpacity={0.8}>
            <animate attributeName="strokeOpacity" values="0.5;0.9;0.5" dur="3s" repeatCount="indefinite" />
          </line>
          <line x1={ne.x} y1={ne.y} x2={ne.x} y2={ne.y - wallHeight}
            stroke={skinColor} strokeWidth={1} strokeOpacity={0.5} />

          {/* Roof edge neon */}
          <line x1={sw.x} y1={sw.y - wallHeight} x2={se.x} y2={se.y - wallHeight}
            stroke={skinColor} strokeWidth={1.2} strokeOpacity={0.6} />
          <line x1={ne.x} y1={ne.y - wallHeight} x2={se.x} y2={se.y - wallHeight}
            stroke={skinColor} strokeWidth={0.8} strokeOpacity={0.4} />

          {/* Ground neon base glow */}
          <line x1={sw.x} y1={sw.y + 1} x2={se.x} y2={se.y + 1}
            stroke={skinColor} strokeWidth={2} strokeOpacity={0.3} />
          <line x1={ne.x} y1={ne.y + 1} x2={se.x} y2={se.y + 1}
            stroke={skinColor} strokeWidth={1.5} strokeOpacity={0.2} />

          {/* Branded entrance — glass storefront on south wall */}
          {(() => {
            const midX = (sw.x + se.x) / 2;
            const midY = (sw.y + se.y) / 2;
            const doorW = Math.min(16, b.width * 1.8);
            const doorH = Math.min(wallHeight * 0.5, 14);
            return (
              <g>
                {/* Glass entrance panel */}
                <rect x={midX - doorW / 2} y={midY - doorH} width={doorW} height={doorH} rx={1}
                  fill={skinColor} fillOpacity={0.12}
                  stroke={skinColor} strokeWidth={0.8} strokeOpacity={0.6} />
                {/* Glass reflection */}
                <rect x={midX - doorW / 2 + 1} y={midY - doorH + 1} width={doorW * 0.3} height={doorH - 2} rx={0.5}
                  fill="hsl(0,0%,100%)" fillOpacity={0.06} />
                {/* Small brand nameplate at entrance */}
                <rect x={midX - 12} y={midY - doorH - 5} width={24} height={5} rx={1.5}
                  fill="hsl(0,0%,5%)" fillOpacity={0.9}
                  stroke={skinColor} strokeWidth={0.6} />
                <text x={midX} y={midY - doorH - 1.5} textAnchor="middle" fontSize={3.5}
                  fill={skinLight} fontFamily="Inter" fontWeight={700} letterSpacing="1.5">
                  {brandSkin!.name.toUpperCase()}
                </text>
              </g>
            );
          })()}

          {/* Ambient glow beneath building */}
          <ellipse cx={center.x} cy={center.y + 6} rx={b.width * 2.5} ry={b.height * 1.2}
            fill={skinColor} fillOpacity={0.04} />
        </g>
      )}

    </g>
  );
});
BuildingRenderer.displayName = 'BuildingRenderer';

// ─── Window styles per building type ───
function getWindowStyle(type: Building['buildingType']) {
  switch (type) {
    case 'shop': return { w: 7, h: 5, rx: 0.5, fill: 'hsl(45,35%,72%)', opacity: 0.45, stroke: 'hsl(30,15%,50%)' };
    case 'campus': return { w: 5, h: 6, rx: 1, fill: 'hsl(200,30%,62%)', opacity: 0.4, stroke: 'hsl(210,18%,50%)' };
    case 'warehouse': return { w: 8, h: 3, rx: 0, fill: 'hsl(215,8%,50%)', opacity: 0.22, stroke: 'hsl(215,6%,45%)' };
    case 'tower': return { w: 4, h: 5, rx: 0.5, fill: 'hsl(200,35%,68%)', opacity: 0.45, stroke: 'hsl(210,22%,55%)' };
    case 'civic': return { w: 6, h: 5, rx: 1, fill: 'hsl(200,28%,64%)', opacity: 0.42, stroke: 'hsl(210,15%,52%)' };
    case 'park_structure': return { w: 5, h: 4, rx: 1.5, fill: 'hsl(130,22%,58%)', opacity: 0.32, stroke: 'hsl(130,15%,45%)' };
    default: return { w: 6, h: 4, rx: 0.5, fill: 'hsl(200,28%,62%)', opacity: 0.38, stroke: 'hsl(210,15%,55%)' };
  }
}

// ─── Building-type specific architectural details ───
const BuildingTypeDetail: React.FC<{
  b: Building;
  sw: { x: number; y: number }; se: { x: number; y: number };
  ne: { x: number; y: number }; nw: { x: number; y: number };
  center: { x: number; y: number };
  wallHeight: number; wColorDark: string; wColorLight: string; seed: number;
}> = ({ b, sw, se, ne, center, wallHeight, wColorDark, wColorLight, seed }) => {
  const midSouthX = (sw.x + se.x) / 2;
  const midSouthY = (sw.y + se.y) / 2;

  switch (b.buildingType) {
    case 'shop':
      return (
        <g>
          {/* Awning with stripes */}
          <polygon
            points={`${sw.x + 2},${sw.y - 3} ${se.x - 2},${se.y - 3} ${se.x + 2},${se.y + 3} ${sw.x + 2},${sw.y + 3}`}
            fill="hsl(10,40%,48%)" fillOpacity={0.55} stroke="hsl(10,35%,38%)" strokeWidth={0.4} />
          {/* Awning stripes */}
          {[...Array(Math.max(2, b.width))].map((_, i) => {
            const t = (i + 0.5) / b.width;
            const sx = sw.x + 2 + (se.x - sw.x - 4) * t;
            const sy = sw.y + (se.y - sw.y) * t;
            return <line key={i} x1={sx} y1={sy - 3} x2={sx + 1} y2={sy + 3}
              stroke="hsl(0,0%,95%)" strokeWidth={0.4} strokeOpacity={0.25} />;
          })}
          {/* Door */}
          <rect x={midSouthX - 2.5} y={midSouthY - 6} width={5} height={6} rx={0.5}
            fill="hsl(25,20%,35%)" fillOpacity={0.5} stroke="hsl(25,15%,45%)" strokeWidth={0.4} />
          {/* Door handle */}
          <circle cx={midSouthX + 1.2} cy={midSouthY - 3} r={0.5} fill="hsl(45,60%,60%)" />
          {/* Shop light */}
          <ellipse cx={midSouthX} cy={sw.y + 4} rx={8} ry={2.5}
            fill="hsl(45,55%,65%)" fillOpacity={0.06} />
        </g>
      );

    case 'campus':
      return (
        <g>
          {/* Entrance steps */}
          {[0, 1, 2].map(step => (
            <rect key={step} x={midSouthX - 8 + step * 1.5} y={midSouthY + step * 2 - 1}
              width={16 - step * 3} height={2.2} rx={0.3}
              fill="hsl(25,15%,55%)" fillOpacity={0.45} stroke="hsl(25,12%,48%)" strokeWidth={0.2} />
          ))}
          {/* Entrance pillars */}
          <rect x={midSouthX - 7} y={midSouthY - wallHeight * 0.6} width={1.5} height={wallHeight * 0.6}
            fill="hsl(25,12%,58%)" fillOpacity={0.5} rx={0.3} />
          <rect x={midSouthX + 5.5} y={midSouthY - wallHeight * 0.6} width={1.5} height={wallHeight * 0.6}
            fill="hsl(25,12%,58%)" fillOpacity={0.5} rx={0.3} />
          {/* Entrance arch */}
          <path d={`M${midSouthX - 5},${midSouthY - wallHeight * 0.55} Q${midSouthX},${midSouthY - wallHeight * 0.7} ${midSouthX + 5},${midSouthY - wallHeight * 0.55}`}
            fill="none" stroke="hsl(25,15%,52%)" strokeWidth={1} strokeOpacity={0.4} />
        </g>
      );

    case 'tower':
      return (
        <g>
          {/* Glass curtain wall effect - vertical mullions on south wall */}
          {[...Array(b.width + 1)].map((_, i) => {
            const t = i / b.width;
            const lx = sw.x + (se.x - sw.x) * t;
            const ly = sw.y + (se.y - sw.y) * t;
            return <line key={`vm_${i}`} x1={lx} y1={ly} x2={lx} y2={ly - wallHeight}
              stroke="hsl(200,15%,55%)" strokeWidth={0.3} strokeOpacity={0.3} />;
          })}
          {/* Corner accent strip */}
          <line x1={se.x} y1={se.y} x2={se.x} y2={se.y - wallHeight}
            stroke="hsl(200,20%,60%)" strokeWidth={1.5} strokeOpacity={0.3} />
        </g>
      );

    case 'warehouse':
      return (
        <g>
          {/* Corrugated wall texture */}
          {[...Array(6)].map((_, i) => {
            const t = (i + 0.5) / 6;
            const lx = sw.x + (se.x - sw.x) * t;
            const ly = sw.y + (se.y - sw.y) * t;
            return <line key={`corr_${i}`} x1={lx} y1={ly} x2={lx} y2={ly - wallHeight}
              stroke={wColorDark} strokeWidth={0.5} strokeOpacity={0.2} />;
          })}
          {/* Loading dock */}
          <rect x={midSouthX - 6} y={midSouthY - 8} width={12} height={8} rx={0.5}
            fill="hsl(220,5%,25%)" fillOpacity={0.5} stroke="hsl(220,5%,35%)" strokeWidth={0.6} />
          {/* Dock stripe */}
          <line x1={midSouthX - 6} y1={midSouthY - 1} x2={midSouthX + 6} y2={midSouthY - 1}
            stroke="hsl(45,70%,55%)" strokeWidth={0.8} strokeOpacity={0.4} strokeDasharray="2 1.5" />
        </g>
      );

    case 'civic':
      return (
        <g>
          {/* Grand entrance */}
          <rect x={midSouthX - 4} y={midSouthY - 8} width={8} height={8} rx={1}
            fill="hsl(220,8%,32%)" fillOpacity={0.5} stroke="hsl(220,10%,45%)" strokeWidth={0.4} />
          {/* Entrance arch */}
          <path d={`M${midSouthX - 4},${midSouthY - 8} Q${midSouthX},${midSouthY - 12} ${midSouthX + 4},${midSouthY - 8}`}
            fill="hsl(220,8%,38%)" fillOpacity={0.4} stroke="hsl(220,10%,50%)" strokeWidth={0.4} />
          {/* Flag or banner */}
          <line x1={se.x - 2} y1={se.y - wallHeight} x2={se.x - 2} y2={se.y - wallHeight - 8}
            stroke="hsl(215,8%,45%)" strokeWidth={0.8} />
          <rect x={se.x - 2} y={se.y - wallHeight - 8} width={5} height={3.5} rx={0.3}
            fill="hsl(38,65%,50%)" fillOpacity={0.6}>
            <animate attributeName="fillOpacity" values="0.5;0.7;0.5" dur="3s" repeatCount="indefinite" />
          </rect>
        </g>
      );

    case 'park_structure':
      return (
        <g>
          {/* Trellis / lattice on south wall */}
          {[...Array(3)].map((_, i) => {
            const t = (i + 0.5) / 3;
            const vx = sw.x + (se.x - sw.x) * t;
            const vy = sw.y + (se.y - sw.y) * t;
            return (
              <g key={`trel_${i}`}>
                <line x1={vx} y1={vy} x2={vx} y2={vy - wallHeight * 0.7}
                  stroke="hsl(130,15%,45%)" strokeWidth={0.4} strokeOpacity={0.3} />
                {/* Vine */}
                <circle cx={vx + 1} cy={vy - wallHeight * 0.3} r={2.5}
                  fill="hsl(130,30%,40%)" fillOpacity={0.4} />
                <circle cx={vx - 1} cy={vy - wallHeight * 0.5} r={2}
                  fill="hsl(135,35%,45%)" fillOpacity={0.35} />
              </g>
            );
          })}
        </g>
      );

    default:
      return (
        <g>
          {/* Generic door */}
          <rect x={midSouthX - 2} y={midSouthY - 5} width={4} height={5} rx={0.5}
            fill="hsl(220,8%,35%)" fillOpacity={0.4} stroke="hsl(220,6%,45%)" strokeWidth={0.3} />
        </g>
      );
  }
};

// ─── Roof surface patterns ───
const RoofSurfaceDetail: React.FC<{
  b: Building;
  nw: { x: number; y: number }; ne: { x: number; y: number };
  se: { x: number; y: number }; sw: { x: number; y: number };
  wallHeight: number; rColor: string;
}> = ({ b, nw, ne, se, sw, wallHeight }) => {
  // AC units on large roofs
  if (b.heightLevel >= 2 && b.width >= 3) {
    const cx = (nw.x + se.x) / 2 + 5;
    const cy = (nw.y + se.y) / 2 - wallHeight - 1;
    return (
      <g>
        {/* AC unit 1 */}
        <rect x={cx - 3} y={cy - 2} width={5} height={3} rx={0.5}
          fill="hsl(215,5%,45%)" fillOpacity={0.4} stroke="hsl(215,5%,38%)" strokeWidth={0.3} />
        {/* AC fan */}
        <circle cx={cx - 0.5} cy={cy - 0.5} r={1} fill="none"
          stroke="hsl(215,5%,55%)" strokeWidth={0.4} strokeOpacity={0.4}>
          <animateTransform attributeName="transform" type="rotate"
            from={`0 ${cx - 0.5} ${cy - 0.5}`} to={`360 ${cx - 0.5} ${cy - 0.5}`}
            dur="4s" repeatCount="indefinite" />
        </circle>
        {/* Vent pipe */}
        {b.buildingType === 'warehouse' && (
          <g>
            <line x1={cx + 8} y1={cy + 1} x2={cx + 8} y2={cy - 4}
              stroke="hsl(215,5%,42%)" strokeWidth={1.5} />
            <ellipse cx={cx + 8} cy={cy - 4.5} rx={1.5} ry={0.8}
              fill="hsl(215,5%,48%)" fillOpacity={0.5} />
          </g>
        )}
      </g>
    );
  }
  return null;
};

// ─── Roof shapes ───
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
}> = ({ shape, center, nw, ne, sw, se, wallHeight, rColor, wColorDark, width, height }) => {
  switch (shape) {
    case 'gabled':
      return (
        <g>
          <polygon points={`${(nw.x + sw.x) / 2},${(nw.y + sw.y) / 2 - wallHeight - 10} ${nw.x},${nw.y - wallHeight} ${sw.x},${sw.y - wallHeight}`}
            fill={rColor} fillOpacity={0.55} stroke={wColorDark} strokeWidth={0.6} />
          {/* Ridge line */}
          <line x1={(nw.x + sw.x) / 2} y1={(nw.y + sw.y) / 2 - wallHeight - 10}
            x2={(ne.x + se.x) / 2} y2={(ne.y + se.y) / 2 - wallHeight - 10}
            stroke={wColorDark} strokeWidth={0.8} strokeOpacity={0.4} />
          <polygon points={`${(ne.x + se.x) / 2},${(ne.y + se.y) / 2 - wallHeight - 10} ${ne.x},${ne.y - wallHeight} ${se.x},${se.y - wallHeight}`}
            fill={rColor} fillOpacity={0.4} stroke={wColorDark} strokeWidth={0.5} />
        </g>
      );
    case 'hip':
      return (
        <g>
          <polygon points={`${center.x},${center.y - wallHeight - 8} ${nw.x},${nw.y - wallHeight} ${ne.x},${ne.y - wallHeight}`}
            fill={rColor} fillOpacity={0.48} stroke={wColorDark} strokeWidth={0.5} />
          <polygon points={`${center.x},${center.y - wallHeight - 8} ${sw.x},${sw.y - wallHeight} ${nw.x},${nw.y - wallHeight}`}
            fill={rColor} fillOpacity={0.58} stroke={wColorDark} strokeWidth={0.5} />
          {/* Ridge cap */}
          <circle cx={center.x} cy={center.y - wallHeight - 8} r={1.5}
            fill={wColorDark} fillOpacity={0.4} />
        </g>
      );
    case 'antenna':
      return (
        <g>
          {/* Antenna base */}
          <rect x={center.x - 2} y={center.y - wallHeight - 3} width={4} height={3} rx={0.5}
            fill="hsl(215,8%,42%)" fillOpacity={0.5} />
          {/* Main mast */}
          <line x1={center.x} y1={center.y - wallHeight - 3} x2={center.x} y2={center.y - wallHeight - 22}
            stroke="hsl(215,8%,55%)" strokeWidth={1.5} />
          {/* Cross arms */}
          <line x1={center.x - 4} y1={center.y - wallHeight - 16} x2={center.x + 4} y2={center.y - wallHeight - 16}
            stroke="hsl(215,8%,52%)" strokeWidth={0.8} />
          <line x1={center.x - 3} y1={center.y - wallHeight - 12} x2={center.x + 3} y2={center.y - wallHeight - 12}
            stroke="hsl(215,8%,52%)" strokeWidth={0.6} />
          {/* Blinking light */}
          <circle cx={center.x} cy={center.y - wallHeight - 23} r={1.8} fill="hsl(0,65%,52%)">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" />
          </circle>
          {/* Light glow */}
          <circle cx={center.x} cy={center.y - wallHeight - 23} r={4} fill="hsl(0,60%,50%)" fillOpacity={0.1}>
            <animate attributeName="fillOpacity" values="0.05;0.15;0.05" dur="1.5s" repeatCount="indefinite" />
          </circle>
        </g>
      );
    case 'dome':
      return (
        <g>
          <ellipse cx={center.x} cy={center.y - wallHeight - 4}
            rx={Math.min(width, height) * TILE_W * 0.14} ry={Math.min(width, height) * TILE_H * 0.14 + 5}
            fill={rColor} fillOpacity={0.5} stroke={wColorDark} strokeWidth={0.6} />
          {/* Dome highlight */}
          <ellipse cx={center.x - 2} cy={center.y - wallHeight - 6}
            rx={Math.min(width, height) * TILE_W * 0.06} ry={Math.min(width, height) * TILE_H * 0.06 + 2}
            fill="hsl(0,0%,100%)" fillOpacity={0.08} />
          {/* Dome apex */}
          <circle cx={center.x} cy={center.y - wallHeight - 4 - Math.min(width, height) * TILE_H * 0.14 - 3}
            r={1.5} fill={wColorDark} fillOpacity={0.5} />
        </g>
      );
    case 'garden':
      return (
        <g>
          {[...Array(5)].map((_, i) => {
            const ox = (i - 2) * 8;
            const oy = (i % 2) * 2;
            const hue = 125 + i * 8;
            return (
              <g key={i}>
                <circle cx={center.x + ox} cy={center.y - wallHeight - 3 + oy}
                  r={4 + (i % 2)} fill={`hsl(${hue},30%,38%)`} fillOpacity={0.7} />
                {i % 2 === 0 && (
                  <circle cx={center.x + ox} cy={center.y - wallHeight - 5 + oy}
                    r={2.5} fill={`hsl(${hue + 10},35%,44%)`} fillOpacity={0.5} />
                )}
              </g>
            );
          })}
          {/* Small flowers */}
          {[...Array(3)].map((_, i) => (
            <circle key={`rf_${i}`} cx={center.x + (i - 1) * 12} cy={center.y - wallHeight - 1}
              r={1.2} fill={['hsl(340,50%,55%)', 'hsl(45,65%,55%)', 'hsl(280,40%,55%)'][i]}
              fillOpacity={0.6} />
          ))}
        </g>
      );
    case 'gear':
      return (
        <g>
          {/* Gear housing */}
          <circle cx={center.x} cy={center.y - wallHeight - 4} r={7}
            fill="hsl(215,6%,40%)" fillOpacity={0.3} />
          {/* Spinning gear */}
          <circle cx={center.x} cy={center.y - wallHeight - 4} r={5}
            fill="none" stroke="hsl(215,8%,52%)" strokeWidth={1.5} strokeOpacity={0.5} strokeDasharray="3 2">
            <animateTransform attributeName="transform" type="rotate"
              from={`0 ${center.x} ${center.y - wallHeight - 4}`}
              to={`360 ${center.x} ${center.y - wallHeight - 4}`} dur="15s" repeatCount="indefinite" />
          </circle>
          {/* Center bolt */}
          <circle cx={center.x} cy={center.y - wallHeight - 4} r={1.5}
            fill="hsl(215,10%,55%)" fillOpacity={0.6} />
        </g>
      );
    case 'lantern':
      return (
        <g>
          <line x1={center.x} y1={center.y - wallHeight} x2={center.x} y2={center.y - wallHeight - 4}
            stroke="hsl(215,8%,45%)" strokeWidth={1} />
          <rect x={center.x - 2.5} y={center.y - wallHeight - 8} width={5} height={4} rx={0.5}
            fill="hsl(40,60%,50%)" fillOpacity={0.3} stroke="hsl(40,50%,40%)" strokeWidth={0.4} />
          <circle cx={center.x} cy={center.y - wallHeight - 6} r={2.5} fill="hsl(40,70%,55%)" fillOpacity={0.35}>
            <animate attributeName="fillOpacity" values="0.2;0.5;0.2" dur="2.5s" repeatCount="indefinite" />
          </circle>
          {/* Glow */}
          <circle cx={center.x} cy={center.y - wallHeight - 6} r={6} fill="hsl(40,60%,55%)" fillOpacity={0.06} />
        </g>
      );
    case 'telescope':
      return (
        <g>
          {/* Base platform */}
          <ellipse cx={center.x} cy={center.y - wallHeight - 1} rx={4} ry={2}
            fill="hsl(215,8%,42%)" fillOpacity={0.4} />
          {/* Telescope tube */}
          <line x1={center.x - 3} y1={center.y - wallHeight - 2} x2={center.x + 5} y2={center.y - wallHeight - 15}
            stroke="hsl(215,10%,52%)" strokeWidth={2.2} strokeLinecap="round" />
          {/* Lens */}
          <circle cx={center.x + 5.5} cy={center.y - wallHeight - 15.5} r={2.5}
            fill="hsl(200,25%,58%)" fillOpacity={0.5} stroke="hsl(200,20%,50%)" strokeWidth={0.5} />
          {/* Lens glint */}
          <circle cx={center.x + 4.5} cy={center.y - wallHeight - 16.5} r={0.8}
            fill="hsl(0,0%,100%)" fillOpacity={0.3} />
        </g>
      );
    default:
      return null;
  }
};
