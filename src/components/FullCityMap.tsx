import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import type { Zone, Building, Agent, AdSlot, InteractionEvent } from '@/data/world';
import type { SpeechBubble, AdReaction, AgentVisualState } from '@/hooks/useWorldSimulation';
import type { CityEnergyStatus } from '@/lib/cityEnergy';
import type { Slot } from '@/data/slots';
import { ZoneRenderer } from './map/ZoneRenderer';
import { MiniMap } from './MiniMap';
import { iso } from './map/constants';

// Cross layout: Plaza center, campus N, harbor E, industrial S, residential W
// Each zone is 36×36 grid. Gap of 2 grid units between zones.
const ZONE_GRID_OFFSETS: Record<string, { gx: number; gy: number }> = {
  campus:      { gx: 38, gy: 0 },
  residential: { gx: 0,  gy: 38 },
  plaza:       { gx: 38, gy: 38 },
  harbor:      { gx: 76, gy: 38 },
  industrial:  { gx: 38, gy: 76 },
};

// Convert grid offset to isometric pixel offset (relative to iso(0,0) of each zone)
function getIsoOffset(gx: number, gy: number): { x: number; y: number } {
  // iso(gx, gy) relative to iso(0,0):
  // x_offset = (gx - gy) * (TILE_W/2) = (gx - gy) * 12
  // y_offset = (gx + gy) * (TILE_H/2) = (gx + gy) * 6
  return {
    x: (gx - gy) * 12,
    y: (gx + gy) * 6,
  };
}

interface ZoneData {
  zone: Zone;
  agents: Agent[];
  adSlots: AdSlot[];
  interactions: InteractionEvent[];
  speechBubbles: SpeechBubble[];
  adReactions: AdReaction[];
  agentVisuals: Map<string, AgentVisualState>;
  zoneSlots: Slot[];
  patronSlots: Slot[];
}

interface Props {
  zones: Zone[];
  zoneDataMap: Map<string, ZoneData>;
  energyStatus?: CityEnergyStatus;
  focusedZoneId: string | null;
  onBuildingClick: (b: Building) => void;
  onAgentClick: (a: Agent) => void;
  onSlotClick?: (slot: Slot) => void;
  onAdSlotClick?: (adSlot: AdSlot) => void;
  onZoneFocus: (zoneId: string) => void;
}

const LOD_THRESHOLD = 0.45; // Below this zoom, use simplified rendering

