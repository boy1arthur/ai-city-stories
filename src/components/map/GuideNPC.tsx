import React from 'react';
import { iso } from './constants';
import type { Slot } from '@/data/slots';

interface Props {
  onGuideClick: (slot: Slot) => void;
}

// Virtual slot for the Guide NPC
export const GUIDE_SLOT: Slot = {
  id: 'system_guide_plaza',
  zone: 'plaza',
  type: 'PATRON_TILE' as any, // Will be treated as SYSTEM_GUIDE in getSlotMessage
  location: { tile: { x: 4, y: 4 } }, // NW corner near entrance
  label: 'Plaza Guide AI',
  ownerType: 'empty' as any,
  triggerType: 'click',
};

// Override type for the interaction handler
(GUIDE_SLOT as any).type = 'SYSTEM_GUIDE';

/**
 * Guide NPC rendered at the plaza center crossroad.
 * Clicking it opens the slot interaction modal with template guide dialogue.
 */
export const GuideNPC: React.FC<Props> = React.memo(({ onGuideClick }) => {
  const pos = iso(4, 4); // NW corner — feels like a greeter at the entrance

  return (
    <g style={{ cursor: 'pointer' }} onClick={() => onGuideClick(GUIDE_SLOT)}>
      {/* Subtle ground glow */}
      <ellipse cx={pos.x} cy={pos.y + 2} rx={8} ry={3}
        fill="hsl(210,50%,45%)" fillOpacity={0.08}>
        <animate attributeName="fillOpacity" values="0.04;0.12;0.04" dur="4s" repeatCount="indefinite" />
      </ellipse>

      {/* Shadow */}
      <ellipse cx={pos.x} cy={pos.y + 1} rx={4} ry={1.5}
        fill="hsl(0,0%,0%)" fillOpacity={0.15} />

      {/* Simple bot body — rounded rectangle */}
      <rect x={pos.x - 4} y={pos.y - 10} width={8} height={10} rx={3}
        fill="hsl(210,20%,30%)" fillOpacity={0.85}
        stroke="hsl(210,30%,45%)" strokeWidth={0.5} />

      {/* Screen face */}
      <rect x={pos.x - 3} y={pos.y - 9} width={6} height={4} rx={1.5}
        fill="hsl(210,40%,18%)" stroke="hsl(210,50%,55%)" strokeWidth={0.4} />

      {/* Eyes — two dots */}
      <circle cx={pos.x - 1} cy={pos.y - 7.2} r={0.7}
        fill="hsl(180,60%,65%)">
        <animate attributeName="fillOpacity" values="0.7;1;0.7" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle cx={pos.x + 1} cy={pos.y - 7.2} r={0.7}
        fill="hsl(180,60%,65%)">
        <animate attributeName="fillOpacity" values="0.7;1;0.7" dur="2.5s" repeatCount="indefinite" />
      </circle>

      {/* Antenna */}
      <line x1={pos.x} y1={pos.y - 10} x2={pos.x} y2={pos.y - 13}
        stroke="hsl(210,20%,50%)" strokeWidth={0.8} strokeLinecap="round" />
      <circle cx={pos.x} cy={pos.y - 13.5} r={1}
        fill="hsl(180,50%,55%)" fillOpacity={0.7}>
        <animate attributeName="fillOpacity" values="0.4;0.9;0.4" dur="2s" repeatCount="indefinite" />
      </circle>

      {/* Minimal label pill */}
      <rect x={pos.x - 12} y={pos.y - 22} width={24} height={7} rx={3.5}
        fill="hsl(210,25%,15%)" fillOpacity={0.9}
        stroke="hsl(210,40%,50%)" strokeWidth={0.5} />
      <text x={pos.x} y={pos.y - 17.2} textAnchor="middle" fontSize={3.5}
        fill="hsl(180,50%,70%)" fontFamily="Inter" fontWeight={600}>
        🤖 Guide AI
      </text>
    </g>
  );
});
GuideNPC.displayName = 'GuideNPC';
