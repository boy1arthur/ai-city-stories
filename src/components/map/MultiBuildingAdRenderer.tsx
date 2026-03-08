import React from 'react';
import type { Building } from '@/data/world';
import type { MultiBuildingAd } from '@/lib/multiBuildingAd';
import { iso, TILE_W, TILE_H, WALL_H_UNIT } from './constants';

interface Props {
  ads: MultiBuildingAd[];
  buildings: Building[];
}

/** Render brand banners painted on building walls as isometric parallelograms */
export const MultiBuildingAdRenderer: React.FC<Props> = React.memo(({ ads, buildings }) => {
  return (
    <g>
      {ads.map(ad => {
        const blds = ad.buildingIds
          .map(id => buildings.find(b => b.id === id))
          .filter(Boolean) as Building[];
        if (blds.length < 1) return null;

        return <WallBanner key={ad.id} ad={ad} buildings={blds} />;
      })}
    </g>
  );
});
MultiBuildingAdRenderer.displayName = 'MultiBuildingAdRenderer';

// Minimum font size for readability
const MIN_FONT = 5;
const MIN_BANNER_H = 10;

const WallBanner: React.FC<{ ad: MultiBuildingAd; buildings: Building[] }> = ({ ad, buildings }) => {
  const b = buildings[0]; // single building per banner now
  const wallH = WALL_H_UNIT * b.heightLevel;
  const isSouth = ad.face === 'south';

  // Banner occupies top 30% of wall
  const bannerTopRatio = 0.85; // from top of wall
  const bannerBotRatio = 0.55; // to this ratio

  if (isSouth) {
    // South wall: SW corner to SE corner
    const sw = iso(b.gridX, b.gridY + b.height);
    const se = iso(b.gridX + b.width, b.gridY + b.height);

    // Banner parallelogram corners (on the south wall face)
    const topL = { x: sw.x, y: sw.y - wallH * bannerTopRatio };
    const topR = { x: se.x, y: se.y - wallH * bannerTopRatio };
    const botL = { x: sw.x, y: sw.y - wallH * bannerBotRatio };
    const botR = { x: se.x, y: se.y - wallH * bannerBotRatio };

    const bannerH = wallH * (bannerTopRatio - bannerBotRatio);
    const effectiveH = Math.max(bannerH, MIN_BANNER_H);

    // Center point for text
    const cx = (topL.x + topR.x + botL.x + botR.x) / 4;
    const cy = (topL.y + topR.y + botL.y + botR.y) / 4;

    // Text angle follows wall baseline (SW→SE direction)
    const angle = Math.atan2(se.y - sw.y, se.x - sw.x) * (180 / Math.PI);

    const fontSize = Math.max(MIN_FONT, effectiveH * 0.5);
    const fontSizeName = Math.max(MIN_FONT * 0.7, effectiveH * 0.3);

    // For very short buildings, use a rooftop sign instead
    if (b.heightLevel <= 1) {
      return <RooftopSign ad={ad} building={b} face="south" />;
    }

    return (
      <g>
        {/* Parallelogram banner background */}
        <polygon
          points={`${topL.x},${topL.y} ${topR.x},${topR.y} ${botR.x},${botR.y} ${botL.x},${botL.y}`}
          fill={ad.brandColor} stroke={ad.brandColor} strokeWidth={0.5} />

        {/* Brand initial + name, rotated to follow wall */}
        <g transform={`rotate(${angle}, ${cx}, ${cy})`}>
          <text x={cx - fontSize * 1.2} y={cy + fontSize * 0.15}
            textAnchor="middle" fontSize={fontSize}
            fill="hsl(0,0%,100%)" fontFamily="Inter" fontWeight={900}>
            {ad.brandInitial}
          </text>
          <text x={cx + fontSizeName * 0.5} y={cy + fontSizeName * 0.15}
            textAnchor="middle" fontSize={fontSizeName}
            fill="hsl(0,0%,100%)" fontFamily="Inter" fontWeight={800} letterSpacing="1">
            {ad.brandName}
          </text>
        </g>
      </g>
    );
  } else {
    // East wall: NE corner to SE corner
    const ne = iso(b.gridX + b.width, b.gridY);
    const se = iso(b.gridX + b.width, b.gridY + b.height);

    const topL = { x: ne.x, y: ne.y - wallH * bannerTopRatio };
    const topR = { x: se.x, y: se.y - wallH * bannerTopRatio };
    const botL = { x: ne.x, y: ne.y - wallH * bannerBotRatio };
    const botR = { x: se.x, y: se.y - wallH * bannerBotRatio };

    const bannerH = wallH * (bannerTopRatio - bannerBotRatio);
    const effectiveH = Math.max(bannerH, MIN_BANNER_H);

    const cx = (topL.x + topR.x + botL.x + botR.x) / 4;
    const cy = (topL.y + topR.y + botL.y + botR.y) / 4;

    // Text angle follows wall baseline (NE→SE direction)
    const angle = Math.atan2(se.y - ne.y, se.x - ne.x) * (180 / Math.PI);

    const fontSize = Math.max(MIN_FONT, effectiveH * 0.5);
    const fontSizeName = Math.max(MIN_FONT * 0.7, effectiveH * 0.3);

    if (b.heightLevel <= 1) {
      return <RooftopSign ad={ad} building={b} face="east" />;
    }

    return (
      <g>
        <polygon
          points={`${topL.x},${topL.y} ${topR.x},${topR.y} ${botR.x},${botR.y} ${botL.x},${botL.y}`}
          fill={ad.brandColor} stroke={ad.brandColor} strokeWidth={0.5} />

        <g transform={`rotate(${angle}, ${cx}, ${cy})`}>
          <text x={cx - fontSize * 1.2} y={cy + fontSize * 0.15}
            textAnchor="middle" fontSize={fontSize}
            fill="hsl(0,0%,100%)" fontFamily="Inter" fontWeight={900}>
            {ad.brandInitial}
          </text>
          <text x={cx + fontSizeName * 0.5} y={cy + fontSizeName * 0.15}
            textAnchor="middle" fontSize={fontSizeName}
            fill="hsl(0,0%,100%)" fontFamily="Inter" fontWeight={800} letterSpacing="0.8">
            {ad.brandName}
          </text>
        </g>
      </g>
    );
  }
};

