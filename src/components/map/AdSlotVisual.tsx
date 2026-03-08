import React from 'react';
import type { Building, AdSlot } from '@/data/world';
import { iso, WALL_H_UNIT } from './constants';
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
        const signPos = iso(b.gridX + b.width + 0.6, b.gridY + i * 1.5);
        const has = !!slot.brand;
        const bv = has ? getBrandVisual(slot.brand!) : null;
        const boardW = 24;
        const boardH = 10;
        const postH = 16;

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
                  r={3} fill={bv.color} />
                <text x={signPos.x - boardW / 2 + boardH / 2 + 0.5} y={signPos.y - postH - boardH / 2 + 1.3}
                  textAnchor="middle" fontSize={3.5} fill="hsl(0,0%,100%)"
                  fontFamily="Inter" fontWeight={800}>{bv.initial}</text>

                {/* Brand name only */}
                <text x={signPos.x + 2} y={signPos.y - postH - boardH / 2 + 1.8}
                  textAnchor="middle" fontSize={4}
                  fill="hsl(220,18%,15%)" fontFamily="Inter" fontWeight={700}>
                  {fitText(slot.brand!, 6)}
                </text>
              </>
            ) : (
              <text x={signPos.x} y={signPos.y - postH - boardH / 2 + 1.5}
                textAnchor="middle" fontSize={3}
                fill="hsl(215,8%,50%)" fontFamily="Inter" fontWeight={500}>
                AD SPACE
              </text>
            )}
          </g>
        );
      })}

      {/* ===== KIOSKS ===== */}
      {adSlots.filter(s => s.type === 'kiosk').map((slot, i) => {
        const kPos = iso(b.gridX - 0.6, b.gridY + b.height - 1 + i);
        const has = !!slot.brand;
        const bv = has ? getBrandVisual(slot.brand!) : null;

        return (
          <g key={slot.id}>
            {/* Base */}
            <ellipse cx={kPos.x} cy={kPos.y + 1} rx={4} ry={1.5}
              fill="hsl(215,5%,28%)" fillOpacity={0.5} />
            {/* Pillar */}
            <rect x={kPos.x - 3.5} y={kPos.y - 16} width={7} height={17} rx={1.5}
              fill={has ? 'hsl(215,10%,38%)' : 'hsl(215,5%,28%)'}
              stroke={has ? 'hsl(215,12%,48%)' : 'hsl(215,5%,33%)'} strokeWidth={0.5} />
            {/* Screen area */}
            <rect x={kPos.x - 2.5} y={kPos.y - 14} width={5} height={8} rx={0.5}
              fill={has ? bv!.color : 'hsl(210,10%,30%)'} fillOpacity={has ? 0.35 : 0.2} />

            {has && bv ? (
              <>
                {/* Logo */}
                <circle cx={kPos.x} cy={kPos.y - 11} r={2} fill={bv.color} />
                <text x={kPos.x} y={kPos.y - 9.8} textAnchor="middle" fontSize={2.5}
                  fill="hsl(0,0%,100%)" fontFamily="Inter" fontWeight={800}>{bv.initial}</text>
                {/* Name below screen */}
                <text x={kPos.x} y={kPos.y - 5} textAnchor="middle" fontSize={2.2}
                  fill="hsl(0,0%,80%)" fontFamily="Inter" fontWeight={600}>
                  {fitText(slot.brand!, 5)}
                </text>
                {/* Screen glow */}
                <rect x={kPos.x - 3} y={kPos.y - 14.5} width={6} height={9} rx={1}
                  fill="none" stroke={bv.color} strokeWidth={0.3} strokeOpacity={0.3}>
                  <animate attributeName="strokeOpacity" values="0.15;0.4;0.15" dur="2.5s" repeatCount="indefinite" />
                </rect>
              </>
            ) : (
              <text x={kPos.x} y={kPos.y - 9.5} textAnchor="middle" fontSize={2}
                fill="hsl(215,8%,48%)" fontFamily="Inter">INFO</text>
            )}
            {/* Top cap */}
            <rect x={kPos.x - 4} y={kPos.y - 17} width={8} height={2} rx={1}
              fill="hsl(215,8%,40%)" fillOpacity={0.7} />
          </g>
        );
      })}

      {/* ===== BUS STOPS ===== */}
      {adSlots.filter(s => s.type === 'bus_stop').map((slot, i) => {
        const bsPos = iso(b.gridX + i * 1.2, b.gridY + b.height + 0.6);
        const has = !!slot.brand;
        const bv = has ? getBrandVisual(slot.brand!) : null;
        const shelterW = 18;
        const panelH = 10;

        return (
          <g key={slot.id}>
            {/* Ground shadow */}
            <ellipse cx={bsPos.x} cy={bsPos.y + 2} rx={10} ry={3}
              fill="hsl(0,0%,0%)" fillOpacity={0.1} />
            {/* Left post */}
            <line x1={bsPos.x - shelterW / 2} y1={bsPos.y - 1} x2={bsPos.x - shelterW / 2} y2={bsPos.y - 14}
              stroke="hsl(215,5%,42%)" strokeWidth={1} strokeLinecap="round" />
            {/* Right post */}
            <line x1={bsPos.x + shelterW / 2} y1={bsPos.y - 1} x2={bsPos.x + shelterW / 2} y2={bsPos.y - 14}
              stroke="hsl(215,5%,42%)" strokeWidth={1} strokeLinecap="round" />
            {/* Roof */}
            <rect x={bsPos.x - shelterW / 2 - 1} y={bsPos.y - 15} width={shelterW + 2} height={2.5} rx={1}
              fill="hsl(215,8%,42%)" fillOpacity={0.7} />

            {/* Ad panel */}
            <rect x={bsPos.x - 6} y={bsPos.y - 13} width={12} height={panelH} rx={1}
              fill={has ? bv!.bgColor : 'hsl(200,8%,40%)'} fillOpacity={has ? 0.9 : 0.25}
              stroke={has ? bv!.color : 'hsl(210,8%,45%)'} strokeWidth={has ? 0.8 : 0.4} />

            {has && bv ? (
              <>
                {/* Logo */}
                <circle cx={bsPos.x} cy={bsPos.y - 10} r={2.5} fill={bv.color} />
                <text x={bsPos.x} y={bsPos.y - 8.8} textAnchor="middle" fontSize={3}
                  fill="hsl(0,0%,100%)" fontFamily="Inter" fontWeight={800}>{bv.initial}</text>
                {/* Brand name */}
                <text x={bsPos.x} y={bsPos.y - 5.5} textAnchor="middle" fontSize={3}
                  fill="hsl(220,18%,18%)" fontFamily="Inter" fontWeight={600}>
                  {fitText(slot.brand!, 5)}
                </text>
              </>
            ) : (
              <>
                <text x={bsPos.x} y={bsPos.y - 8} textAnchor="middle" fontSize={3}
                  fill="hsl(215,8%,50%)" fontFamily="Inter" fontWeight={500}>🚌</text>
                <text x={bsPos.x} y={bsPos.y - 4.5} textAnchor="middle" fontSize={2}
                  fill="hsl(215,8%,48%)" fontFamily="Inter">BUS STOP</text>
              </>
            )}

            {/* Bench */}
            <rect x={bsPos.x - 5} y={bsPos.y - 1} width={10} height={1.5} rx={0.5}
              fill="hsl(25,20%,38%)" fillOpacity={0.6} />
          </g>
        );
      })}

      {/* ===== NAMING RIGHTS ===== */}
      {adSlots.filter(s => s.type === 'naming_rights').map(slot => {
        const has = !!slot.brand;
        const bv = has ? getBrandVisual(slot.brand!) : null;
        const bannerW = 44;
        const bannerH = 12;
        const bannerY = center.y - wallHeight - 20;

        return (
          <g key={slot.id}>
            {has && bv ? (
              <>
                {/* Premium banner background */}
                <rect x={center.x - bannerW / 2} y={bannerY} width={bannerW} height={bannerH} rx={2}
                  fill={bv.bgColor} fillOpacity={0.92}
                  stroke={bv.color} strokeWidth={1} />

                {/* Top accent line */}
                <rect x={center.x - bannerW / 2} y={bannerY} width={bannerW} height={1.5} rx={1}
                  fill={bv.color} fillOpacity={0.6} />

                {/* Logo */}
                <circle cx={center.x - bannerW / 2 + 7} cy={bannerY + bannerH / 2 + 0.5}
                  r={3.5} fill={bv.color} />
                <text x={center.x - bannerW / 2 + 7} y={bannerY + bannerH / 2 + 2}
                  textAnchor="middle" fontSize={4} fill="hsl(0,0%,100%)"
                  fontFamily="Inter" fontWeight={800}>{bv.initial}</text>

                {/* Brand name - large */}
                <text x={center.x + 3} y={bannerY + bannerH / 2 + 2}
                  textAnchor="middle" fontSize={6}
                  fill="hsl(220,18%,12%)" fontFamily="Inter" fontWeight={800}>
                  {fitText(slot.brand!, 8)}
                </text>

                {/* Premium glow */}
                <rect x={center.x - bannerW / 2 - 1.5} y={bannerY - 1.5}
                  width={bannerW + 3} height={bannerH + 3} rx={3}
                  fill="none" stroke={bv.color} strokeWidth={0.6} strokeOpacity={0.2}>
                  <animate attributeName="strokeOpacity" values="0.1;0.3;0.1" dur="4s" repeatCount="indefinite" />
                </rect>

                {/* Crown icon for premium */}
                <text x={center.x + bannerW / 2 - 5} y={bannerY + bannerH / 2 + 2}
                  textAnchor="middle" fontSize={6}>👑</text>
              </>
            ) : (
              <>
                <rect x={center.x - bannerW / 2} y={bannerY} width={bannerW} height={bannerH} rx={2}
                  fill="hsl(215,5%,28%)" fillOpacity={0.4}
                  stroke="hsl(215,5%,38%)" strokeWidth={0.5} strokeDasharray="3 2" />
                <text x={center.x} y={bannerY + bannerH / 2 + 1.5}
                  textAnchor="middle" fontSize={4}
                  fill="hsl(215,8%,48%)" fontFamily="Inter" fontWeight={500} opacity={0.6}>
                  NAMING RIGHTS AVAILABLE
                </text>
              </>
            )}
          </g>
        );
      })}

      {/* ===== WALL WRAP (visual indicator on building, not standalone) ===== */}
      {adSlots.filter(s => s.type === 'wall_wrap' && s.brand).map(slot => {
        const bv = getBrandVisual(slot.brand!);
        // Small badge on building corner
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
