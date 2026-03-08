import React from 'react';
import type { Building } from '@/data/world';
import type { MultiBuildingAd } from '@/lib/multiBuildingAd';
import { iso, TILE_W, TILE_H, WALL_H_UNIT } from './constants';

interface Props {
  ads: MultiBuildingAd[];
  buildings: Building[];
}

// Isometric angles
const SOUTH_ANGLE = Math.atan2(TILE_H, TILE_W) * (180 / Math.PI); // ≈ 26.57°
const EAST_ANGLE = Math.atan2(TILE_H, -TILE_W) * (180 / Math.PI); // ≈ -26.57°

/** Render brand canvases painted on building walls */
export const MultiBuildingAdRenderer: React.FC<Props> = React.memo(({ ads, buildings }) => {
  return (
    <g>
      {ads.map(ad => {
        const blds = ad.buildingIds
          .map(id => buildings.find(b => b.id === id))
          .filter(Boolean) as Building[];
        if (blds.length < 2) return null;

        return <WallPaintedAd key={ad.id} ad={ad} buildings={blds} />;
      })}
    </g>
  );
});
MultiBuildingAdRenderer.displayName = 'MultiBuildingAdRenderer';

// ===== WALL-PAINTED AD (text follows wall angle) =====
const WallPaintedAd: React.FC<{ ad: MultiBuildingAd; buildings: Building[] }> = ({ ad, buildings }) => {
  const isSouth = ad.face === 'south';

  if (isSouth) {
    // South wall: find leftmost and rightmost points
    const sorted = [...buildings].sort((a, b) => a.gridX - b.gridX);
    const leftBld = sorted[0];
    const rightBld = sorted[sorted.length - 1];
    const sw = iso(leftBld.gridX, leftBld.gridY + leftBld.height);
    const se = iso(rightBld.gridX + rightBld.width, rightBld.gridY + rightBld.height);
    const minH = Math.min(...sorted.map(b => b.heightLevel));
    const wallH = WALL_H_UNIT * minH;

    const mx = (sw.x + se.x) / 2;
    const my = (sw.y + se.y) / 2 - wallH * 0.5;
    const panelW = Math.hypot(se.x - sw.x, se.y - sw.y) * 0.8;
    const panelH = wallH * 0.55;

    return (
      <g transform={`rotate(${SOUTH_ANGLE}, ${mx}, ${my})`}>
        {/* Wall panel tint */}
        <rect x={mx - panelW / 2} y={my - panelH / 2}
          width={panelW} height={panelH} rx={2}
          fill={ad.brandColor} fillOpacity={0.12}
          stroke={ad.brandColor} strokeWidth={0.5} strokeOpacity={0.25} />

        {/* Brand initial */}
        <text x={mx - panelW / 2 + panelH * 0.6} y={my + panelH * 0.15}
          textAnchor="middle" fontSize={panelH * 0.55}
          fill={ad.brandColor} fillOpacity={0.6}
          fontFamily="Inter" fontWeight={900}>{ad.brandInitial}</text>

        {/* Brand name */}
        <text x={mx + 4} y={my + panelH * 0.12}
          textAnchor="middle" fontSize={panelH * 0.32}
          fill={ad.brandColor} fillOpacity={0.7}
          fontFamily="Inter" fontWeight={800} letterSpacing="1">
          {ad.brandName}
        </text>
      </g>
    );
  } else {
    // East wall
    const sorted = [...buildings].sort((a, b) => a.gridY - b.gridY);
    const topBld = sorted[0];
    const botBld = sorted[sorted.length - 1];
    const ne = iso(topBld.gridX + topBld.width, topBld.gridY);
    const se = iso(botBld.gridX + botBld.width, botBld.gridY + botBld.height);
    const minH = Math.min(...sorted.map(b => b.heightLevel));
    const wallH = WALL_H_UNIT * minH;

    const mx = (ne.x + se.x) / 2;
    const my = (ne.y + se.y) / 2 - wallH * 0.5;
    const panelW = Math.hypot(se.x - ne.x, se.y - ne.y) * 0.75;
    const panelH = wallH * 0.5;

    return (
      <g transform={`rotate(${EAST_ANGLE}, ${mx}, ${my})`}>
        {/* Wall panel tint */}
        <rect x={mx - panelW / 2} y={my - panelH / 2}
          width={panelW} height={panelH} rx={2}
          fill={ad.brandColor} fillOpacity={0.1}
          stroke={ad.brandColor} strokeWidth={0.5} strokeOpacity={0.2} />

        {/* Brand initial */}
        <text x={mx - panelW / 2 + panelH * 0.6} y={my + panelH * 0.15}
          textAnchor="middle" fontSize={panelH * 0.5}
          fill={ad.brandColor} fillOpacity={0.5}
          fontFamily="Inter" fontWeight={900}>{ad.brandInitial}</text>

        {/* Brand name */}
        <text x={mx + 4} y={my + panelH * 0.12}
          textAnchor="middle" fontSize={panelH * 0.3}
          fill={ad.brandColor} fillOpacity={0.6}
          fontFamily="Inter" fontWeight={800} letterSpacing="0.8">
          {ad.brandName}
        </text>
      </g>
    );
  }
};

