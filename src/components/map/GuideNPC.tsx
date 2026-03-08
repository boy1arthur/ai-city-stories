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
  const pos = iso(17, 17); // Center of 36x36 crossroad

  return (
    <g style={{ cursor: 'pointer' }} onClick={() => onGuideClick(GUIDE_SLOT)}>
      {/* Ground highlight circle */}
      <ellipse cx={pos.x} cy={pos.y + 2} rx={10} ry={4}
        fill="hsl(210,50%,45%)" fillOpacity={0.1}>
        <animate attributeName="fillOpacity" values="0.06;0.15;0.06" dur="3s" repeatCount="indefinite" />
      </ellipse>

      {/* Body — simple humanoid */}
      {/* Shadow */}
      <ellipse cx={pos.x} cy={pos.y + 1} rx={5} ry={2}
        fill="hsl(0,0%,0%)" fillOpacity={0.2} />

      {/* Legs */}
      <line x1={pos.x - 1.5} y1={pos.y - 1} x2={pos.x - 2} y2={pos.y + 1}
        stroke="hsl(210,15%,40%)" strokeWidth={1.5} strokeLinecap="round" />
      <line x1={pos.x + 1.5} y1={pos.y - 1} x2={pos.x + 2} y2={pos.y + 1}
        stroke="hsl(210,15%,40%)" strokeWidth={1.5} strokeLinecap="round" />

      {/* Body */}
      <rect x={pos.x - 3.5} y={pos.y - 8} width={7} height={8} rx={2}
        fill="hsl(210,45%,50%)" fillOpacity={0.9}
        stroke="hsl(210,50%,60%)" strokeWidth={0.5} />

      {/* Vest / sash */}
      <line x1={pos.x - 2} y1={pos.y - 8} x2={pos.x + 2} y2={pos.y - 2}
        stroke="hsl(38,60%,55%)" strokeWidth={1.2} />

      {/* Head */}
      <circle cx={pos.x} cy={pos.y - 11} r={3.5}
        fill="hsl(30,25%,70%)" stroke="hsl(30,20%,60%)" strokeWidth={0.4} />

      {/* Eyes */}
      <circle cx={pos.x - 1.2} cy={pos.y - 11.5} r={0.6} fill="hsl(220,20%,25%)" />
      <circle cx={pos.x + 1.2} cy={pos.y - 11.5} r={0.6} fill="hsl(220,20%,25%)" />

      {/* Hat / cap */}
      <rect x={pos.x - 4} y={pos.y - 14.5} width={8} height={2.5} rx={1}
        fill="hsl(210,50%,45%)" />
      <rect x={pos.x - 2.5} y={pos.y - 16} width={5} height={2.5} rx={1}
        fill="hsl(210,50%,48%)" />

      {/* Floating label */}
      <g>
        {/* Label background */}
        <rect x={pos.x - 18} y={pos.y - 28} width={36} height={10} rx={5}
          fill="hsl(210,30%,12%)" fillOpacity={0.92}
          stroke="hsl(210,50%,50%)" strokeWidth={0.6} />

        {/* Guide text */}
        <text x={pos.x} y={pos.y - 21.5} textAnchor="middle" fontSize={4}
          fill="hsl(210,50%,70%)" fontFamily="Inter" fontWeight={600}>
          🧭 Plaza Guide
        </text>

        {/* Pulse ring */}
        <circle cx={pos.x} cy={pos.y - 5} r={8} fill="none"
          stroke="hsl(210,50%,55%)" strokeWidth={0.5} strokeOpacity={0.15}>
          <animate attributeName="r" values="7;10;7" dur="3s" repeatCount="indefinite" />
          <animate attributeName="strokeOpacity" values="0.08;0.22;0.08" dur="3s" repeatCount="indefinite" />
        </circle>
      </g>
    </g>
  );
});
GuideNPC.displayName = 'GuideNPC';
