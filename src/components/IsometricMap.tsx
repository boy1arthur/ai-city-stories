import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import type { Building, Agent, AdSlot, InteractionEvent, Zone } from '@/data/world';
import type { SpeechBubble, AdReaction, AgentVisualState } from '@/hooks/simulation/types';
import type { CityEnergyStatus } from '@/lib/cityEnergy';
import type { Slot } from '@/data/slots';
import { GroundLayer } from './map/GroundLayer';
import { BuildingRenderer } from './map/BuildingRenderer';
import { LandmarkRenderer } from './map/LandmarkRenderer';
import { AdSlotVisual } from './map/AdSlotVisual';
import { AgentRenderer } from './map/AgentRenderer';
import { LockedZoneGhost } from './map/LockedZoneGhost';
import { MultiBuildingAdRenderer } from './map/MultiBuildingAdRenderer';
import { PatronTileRenderer } from './map/PatronTileRenderer';
import { SlotVisualRenderer } from './map/SlotVisualRenderer';
import { GuideNPC, GUIDE_SLOT } from './map/GuideNPC';
import { DEMO_MULTI_BUILDING_ADS } from '@/lib/multiBuildingAd';

interface Props {
  zone: Zone;
  buildings: Building[];
  agents: Agent[];
  adSlots: AdSlot[];
  interactions: InteractionEvent[];
  speechBubbles: SpeechBubble[];
  adReactions: AdReaction[];
  agentVisuals: Map<string, AgentVisualState>;
  energyStatus?: CityEnergyStatus;
  zoneSlots: Slot[];
  patronSlots: Slot[];
  slotsLoading?: boolean;
  onBuildingClick: (b: Building) => void;
  onAgentClick: (a: Agent) => void;
  onSlotClick?: (slot: Slot) => void;
  onAdSlotClick?: (adSlot: AdSlot) => void;
}

