import React from 'react';
import type { Building } from '@/data/world';
import type { MultiBuildingAd } from '@/lib/multiBuildingAd';
import { iso, WALL_H_UNIT } from './constants';

interface Props {
  ads: MultiBuildingAd[];
  buildings: Building[];
}

/** Render continuous brand canvases across adjacent buildings */
export const MultiBuildingAdRenderer: React.FC<Props> = React.memo(({ ads, buildings }) => {
  return (
    <g>
      {ads.map(ad => {
        const blds = ad.buildingIds
          .map(id => buildings.find(b => b.id === id))
          .filter(Boolean) as Building[];
        if (blds.length < 2) return null;

        switch (ad.face) {
          case 'south': return <SouthCanvasAd key={ad.id} ad={ad} buildings={blds} />;
          case 'east': return <EastCanvasAd key={ad.id} ad={ad} buildings={blds} />;
          case 'roof': return <RoofCanvasAd key={ad.id} ad={ad} buildings={blds} />;
        }
      })}
    </g>
  );
});
MultiBuildingAdRenderer.displayName = 'MultiBuildingAdRenderer';

// ===== SOUTH WALL CONTINUOUS CANVAS =====
const SouthCanvasAd: React.FC<{ ad: MultiBuildingAd; buildings: Building[] }> = ({ ad, buildings }) => {
  // Sort buildings left to right (by gridX)
  const sorted = [...buildings].sort((a, b) => a.gridX - b.gridX);
  
  // Find the overall south wall extents
  const leftBld = sorted[0];
  const rightBld = sorted[sorted.length - 1];
  const sw = iso(leftBld.gridX, leftBld.gridY + leftBld.height);
  const se = iso(rightBld.gridX + rightBld.width, rightBld.gridY + rightBld.height);
  
  // Use minimum height for consistent canvas
  const minHeight = Math.min(...sorted.map(b => b.heightLevel));
  const wallH = WALL_H_UNIT * minHeight;
  
  // Canvas area (lower 70% of min wall height)
  const canvasRatio = 0.65;
  const canvasH = wallH * canvasRatio;
  const canvasTopOffset = wallH * 0.15;
  
  const bgColor = ad.brandColor.replace(/(\d+)%\)$/, (_, n: string) => `${Math.min(95, parseInt(n) + 35)}%)`);

  return (
    <g>
      {/* Continuous canvas background */}
      <polygon
        points={`
          ${sw.x},${sw.y - canvasTopOffset - canvasH}
          ${se.x},${se.y - canvasTopOffset - canvasH}
          ${se.x},${se.y - canvasTopOffset}
          ${sw.x},${sw.y - canvasTopOffset}
        `}
        fill={bgColor} fillOpacity={0.85}
        stroke={ad.brandColor} strokeWidth={1} strokeOpacity={0.6}
      />

      {/* Brand accent strip (top) */}
      <polygon
        points={`
          ${sw.x},${sw.y - canvasTopOffset - canvasH}
          ${se.x},${se.y - canvasTopOffset - canvasH}
          ${se.x},${se.y - canvasTopOffset - canvasH + 2}
          ${sw.x},${sw.y - canvasTopOffset - canvasH + 2}
        `}
        fill={ad.brandColor} fillOpacity={0.7}
      />

      {/* Logo circle */}
      {(() => {
        const cx = (sw.x + se.x) / 2 - 14;
        const cy = (sw.y + se.y) / 2 - canvasTopOffset - canvasH / 2;
        return (
          <>
            <circle cx={cx} cy={cy} r={5} fill={ad.brandColor} fillOpacity={0.9} />
            <text x={cx} y={cy + 2} textAnchor="middle" fontSize={6}
              fill="hsl(0,0%,100%)" fontFamily="Inter" fontWeight={800}>{ad.brandInitial}</text>
          </>
        );
      })()}

      {/* Brand name — large */}
      <text
        x={(sw.x + se.x) / 2 + 2}
        y={(sw.y + se.y) / 2 - canvasTopOffset - canvasH / 2 - 1}
        textAnchor="middle" fontSize={8}
        fill="hsl(220,18%,12%)" fontFamily="Inter" fontWeight={800}>
        {ad.brandName}
      </text>

      {/* Tagline */}
      <text
        x={(sw.x + se.x) / 2 + 2}
        y={(sw.y + se.y) / 2 - canvasTopOffset - canvasH / 2 + 6}
        textAnchor="middle" fontSize={3.5}
        fill="hsl(220,12%,35%)" fontFamily="Inter" fontWeight={500}>
        {ad.tagline}
      </text>

      {/* Glow outline */}
      <polygon
        points={`
          ${sw.x - 1},${sw.y - canvasTopOffset - canvasH - 1}
          ${se.x + 1},${se.y - canvasTopOffset - canvasH - 1}
          ${se.x + 1},${se.y - canvasTopOffset + 1}
          ${sw.x - 1},${sw.y - canvasTopOffset + 1}
        `}
        fill="none" stroke={ad.brandColor} strokeWidth={0.5} strokeOpacity={0.2}>
        <animate attributeName="strokeOpacity" values="0.1;0.35;0.1" dur="3.5s" repeatCount="indefinite" />
      </polygon>

      {/* "MULTI-BUILDING" badge */}
      {(() => {
        const bx = se.x - 2;
        const by = se.y - canvasTopOffset - canvasH + 5;
        return (
          <>
            <rect x={bx - 12} y={by - 3} width={24} height={6} rx={3}
              fill={ad.brandColor} fillOpacity={0.15} stroke={ad.brandColor} strokeWidth={0.4} />
            <text x={bx} y={by + 0.5} textAnchor="middle" fontSize={2.5}
              fill={ad.brandColor} fontFamily="Inter" fontWeight={700} letterSpacing="0.5">
              MULTI-BUILDING
            </text>
          </>
        );
      })()}

      {/* Building seam indicators (dashed lines where buildings meet) */}
      {sorted.slice(0, -1).map((bld, i) => {
        const seamPos = iso(bld.gridX + bld.width, bld.gridY + bld.height);
        return (
          <line key={`seam_s_${i}`}
            x1={seamPos.x} y1={seamPos.y - canvasTopOffset - canvasH}
            x2={seamPos.x} y2={seamPos.y - canvasTopOffset}
            stroke={ad.brandColor} strokeWidth={0.3} strokeOpacity={0.25}
            strokeDasharray="2 2"
          />
        );
      })}
    </g>
  );
};

