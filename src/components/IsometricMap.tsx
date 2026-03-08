import React, { useState, useRef, useCallback } from 'react';
import type { Building, Agent, AdSlot } from '@/data/world';

const TILE_W = 64;
const TILE_H = 32;
const GRID_SIZE = 18;

function isoToScreen(gx: number, gy: number) {
  return {
    x: (gx - gy) * (TILE_W / 2) + (GRID_SIZE * TILE_W) / 2,
    y: (gx + gy) * (TILE_H / 2) + 60,
  };
}

interface Props {
  buildings: Building[];
  agents: Agent[];
  adSlots: AdSlot[];
  onBuildingClick: (b: Building) => void;
  onAgentClick: (a: Agent) => void;
}

export const IsometricMap: React.FC<Props> = ({ buildings, agents, adSlots, onBuildingClick, onAgentClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  }, [pan]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    setPan({
      x: dragStart.current.panX + (e.clientX - dragStart.current.x),
      y: dragStart.current.panY + (e.clientY - dragStart.current.y),
    });
  }, [dragging]);

  const onMouseUp = useCallback(() => setDragging(false), []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.3, Math.min(3, z - e.deltaY * 0.001)));
  }, []);

  // Render grid
  const gridLines: React.ReactNode[] = [];
  for (let i = 0; i <= GRID_SIZE; i++) {
    const start = isoToScreen(i, 0);
    const end = isoToScreen(i, GRID_SIZE);
    gridLines.push(<line key={`v${i}`} x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="hsl(240 14% 10%)" strokeWidth={0.5} />);
    const s2 = isoToScreen(0, i);
    const e2 = isoToScreen(GRID_SIZE, i);
    gridLines.push(<line key={`h${i}`} x1={s2.x} y1={s2.y} x2={e2.x} y2={e2.y} stroke="hsl(240 14% 10%)" strokeWidth={0.5} />);
  }

  const buildingColorMap: Record<string, string> = {
    primary: 'hsl(152 76% 44%)',
    secondary: 'hsl(270 60% 55%)',
    accent: 'hsl(38 92% 50%)',
  };

  return (
    <div className="w-full h-full overflow-hidden bg-background relative" style={{ cursor: dragging ? 'grabbing' : 'grab' }}>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox="0 0 1200 700"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Grid */}
          {gridLines}

          {/* Buildings */}
          {buildings.map(b => {
            const pos = isoToScreen(b.gridX + b.width / 2, b.gridY + b.height / 2);
            const baseColor = buildingColorMap[b.color] || buildingColorMap.primary;
            const hasAds = adSlots.some(s => s.buildingId === b.id && s.brand);

            // Isometric building shape
            const bw = b.width * TILE_W * 0.4;
            const bh = b.height * TILE_H * 0.4;
            const buildingHeight = 30 + b.width * 8;

            return (
              <g key={b.id} onClick={() => onBuildingClick(b)} style={{ cursor: 'pointer' }}>
                {/* Shadow */}
                <ellipse cx={pos.x} cy={pos.y + 5} rx={bw * 0.7} ry={bh * 0.5} fill="hsl(0 0% 0% / 0.3)" />

                {/* Building body - isometric box */}
                <polygon
                  points={`${pos.x},${pos.y - buildingHeight} ${pos.x + bw},${pos.y - buildingHeight + bh / 2} ${pos.x + bw},${pos.y + bh / 2} ${pos.x},${pos.y + bh}`}
                  fill={baseColor}
                  fillOpacity={0.15}
                  stroke={baseColor}
                  strokeWidth={1.5}
                  strokeOpacity={0.6}
                />
                <polygon
                  points={`${pos.x},${pos.y - buildingHeight} ${pos.x - bw},${pos.y - buildingHeight + bh / 2} ${pos.x - bw},${pos.y + bh / 2} ${pos.x},${pos.y + bh}`}
                  fill={baseColor}
                  fillOpacity={0.1}
                  stroke={baseColor}
                  strokeWidth={1}
                  strokeOpacity={0.4}
                />
                {/* Top face */}
                <polygon
                  points={`${pos.x},${pos.y - buildingHeight - bh / 2} ${pos.x + bw},${pos.y - buildingHeight} ${pos.x},${pos.y - buildingHeight + bh / 2} ${pos.x - bw},${pos.y - buildingHeight}`}
                  fill={baseColor}
                  fillOpacity={0.25}
                  stroke={baseColor}
                  strokeWidth={1}
                />

                {/* Ad indicator */}
                {hasAds && (
                  <circle cx={pos.x + bw - 5} cy={pos.y - buildingHeight - bh / 2 - 5} r={4} fill="hsl(38 92% 50%)" opacity={0.9}>
                    <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Emoji + Name */}
                <text x={pos.x} y={pos.y - buildingHeight - bh / 2 - 12} textAnchor="middle" fontSize={18}>
                  {b.emoji}
                </text>
                <text x={pos.x} y={pos.y + bh + 14} textAnchor="middle" fontSize={8} fill={baseColor} fontFamily="JetBrains Mono" fontWeight={600}>
                  {b.name}
                </text>
              </g>
            );
          })}

          {/* Agents */}
          {agents.map(agent => {
            const building = buildings.find(b => b.id === agent.currentBuildingId);
            if (!building) return null;
            const pos = isoToScreen(building.gridX + building.width / 2, building.gridY + building.height / 2);
            // Offset each agent slightly
            const offset = agents.indexOf(agent) * 12 - 30;
            return (
              <g key={agent.id} onClick={() => onAgentClick(agent)} style={{ cursor: 'pointer' }}>
                <circle cx={pos.x + offset} cy={pos.y - 8} r={10} fill="hsl(240 16% 8%)" stroke="hsl(152 76% 44%)" strokeWidth={1.5} opacity={0.9}>
                  <animate attributeName="cy" values={`${pos.y - 8};${pos.y - 12};${pos.y - 8}`} dur="2s" repeatCount="indefinite" />
                </circle>
                <text x={pos.x + offset} y={pos.y - 5} textAnchor="middle" fontSize={12}>
                  {agent.avatar}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1">
        <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="w-8 h-8 rounded bg-surface-elevated border border-border flex items-center justify-center text-foreground hover:border-primary transition-colors text-sm font-mono">+</button>
        <button onClick={() => setZoom(z => Math.max(0.3, z - 0.2))} className="w-8 h-8 rounded bg-surface-elevated border border-border flex items-center justify-center text-foreground hover:border-primary transition-colors text-sm font-mono">−</button>
      </div>
    </div>
  );
};
