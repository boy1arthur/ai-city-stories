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
        if (blds.length < 1) return null;

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
    const my = (sw.y + se.y) / 2 - wallH * 0.75;
    const panelW = Math.hypot(se.x - sw.x, se.y - sw.y) * 0.7;
    const panelH = wallH * 0.3;

    return (
      <g transform={`rotate(${SOUTH_ANGLE}, ${mx}, ${my})`}>
        {/* Wall panel tint */}
        <rect x={mx - panelW / 2} y={my - panelH / 2}
          width={panelW} height={panelH} rx={2}
          fill={ad.brandColor}
          stroke={ad.brandColor} strokeWidth={0.7} />

        {/* Brand initial */}
        <text x={mx - panelW / 2 + panelH * 0.6} y={my + panelH * 0.15}
          textAnchor="middle" fontSize={panelH * 0.55}
          fill="hsl(0,0%,100%)"
          fontFamily="Inter" fontWeight={900}>{ad.brandInitial}</text>

        {/* Brand name */}
        <text x={mx + 4} y={my + panelH * 0.12}
          textAnchor="middle" fontSize={panelH * 0.32}
          fill="hsl(0,0%,100%)"
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
    const my = (ne.y + se.y) / 2 - wallH * 0.75;
    const panelW = Math.hypot(se.x - ne.x, se.y - ne.y) * 0.65;
    const panelH = wallH * 0.3;

    return (
      <g transform={`rotate(${EAST_ANGLE}, ${mx}, ${my})`}>
        {/* Wall panel tint */}
        <rect x={mx - panelW / 2} y={my - panelH / 2}
          width={panelW} height={panelH} rx={2}
          fill={ad.brandColor}
          stroke={ad.brandColor} strokeWidth={0.7} />

        {/* Brand initial */}
        <text x={mx - panelW / 2 + panelH * 0.6} y={my + panelH * 0.15}
          textAnchor="middle" fontSize={panelH * 0.5}
          fill="hsl(0,0%,100%)"
          fontFamily="Inter" fontWeight={900}>{ad.brandInitial}</text>

        {/* Brand name */}
        <text x={mx + 4} y={my + panelH * 0.12}
          textAnchor="middle" fontSize={panelH * 0.3}
          fill="hsl(0,0%,100%)"
          fontFamily="Inter" fontWeight={800} letterSpacing="0.8">
          {ad.brandName}
        </text>
      </g>
    );
  }
};