// ===== SOUTH WALL DIRECT CANVAS =====
const SouthCanvasAd: React.FC<{ ad: MultiBuildingAd; buildings: Building[] }> = ({ ad, buildings }) => {
  const sorted = [...buildings].sort((a, b) => a.gridX - b.gridX);
  const leftBld = sorted[0];
  const rightBld = sorted[sorted.length - 1];
  const sw = iso(leftBld.gridX, leftBld.gridY + leftBld.height);
  const se = iso(rightBld.gridX + rightBld.width, rightBld.gridY + rightBld.height);

  const minHeight = Math.min(...sorted.map(b => b.heightLevel));
  const wallH = WALL_H_UNIT * minHeight;
  const canvasH = wallH * 0.6;
  const topOff = wallH * 0.18;
  const bgColor = bgFromBrand(ad.brandColor);

  return (
    <g>
      {/* Canvas */}
      <polygon
        points={`${sw.x},${sw.y - topOff - canvasH} ${se.x},${se.y - topOff - canvasH} ${se.x},${se.y - topOff} ${sw.x},${sw.y - topOff}`}
        fill={bgColor} fillOpacity={0.85}
        stroke={ad.brandColor} strokeWidth={0.8} strokeOpacity={0.5}
      />
      {/* Accent strip */}
      <polygon
        points={`${sw.x},${sw.y - topOff - canvasH} ${se.x},${se.y - topOff - canvasH} ${se.x},${se.y - topOff - canvasH + 1.5} ${sw.x},${sw.y - topOff - canvasH + 1.5}`}
        fill={ad.brandColor} fillOpacity={0.65}
      />
      {/* Logo + text */}
      {(() => {
        const cx = (sw.x + se.x) / 2;
        const cy = (sw.y + se.y) / 2 - topOff - canvasH / 2;
        return (
          <>
            <circle cx={cx - 14} cy={cy} r={4.5} fill={ad.brandColor} fillOpacity={0.9} />
            <text x={cx - 14} y={cy + 1.8} textAnchor="middle" fontSize={5.5}
              fill="hsl(0,0%,100%)" fontFamily="Inter" fontWeight={800}>{ad.brandInitial}</text>
            <text x={cx + 2} y={cy - 1} textAnchor="middle" fontSize={7}
              fill="hsl(220,18%,12%)" fontFamily="Inter" fontWeight={800}>{ad.brandName}</text>
            <text x={cx + 2} y={cy + 5} textAnchor="middle" fontSize={3}
              fill="hsl(220,12%,35%)" fontFamily="Inter" fontWeight={500}>{ad.tagline}</text>
          </>
        );
      })()}
      {/* Glow */}
      <polygon
        points={`${sw.x - 1},${sw.y - topOff - canvasH - 1} ${se.x + 1},${se.y - topOff - canvasH - 1} ${se.x + 1},${se.y - topOff + 1} ${sw.x - 1},${sw.y - topOff + 1}`}
        fill="none" stroke={ad.brandColor} strokeWidth={0.4} strokeOpacity={0.15}>
        <animate attributeName="strokeOpacity" values="0.08;0.3;0.08" dur="3.5s" repeatCount="indefinite" />
      </polygon>
      {/* Seams */}
      {sorted.slice(0, -1).map((bld, i) => {
        const seamPos = iso(bld.gridX + bld.width, bld.gridY + bld.height);
        return (
          <line key={`seam_s_${i}`}
            x1={seamPos.x} y1={seamPos.y - topOff - canvasH}
            x2={seamPos.x} y2={seamPos.y - topOff}
            stroke={ad.brandColor} strokeWidth={0.3} strokeOpacity={0.2}
            strokeDasharray="2 2" />
        );
      })}
    </g>
  );
};

