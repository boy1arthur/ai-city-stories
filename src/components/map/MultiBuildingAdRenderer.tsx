import React from 'react';
import type { Building } from '@/data/world';
import type { MultiBuildingAd } from '@/lib/multiBuildingAd';
import { iso, TILE_W, TILE_H, WALL_H_UNIT } from './constants';

interface Props {
  ads: MultiBuildingAd[];
  buildings: Building[];
}

export const MultiBuildingAdRenderer: React.FC<Props> = React.memo(({ ads, buildings }) => {
  return (
    <g>
      {ads.map(ad => {
        switch (ad.placement) {
          case 'wall':
            return <WallBanner key={ad.id} ad={ad} buildings={buildings} />;
          case 'rooftop':
            return <RooftopBillboard key={ad.id} ad={ad} buildings={buildings} />;
          case 'roadside':
            return <RoadsideBillboard key={ad.id} ad={ad} />;
          case 'plaza_screen':
            return <PlazaScreen key={ad.id} ad={ad} />;
          default:
            return null;
        }
      })}
    </g>
  );
});
MultiBuildingAdRenderer.displayName = 'MultiBuildingAdRenderer';

// ════════════════════════════════════════════════
// 1. WALL BANNER — parallelogram on building face
// ════════════════════════════════════════════════
const WallBanner: React.FC<{ ad: MultiBuildingAd; buildings: Building[] }> = ({ ad, buildings }) => {
  const b = buildings.find(bld => ad.buildingIds.includes(bld.id));
  if (!b) return null;
  const wallH = WALL_H_UNIT * b.heightLevel;
  const isPremium = ad.tier === 'premium';

  // Compute wall endpoints based on face
  const isEast = ad.face === 'east';
  const p1 = isEast ? iso(b.gridX + b.width, b.gridY) : iso(b.gridX, b.gridY + b.height);
  const p2 = isEast ? iso(b.gridX + b.width, b.gridY + b.height) : iso(b.gridX + b.width, b.gridY + b.height);

  // Floating LED panel — fits building width, thinner for basic
  const panelTop = isPremium ? 0.85 : 0.80;
  const panelBot = isPremium ? 0.62 : 0.66;
  const inset = 0.05; // tight to building edges
  const lerp = (a: {x:number,y:number}, b2: {x:number,y:number}, t: number) => ({ x: a.x + (b2.x - a.x) * t, y: a.y + (b2.y - a.y) * t });

  const tl = { x: lerp(p1, p2, inset).x, y: lerp(p1, p2, inset).y - wallH * panelTop };
  const tr = { x: lerp(p1, p2, 1 - inset).x, y: lerp(p1, p2, 1 - inset).y - wallH * panelTop };
  const bl = { x: lerp(p1, p2, inset).x, y: lerp(p1, p2, inset).y - wallH * panelBot };
  const br = { x: lerp(p1, p2, 1 - inset).x, y: lerp(p1, p2, 1 - inset).y - wallH * panelBot };

  const cx = (tl.x + tr.x + bl.x + br.x) / 4;
  const cy = (tl.y + tr.y + bl.y + br.y) / 4;
  const panelH = Math.abs(tl.y - bl.y);
  const fs = Math.max(4, panelH * 0.45);
  const fsN = Math.max(3, panelH * 0.3);

  return (
    <g>
      {/* Dark LED panel backing */}
      <polygon points={`${tl.x},${tl.y} ${tr.x},${tr.y} ${br.x},${br.y} ${bl.x},${bl.y}`}
        fill="hsl(220,8%,12%)" stroke="hsl(220,5%,25%)" strokeWidth={0.6} />

      {/* Brand color accent strip at top edge */}
      {(() => {
        const t = 0.12;
        const stBl = { x: tl.x + (bl.x - tl.x) * t, y: tl.y + (bl.y - tl.y) * t };
        const stBr = { x: tr.x + (br.x - tr.x) * t, y: tr.y + (br.y - tr.y) * t };
        return <polygon points={`${tl.x},${tl.y} ${tr.x},${tr.y} ${stBr.x},${stBr.y} ${stBl.x},${stBl.y}`}
          fill={ad.brandColor} fillOpacity={0.9} />;
      })()}

      {/* LED glow pulse for premium */}
      {isPremium && (
        <polygon points={`${tl.x},${tl.y} ${tr.x},${tr.y} ${br.x},${br.y} ${bl.x},${bl.y}`}
          fill={ad.brandColor} fillOpacity={0.06}>
          <animate attributeName="fillOpacity" values="0.03;0.1;0.03" dur="2.5s" repeatCount="indefinite" />
        </polygon>
      )}

      {/* Logo + brand name — single line only */}
      <text x={cx - fsN * 1.5} y={cy + fs * 0.2} textAnchor="middle" fontSize={fs}
        fill={ad.brandColor} fontFamily="Inter" fontWeight={900}>{ad.brandInitial}</text>
      <text x={cx + fsN * 0.8} y={cy + fsN * 0.2} textAnchor="middle" fontSize={fsN}
        fill="hsl(0,0%,88%)" fontFamily="Inter" fontWeight={700} letterSpacing="0.8">{ad.brandName}</text>
    </g>
  );
};

