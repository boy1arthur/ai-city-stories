import React from 'react';
import type { Building } from '@/data/world';
import type { MultiBuildingAd } from '@/lib/multiBuildingAd';
import { isAdOccluded } from '@/lib/multiBuildingAd';
import { iso, WALL_H_UNIT } from './constants';

interface Props {
  ads: MultiBuildingAd[];
  buildings: Building[];
}

function bgFromBrand(color: string, boost = 35): string {
  return color.replace(/(\d+)%\)$/, (_, n: string) => `${Math.min(95, parseInt(n) + boost)}%)`);
}

/** Render continuous brand canvases — hybrid: wall-direct or floating banner */
export const MultiBuildingAdRenderer: React.FC<Props> = React.memo(({ ads, buildings }) => {
  return (
    <g>
      {ads.map(ad => {
        const blds = ad.buildingIds
          .map(id => buildings.find(b => b.id === id))
          .filter(Boolean) as Building[];
        if (blds.length < 2) return null;

        // Always use floating banner — wall-direct rendering is unstable in isometric SVG
        return <FloatingBannerAd key={ad.id} ad={ad} buildings={blds} />;
      })}
    </g>
  );
});
MultiBuildingAdRenderer.displayName = 'MultiBuildingAdRenderer';

// ===== FLOATING BANNER (for occluded walls) =====
const FloatingBannerAd: React.FC<{ ad: MultiBuildingAd; buildings: Building[] }> = ({ ad, buildings }) => {
  // Position banner above the tallest building in the group
  const maxHeightLevel = Math.max(...buildings.map(b => b.heightLevel));
  const tallest = buildings.find(b => b.heightLevel === maxHeightLevel) || buildings[0];
  const maxWallH = WALL_H_UNIT * maxHeightLevel;

  // Compute center of building group
  const minGX = Math.min(...buildings.map(b => b.gridX));
  const maxGX = Math.max(...buildings.map(b => b.gridX + b.width));
  const minGY = Math.min(...buildings.map(b => b.gridY));
  const maxGY = Math.max(...buildings.map(b => b.gridY + b.height));

  const centerIso = iso((minGX + maxGX) / 2, (minGY + maxGY) / 2);
  const floatY = centerIso.y - maxWallH - 28; // Float above roofline

  // Wall anchor point (where the actual wall is)
  let anchorIso: { x: number; y: number };
  if (ad.face === 'south') {
    anchorIso = iso((minGX + maxGX) / 2, maxGY);
  } else {
    anchorIso = iso(maxGX, (minGY + maxGY) / 2);
  }
  const anchorY = anchorIso.y - maxWallH * 0.5;

  const bannerW = 48;
  const bannerH = 16;
  const bgColor = bgFromBrand(ad.brandColor, 38);

  return (
    <g>
      {/* Connecting dashed line from banner to wall */}
      <line
        x1={centerIso.x} y1={floatY + bannerH / 2}
        x2={anchorIso.x} y2={anchorY}
        stroke={ad.brandColor} strokeWidth={0.6} strokeOpacity={0.35}
        strokeDasharray="3 2"
      />
      {/* Wall indicator dot */}
      <circle cx={anchorIso.x} cy={anchorY} r={2}
        fill={ad.brandColor} fillOpacity={0.5} />

      {/* Banner shadow */}
      <ellipse cx={centerIso.x} cy={floatY + bannerH + 2} rx={bannerW / 2 - 4} ry={2}
        fill="hsl(0,0%,0%)" fillOpacity={0.08} />

      {/* Banner background */}
      <rect
        x={centerIso.x - bannerW / 2} y={floatY}
        width={bannerW} height={bannerH} rx={3}
        fill={bgColor} fillOpacity={0.92}
        stroke={ad.brandColor} strokeWidth={1} strokeOpacity={0.6}
      />

      {/* Top accent strip */}
      <rect
        x={centerIso.x - bannerW / 2} y={floatY}
        width={bannerW} height={2} rx={3}
        fill={ad.brandColor} fillOpacity={0.65}
      />

      {/* Logo circle */}
      <circle cx={centerIso.x - bannerW / 2 + 9} cy={floatY + bannerH / 2 + 1} r={4.5}
        fill={ad.brandColor} fillOpacity={0.9} />
      <text x={centerIso.x - bannerW / 2 + 9} y={floatY + bannerH / 2 + 3}
        textAnchor="middle" fontSize={5.5}
        fill="hsl(0,0%,100%)" fontFamily="Inter" fontWeight={800}>{ad.brandInitial}</text>

      {/* Brand name */}
      <text x={centerIso.x + 4} y={floatY + bannerH / 2}
        textAnchor="middle" fontSize={7}
        fill="hsl(220,18%,12%)" fontFamily="Inter" fontWeight={800}>
        {ad.brandName}
      </text>

      {/* Tagline */}
      <text x={centerIso.x + 4} y={floatY + bannerH / 2 + 6}
        textAnchor="middle" fontSize={3}
        fill="hsl(220,12%,40%)" fontFamily="Inter" fontWeight={500}>
        {ad.tagline}
      </text>

      {/* Face indicator badge */}
      {(() => {
        const label = ad.face === 'south' ? '▼ SOUTH WALL' : '▶ EAST WALL';
        return (
          <>
            <rect x={centerIso.x + bannerW / 2 - 22} y={floatY + bannerH - 5}
              width={20} height={4.5} rx={2}
              fill={ad.brandColor} fillOpacity={0.12} stroke={ad.brandColor} strokeWidth={0.3} />
            <text x={centerIso.x + bannerW / 2 - 12} y={floatY + bannerH - 2}
              textAnchor="middle" fontSize={2.2}
              fill={ad.brandColor} fontFamily="Inter" fontWeight={700} letterSpacing="0.3">
              {label}
            </text>
          </>
        );
      })()}

      {/* Glow pulse */}
      <rect
        x={centerIso.x - bannerW / 2 - 1.5} y={floatY - 1.5}
        width={bannerW + 3} height={bannerH + 3} rx={4}
        fill="none" stroke={ad.brandColor} strokeWidth={0.5} strokeOpacity={0.15}>
        <animate attributeName="strokeOpacity" values="0.08;0.28;0.08" dur="3s" repeatCount="indefinite" />
      </rect>
    </g>
  );
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