// ===== EAST WALL CONTINUOUS CANVAS =====
const EastCanvasAd: React.FC<{ ad: MultiBuildingAd; buildings: Building[] }> = ({ ad, buildings }) => {
  // Sort buildings top to bottom (by gridY)
  const sorted = [...buildings].sort((a, b) => a.gridY - b.gridY);
  
  const topBld = sorted[0];
  const botBld = sorted[sorted.length - 1];
  const ne = iso(topBld.gridX + topBld.width, topBld.gridY);
  const se = iso(botBld.gridX + botBld.width, botBld.gridY + botBld.height);
  
  const minHeight = Math.min(...sorted.map(b => b.heightLevel));
  const wallH = WALL_H_UNIT * minHeight;
  
  const canvasRatio = 0.6;
  const canvasH = wallH * canvasRatio;
  const canvasTopOffset = wallH * 0.18;
  
  const bgColor = ad.brandColor.replace(/(\d+)%\)$/, (_, n: string) => `${Math.min(95, parseInt(n) + 35)}%)`);

  return (
    <g>
      {/* Canvas background */}
      <polygon
        points={`
          ${ne.x},${ne.y - canvasTopOffset - canvasH}
          ${se.x},${se.y - canvasTopOffset - canvasH}
          ${se.x},${se.y - canvasTopOffset}
          ${ne.x},${ne.y - canvasTopOffset}
        `}
        fill={bgColor} fillOpacity={0.75}
        stroke={ad.brandColor} strokeWidth={0.8} strokeOpacity={0.5}
      />

      {/* Brand accent strip */}
      <polygon
        points={`
          ${ne.x},${ne.y - canvasTopOffset - canvasH}
          ${se.x},${se.y - canvasTopOffset - canvasH}
          ${se.x},${se.y - canvasTopOffset - canvasH + 1.5}
          ${ne.x},${ne.y - canvasTopOffset - canvasH + 1.5}
        `}
        fill={ad.brandColor} fillOpacity={0.6}
      />

      {/* Logo */}
      {(() => {
        const cx = (ne.x + se.x) / 2;
        const cy = (ne.y + se.y) / 2 - canvasTopOffset - canvasH / 2;
        return (
          <>
            <circle cx={cx} cy={cy - 2} r={4} fill={ad.brandColor} fillOpacity={0.85} />
            <text x={cx} y={cy - 0.2} textAnchor="middle" fontSize={5}
              fill="hsl(0,0%,100%)" fontFamily="Inter" fontWeight={800}>{ad.brandInitial}</text>
            <text x={cx} y={cy + 5} textAnchor="middle" fontSize={5}
              fill="hsl(220,15%,15%)" fontFamily="Inter" fontWeight={800}>
              {ad.brandName}
            </text>
            <text x={cx} y={cy + 9} textAnchor="middle" fontSize={2.5}
              fill="hsl(220,10%,40%)" fontFamily="Inter" fontWeight={500}>
              {ad.tagline}
            </text>
          </>
        );
      })()}

      {/* Glow */}
      <polygon
        points={`
          ${ne.x - 1},${ne.y - canvasTopOffset - canvasH - 1}
          ${se.x + 1},${se.y - canvasTopOffset - canvasH - 1}
          ${se.x + 1},${se.y - canvasTopOffset + 1}
          ${ne.x - 1},${ne.y - canvasTopOffset + 1}
        `}
        fill="none" stroke={ad.brandColor} strokeWidth={0.4} strokeOpacity={0.18}>
        <animate attributeName="strokeOpacity" values="0.08;0.28;0.08" dur="4s" repeatCount="indefinite" />
      </polygon>

      {/* Seam indicators */}
      {sorted.slice(0, -1).map((bld, i) => {
        const seamPos = iso(bld.gridX + bld.width, bld.gridY + bld.height);
        return (
          <line key={`seam_e_${i}`}
            x1={seamPos.x} y1={seamPos.y - canvasTopOffset - canvasH}
            x2={seamPos.x} y2={seamPos.y - canvasTopOffset}
            stroke={ad.brandColor} strokeWidth={0.3} strokeOpacity={0.2}
            strokeDasharray="2 2"
          />
        );
      })}
    </g>
  );
};