// ════════════════════════════════════════════════
// 2. ROOFTOP BILLBOARD — sign above roofline
// ════════════════════════════════════════════════
const RooftopBillboard: React.FC<{ ad: MultiBuildingAd; buildings: Building[] }> = ({ ad, buildings }) => {
  const b = buildings.find(bld => ad.buildingIds.includes(bld.id));
  if (!b) return null;
  const wallH = WALL_H_UNIT * b.heightLevel;
  const signW = Math.max(24, b.width * 2.5);
  const signH = 14;
  const postH = 6;

  const sw = iso(b.gridX, b.gridY + b.height);
  const se = iso(b.gridX + b.width, b.gridY + b.height);
  const cx = (sw.x + se.x) / 2;
  const roofY = (sw.y + se.y) / 2 - wallH;
  const signCy = roofY - postH - signH / 2;
  const angle = Math.atan2(se.y - sw.y, se.x - sw.x) * (180 / Math.PI);

  return (
    <g>
      {/* Support posts */}
      <line x1={cx - 4} y1={roofY} x2={cx - 4} y2={roofY - postH} stroke="hsl(220,5%,45%)" strokeWidth={1.2} />
      <line x1={cx + 4} y1={roofY} x2={cx + 4} y2={roofY - postH} stroke="hsl(220,5%,45%)" strokeWidth={1.2} />

      {/* Billboard panel */}
      <g>
        {/* Back panel frame */}
        <rect x={cx - signW / 2 - 1} y={signCy - signH / 2 - 1} width={signW + 2} height={signH + 2} rx={2}
          fill="hsl(220,5%,30%)" stroke="hsl(220,5%,45%)" strokeWidth={0.8} />
        {/* Main panel */}
        <rect x={cx - signW / 2} y={signCy - signH / 2} width={signW} height={signH} rx={1.5}
          fill={ad.brandColor} />

        {/* Brand initial */}
        <text x={cx} y={signCy - 2} textAnchor="middle" fontSize={6}
          fill="hsl(0,0%,100%)" fontFamily="Inter" fontWeight={900}>{ad.brandInitial}</text>
        {/* Brand name */}
        <text x={cx} y={signCy + 3} textAnchor="middle" fontSize={3.5}
          fill="hsl(0,0%,100%)" fontFamily="Inter" fontWeight={800} letterSpacing="0.8">{ad.brandName}</text>
        {/* Tagline */}
        <text x={cx} y={signCy + 6} textAnchor="middle" fontSize={2.5}
          fill="hsl(0,0%,100%)" fillOpacity={0.7} fontFamily="Inter" fontWeight={400} fontStyle="italic">{ad.tagline}</text>
      </g>
    </g>
  );
};

// ════════════════════════════════════════════════
// 3. ROADSIDE BILLBOARD — standalone pole structure
// ════════════════════════════════════════════════
const RoadsideBillboard: React.FC<{ ad: MultiBuildingAd }> = ({ ad }) => {
  if (ad.gridX === undefined || ad.gridY === undefined) return null;
  const pos = iso(ad.gridX, ad.gridY);
  const postH = 28;
  const boardW = 32;
  const boardH = 14;

  return (
    <g>
      {/* Ground shadow */}
      <ellipse cx={pos.x} cy={pos.y + 2} rx={6} ry={2} fill="hsl(0,0%,0%)" fillOpacity={0.25} />
      {/* Post */}
      <line x1={pos.x} y1={pos.y} x2={pos.x} y2={pos.y - postH}
        stroke="hsl(220,5%,42%)" strokeWidth={2} strokeLinecap="round" />
      {/* Cross arm */}
      <line x1={pos.x - boardW / 2} y1={pos.y - postH} x2={pos.x + boardW / 2} y2={pos.y - postH}
        stroke="hsl(220,5%,42%)" strokeWidth={1.2} />

      {/* Back panel */}
      <rect x={pos.x - boardW / 2 - 1} y={pos.y - postH - boardH - 1} width={boardW + 2} height={boardH + 2} rx={2}
        fill="hsl(220,5%,25%)" stroke="hsl(220,5%,40%)" strokeWidth={0.6} />
      {/* Main board */}
      <rect x={pos.x - boardW / 2} y={pos.y - postH - boardH} width={boardW} height={boardH} rx={1.5}
        fill={ad.brandColor} />

      {/* Brand initial */}
      <text x={pos.x - boardW / 4} y={pos.y - postH - boardH / 2 + 1.5} textAnchor="middle" fontSize={7}
        fill="hsl(0,0%,100%)" fontFamily="Inter" fontWeight={900}>{ad.brandInitial}</text>
      {/* Brand name */}
      <text x={pos.x + 3} y={pos.y - postH - boardH / 2 - 0.5} textAnchor="middle" fontSize={4.5}
        fill="hsl(0,0%,100%)" fontFamily="Inter" fontWeight={800} letterSpacing="0.5">{ad.brandName}</text>
      {/* Tagline */}
      <text x={pos.x + 3} y={pos.y - postH - boardH / 2 + 4} textAnchor="middle" fontSize={2.5}
        fill="hsl(0,0%,100%)" fillOpacity={0.7} fontFamily="Inter" fontWeight={400} fontStyle="italic">{ad.tagline}</text>

      {/* Spotlight */}
      <ellipse cx={pos.x} cy={pos.y - postH - boardH / 2} rx={boardW / 2 + 4} ry={boardH / 2 + 6}
        fill={ad.brandColor} fillOpacity={0.05} />
    </g>
  );
};

