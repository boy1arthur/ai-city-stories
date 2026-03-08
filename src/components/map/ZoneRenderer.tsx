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
import { iso } from './constants';
import type { Agent, InteractionEvent } from '@/data/world';

interface Props {
  zone: Zone;
  offsetX: number;
  offsetY: number;
  lod: 'full' | 'simplified' | 'silhouette';
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
  onZoneClick?: (zoneId: string) => void;
}

/**
 * Renders a single zone at a given offset in the SVG coordinate space.
 * LOD controls detail level:
 * - 'full': All details including agents, ad slots, decorations
 * - 'simplified': Just ground + simple building blocks (colored rectangles)
 * - 'silhouette': Minimal — just a colored zone outline with label (fastest)
 */
export const ZoneRenderer: React.FC<Props> = React.memo(({
  zone, offsetX, offsetY, lod,
  agents, adSlots, interactions,
  speechBubbles, adReactions, agentVisuals,
  zoneSlots, patronSlots,
  onBuildingClick, onAgentClick, onSlotClick, onAdSlotClick, onZoneClick,
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

  // Silhouette mode: just a colored diamond footprint + label
  if (lod === 'silhouette') {
    const gridSize = zone.gridSize;
    const topLeft = iso(0, 0);
    const topRight = iso(gridSize, 0);
    const bottomRight = iso(gridSize, gridSize);
    const bottomLeft = iso(0, gridSize);
    const points = `${topLeft.x},${topLeft.y} ${topRight.x},${topRight.y} ${bottomRight.x},${bottomRight.y} ${bottomLeft.x},${bottomLeft.y}`;
    const centerX = (topLeft.x + bottomRight.x) / 2;
    const centerY = (topLeft.y + bottomRight.y) / 2;

    return (
      <g transform={`translate(${offsetX}, ${offsetY})`}>
        <polygon points={points}
          fill={zone.themeColor} fillOpacity={0.08}
          stroke={zone.themeColor} strokeWidth={1.5} strokeOpacity={0.3} />
        {/* Simplified building silhouettes */}
        {buildings.slice(0, 8).map(b => {
          const bPos = iso(b.gridX, b.gridY);
          const w = 24;
          const h = 12;
          return (
            <rect key={b.id}
              x={bPos.x - w / 2} y={bPos.y - h}
              width={w} height={h}
              fill={zone.themeColor} fillOpacity={0.12}
              rx={1} />
          );
        })}
        <text x={centerX} y={centerY + 4} textAnchor="middle" fontSize={14}
          fill={zone.themeColor} fillOpacity={0.6} fontWeight={700}>
          {zone.emoji} {zone.name}
        </text>
      </g>
    );
  }

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
