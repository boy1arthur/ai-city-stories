import React from 'react';
import { iso, TILE_W, TILE_H } from './constants';
import type { Slot } from '@/data/slots';

interface Props {
  slots: Slot[];
  onSlotClick?: (slot: Slot) => void;
}

/** Renders PATRON_TILE slots on the isometric map as benches with plaques or empty "available" markers */
export const PatronTileRenderer = React.memo(React.forwardRef<SVGGElement, Props>(({ slots, onSlotClick }, _ref) => {
  return (
    <g>
      {slots.map(slot => {
        if (slot.type !== 'PATRON_TILE' || !slot.location.tile) return null;
        const { x: gx, y: gy } = slot.location.tile;
        const pos = iso(gx, gy);
        const isOwned = slot.ownerType === 'patron';

        if (isOwned) {
          return (
            <g key={slot.id} style={{ cursor: 'pointer' }} onClick={() => onSlotClick?.(slot)}>
              {/* Ground highlight — subtle golden tile */}
              <polygon
                points={`${pos.x},${pos.y - TILE_H / 2} ${pos.x + TILE_W / 2},${pos.y} ${pos.x},${pos.y + TILE_H / 2} ${pos.x - TILE_W / 2},${pos.y}`}
                fill="hsl(38,50%,35%)" fillOpacity={0.25}
                stroke="hsl(38,60%,50%)" strokeWidth={0.6} strokeOpacity={0.4}
              />

              {/* Bench structure */}
              <g>
                {/* Shadow */}
                <ellipse cx={pos.x + 1} cy={pos.y + 2} rx={7} ry={2.5}
                  fill="hsl(0,0%,0%)" fillOpacity={0.15} />
                {/* Seat */}
                <rect x={pos.x - 6} y={pos.y - 2} width={12} height={2.5} rx={0.8}
                  fill="hsl(25,35%,40%)" />
                {/* Backrest */}
                <rect x={pos.x - 6} y={pos.y - 5} width={12} height={2} rx={0.6}
                  fill="hsl(25,30%,35%)" />
                {/* Legs */}
                <line x1={pos.x - 5} y1={pos.y} x2={pos.x - 5} y2={pos.y + 2}
                  stroke="hsl(215,8%,30%)" strokeWidth={1} />
                <line x1={pos.x + 5} y1={pos.y} x2={pos.x + 5} y2={pos.y + 2}
                  stroke="hsl(215,8%,30%)" strokeWidth={1} />
              </g>

              {/* Patron plaque — compact single-line floating above */}
              <g>
                {/* Connector line */}
                <line x1={pos.x} y1={pos.y - 5} x2={pos.x} y2={pos.y - 15}
                  stroke="hsl(38,40%,45%)" strokeWidth={0.5} strokeOpacity={0.5} />
                {/* Background pill */}
                <rect x={pos.x - 22} y={pos.y - 25} width={44} height={10} rx={5}
                  fill="hsl(38,20%,12%)" fillOpacity={0.95}
                  stroke="hsl(38,50%,45%)" strokeWidth={0.6} />
                {/* Single line: ⭐ Name · Message */}
                <text x={pos.x} y={pos.y - 18} textAnchor="middle" fontSize={4}
                  fill="hsl(38,50%,72%)" fontFamily="Inter" fontWeight={600}>
                  ⭐ {slot.ownerName} · {(slot.ownerMessage || '').slice(0, 12)}
                </text>
              </g>

              {/* Subtle glow pulse */}
              <circle cx={pos.x} cy={pos.y} r={8} fill="none"
                stroke="hsl(38,50%,50%)" strokeWidth={0.4} strokeOpacity={0.2}>
                <animate attributeName="r" values="7;9;7" dur="4s" repeatCount="indefinite" />
                <animate attributeName="strokeOpacity" values="0.1;0.25;0.1" dur="4s" repeatCount="indefinite" />
              </circle>
            </g>
          );
        }

        // Empty slot — "Available for sponsorship" marker
        return (
          <g key={slot.id} style={{ cursor: 'pointer' }} onClick={() => onSlotClick?.(slot)}>
            {/* Dashed outline tile */}
            <polygon
              points={`${pos.x},${pos.y - TILE_H / 2} ${pos.x + TILE_W / 2},${pos.y} ${pos.x},${pos.y + TILE_H / 2} ${pos.x - TILE_W / 2},${pos.y}`}
              fill="hsl(210,15%,20%)" fillOpacity={0.3}
              stroke="hsl(210,30%,50%)" strokeWidth={0.6} strokeDasharray="2 2" strokeOpacity={0.5}
            />

            {/* Empty bench silhouette */}
            <rect x={pos.x - 5} y={pos.y - 1.5} width={10} height={2} rx={0.5}
              fill="hsl(215,8%,35%)" fillOpacity={0.4}
              stroke="hsl(215,15%,45%)" strokeWidth={0.3} strokeDasharray="1 1" />

            {/* "Available" label */}
            <rect x={pos.x - 14} y={pos.y - 12} width={28} height={9} rx={2.5}
              fill="hsl(210,15%,15%)" fillOpacity={0.85}
              stroke="hsl(210,30%,45%)" strokeWidth={0.4} strokeDasharray="2 1" />
            <text x={pos.x} y={pos.y - 6} textAnchor="middle" fontSize={4}
              fill="hsl(210,30%,60%)" fontFamily="Inter" fontWeight={500}>
              후원 가능 ✨
            </text>

            {/* Pulsing dot */}
            <circle cx={pos.x} cy={pos.y} r={2} fill="hsl(210,40%,55%)" fillOpacity={0.4}>
              <animate attributeName="fillOpacity" values="0.2;0.5;0.2" dur="2.5s" repeatCount="indefinite" />
              <animate attributeName="r" values="1.5;2.5;1.5" dur="2.5s" repeatCount="indefinite" />
            </circle>
          </g>
        );
      })}
    </g>
  );
});
PatronTileRenderer.displayName = 'PatronTileRenderer';