export const IsometricMap: React.FC<Props> = ({
  zone, buildings, agents, adSlots, interactions,
  speechBubbles, adReactions, agentVisuals, energyStatus,
  zoneSlots, patronSlots, slotsLoading,
  onBuildingClick, onAgentClick, onSlotClick, onAdSlotClick,
}) => {
  const [pan, setPan] = useState({ x: -750, y: -290 });
  const [zoom, setZoom] = useState(2.5);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // Force re-render for animations
  const [, setFrame] = useState(0);
  useEffect(() => {
    let raf: number;
    const tick = () => { setFrame(f => f + 1); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

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
    setZoom(z => Math.max(0.25, Math.min(3, z - e.deltaY * 0.0006)));
  }, []);

  const sortedBuildings = useMemo(() =>
    [...buildings].sort((a, b) => (a.gridX + a.gridY) - (b.gridX + b.gridY)),
    [buildings]
  );

  const sortedAgents = useMemo(() => {
    return agents.map((agent, i) => ({ agent, index: i })).sort((a, b) => {
      const ba = buildings.find(bld => bld.id === a.agent.currentBuildingId);
      const bb = buildings.find(bld => bld.id === b.agent.currentBuildingId);
      return ((ba?.gridY ?? 0) + (ba?.gridX ?? 0)) - ((bb?.gridY ?? 0) + (bb?.gridX ?? 0));
    });
  }, [agents, buildings]);

  const handleSlotClick = useCallback((slot: Slot) => {
    onSlotClick?.(slot);
  }, [onSlotClick]);

  return (
    <div className="w-full h-full overflow-hidden bg-background relative" style={{ cursor: dragging ? 'grabbing' : 'grab' }}>

      <svg width="100%" height="100%" viewBox="-200 -100 1400 900"
        onMouseDown={onMouseDown} onMouseMove={onMouseMove}
        onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
        onWheel={onWheel}>

        {/* Simple dark background */}
        <rect x="-200" y="-100" width="1400" height="900" fill={zone.id === 'residential' ? 'hsl(30,10%,18%)' : zone.id === 'industrial' ? 'hsl(240,8%,4%)' : 'hsl(220,10%,6%)'} />

        <g
          transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
          style={{ transition: dragging ? 'none' : 'transform 0.5s cubic-bezier(0.2, 0, 0.2, 1)' }}
        >
          {/* Layer 0: Locked zone ghost previews */}
          <LockedZoneGhost activeZoneId={zone.id} />

          {/* Layer 1: Ground tiles */}
          <GroundLayer zone={zone} />

          {/* Layer 2: Buildings only (no inline ads — prevents occlusion) */}
          {sortedBuildings.map(b => {
            // Landmarks get their own special renderer
            if (b.isLandmark && b.landmarkType) {
              return (
                <LandmarkRenderer
                  key={b.id}
                  b={b}
                  onClick={() => onBuildingClick(b)}
                />
              );
            }
            const buildingAds = adSlots.filter(s => s.buildingId === b.id);
            const wallWrapAd = buildingAds.find(s => s.type === 'wall_wrap' && s.brand);
            const namingAd = buildingAds.find(s => s.type === 'naming_rights' && s.brand);
            // Find BRAND_BUILDING slot from DB for flagship skin
            const brandSlot = zoneSlots.find(s => s.type === 'BRAND_BUILDING' && s.location.buildingId === b.id && s.ownerType === 'brand');
            return (
              <BuildingRenderer
                key={b.id}
                b={b}
                namingBrand={namingAd?.brand ?? null}
                wallWrapBrand={wallWrapAd?.brand ?? null}
                brandSkin={brandSlot ? { name: brandSlot.ownerName || '', color: brandSlot.displayConfig?.color as string || 'hsl(38,75%,50%)' } : null}
                onClick={() => onBuildingClick(b)}
              />
            );
          })}

          {/* Layer 2.5: Ad slot visuals (billboards, kiosks, bus stops) — rendered ABOVE all buildings */}
          {sortedBuildings.map(b => {
            const buildingAds = adSlots.filter(s => s.buildingId === b.id);
            if (buildingAds.length === 0) return null;
            return <AdSlotVisual key={`ad-${b.id}`} building={b} adSlots={buildingAds} onAdSlotClick={onAdSlotClick} />;
          })}

          {/* Layer 3.5: Multi-building ad canvases */}
          <MultiBuildingAdRenderer ads={DEMO_MULTI_BUILDING_ADS} buildings={buildings} />

          {/* Layer 3.6: Slot-based visuals from DB (BRAND_BUILDING, BRAND_SCREEN, PRODUCT_PPL) */}
          {!slotsLoading && (
            <SlotVisualRenderer slots={zoneSlots} buildings={buildings} onSlotClick={handleSlotClick} />
          )}

          {/* Layer 3.7: Patron tiles from DB */}
          {!slotsLoading && (
            <PatronTileRenderer slots={patronSlots} onSlotClick={handleSlotClick} />
          )}

          {/* Layer 3.8: Guide NPC — rendered in HTML overlay instead */}

          {/* Layer 4: Agents */}
          {sortedAgents.map(({ agent, index }) => (
            <AgentRenderer key={agent.id} agent={agent} index={index}
              building={buildings.find(bld => bld.id === agent.currentBuildingId)}
              interactions={interactions} allBuildings={buildings}
              speechBubbles={speechBubbles} adReactions={adReactions}
              visualState={agentVisuals.get(agent.id)}
              onClick={() => onAgentClick(agent)} />
          ))}
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

      {/* Loading indicator for slots */}
      {slotsLoading && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-card/90 border border-border rounded-lg px-3 py-1.5 text-xs text-muted-foreground">
          슬롯 로딩 중...
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1">
        <button onClick={() => setZoom(z => Math.min(3, z + 0.15))} className="w-8 h-8 rounded bg-card border border-border flex items-center justify-center text-foreground hover:border-primary transition-colors text-sm">+</button>
        <button onClick={() => setZoom(z => Math.max(0.25, z - 0.15))} className="w-8 h-8 rounded bg-card border border-border flex items-center justify-center text-foreground hover:border-primary transition-colors text-sm">−</button>
      </div>

      {/* Guide NPC button — top left where legend was */}
      {zone.id === 'plaza' && (
        <button
          onClick={() => handleSlotClick(GUIDE_SLOT)}
          className="absolute top-3 left-3 bg-card/90 backdrop-blur-sm rounded-xl border border-border px-3 py-2.5 flex items-center gap-2 hover:border-primary transition-colors cursor-pointer"
        >
          <span className="text-base">🤖</span>
          <span className="text-xs font-semibold text-muted-foreground">Guide AI</span>
        </button>
      )}
    </div>
  );
};
