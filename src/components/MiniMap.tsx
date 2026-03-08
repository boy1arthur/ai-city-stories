import React from 'react';
import type { Zone } from '@/data/world';

// Cross layout offsets (matching FullCityMap)
const ZONE_POSITIONS: Record<string, { x: number; y: number }> = {
  campus:      { x: 1, y: 0 },
  residential: { x: 0, y: 1 },
  plaza:       { x: 1, y: 1 },
  harbor:      { x: 2, y: 1 },
  industrial:  { x: 1, y: 2 },
};

interface Props {
  zones: Zone[];
  focusedZoneId: string | null;
  viewBox: { x: number; y: number; w: number; h: number };
  totalBounds: { x: number; y: number; w: number; h: number };
  onZoneClick: (zoneId: string) => void;
}

export const MiniMap: React.FC<Props> = ({ zones, focusedZoneId, viewBox, totalBounds, onZoneClick }) => {
  const scale = 120 / totalBounds.w;
  const mapW = totalBounds.w * scale;
  const mapH = totalBounds.h * scale;

  return (
    <div className="absolute bottom-14 right-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg overflow-hidden"
      style={{ width: Math.max(100, mapW + 8), height: Math.max(80, mapH + 8), padding: 4 }}>
      <svg width={mapW} height={mapH} viewBox={`${totalBounds.x} ${totalBounds.y} ${totalBounds.w} ${totalBounds.h}`}>
        {/* Zone blocks */}
        {zones.filter(z => !z.locked).map(zone => {
          const pos = ZONE_POSITIONS[zone.id];
          if (!pos) return null;
          const bx = pos.x * 38;
          const by = pos.y * 38;
          const isFocused = zone.id === focusedZoneId;
          return (
            <g key={zone.id} onClick={() => onZoneClick(zone.id)} style={{ cursor: 'pointer' }}>
              <rect x={bx} y={by} width={36} height={36} rx={2}
                fill={zone.themeColor} fillOpacity={isFocused ? 0.5 : 0.25}
                stroke={isFocused ? 'hsl(0,0%,100%)' : zone.themeColor}
                strokeWidth={isFocused ? 2 : 0.5} strokeOpacity={isFocused ? 0.8 : 0.4} />
              <text x={bx + 18} y={by + 20} textAnchor="middle" fontSize={10} fill="hsl(0,0%,90%)" fillOpacity={0.8}>
                {zone.emoji}
              </text>
            </g>
          );
        })}

        {/* Viewport indicator */}
        <rect
          x={viewBox.x * (mapW / totalBounds.w) / scale + totalBounds.x}
          y={viewBox.y * (mapH / totalBounds.h) / scale + totalBounds.y}
          width={viewBox.w * (mapW / totalBounds.w) / scale}
          height={viewBox.h * (mapH / totalBounds.h) / scale}
          fill="none" stroke="hsl(0,0%,100%)" strokeWidth={1.5} strokeOpacity={0.6}
          rx={1}
        />
      </svg>
    </div>
  );
};