/** Rooftop sign for short buildings (heightLevel 1) — sign above roofline */
const RooftopSign: React.FC<{ ad: MultiBuildingAd; building: Building; face: 'south' | 'east' }> = ({ ad, building: b, face }) => {
  const wallH = WALL_H_UNIT * b.heightLevel;
  const signH = 12;
  const signW = 28;

  if (face === 'south') {
    const sw = iso(b.gridX, b.gridY + b.height);
    const se = iso(b.gridX + b.width, b.gridY + b.height);
    const cx = (sw.x + se.x) / 2;
    const cy = (sw.y + se.y) / 2 - wallH - signH / 2 - 2;

    // Angle follows south wall
    const angle = Math.atan2(se.y - sw.y, se.x - sw.x) * (180 / Math.PI);

    return (
      <g>
        {/* Sign post */}
        <line x1={cx} y1={cy + signH / 2} x2={cx} y2={cy + signH / 2 + 4}
          stroke="hsl(220,5%,40%)" strokeWidth={1} />
        {/* Sign board */}
        <g transform={`rotate(${angle}, ${cx}, ${cy})`}>
          <rect x={cx - signW / 2} y={cy - signH / 2} width={signW} height={signH} rx={2}
            fill={ad.brandColor} stroke={ad.brandColor} strokeWidth={0.5} />
          <text x={cx - signW / 4} y={cy + 2}
            textAnchor="middle" fontSize={6}
            fill="hsl(0,0%,100%)" fontFamily="Inter" fontWeight={900}>
            {ad.brandInitial}
          </text>
          <text x={cx + signW / 8} y={cy + 2}
            textAnchor="middle" fontSize={4.5}
            fill="hsl(0,0%,100%)" fontFamily="Inter" fontWeight={800} letterSpacing="0.5">
            {ad.brandName}
          </text>
        </g>
      </g>
    );
  } else {
    const ne = iso(b.gridX + b.width, b.gridY);
    const se = iso(b.gridX + b.width, b.gridY + b.height);
    const cx = (ne.x + se.x) / 2;
    const cy = (ne.y + se.y) / 2 - wallH - signH / 2 - 2;

    const angle = Math.atan2(se.y - ne.y, se.x - ne.x) * (180 / Math.PI);

    return (
      <g>
        <line x1={cx} y1={cy + signH / 2} x2={cx} y2={cy + signH / 2 + 4}
          stroke="hsl(220,5%,40%)" strokeWidth={1} />
        <g transform={`rotate(${angle}, ${cx}, ${cy})`}>
          <rect x={cx - signW / 2} y={cy - signH / 2} width={signW} height={signH} rx={2}
            fill={ad.brandColor} stroke={ad.brandColor} strokeWidth={0.5} />
          <text x={cx - signW / 4} y={cy + 2}
            textAnchor="middle" fontSize={6}
            fill="hsl(0,0%,100%)" fontFamily="Inter" fontWeight={900}>
            {ad.brandInitial}
          </text>
          <text x={cx + signW / 8} y={cy + 2}
            textAnchor="middle" fontSize={4.5}
            fill="hsl(0,0%,100%)" fontFamily="Inter" fontWeight={800} letterSpacing="0.5">
            {ad.brandName}
          </text>
        </g>
      </g>
    );
  }
};