// ===== EAST WALL DIRECT CANVAS =====
const EastCanvasAd: React.FC<{ ad: MultiBuildingAd; buildings: Building[] }> = ({ ad, buildings }) => {
  const sorted = [...buildings].sort((a, b) => a.gridY - b.gridY);
  const topBld = sorted[0];
  const botBld = sorted[sorted.length - 1];
  const ne = iso(topBld.gridX + topBld.width, topBld.gridY);
  const se = iso(botBld.gridX + botBld.width, botBld.gridY + botBld.height);

  const minHeight = Math.min(...sorted.map(b => b.heightLevel));
  const wallH = WALL_H_UNIT * minHeight;
  const canvasH = wallH * 0.55;
  const topOff = wallH * 0.2;
  const bgColor = bgFromBrand(ad.brandColor);

  return (
    <g>
      {/* Canvas */}
      <polygon
        points={`${ne.x},${ne.y - topOff - canvasH} ${se.x},${se.y - topOff - canvasH} ${se.x},${se.y - topOff} ${ne.x},${ne.y - topOff}`}
        fill={bgColor} fillOpacity={0.7}
        stroke={ad.brandColor} strokeWidth={0.7} strokeOpacity={0.45}
      />
      {/* Accent strip */}
      <polygon
        points={`${ne.x},${ne.y - topOff - canvasH} ${se.x},${se.y - topOff - canvasH} ${se.x},${se.y - topOff - canvasH + 1.2} ${ne.x},${ne.y - topOff - canvasH + 1.2}`}
        fill={ad.brandColor} fillOpacity={0.55}
      />
      {/* Logo + text */}
      {(() => {
        const cx = (ne.x + se.x) / 2;
        const cy = (ne.y + se.y) / 2 - topOff - canvasH / 2;
        return (
          <>
            <circle cx={cx} cy={cy - 3} r={3.5} fill={ad.brandColor} fillOpacity={0.85} />
            <text x={cx} y={cy - 1.2} textAnchor="middle" fontSize={4.5}
              fill="hsl(0,0%,100%)" fontFamily="Inter" fontWeight={800}>{ad.brandInitial}</text>
            <text x={cx} y={cy + 4} textAnchor="middle" fontSize={5}
              fill="hsl(220,15%,15%)" fontFamily="Inter" fontWeight={800}>{ad.brandName}</text>
            <text x={cx} y={cy + 8} textAnchor="middle" fontSize={2.3}
              fill="hsl(220,10%,40%)" fontFamily="Inter" fontWeight={500}>{ad.tagline}</text>
          </>
        );
      })()}
      {/* Glow */}
      <polygon
        points={`${ne.x - 1},${ne.y - topOff - canvasH - 1} ${se.x + 1},${se.y - topOff - canvasH - 1} ${se.x + 1},${se.y - topOff + 1} ${ne.x - 1},${ne.y - topOff + 1}`}
        fill="none" stroke={ad.brandColor} strokeWidth={0.35} strokeOpacity={0.12}>
        <animate attributeName="strokeOpacity" values="0.06;0.25;0.06" dur="4s" repeatCount="indefinite" />
      </polygon>
      {/* Seams */}
      {sorted.slice(0, -1).map((bld, i) => {
        const seamPos = iso(bld.gridX + bld.width, bld.gridY + bld.height);
        return (
          <line key={`seam_e_${i}`}
            x1={seamPos.x} y1={seamPos.y - topOff - canvasH}
            x2={seamPos.x} y2={seamPos.y - topOff}
            stroke={ad.brandColor} strokeWidth={0.3} strokeOpacity={0.18}
            strokeDasharray="2 2" />
        );
      })}
    </g>
  );
};