// ===== ROOF CONTINUOUS CANVAS =====
const RoofCanvasAd: React.FC<{ ad: MultiBuildingAd; buildings: Building[] }> = ({ ad, buildings }) => {
  // Compute bounding box of all buildings
  const minGX = Math.min(...buildings.map(b => b.gridX));
  const minGY = Math.min(...buildings.map(b => b.gridY));
  const maxGX = Math.max(...buildings.map(b => b.gridX + b.width));
  const maxGY = Math.max(...buildings.map(b => b.gridY + b.height));
  
  const minHeight = Math.min(...buildings.map(b => b.heightLevel));
  const wallH = WALL_H_UNIT * minHeight;
  
  const nw = iso(minGX, minGY);
  const ne = iso(maxGX, minGY);
  const se = iso(maxGX, maxGY);
  const sw = iso(minGX, maxGY);
  
  const bgColor = ad.brandColor.replace(/(\d+)%\)$/, (_, n: string) => `${Math.min(95, parseInt(n) + 30)}%)`);

  return (
    <g>
      {/* Roof canvas overlay */}
      <polygon
        points={`${nw.x},${nw.y - wallH} ${ne.x},${ne.y - wallH} ${se.x},${se.y - wallH} ${sw.x},${sw.y - wallH}`}
        fill={bgColor} fillOpacity={0.5}
        stroke={ad.brandColor} strokeWidth={1} strokeOpacity={0.4}
      />

      {/* Large brand logo on roof */}
      {(() => {
        const cx = (nw.x + se.x) / 2;
        const cy = (nw.y + se.y) / 2 - wallH;
        return (
          <>
            {/* Logo circle */}
            <circle cx={cx} cy={cy - 1} r={7} fill={ad.brandColor} fillOpacity={0.7}
              stroke="hsl(0,0%,100%)" strokeWidth={0.5} strokeOpacity={0.3} />
            <text x={cx} y={cy + 2} textAnchor="middle" fontSize={9}
              fill="hsl(0,0%,100%)" fontFamily="Inter" fontWeight={800}>{ad.brandInitial}</text>
            
            {/* Brand name below logo */}
            <text x={cx} y={cy + 10} textAnchor="middle" fontSize={4}
              fill="hsl(220,15%,20%)" fontFamily="Inter" fontWeight={700}>
              {ad.brandName}
            </text>

            {/* Pulse ring */}
            <circle cx={cx} cy={cy - 1} r={9} fill="none"
              stroke={ad.brandColor} strokeWidth={0.4} strokeOpacity={0.3}>
              <animate attributeName="r" values="8;12;8" dur="4s" repeatCount="indefinite" />
              <animate attributeName="strokeOpacity" values="0.3;0.05;0.3" dur="4s" repeatCount="indefinite" />
            </circle>
          </>
        );
      })()}

      {/* Edge glow */}
      <polygon
        points={`${nw.x},${nw.y - wallH} ${ne.x},${ne.y - wallH} ${se.x},${se.y - wallH} ${sw.x},${sw.y - wallH}`}
        fill="none" stroke={ad.brandColor} strokeWidth={0.6} strokeOpacity={0.15}>
        <animate attributeName="strokeOpacity" values="0.08;0.25;0.08" dur="3s" repeatCount="indefinite" />
      </polygon>
    </g>
  );
};