// ════════════════════════════════════════════════
// 4. PLAZA CENTER SCREEN — large LED landmark
// ════════════════════════════════════════════════
const PlazaScreen: React.FC<{ ad: MultiBuildingAd }> = ({ ad }) => {
  if (ad.gridX === undefined || ad.gridY === undefined) return null;
  const pos = iso(ad.gridX, ad.gridY);
  const postH = 40;
  const screenW = 44;
  const screenH = 22;

  return (
    <g>
      {/* Ground base */}
      <ellipse cx={pos.x} cy={pos.y + 2} rx={10} ry={3.5}
        fill="hsl(220,5%,30%)" stroke="hsl(220,5%,40%)" strokeWidth={0.5} />
      {/* Main post */}
      <rect x={pos.x - 2} y={pos.y - postH} width={4} height={postH} rx={1}
        fill="hsl(220,5%,35%)" stroke="hsl(220,5%,45%)" strokeWidth={0.5} />

      {/* Screen frame */}
      <rect x={pos.x - screenW / 2 - 2} y={pos.y - postH - screenH - 2} width={screenW + 4} height={screenH + 4} rx={3}
        fill="hsl(220,5%,20%)" stroke="hsl(220,5%,40%)" strokeWidth={1} />

      {/* Screen */}
      <rect x={pos.x - screenW / 2} y={pos.y - postH - screenH} width={screenW} height={screenH} rx={2}
        fill={ad.brandColor} />

      {/* LED glow animation */}
      <rect x={pos.x - screenW / 2} y={pos.y - postH - screenH} width={screenW} height={screenH} rx={2}
        fill="hsl(0,0%,100%)" fillOpacity={0.06}>
        <animate attributeName="fillOpacity" values="0.03;0.1;0.03" dur="3s" repeatCount="indefinite" />
      </rect>

      {/* Scan line effect */}
      <rect x={pos.x - screenW / 2} y={pos.y - postH - screenH} width={screenW} height={1}
        fill="hsl(0,0%,100%)" fillOpacity={0.08}>
        <animateTransform attributeName="transform" type="translate" from={`0 0`} to={`0 ${screenH}`}
          dur="2s" repeatCount="indefinite" />
      </rect>

      {/* Brand initial — large */}
      <text x={pos.x - screenW / 3.5} y={pos.y - postH - screenH / 2 + 3} textAnchor="middle" fontSize={14}
        fill="hsl(0,0%,100%)" fontFamily="Inter" fontWeight={900}>{ad.brandInitial}</text>
      {/* Brand name */}
      <text x={pos.x + 4} y={pos.y - postH - screenH / 2 - 1} textAnchor="middle" fontSize={7}
        fill="hsl(0,0%,100%)" fontFamily="Inter" fontWeight={800} letterSpacing="1">{ad.brandName}</text>
      {/* Tagline */}
      <text x={pos.x + 4} y={pos.y - postH - screenH / 2 + 6} textAnchor="middle" fontSize={3.5}
        fill="hsl(0,0%,100%)" fillOpacity={0.8} fontFamily="Inter" fontWeight={400} fontStyle="italic">{ad.tagline}</text>

      {/* Light cone below screen */}
      <polygon points={`${pos.x - screenW / 2},${pos.y - postH} ${pos.x + screenW / 2},${pos.y - postH} ${pos.x + 8},${pos.y - 4} ${pos.x - 8},${pos.y - 4}`}
        fill={ad.brandColor} fillOpacity={0.06} />
    </g>
  );
};
