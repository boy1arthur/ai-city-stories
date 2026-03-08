import React, { useMemo } from 'react';
import type { Zone, Building, AdSlot } from '@/data/world';
import type { SpeechBubble, AdReaction, AgentVisualState } from '@/hooks/useWorldSimulation';
import type { Slot } from '@/data/slots';
import { GroundLayer } from './GroundLayer';
import { BuildingRenderer } from './BuildingRenderer';
import { LandmarkRenderer } from './LandmarkRenderer';
import { AdSlotVisual } from './AdSlotVisual';
import { AgentRenderer } from './AgentRenderer';
import { SlotVisualRenderer } from './SlotVisualRenderer';
import { PatronTileRenderer } from './PatronTileRenderer';
import type { Agent, InteractionEvent } from '@/data/world';

interface Props {
  zone: Zone;
  offsetX: number;
  offsetY: number;
  lod: 'full' | 'simplified';
  agents: Agent[];
  adSlots: AdSlot[];
  interactions: InteractionEvent[];
  speechBubbles: SpeechBubble[];
  adReactions: AdReaction[];
  agentVisuals: Map<string, AgentVisualState>;
  zoneSlots: Slot[];
  patronSlots: Slot[];
  onBuildingClick: (b: Building) => void;
  onAgentClick: (a: Agent) => void;
  onSlotClick?: (slot: Slot) => void;
  onAdSlotClick?: (adSlot: AdSlot) => void;
}

/**
 * Renders a single zone at a given offset in the SVG coordinate space.
 * LOD controls detail level:
 * - 'full': All details including agents, ad slots, decorations
 * - 'simplified': Just ground + simple building blocks (colored rectangles)
 */
export const ZoneRenderer: React.FC<Props> = React.memo(({
  zone, offsetX, offsetY, lod,
  agents, adSlots, interactions,
  speechBubbles, adReactions, agentVisuals,
  zoneSlots, patronSlots,
  onBuildingClick, onAgentClick, onSlotClick, onAdSlotClick,
}) => {
  const buildings = zone.buildings;

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

  if (lod === 'simplified') {
    return (
      <g transform={`translate(${offsetX}, ${offsetY})`}>
        <GroundLayer zone={zone} />
        {sortedBuildings.map(b => {
          if (b.isLandmark && b.landmarkType) {
            return <LandmarkRenderer key={b.id} b={b} onClick={() => onBuildingClick(b)} />;
          }
          return (
            <BuildingRenderer
              key={b.id}
              b={b}
              namingBrand={null}
              wallWrapBrand={null}
              brandSkin={null}
              onClick={() => onBuildingClick(b)}
            />
          );
        })}
      </g>
    );
  }

  return (
    <g transform={`translate(${offsetX}, ${offsetY})`}>
      <GroundLayer zone={zone} />

      {sortedBuildings.map(b => {
        if (b.isLandmark && b.landmarkType) {
          return <LandmarkRenderer key={b.id} b={b} onClick={() => onBuildingClick(b)} />;
        }
        const buildingAds = adSlots.filter(s => s.buildingId === b.id);
        const wallWrapAd = buildingAds.find(s => s.type === 'wall_wrap' && s.brand);
        const namingAd = buildingAds.find(s => s.type === 'naming_rights' && s.brand);
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

      {sortedBuildings.map(b => {
        const buildingAds = adSlots.filter(s => s.buildingId === b.id);
        if (buildingAds.length === 0) return null;
        return <AdSlotVisual key={`ad-${b.id}`} building={b} adSlots={buildingAds} onAdSlotClick={onAdSlotClick} />;
      })}

      <SlotVisualRenderer slots={zoneSlots} buildings={buildings} onSlotClick={onSlotClick} />
      <PatronTileRenderer slots={patronSlots} onSlotClick={onSlotClick} />

      {sortedAgents.map(({ agent, index }) => (
        <AgentRenderer key={agent.id} agent={agent} index={index}
          building={buildings.find(bld => bld.id === agent.currentBuildingId)}
          interactions={interactions} allBuildings={buildings}
          speechBubbles={speechBubbles} adReactions={adReactions}
          visualState={agentVisuals.get(agent.id)}
          onClick={() => onAgentClick(agent)} />
      ))}
    </g>
  );
});
ZoneRenderer.displayName = 'ZoneRenderer';
