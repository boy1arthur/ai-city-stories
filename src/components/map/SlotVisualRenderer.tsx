import React from 'react';
import { iso, WALL_H_UNIT } from './constants';
import type { Slot } from '@/data/slots';
import type { Building } from '@/data/world';

interface Props {
  slots: Slot[];
  buildings: Building[];
  onSlotClick: (slot: Slot) => void;
}

/** Truncate text */
function fit(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max - 1) + '…';
}

/**
 * Renders BRAND_BUILDING, BRAND_SCREEN, and PRODUCT_PPL slot visuals
 * on the isometric map. PATRON_TILE is handled by PatronTileRenderer.
 */
export const SlotVisualRenderer: React.FC<Props> = React.memo(({ slots, buildings, onSlotClick }) => {
  return (
    <g>
      {slots.map(slot => {
        if (slot.type === 'PATRON_TILE') return null; // handled elsewhere

        const building = slot.location.buildingId
          ? buildings.find(b => b.id === slot.location.buildingId)
          : null;

        if (!building && slot.location.buildingId) return null;

        switch (slot.type) {
          case 'BRAND_BUILDING':
            return <BrandBuildingSlot key={slot.id} slot={slot} building={building!} onClick={() => onSlotClick(slot)} />;
          case 'BRAND_SCREEN':
            return <BrandScreenSlot key={slot.id} slot={slot} building={building!} onClick={() => onSlotClick(slot)} />;
          case 'PRODUCT_PPL':
            return <ProductPPLSlot key={slot.id} slot={slot} building={building!} onClick={() => onSlotClick(slot)} />;
          default:
            return null;
        }
      })}
    </g>
  );
});
SlotVisualRenderer.displayName = 'SlotVisualRenderer';

// ═══════════════════════════════════════
// BRAND_BUILDING — Premium neon panel
// ═══════════════════════════════════════
const BrandBuildingSlot: React.FC<{ slot: Slot; building: Building; onClick: () => void }> = ({ slot, building, onClick }) => {
  const wallH = WALL_H_UNIT * building.heightLevel;
  const face = slot.location.face || 'roof';
  const isOwned = slot.ownerType === 'brand';
  const label = slot.ownerName || slot.label;

  const center = iso(building.gridX + building.width / 2, building.gridY + building.height / 2);

  if (face === 'roof') {
    // Floating banner above the roof
    const bx = center.x;
    const by = center.y - wallH - 28;
    const w = 52;
    const h = 14;
    const accentColor = isOwned ? 'hsl(38,80%,55%)' : 'hsl(215,20%,45%)';
    const bgColor = isOwned ? 'hsl(38,30%,12%)' : 'hsl(215,10%,15%)';

    return (
      <g style={{ cursor: 'pointer' }} onClick={onClick}>
        {/* Connector line */}
        <line x1={bx} y1={center.y - wallH - 2} x2={bx} y2={by + h}
          stroke={accentColor} strokeWidth={0.6} strokeOpacity={0.4} strokeDasharray="2 2" />

        {/* Outer glow */}
        {isOwned && (
          <rect x={bx - w / 2 - 2} y={by - 2} width={w + 4} height={h + 4} rx={4}
            fill="none" stroke={accentColor} strokeWidth={1} strokeOpacity={0.15}>
            <animate attributeName="strokeOpacity" values="0.08;0.25;0.08" dur="3s" repeatCount="indefinite" />
          </rect>
        )}

        {/* Panel background */}
        <rect x={bx - w / 2} y={by} width={w} height={h} rx={2.5}
          fill={bgColor} fillOpacity={0.95}
          stroke={accentColor} strokeWidth={isOwned ? 1.2 : 0.6} />

        {/* Top accent bar */}
        <rect x={bx - w / 2} y={by} width={w} height={1.8} rx={1}
          fill={accentColor} fillOpacity={isOwned ? 0.7 : 0.3} />

        {isOwned ? (
          <>
            {/* Crown icon */}
            <text x={bx - w / 2 + 7} y={by + h / 2 + 2.5} textAnchor="middle" fontSize={7}>👑</text>
            {/* Brand name */}
            <text x={bx + 3} y={by + h / 2 + 2} textAnchor="middle" fontSize={5.5}
              fill="hsl(38,70%,72%)" fontFamily="Inter" fontWeight={800}>
              {fit(label, 10)}
            </text>
            {/* PREMIUM badge */}
            <text x={bx + w / 2 - 6} y={by + h / 2 + 1.5} textAnchor="middle" fontSize={2.5}
              fill="hsl(38,50%,55%)" fontFamily="Inter" fontWeight={700} letterSpacing="0.5">
              PREMIUM
            </text>
          </>
        ) : (
          <text x={bx} y={by + h / 2 + 2} textAnchor="middle" fontSize={4}
            fill="hsl(215,15%,55%)" fontFamily="Inter" fontWeight={500}>
            🏢 BRAND SLOT — {fit(slot.label, 12)}
          </text>
        )}
      </g>
    );
  }

  // Face: front or side — panel on wall
  const isFront = face === 'front';
  const sw = iso(building.gridX, building.gridY + building.height);
  const se = iso(building.gridX + building.width, building.gridY + building.height);
  const ne = iso(building.gridX + building.width, building.gridY);

  const wallStart = isFront ? sw : ne;
  const wallEnd = isFront ? se : se;
  const mx = (wallStart.x + wallEnd.x) / 2;
  const my = (wallStart.y + wallEnd.y) / 2 - wallH * 0.5;
  const pw = 36;
  const ph = 12;
  const accentColor = isOwned ? 'hsl(38,80%,55%)' : 'hsl(215,20%,45%)';

  return (
    <g style={{ cursor: 'pointer' }} onClick={onClick}>
      {isOwned && (
        <rect x={mx - pw / 2 - 1.5} y={my - ph / 2 - 1.5} width={pw + 3} height={ph + 3} rx={3}
          fill="none" stroke={accentColor} strokeWidth={0.8} strokeOpacity={0.2}>
          <animate attributeName="strokeOpacity" values="0.1;0.3;0.1" dur="3s" repeatCount="indefinite" />
        </rect>
      )}
      <rect x={mx - pw / 2} y={my - ph / 2} width={pw} height={ph} rx={2}
        fill={isOwned ? 'hsl(38,25%,12%)' : 'hsl(215,8%,18%)'} fillOpacity={0.92}
        stroke={accentColor} strokeWidth={isOwned ? 1 : 0.5} />
      <text x={mx} y={my + 2} textAnchor="middle" fontSize={isOwned ? 5 : 3.5}
        fill={isOwned ? 'hsl(38,65%,70%)' : 'hsl(215,15%,55%)'} fontFamily="Inter" fontWeight={isOwned ? 700 : 500}>
        {isOwned ? fit(label, 8) : 'AD SPACE'}
      </text>
    </g>
  );
};

