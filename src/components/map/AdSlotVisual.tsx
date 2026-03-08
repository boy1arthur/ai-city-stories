import React from 'react';
import type { Building, AdSlot } from '@/data/world';
import { iso, TILE_W, TILE_H, WALL_H_UNIT } from './constants';
import { VIRTUAL_BRANDS } from '@/data/demoSeed';

// Isometric angle for south wall baseline (radians)
const SOUTH_ANGLE_DEG = Math.atan2(TILE_H, TILE_W) * (180 / Math.PI); // ≈ 26.57°
// Isometric angle for east wall baseline
const EAST_ANGLE_DEG = Math.atan2(TILE_H, -TILE_W) * (180 / Math.PI); // ≈ -26.57°

interface Props {
  building: Building;
  adSlots: AdSlot[];
}

// Get brand visual info
function getBrandVisual(brandName: string): { color: string; initial: string; bgColor: string } {
  const vb = VIRTUAL_BRANDS.find(b => b.name === brandName);
  const color = vb?.color || 'hsl(215,30%,50%)';
  // Lighter bg version
  const bgColor = vb?.color
    ? vb.color.replace(/(\d+)%\)$/, (_, n: string) => `${Math.min(95, parseInt(n) + 40)}%)`)
    : 'hsl(215,20%,85%)';
  return { color, initial: brandName.charAt(0).toUpperCase(), bgColor };
}

// Truncate text to fit width, with ellipsis
function fitText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars - 1) + '…';
}