export const FullCityMap: React.FC<Props> = ({
  zones, zoneDataMap, energyStatus,
  focusedZoneId,
  onBuildingClick, onAgentClick, onSlotClick, onAdSlotClick,
  onZoneFocus,
}) => {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.35);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // No RAF loop — rendering is driven by tick/state changes from parent

  // Pan/zoom handlers
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
    setZoom(z => Math.max(0.15, Math.min(2, z - e.deltaY * 0.001)));
  }, []);

  // Zoom to zone
  const zoomToZone = useCallback((zoneId: string) => {
    const offset = ZONE_GRID_OFFSETS[zoneId];
    if (!offset) return;
    const isoOff = getIsoOffset(offset.gx + 18, offset.gy + 18);
    // Center the zone in viewport: offset from iso origin (500, 40)
    const targetX = -(500 + isoOff.x) * 0.7 + window.innerWidth / 2;
    const targetY = -(40 + isoOff.y) * 0.7 + window.innerHeight / 2;
    setPan({ x: targetX, y: targetY });
    setZoom(0.7);
    onZoneFocus(zoneId);
  }, [onZoneFocus]);

  // Reset to full view
  const resetView = useCallback(() => {
    setPan({ x: 0, y: 0 });
    setZoom(0.35);
    onZoneFocus('');
  }, [onZoneFocus]);

  // Determine LOD per zone
  const getLod = useCallback((zoneId: string): 'full' | 'simplified' => {
    if (zoom >= LOD_THRESHOLD) return 'full';
    // In simplified mode, only focused zone gets full detail
    if (focusedZoneId === zoneId) return 'full';
    return 'simplified';
  }, [zoom, focusedZoneId]);

  // Compute total bounds for minimap
  const totalBounds = useMemo(() => ({
    x: 0, y: 0, w: 112, h: 112, // 3×38 grid cross
  }), []);

  // Current viewport in grid coords (approximate)
  const viewBox = useMemo(() => ({
    x: -pan.x / (zoom * 12) + 38,
    y: -pan.y / (zoom * 6) + 38,
    w: window.innerWidth / (zoom * 12),
    h: window.innerHeight / (zoom * 6),
  }), [pan, zoom]);

  const activeZones = zones.filter(z => !z.locked);

  return (
    <div className="w-full h-full overflow-hidden bg-background relative"
      style={{ cursor: dragging ? 'grabbing' : 'grab' }}>

      <svg ref={svgRef} width="100%" height="100%" viewBox="-200 -100 1400 900"
        onMouseDown={onMouseDown} onMouseMove={onMouseMove}
        onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
        onWheel={onWheel}>

        <rect x="-200" y="-100" width="1400" height="900" fill="hsl(220,12%,6%)" />

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Connecting roads between zones */}
          {renderConnectingRoads()}

          {/* Render each zone */}
          {activeZones.map(zone => {
            const offset = ZONE_GRID_OFFSETS[zone.id];
            if (!offset) return null;
            const isoOff = getIsoOffset(offset.gx, offset.gy);
            const data = zoneDataMap.get(zone.id);
            const lod = getLod(zone.id);

            return (
              <g key={zone.id}>
                {/* Zone ground tint for visual distinction */}
                {lod === 'simplified' && (
                  <g transform={`translate(${isoOff.x}, ${isoOff.y})`} opacity={0.6}>
                    {/* Zone label when zoomed out */}
                    {zoom < LOD_THRESHOLD && (
                      <text x={500} y={250} textAnchor="middle" fontSize={28 / zoom}
                        fill={zone.themeColor} fillOpacity={0.5} fontFamily="Inter" fontWeight={700}>
                        {zone.emoji} {zone.name}
                      </text>
                    )}
                  </g>
                )}
                <ZoneRenderer
                  zone={zone}
                  offsetX={isoOff.x}
                  offsetY={isoOff.y}
                  lod={lod}
                  agents={data?.agents ?? []}
                  adSlots={data?.adSlots ?? []}
                  interactions={data?.interactions ?? []}
                  speechBubbles={data?.speechBubbles ?? []}
                  adReactions={data?.adReactions ?? []}
                  agentVisuals={data?.agentVisuals ?? new Map()}
                  zoneSlots={data?.zoneSlots ?? []}
                  patronSlots={data?.patronSlots ?? []}
                  onBuildingClick={onBuildingClick}
                  onAgentClick={onAgentClick}
                  onSlotClick={onSlotClick}
                  onAdSlotClick={onAdSlotClick}
                />
              </g>
            );
          })}
        </g>

        {/* Energy overlay */}
        {energyStatus && energyStatus !== 'stable' && (
          <rect x="-200" y="-100" width="1400" height="900" pointerEvents="none"
            fill={energyStatus === 'critical' ? 'hsl(0,30%,8%)' : 'hsl(220,20%,8%)'}
            fillOpacity={energyStatus === 'critical' ? 0.35 : 0.18}>
            {energyStatus === 'critical' && (
              <animate attributeName="fillOpacity" values="0.25;0.4;0.25" dur="2s" repeatCount="indefinite" />
            )}
          </rect>
        )}
      </svg>

      {/* MiniMap */}
      <MiniMap
        zones={activeZones}
        focusedZoneId={focusedZoneId}
        viewBox={viewBox}
        totalBounds={totalBounds}
        onZoneClick={zoomToZone}
      />

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1">
        <button onClick={resetView}
          className="w-8 h-8 rounded bg-card border border-border flex items-center justify-center text-foreground hover:border-primary transition-colors text-xs">
          🗺️
        </button>
        <button onClick={() => setZoom(z => Math.min(2, z + 0.15))}
          className="w-8 h-8 rounded bg-card border border-border flex items-center justify-center text-foreground hover:border-primary transition-colors text-sm">+</button>
        <button onClick={() => setZoom(z => Math.max(0.15, z - 0.15))}
          className="w-8 h-8 rounded bg-card border border-border flex items-center justify-center text-foreground hover:border-primary transition-colors text-sm">−</button>
      </div>

      {/* Zone quick-nav pills */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-1">
        {activeZones.map(zone => (
          <button key={zone.id}
            onClick={() => zoomToZone(zone.id)}
            className={`text-xs px-2.5 py-1 rounded-full transition-all ${
              focusedZoneId === zone.id
                ? 'bg-primary/20 text-primary border border-primary/40 scale-105'
                : 'bg-card/80 text-muted-foreground border border-border hover:border-primary/30 hover:text-foreground'
            }`}>
            {zone.emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

/** Render road connections between adjacent zones */
function renderConnectingRoads() {
  const roadColor = 'hsl(220,6%,28%)';
  const centerLineColor = 'hsl(45,80%,75%)';
  // Plaza↔Campus (vertical, north)
  // Plaza↔Industrial (vertical, south)
  // Plaza↔Harbor (horizontal, east)
  // Plaza↔Residential (horizontal, west)
  const connections: { from: string; to: string; axis: 'v' | 'h' }[] = [
    { from: 'plaza', to: 'campus', axis: 'v' },
    { from: 'plaza', to: 'industrial', axis: 'v' },
    { from: 'plaza', to: 'harbor', axis: 'h' },
    { from: 'plaza', to: 'residential', axis: 'h' },
  ];

  return (
    <g>
      {connections.map(({ from, to, axis }) => {
        const fo = ZONE_GRID_OFFSETS[from];
        const too = ZONE_GRID_OFFSETS[to];
        if (!fo || !too) return null;

        // Road at grid 16-17 (center of each zone's 36-grid)
        const lanes = [16, 17];
        return lanes.map(lane => {
          let startGx: number, startGy: number, endGx: number, endGy: number;
          if (axis === 'v') {
            if (too.gy < fo.gy) {
              // to is north of from
              startGx = fo.gx + lane; startGy = fo.gy;
              endGx = too.gx + lane; endGy = too.gy + 36;
            } else {
              startGx = fo.gx + lane; startGy = fo.gy + 36;
              endGx = too.gx + lane; endGy = too.gy;
            }
          } else {
            if (too.gx < fo.gx) {
              startGx = fo.gx; startGy = fo.gy + lane;
              endGx = too.gx + 36; endGy = too.gy + lane;
            } else {
              startGx = fo.gx + 36; startGy = fo.gy + lane;
              endGx = too.gx; endGy = too.gy + lane;
            }
          }
          const startIso = getIsoOffset(startGx, startGy);
          const endIso = getIsoOffset(endGx, endGy);
          const sx = 500 + startIso.x;
          const sy = 40 + startIso.y;
          const ex = 500 + endIso.x;
          const ey = 40 + endIso.y;
          return (
            <g key={`road_${from}_${to}_${lane}`}>
              <line x1={sx} y1={sy} x2={ex} y2={ey}
                stroke={roadColor} strokeWidth={3} strokeOpacity={0.6} />
              <line x1={sx} y1={sy} x2={ex} y2={ey}
                stroke={centerLineColor} strokeWidth={0.6} strokeOpacity={0.25}
                strokeDasharray="4 6" />
            </g>
          );
        });
      })}
    </g>
  );
}