// ═══════════════════════════════════════
// BRAND_SCREEN — Digital display 16:9
// ═══════════════════════════════════════
const BrandScreenSlot: React.FC<{ slot: Slot; building: Building; onClick: () => void }> = ({ slot, building, onClick }) => {
  const wallH = WALL_H_UNIT * building.heightLevel;
  const face = slot.location.face || 'side';
  const isOwned = slot.ownerType === 'brand';
  const label = slot.ownerName || slot.label;

  // Position on the side wall
  const ne = iso(building.gridX + building.width, building.gridY);
  const se = iso(building.gridX + building.width, building.gridY + building.height);
  const mx = (ne.x + se.x) / 2;
  const my = (ne.y + se.y) / 2 - wallH * 0.45;

  const sw = 32; // screen width
  const sh = 18; // 16:9-ish
  const screenColor = isOwned ? 'hsl(200,60%,50%)' : 'hsl(210,15%,30%)';
  const frameColor = 'hsl(220,5%,25%)';

  return (
    <g style={{ cursor: 'pointer' }} onClick={onClick}>
      {/* Screen bezel / frame */}
      <rect x={mx - sw / 2 - 2} y={my - sh / 2 - 2} width={sw + 4} height={sh + 4} rx={2}
        fill={frameColor} fillOpacity={0.9}
        stroke="hsl(220,8%,35%)" strokeWidth={0.8} />

      {/* Screen surface */}
      <rect x={mx - sw / 2} y={my - sh / 2} width={sw} height={sh} rx={1}
        fill={isOwned ? 'hsl(200,20%,8%)' : 'hsl(210,10%,12%)'} fillOpacity={0.95}
        stroke={screenColor} strokeWidth={0.6} />

      {/* Screen content */}
      {isOwned ? (
        <>
          {/* Scan lines effect */}
          {[0, 1, 2, 3, 4].map(i => (
            <line key={i}
              x1={mx - sw / 2 + 1} y1={my - sh / 2 + 2 + i * 3.5}
              x2={mx + sw / 2 - 1} y2={my - sh / 2 + 2 + i * 3.5}
              stroke={screenColor} strokeWidth={0.15} strokeOpacity={0.3} />
          ))}
          <text x={mx} y={my - 1} textAnchor="middle" fontSize={5}
            fill={screenColor} fontFamily="Inter" fontWeight={700}>
            {fit(label, 8)}
          </text>
          <text x={mx} y={my + 5} textAnchor="middle" fontSize={2.5}
            fill="hsl(200,40%,60%)" fontFamily="Inter" fontWeight={400}>
            DIGITAL DISPLAY
          </text>
          {/* Screen glow */}
          <rect x={mx - sw / 2 - 3} y={my - sh / 2 - 3} width={sw + 6} height={sh + 6} rx={3}
            fill="none" stroke={screenColor} strokeWidth={0.5} strokeOpacity={0.12}>
            <animate attributeName="strokeOpacity" values="0.05;0.2;0.05" dur="2.5s" repeatCount="indefinite" />
          </rect>
        </>
      ) : (
        <>
          <text x={mx} y={my - 1} textAnchor="middle" fontSize={4}
            fill="hsl(210,15%,45%)" fontFamily="Inter" fontWeight={500}>
            AD SPACE
          </text>
          <text x={mx} y={my + 5} textAnchor="middle" fontSize={2.5}
            fill="hsl(210,10%,38%)" fontFamily="Inter">
            16:9 Digital Screen
          </text>
          {/* Standby blink */}
          <circle cx={mx + sw / 2 - 3} cy={my + sh / 2 - 3} r={1.2}
            fill="hsl(120,40%,45%)" fillOpacity={0.5}>
            <animate attributeName="fillOpacity" values="0.2;0.6;0.2" dur="2s" repeatCount="indefinite" />
          </circle>
        </>
      )}
    </g>
  );
};