export const AdSlotVisual: React.FC<Props> = React.memo(({ building: b, adSlots }) => {
  const wallHeight = WALL_H_UNIT * b.heightLevel;
  const center = iso(b.gridX + b.width / 2, b.gridY + b.height / 2);

  return (
    <g>
      {/* ===== BILLBOARDS ===== */}
      {adSlots.filter(s => s.type === 'billboard').map((slot, i) => {
        const signPos = iso(b.gridX + b.width + 0.6, b.gridY + i * 1.5);
        const has = !!slot.brand;
        const bv = has ? getBrandVisual(slot.brand!) : null;
        const boardW = 30;
        const boardH = 14;
        const postH = 18;

        return (
          <g key={slot.id}>
            {/* Post */}
            <line x1={signPos.x} y1={signPos.y} x2={signPos.x} y2={signPos.y - postH}
              stroke="hsl(215,6%,38%)" strokeWidth={1.5} strokeLinecap="round" />

            {/* Board — pill shape */}
            <rect x={signPos.x - boardW / 2} y={signPos.y - postH - boardH}
              width={boardW} height={boardH} rx={boardH / 2}
              fill={has ? bv!.bgColor : 'hsl(215,5%,30%)'} fillOpacity={has ? 0.95 : 0.5}
              stroke={has ? bv!.color : 'hsl(215,5%,40%)'} strokeWidth={has ? 0.8 : 0.5} />

            {has && bv ? (
              <>
                {/* Logo */}
                <circle cx={signPos.x - boardW / 2 + boardH / 2 + 0.5} cy={signPos.y - postH - boardH / 2}
                  r={4} fill={bv.color} />
                <text x={signPos.x - boardW / 2 + boardH / 2 + 0.5} y={signPos.y - postH - boardH / 2 + 1.8}
                  textAnchor="middle" fontSize={4.5} fill="hsl(0,0%,100%)"
                  fontFamily="Inter" fontWeight={800}>{bv.initial}</text>

                {/* Brand name */}
                <text x={signPos.x + 3} y={signPos.y - postH - boardH / 2 + 2}
                  textAnchor="middle" fontSize={5}
                  fill="hsl(220,18%,15%)" fontFamily="Inter" fontWeight={700}>
                  {fitText(slot.brand!, 6)}
                </text>
              </>
            ) : (
              <text x={signPos.x} y={signPos.y - postH - boardH / 2 + 2}
                textAnchor="middle" fontSize={3.5}
                fill="hsl(215,8%,50%)" fontFamily="Inter" fontWeight={500}>
                AD SPACE
              </text>
            )}
          </g>
        );
      })}

      {/* ===== KIOSKS — pill on short post ===== */}
      {adSlots.filter(s => s.type === 'kiosk').map((slot, i) => {
        const kPos = iso(b.gridX - 0.6, b.gridY + b.height - 1 + i);
        const has = !!slot.brand;
        const bv = has ? getBrandVisual(slot.brand!) : null;
        const pw = 22;
        const ph = 10;
        const postH = 12;

        return (
          <g key={slot.id}>
            {/* Post */}
            <line x1={kPos.x} y1={kPos.y} x2={kPos.x} y2={kPos.y - postH}
              stroke="hsl(215,6%,38%)" strokeWidth={1.2} strokeLinecap="round" />

            {/* Pill board */}
            <rect x={kPos.x - pw / 2} y={kPos.y - postH - ph}
              width={pw} height={ph} rx={ph / 2}
              fill={has ? bv!.bgColor : 'hsl(215,5%,28%)'} fillOpacity={has ? 0.95 : 0.45}
              stroke={has ? bv!.color : 'hsl(215,5%,38%)'} strokeWidth={has ? 0.7 : 0.4} />

            {has && bv ? (
              <>
                <circle cx={kPos.x - pw / 2 + ph / 2 + 0.5} cy={kPos.y - postH - ph / 2}
                  r={3} fill={bv.color} />
                <text x={kPos.x - pw / 2 + ph / 2 + 0.5} y={kPos.y - postH - ph / 2 + 1.3}
                  textAnchor="middle" fontSize={3.5} fill="hsl(0,0%,100%)"
                  fontFamily="Inter" fontWeight={800}>{bv.initial}</text>
                <text x={kPos.x + 2} y={kPos.y - postH - ph / 2 + 1.5}
                  textAnchor="middle" fontSize={3.5}
                  fill="hsl(220,18%,15%)" fontFamily="Inter" fontWeight={700}>
                  {fitText(slot.brand!, 5)}
                </text>
              </>
            ) : (
              <circle cx={kPos.x} cy={kPos.y - postH - ph / 2} r={1.5}
                fill="hsl(215,8%,45%)" fillOpacity={0.4} />
            )}
          </g>
        );
      })}

      {/* ===== BUS STOPS — pill on shelter ===== */}
      {adSlots.filter(s => s.type === 'bus_stop').map((slot, i) => {
        const bsPos = iso(b.gridX + i * 1.2, b.gridY + b.height + 0.6);
        const has = !!slot.brand;
        const bv = has ? getBrandVisual(slot.brand!) : null;
        const pw = 26;
        const ph = 12;
        const shelterH = 16;

        return (
          <g key={slot.id}>
            {/* Posts */}
            <line x1={bsPos.x - 7} y1={bsPos.y} x2={bsPos.x - 7} y2={bsPos.y - shelterH}
              stroke="hsl(215,5%,40%)" strokeWidth={0.8} strokeLinecap="round" />
            <line x1={bsPos.x + 7} y1={bsPos.y} x2={bsPos.x + 7} y2={bsPos.y - shelterH}
              stroke="hsl(215,5%,40%)" strokeWidth={0.8} strokeLinecap="round" />
            {/* Roof line */}
            <line x1={bsPos.x - 8} y1={bsPos.y - shelterH} x2={bsPos.x + 8} y2={bsPos.y - shelterH}
              stroke="hsl(215,6%,42%)" strokeWidth={1.5} strokeLinecap="round" />

            {/* Pill board */}
            <rect x={bsPos.x - pw / 2} y={bsPos.y - shelterH + 2}
              width={pw} height={ph} rx={ph / 2}
              fill={has ? bv!.bgColor : 'hsl(215,5%,28%)'} fillOpacity={has ? 0.95 : 0.4}
              stroke={has ? bv!.color : 'hsl(215,5%,38%)'} strokeWidth={has ? 0.7 : 0.4} />

            {has && bv ? (
              <>
                <circle cx={bsPos.x - pw / 2 + ph / 2 + 0.5} cy={bsPos.y - shelterH + 2 + ph / 2}
                  r={3.5} fill={bv.color} />
                <text x={bsPos.x - pw / 2 + ph / 2 + 0.5} y={bsPos.y - shelterH + 2 + ph / 2 + 1.5}
                  textAnchor="middle" fontSize={4} fill="hsl(0,0%,100%)"
                  fontFamily="Inter" fontWeight={800}>{bv.initial}</text>
                <text x={bsPos.x + 3} y={bsPos.y - shelterH + 2 + ph / 2 + 1.8}
                  textAnchor="middle" fontSize={4}
                  fill="hsl(220,18%,15%)" fontFamily="Inter" fontWeight={700}>
                  {fitText(slot.brand!, 5)}
                </text>
              </>
            ) : (
              <circle cx={bsPos.x} cy={bsPos.y - shelterH + 2 + ph / 2} r={1.5}
                fill="hsl(215,8%,45%)" fillOpacity={0.4} />
            )}
          </g>
        );
      })}

      {/* ===== NAMING RIGHTS — pill floating above roof ===== */}
      {adSlots.filter(s => s.type === 'naming_rights').map(slot => {
        const has = !!slot.brand;
        const bv = has ? getBrandVisual(slot.brand!) : null;
        const pw = 48;
        const ph = 14;
        const bannerY = center.y - wallHeight - 22;

        return (
          <g key={slot.id}>
            {has && bv ? (
              <>
                <rect x={center.x - pw / 2} y={bannerY} width={pw} height={ph} rx={ph / 2}
                  fill={bv.bgColor} fillOpacity={0.93}
                  stroke={bv.color} strokeWidth={0.8} />
                <circle cx={center.x - pw / 2 + ph / 2 + 1} cy={bannerY + ph / 2}
                  r={4.5} fill={bv.color} />
                <text x={center.x - pw / 2 + ph / 2 + 1} y={bannerY + ph / 2 + 2}
                  textAnchor="middle" fontSize={5.5} fill="hsl(0,0%,100%)"
                  fontFamily="Inter" fontWeight={800}>{bv.initial}</text>
                <text x={center.x + 5} y={bannerY + ph / 2 + 2.5}
                  textAnchor="middle" fontSize={6.5}
                  fill="hsl(220,18%,12%)" fontFamily="Inter" fontWeight={700}>
                  {fitText(slot.brand!, 8)}
                </text>
                {/* Glow */}
                <rect x={center.x - pw / 2 - 1} y={bannerY - 1}
                  width={pw + 2} height={ph + 2} rx={ph / 2 + 1}
                  fill="none" stroke={bv.color} strokeWidth={0.4} strokeOpacity={0.12}>
                  <animate attributeName="strokeOpacity" values="0.06;0.2;0.06" dur="4s" repeatCount="indefinite" />
                </rect>
              </>
            ) : (
              <>
                <rect x={center.x - pw / 2} y={bannerY} width={pw} height={ph} rx={ph / 2}
                  fill="hsl(215,5%,25%)" fillOpacity={0.35}
                  stroke="hsl(215,5%,38%)" strokeWidth={0.4} strokeDasharray="3 2" />
                <circle cx={center.x} cy={bannerY + ph / 2} r={2}
                  fill="hsl(215,8%,45%)" fillOpacity={0.3} />
              </>
            )}
          </g>
        );
      })}

      {/* ===== WALL WRAP badge ===== */}
      {adSlots.filter(s => s.type === 'wall_wrap' && s.brand).map(slot => {
        const bv = getBrandVisual(slot.brand!);
        const badgePos = iso(b.gridX + b.width, b.gridY + b.height * 0.3);
        return (
          <g key={slot.id}>
            <circle cx={badgePos.x + 4} cy={badgePos.y - wallHeight * 0.6} r={4}
              fill={bv.color} fillOpacity={0.8} stroke="hsl(0,0%,95%)" strokeWidth={0.5} />
            <text x={badgePos.x + 4} y={badgePos.y - wallHeight * 0.6 + 1.5}
              textAnchor="middle" fontSize={4} fill="hsl(0,0%,100%)"
              fontFamily="Inter" fontWeight={800}>{bv.initial}</text>
          </g>
        );
      })}
    </g>
  );
});
AdSlotVisual.displayName = 'AdSlotVisual';
