import React from 'react';
import type { Building, AdSlot } from '@/data/world';
import { iso, TILE_W, TILE_H, WALL_H_UNIT } from './constants';
import { VIRTUAL_BRANDS } from '@/data/demoSeed';

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
        const signPos = iso(b.gridX + b.width + 1.5, b.gridY + i * 2.5);
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
        const kPos = iso(b.gridX - 1.5, b.gridY + b.height - 1 + i * 2);
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

      {/* ===== NAMING RIGHTS — parallelogram on south wall ===== */}
      {adSlots.filter(s => s.type === 'naming_rights').map(slot => {
        const has = !!slot.brand;
        const bv = has ? getBrandVisual(slot.brand!) : null;

        // South wall endpoints
        const sw = iso(b.gridX, b.gridY + b.height);
        const se = iso(b.gridX + b.width, b.gridY + b.height);

        // Banner occupies top portion of wall
        const topRatio = 0.85;
        const botRatio = 0.55;
        const topL = { x: sw.x, y: sw.y - wallHeight * topRatio };
        const topR = { x: se.x, y: se.y - wallHeight * topRatio };
        const botL = { x: sw.x, y: sw.y - wallHeight * botRatio };
        const botR = { x: se.x, y: se.y - wallHeight * botRatio };

        const cx = (topL.x + topR.x + botL.x + botR.x) / 4;
        const cy = (topL.y + topR.y + botL.y + botR.y) / 4;
        const angle = Math.atan2(se.y - sw.y, se.x - sw.x) * (180 / Math.PI);
        const bannerH = wallHeight * (topRatio - botRatio);
        const fontSize = Math.max(5, bannerH * 0.5);
        const fontSizeName = Math.max(3.5, bannerH * 0.3);

        return (
          <g key={slot.id}>
            {has && bv ? (
              <g>
                <polygon
                  points={`${topL.x},${topL.y} ${topR.x},${topR.y} ${botR.x},${botR.y} ${botL.x},${botL.y}`}
                  fill={bv.color} stroke={bv.color} strokeWidth={0.5} />
                <g transform={`rotate(${angle}, ${cx}, ${cy})`}>
                  <text x={cx - fontSize * 1.2} y={cy + fontSize * 0.15}
                    textAnchor="middle" fontSize={fontSize}
                    fill="hsl(0,0%,100%)" fontFamily="Inter" fontWeight={900}>{bv.initial}</text>
                  <text x={cx + fontSizeName * 0.5} y={cy + fontSizeName * 0.15}
                    textAnchor="middle" fontSize={fontSizeName}
                    fill="hsl(0,0%,100%)" fontFamily="Inter" fontWeight={800} letterSpacing="1">
                    {fitText(slot.brand!, 10)}
                  </text>
                </g>
              </g>
            ) : (
              <polygon
                points={`${topL.x},${topL.y} ${topR.x},${topR.y} ${botR.x},${botR.y} ${botL.x},${botL.y}`}
                fill="none" stroke="hsl(215,5%,38%)" strokeWidth={0.4} strokeDasharray="4 3" />
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
