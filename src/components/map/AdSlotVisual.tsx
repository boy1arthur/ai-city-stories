import React from 'react';
import type { Building, AdSlot } from '@/data/world';
import { iso, WALL_H_UNIT } from './constants';

interface Props {
  building: Building;
  adSlots: AdSlot[];
}

export const AdSlotVisual: React.FC<Props> = React.memo(({ building: b, adSlots }) => {
  const wallHeight = WALL_H_UNIT * b.heightLevel;
  const center = iso(b.gridX + b.width / 2, b.gridY + b.height / 2);

  return (
    <g>
      {/* Billboards - roadside signpost */}
      {adSlots.filter(s => s.type === 'billboard').map((slot, i) => {
        const signPos = iso(b.gridX + b.width + 0.5, b.gridY + i * 1.2);
        const has = !!slot.brand;
        return (
          <g key={slot.id}>
            {/* Post */}
            <line x1={signPos.x} y1={signPos.y} x2={signPos.x} y2={signPos.y - 20}
              stroke="hsl(215,6%,40%)" strokeWidth={1.5} />
            {/* Board */}
            <rect x={signPos.x - 10} y={signPos.y - 28} width={20} height={10} rx={1}
              fill={has ? 'hsl(0,0%,92%)' : 'hsl(215,5%,35%)'} fillOpacity={has ? 0.9 : 0.5}
              stroke={has ? 'hsl(38,75%,50%)' : 'hsl(215,5%,40%)'} strokeWidth={has ? 1.2 : 0.6} />
            {/* Brand text */}
            <text x={signPos.x} y={signPos.y - 21.5} textAnchor="middle"
              fontSize={has ? 5 : 3.5}
              fill={has ? 'hsl(220,18%,15%)' : 'hsl(215,8%,50%)'}
              fontFamily="Inter" fontWeight={has ? 700 : 400}>
              {has ? slot.brand!.slice(0, 7) : 'AD SPACE'}
            </text>
            {/* Sponsor glow */}
            {has && (
              <rect x={signPos.x - 11} y={signPos.y - 29} width={22} height={12} rx={2}
                fill="none" stroke="hsl(38,70%,55%)" strokeWidth={0.5} strokeOpacity={0.3}>
                <animate attributeName="strokeOpacity" values="0.15;0.4;0.15" dur="3s" repeatCount="indefinite" />
              </rect>
            )}
          </g>
        );
      })}

      {/* Kiosks - info pillar */}
      {adSlots.filter(s => s.type === 'kiosk').map((slot, i) => {
        const kPos = iso(b.gridX - 0.5, b.gridY + b.height - 1 + i);
        const has = !!slot.brand;
        return (
          <g key={slot.id}>
            {/* Pillar body */}
            <rect x={kPos.x - 3} y={kPos.y - 14} width={6} height={14} rx={1}
              fill={has ? 'hsl(215,8%,42%)' : 'hsl(215,5%,30%)'}
              stroke={has ? 'hsl(215,10%,50%)' : 'hsl(215,5%,35%)'} strokeWidth={0.5} />
            {/* Screen */}
            <rect x={kPos.x - 2} y={kPos.y - 12} width={4} height={6} rx={0.5}
              fill={has ? 'hsl(38,75%,50%)' : 'hsl(210,10%,35%)'} fillOpacity={has ? 0.5 : 0.3} />
            {has && (
              <text x={kPos.x} y={kPos.y - 8} textAnchor="middle" fontSize={2.5}
                fill="hsl(0,0%,95%)" fontFamily="Inter" fontWeight={600}>
                {slot.brand!.slice(0, 4)}
              </text>
            )}
          </g>
        );
      })}

      {/* Bus stops - shelter with panel */}
      {adSlots.filter(s => s.type === 'bus_stop').map((slot, i) => {
        const bsPos = iso(b.gridX + i, b.gridY + b.height + 0.5);
        const has = !!slot.brand;
        return (
          <g key={slot.id}>
            {/* Roof */}
            <rect x={bsPos.x - 8} y={bsPos.y - 12} width={16} height={2} rx={0.5}
              fill="hsl(215,6%,45%)" fillOpacity={0.6} />
            {/* Posts */}
            <line x1={bsPos.x - 7} y1={bsPos.y - 10} x2={bsPos.x - 7} y2={bsPos.y}
              stroke="hsl(215,5%,40%)" strokeWidth={0.8} />
            <line x1={bsPos.x + 7} y1={bsPos.y - 10} x2={bsPos.x + 7} y2={bsPos.y}
              stroke="hsl(215,5%,40%)" strokeWidth={0.8} />
            {/* Ad panel */}
            <rect x={bsPos.x - 5} y={bsPos.y - 10} width={10} height={8} rx={0.5}
              fill={has ? 'hsl(0,0%,90%)' : 'hsl(200,10%,45%)'} fillOpacity={has ? 0.8 : 0.25}
              stroke={has ? 'hsl(38,75%,50%)' : 'hsl(210,8%,45%)'} strokeWidth={has ? 0.8 : 0.4} />
            <text x={bsPos.x} y={bsPos.y - 5} textAnchor="middle"
              fontSize={has ? 3.5 : 2.5}
              fill={has ? 'hsl(220,18%,15%)' : 'hsl(215,8%,50%)'}
              fontFamily="Inter" fontWeight={has ? 600 : 400}>
              {has ? slot.brand!.slice(0, 5) : 'BUS'}
            </text>
            {/* Bench */}
            <rect x={bsPos.x - 5} y={bsPos.y - 1} width={10} height={2} rx={0.5}
              fill="hsl(25,20%,35%)" fillOpacity={0.6} />
          </g>
        );
      })}

      {/* Naming rights - entrance sign */}
      {adSlots.filter(s => s.type === 'naming_rights').map(slot => (
        <g key={slot.id}>
          {slot.brand ? (
            <>
              <rect x={center.x - 20} y={center.y - wallHeight - 18} width={40} height={10} rx={1.5}
                fill="hsl(0,0%,95%)" fillOpacity={0.85}
                stroke="hsl(38,75%,50%)" strokeWidth={0.8} />
              <text x={center.x} y={center.y - wallHeight - 11.5} textAnchor="middle" fontSize={6}
                fill="hsl(220,18%,15%)" fontFamily="Inter" fontWeight={800}>
                {slot.brand}
              </text>
            </>
          ) : (
            <text x={center.x} y={center.y - wallHeight - 12} textAnchor="middle" fontSize={4}
              fill="hsl(215,8%,50%)" fontFamily="Inter" opacity={0.5}>
              NAMING AVAILABLE
            </text>
          )}
        </g>
      ))}
    </g>
  );
});
AdSlotVisual.displayName = 'AdSlotVisual';