// ═══════════════════════════════════════
// PRODUCT_PPL — Small poster/menu board
// ═══════════════════════════════════════
const ProductPPLSlot: React.FC<{ slot: Slot; building: Building; onClick: () => void }> = ({ slot, building, onClick }) => {
  const wallH = WALL_H_UNIT * building.heightLevel;
  const isOwned = slot.ownerType !== 'empty';
  const label = slot.ownerName || slot.label;

  // Position near the front entrance of the building
  const sw = iso(building.gridX, building.gridY + building.height);
  const se = iso(building.gridX + building.width, building.gridY + building.height);
  // Offset slightly to the right of center
  const mx = (sw.x + se.x) / 2 + 12;
  const my = (sw.y + se.y) / 2 - wallH * 0.3;

  const pw = 16;
  const ph = 20;
  const pplColor = isOwned ? 'hsl(150,40%,45%)' : 'hsl(215,10%,35%)';

  return (
    <g style={{ cursor: 'pointer' }} onClick={onClick}>
      {/* Poster board shadow */}
      <rect x={mx - pw / 2 + 1} y={my - ph / 2 + 1} width={pw} height={ph} rx={1}
        fill="hsl(0,0%,0%)" fillOpacity={0.15} />

      {/* Poster board */}
      <rect x={mx - pw / 2} y={my - ph / 2} width={pw} height={ph} rx={1.5}
        fill={isOwned ? 'hsl(150,15%,12%)' : 'hsl(215,8%,16%)'} fillOpacity={0.92}
        stroke={pplColor} strokeWidth={isOwned ? 0.8 : 0.4} />

      {/* Top decorative strip */}
      <rect x={mx - pw / 2} y={my - ph / 2} width={pw} height={2} rx={1}
        fill={pplColor} fillOpacity={isOwned ? 0.5 : 0.2} />

      {isOwned ? (
        <>
          {/* Product icon area */}
          <circle cx={mx} cy={my - 3} r={3.5}
            fill={pplColor} fillOpacity={0.2} stroke={pplColor} strokeWidth={0.4} />
          <text x={mx} y={my - 1.5} textAnchor="middle" fontSize={4}>🎯</text>

          {/* Product name */}
          <text x={mx} y={my + 4} textAnchor="middle" fontSize={3}
            fill="hsl(150,35%,65%)" fontFamily="Inter" fontWeight={600}>
            {fit(label, 8)}
          </text>

          {/* PPL badge */}
          <text x={mx} y={my + 7.5} textAnchor="middle" fontSize={2}
            fill="hsl(150,25%,50%)" fontFamily="Inter" fontWeight={400}>
            PPL
          </text>

          {/* Subtle neon edge */}
          <rect x={mx - pw / 2 - 0.5} y={my - ph / 2 - 0.5} width={pw + 1} height={ph + 1} rx={2}
            fill="none" stroke={pplColor} strokeWidth={0.3} strokeOpacity={0.15}>
            <animate attributeName="strokeOpacity" values="0.08;0.2;0.08" dur="4s" repeatCount="indefinite" />
          </rect>
        </>
      ) : (
        <>
          <text x={mx} y={my - 1} textAnchor="middle" fontSize={3}
            fill="hsl(215,10%,45%)" fontFamily="Inter" fontWeight={500}>
            MENU
          </text>
          <text x={mx} y={my + 4} textAnchor="middle" fontSize={2.2}
            fill="hsl(215,8%,40%)" fontFamily="Inter">
            PPL Slot
          </text>
        </>
      )}
    </g>
  );
};
