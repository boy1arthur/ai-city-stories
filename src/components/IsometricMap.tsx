import React, { useState, useRef, useCallback, useMemo } from 'react';
import type { Building, Agent, AdSlot, InteractionEvent, Zone } from '@/data/world';
import { getTileTypeFromMap, TILE_COLORS, isRoadCenterInZone } from '@/data/world';

// Isometric constants - 2:1 diamond ratio like Zomboid
const TILE_W = 48;
const TILE_H = 24;
const WALL_H_UNIT = 18; // pixels per height level

function iso(gx: number, gy: number): { x: number; y: number } {
  return {
    x: (gx - gy) * (TILE_W / 2) + 500,
    y: (gx + gy) * (TILE_H / 2) + 40,
  };
}

// Diamond tile points
function diamond(cx: number, cy: number): string {
  return `${cx},${cy - TILE_H / 2} ${cx + TILE_W / 2},${cy} ${cx},${cy + TILE_H / 2} ${cx - TILE_W / 2},${cy}`;
}

const COLOR_MAP: Record<string, string> = {
  primary: 'hsl(152,76%,44%)',
  secondary: 'hsl(270,60%,55%)',
  accent: 'hsl(38,92%,50%)',
};

interface Props {
  zone: Zone;
  buildings: Building[];
  agents: Agent[];
  adSlots: AdSlot[];
  interactions: InteractionEvent[];
  onBuildingClick: (b: Building) => void;
  onAgentClick: (a: Agent) => void;
}

// ===== GROUND LAYER - Filled diamond tiles =====
const GroundLayer: React.FC<{ zone: Zone }> = React.memo(({ zone }) => {
  const tiles: React.ReactNode[] = [];
  const GRID = zone.gridSize;

  // Render back-to-front (Y-sort)
  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      const type = getTileTypeFromMap(zone.tileMap, gx, gy, GRID);
      const colors = TILE_COLORS[type];
      const pos = iso(gx, gy);

      tiles.push(
        <polygon
          key={`t_${gx}_${gy}`}
          points={diamond(pos.x, pos.y)}
          fill={colors.fill}
          stroke={colors.stroke}
          strokeWidth={0.5}
          strokeOpacity={colors.strokeOpacity}
        />
      );

      // Road center markings (dashed yellow line)
      if (isRoadCenterInZone(zone.tileMap, gx, gy, GRID)) {
        const isVert = (gx === 7 || gx === 13);
        if (isVert) {
          tiles.push(
            <line key={`rm_${gx}_${gy}`}
              x1={pos.x} y1={pos.y - 4} x2={pos.x} y2={pos.y + 4}
              stroke="hsl(38,70%,40%)" strokeWidth={1} strokeOpacity={0.3}
              strokeDasharray="2 3"
            />
          );
        } else {
          tiles.push(
            <line key={`rm_${gx}_${gy}`}
              x1={pos.x - 8} y1={pos.y} x2={pos.x + 8} y2={pos.y}
              stroke="hsl(38,70%,40%)" strokeWidth={1} strokeOpacity={0.3}
              strokeDasharray="2 3"
            />
          );
        }
      }

      // Grass detail (little patches)
      if (type === 'grass' && Math.random() > 0.7) {
        tiles.push(
          <circle key={`gd_${gx}_${gy}`} cx={pos.x + (Math.random()-0.5)*12} cy={pos.y + (Math.random()-0.5)*6}
            r={1} fill="hsl(140,40%,18%)" opacity={0.5}
          />
        );
      }

      // Park trees
      if (type === 'park') {
        if ((gx + gy) % 3 === 0) {
          tiles.push(
            <g key={`tree_${gx}_${gy}`}>
              <line x1={pos.x} y1={pos.y} x2={pos.x} y2={pos.y - 8} stroke="hsl(25,30%,20%)" strokeWidth={1.5} />
              <circle cx={pos.x} cy={pos.y - 10} r={4} fill="hsl(140,35%,22%)" opacity={0.8} />
              <circle cx={pos.x - 2} cy={pos.y - 12} r={3} fill="hsl(145,40%,25%)" opacity={0.7} />
            </g>
          );
        }
      }

      // Water shimmer
      if (type === 'water') {
        tiles.push(
          <line key={`ws_${gx}_${gy}`}
            x1={pos.x - 6} y1={pos.y} x2={pos.x + 6} y2={pos.y}
            stroke="hsl(210,60%,30%)" strokeWidth={0.5} strokeOpacity={0.5}>
            <animate attributeName="strokeOpacity" values="0.2;0.6;0.2" dur="3s" repeatCount="indefinite" />
          </line>
        );
      }

      // Plaza decorative pattern
      if (type === 'plaza_stone' && (gx + gy) % 2 === 0) {
        tiles.push(
          <polygon key={`pd_${gx}_${gy}`}
            points={diamond(pos.x, pos.y)}
            fill="hsl(38,25%,20%)" fillOpacity={0.3}
            stroke="none"
          />
        );
      }
    }
  }

  return <g>{tiles}</g>;
});
GroundLayer.displayName = 'GroundLayer';

// ===== BUILDING RENDERER (Zomboid-style walls) =====
const BuildingRenderer: React.FC<{
  b: Building;
  adSlots: AdSlot[];
  onClick: () => void;
}> = React.memo(({ b, adSlots, onClick }) => {
  const buildingAds = adSlots.filter(s => s.buildingId === b.id);
  const wallWrapAd = buildingAds.find(s => s.type === 'wall_wrap' && s.brand);
  const wallHeight = WALL_H_UNIT * b.heightLevel;

  // Get 4 corners of building footprint in iso space
  const nw = iso(b.gridX, b.gridY); // top-left in grid = NW corner
  const ne = iso(b.gridX + b.width, b.gridY);
  const se = iso(b.gridX + b.width, b.gridY + b.height);
  const sw = iso(b.gridX, b.gridY + b.height);

  const wColor = wallWrapAd ? 'hsl(38,40%,30%)' : b.wallColor;
  const wColorLight = wallWrapAd ? 'hsl(38,50%,35%)' : b.wallColor.replace(/(\d+)%\)$/, (_, n) => `${Math.min(100, parseInt(n) + 8)}%)`);
  const rColor = b.roofColor;

  // Center for labels
  const center = iso(b.gridX + b.width / 2, b.gridY + b.height / 2);

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }} className="building-group">
      {/* Floor fill */}
      <polygon
        points={`${nw.x},${nw.y} ${ne.x},${ne.y} ${se.x},${se.y} ${sw.x},${sw.y}`}
        fill={rColor}
        fillOpacity={0.15}
        stroke="none"
      />

      {/* South wall (visible face - East side in iso) */}
      <polygon
        points={`
          ${se.x},${se.y}
          ${sw.x},${sw.y}
          ${sw.x},${sw.y - wallHeight}
          ${se.x},${se.y - wallHeight}
        `}
        fill={wColor}
        fillOpacity={0.7}
        stroke={wColorLight}
        strokeWidth={0.8}
      />
      {/* Windows on south wall */}
      {[...Array(b.width)].map((_, wi) => {
        const t = wi / b.width;
        const wx = sw.x + (se.x - sw.x) * (t + 0.5 / b.width);
        const wy = sw.y + (se.y - sw.y) * (t + 0.5 / b.width);
        return [...Array(b.heightLevel)].map((_, hi) => {
          const winY = wy - wallHeight + (wallHeight / (b.heightLevel + 1)) * (hi + 1);
          return (
            <rect key={`sw_${wi}_${hi}`}
              x={wx - 3} y={winY - 2} width={6} height={4} rx={0.5}
              fill="hsl(200,40%,30%)" fillOpacity={0.5}
              stroke="hsl(200,30%,40%)" strokeWidth={0.3}
            />
          );
        });
      })}

      {/* East wall (visible face) */}
      <polygon
        points={`
          ${ne.x},${ne.y}
          ${se.x},${se.y}
          ${se.x},${se.y - wallHeight}
          ${ne.x},${ne.y - wallHeight}
        `}
        fill={wColor}
        fillOpacity={0.5}
        stroke={wColorLight}
        strokeWidth={0.8}
      />
      {/* Windows on east wall */}
      {[...Array(b.height)].map((_, wi) => {
        const t = wi / b.height;
        const wx = ne.x + (se.x - ne.x) * (t + 0.5 / b.height);
        const wy = ne.y + (se.y - ne.y) * (t + 0.5 / b.height);
        return [...Array(b.heightLevel)].map((_, hi) => {
          const winY = wy - wallHeight + (wallHeight / (b.heightLevel + 1)) * (hi + 1);
          return (
            <rect key={`ew_${wi}_${hi}`}
              x={wx - 3} y={winY - 2} width={6} height={4} rx={0.5}
              fill="hsl(220,35%,28%)" fillOpacity={0.4}
              stroke="hsl(220,25%,35%)" strokeWidth={0.3}
            />
          );
        });
      })}

      {/* Wall wrap glow effect */}
      {wallWrapAd && (
        <>
          <polygon points={`${se.x},${se.y} ${sw.x},${sw.y} ${sw.x},${sw.y - wallHeight} ${se.x},${se.y - wallHeight}`}
            fill="hsl(38,92%,50%)" fillOpacity={0.08}>
            <animate attributeName="fillOpacity" values="0.04;0.12;0.04" dur="3s" repeatCount="indefinite" />
          </polygon>
          <text x={(sw.x + se.x) / 2} y={(sw.y + se.y) / 2 - wallHeight / 2}
            textAnchor="middle" fontSize={8} fill="hsl(38,92%,50%)" fontFamily="JetBrains Mono" fontWeight={700} opacity={0.7}>
            {wallWrapAd.brand}
          </text>
        </>
      )}

      {/* Roof (top face) */}
      <polygon
        points={`
          ${nw.x},${nw.y - wallHeight}
          ${ne.x},${ne.y - wallHeight}
          ${se.x},${se.y - wallHeight}
          ${sw.x},${sw.y - wallHeight}
        `}
        fill={rColor}
        fillOpacity={0.6}
        stroke={wColorLight}
        strokeWidth={1}
        strokeOpacity={0.5}
      />

      {/* Roof details by type */}
      {b.roofShape === 'antenna' && (
        <g>
          <line x1={center.x} y1={center.y - wallHeight} x2={center.x} y2={center.y - wallHeight - 20}
            stroke="hsl(200,20%,40%)" strokeWidth={1.5} />
          <circle cx={center.x} cy={center.y - wallHeight - 22} r={2} fill={COLOR_MAP[b.color] || COLOR_MAP.primary}>
            <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" />
          </circle>
        </g>
      )}
      {b.roofShape === 'dome' && (
        <ellipse cx={center.x} cy={center.y - wallHeight - 4}
          rx={Math.min(b.width, b.height) * TILE_W * 0.15}
          ry={Math.min(b.width, b.height) * TILE_H * 0.15 + 4}
          fill={rColor} fillOpacity={0.4} stroke={wColorLight} strokeWidth={0.8} />
      )}
      {b.roofShape === 'dish' && (
        <path d={`M${center.x - 10},${center.y - wallHeight - 2} Q${center.x},${center.y - wallHeight - 14} ${center.x + 10},${center.y - wallHeight - 2}`}
          fill="none" stroke={COLOR_MAP[b.color]} strokeWidth={1.5} strokeOpacity={0.6}>
          <animate attributeName="strokeOpacity" values="0.3;0.8;0.3" dur="4s" repeatCount="indefinite" />
        </path>
      )}
      {b.roofShape === 'spire' && (
        <polygon points={`${center.x},${center.y - wallHeight - 18} ${center.x - 6},${center.y - wallHeight} ${center.x + 6},${center.y - wallHeight}`}
          fill={rColor} fillOpacity={0.5} stroke={wColorLight} strokeWidth={0.8} />
      )}
      {b.roofShape === 'garden' && (
        <g>
          {[...Array(3)].map((_, i) => (
            <circle key={i} cx={center.x + (i - 1) * 10} cy={center.y - wallHeight - 3}
              r={4 + Math.random() * 2} fill="hsl(140,40%,22%)" fillOpacity={0.7}>
              <animate attributeName="r" values={`${3 + i};${5 + i};${3 + i}`} dur={`${3 + i}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </g>
      )}
      {b.roofShape === 'gear' && (
        <circle cx={center.x} cy={center.y - wallHeight - 3} r={6}
          fill="none" stroke={COLOR_MAP[b.color]} strokeWidth={1.5} strokeOpacity={0.5}
          strokeDasharray="3 2">
          <animateTransform attributeName="transform" type="rotate" from={`0 ${center.x} ${center.y - wallHeight - 3}`} to={`360 ${center.x} ${center.y - wallHeight - 3}`} dur="15s" repeatCount="indefinite" />
        </circle>
      )}
      {b.roofShape === 'lantern' && (
        <circle cx={center.x} cy={center.y - wallHeight - 4} r={3}
          fill="hsl(38,80%,50%)" fillOpacity={0.3}>
          <animate attributeName="fillOpacity" values="0.15;0.5;0.15" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
      {b.roofShape === 'telescope' && (
        <g>
          <line x1={center.x - 6} y1={center.y - wallHeight} x2={center.x + 4} y2={center.y - wallHeight - 14}
            stroke={COLOR_MAP[b.color]} strokeWidth={2} strokeOpacity={0.6} strokeLinecap="round" />
          <circle cx={center.x + 5} cy={center.y - wallHeight - 15} r={2.5}
            fill={COLOR_MAP[b.color]} fillOpacity={0.4}>
            <animate attributeName="fillOpacity" values="0.2;0.6;0.2" dur="3s" repeatCount="indefinite" />
          </circle>
        </g>
      )}

      {/* Billboard ad - standing sign next to building */}
      {buildingAds.filter(s => s.type === 'billboard').map((slot, i) => {
        const signPos = iso(b.gridX + b.width + 0.5, b.gridY + i * 1.2);
        return (
          <g key={slot.id}>
            {/* Post */}
            <line x1={signPos.x} y1={signPos.y} x2={signPos.x} y2={signPos.y - 22}
              stroke="hsl(220,10%,30%)" strokeWidth={1.5} />
            {/* Sign panel */}
            <rect x={signPos.x - 10} y={signPos.y - 30} width={20} height={10} rx={1}
              fill={slot.brand ? 'hsl(38,92%,50%)' : 'hsl(220,10%,16%)'}
              fillOpacity={slot.brand ? 0.8 : 0.5}
              stroke={slot.brand ? 'hsl(38,92%,60%)' : 'hsl(220,10%,25%)'}
              strokeWidth={0.8}
            />
            {slot.brand && (
              <>
                <text x={signPos.x} y={signPos.y - 23.5} textAnchor="middle"
                  fontSize={5} fill="hsl(240,20%,4%)" fontFamily="JetBrains Mono" fontWeight={700}>
                  {slot.brand.slice(0, 7)}
                </text>
                {/* Glow */}
                <rect x={signPos.x - 10} y={signPos.y - 30} width={20} height={10} rx={1}
                  fill="hsl(38,92%,50%)" fillOpacity={0.15} filter="url(#glow-gold)">
                  <animate attributeName="fillOpacity" values="0.05;0.2;0.05" dur="2s" repeatCount="indefinite" />
                </rect>
              </>
            )}
          </g>
        );
      })}

      {/* Kiosk - small standing screen */}
      {buildingAds.filter(s => s.type === 'kiosk').map((slot, i) => {
        const kPos = iso(b.gridX - 0.5, b.gridY + b.height - 1 + i);
        return (
          <g key={slot.id}>
            <rect x={kPos.x - 3} y={kPos.y - 14} width={6} height={14} rx={1}
              fill={slot.brand ? 'hsl(38,60%,25%)' : 'hsl(220,10%,14%)'}
              stroke={slot.brand ? 'hsl(38,70%,40%)' : 'hsl(220,10%,20%)'}
              strokeWidth={0.6}
            />
            {slot.brand && (
              <rect x={kPos.x - 2} y={kPos.y - 12} width={4} height={6} rx={0.5}
                fill="hsl(38,92%,50%)" fillOpacity={0.6}>
                <animate attributeName="fillOpacity" values="0.3;0.8;0.3" dur="2.5s" repeatCount="indefinite" />
              </rect>
            )}
          </g>
        );
      })}

      {/* Bus stop - bench + sign on road edge */}
      {buildingAds.filter(s => s.type === 'bus_stop').map((slot, i) => {
        const bsPos = iso(b.gridX + i, b.gridY + b.height + 0.5);
        return (
          <g key={slot.id}>
            {/* Bench */}
            <rect x={bsPos.x - 6} y={bsPos.y - 3} width={12} height={3} rx={0.5}
              fill="hsl(220,8%,20%)" stroke="hsl(220,10%,28%)" strokeWidth={0.5} />
            {/* Sign */}
            <line x1={bsPos.x + 7} y1={bsPos.y} x2={bsPos.x + 7} y2={bsPos.y - 16}
              stroke="hsl(220,10%,30%)" strokeWidth={1} />
            <rect x={bsPos.x + 3} y={bsPos.y - 18} width={8} height={6} rx={0.5}
              fill={slot.brand ? 'hsl(38,80%,45%)' : 'hsl(220,8%,14%)'}
              fillOpacity={slot.brand ? 0.7 : 0.4}
              stroke={slot.brand ? 'hsl(38,90%,55%)' : 'hsl(220,8%,22%)'}
              strokeWidth={0.5}
            />
            {slot.brand && (
              <text x={bsPos.x + 7} y={bsPos.y - 13.5} textAnchor="middle"
                fontSize={3.5} fill="hsl(240,20%,4%)" fontFamily="JetBrains Mono" fontWeight={600}>
                {slot.brand.slice(0, 4)}
              </text>
            )}
          </g>
        );
      })}

      {/* Naming rights - floating hologram above building */}
      {buildingAds.filter(s => s.type === 'naming_rights' && s.brand).map(slot => (
        <g key={slot.id}>
          <text x={center.x} y={center.y - wallHeight - 30} textAnchor="middle"
            fontSize={9} fill="hsl(38,92%,50%)" fontFamily="JetBrains Mono" fontWeight={800}
            opacity={0.9} filter="url(#glow-gold)">
            {slot.brand}
          </text>
          {/* Hologram lines */}
          <line x1={center.x - 15} y1={center.y - wallHeight - 24} x2={center.x + 15} y2={center.y - wallHeight - 24}
            stroke="hsl(38,92%,50%)" strokeWidth={0.5} strokeOpacity={0.3} />
          <line x1={center.x} y1={center.y - wallHeight - 22} x2={center.x} y2={center.y - wallHeight}
            stroke="hsl(38,92%,50%)" strokeWidth={0.3} strokeOpacity={0.15}
            strokeDasharray="2 3" />
        </g>
      ))}

      {/* Building name & emoji label */}
      <text x={center.x} y={center.y - wallHeight - 6} textAnchor="middle" fontSize={14}>{b.emoji}</text>
      <text x={center.x} y={se.y + 10} textAnchor="middle"
        fontSize={7} fill={COLOR_MAP[b.color] || '#888'} fontFamily="JetBrains Mono" fontWeight={600} opacity={0.85}>
        {b.name}
      </text>
    </g>
  );
});
BuildingRenderer.displayName = 'BuildingRenderer';

// ===== AGENT =====
const AgentRenderer: React.FC<{
  agent: Agent;
  index: number;
  building: Building | undefined;
  interactions: InteractionEvent[];
  allBuildings: Building[];
  onClick: () => void;
}> = React.memo(({ agent, index, building, interactions, allBuildings, onClick }) => {
  if (!building) return null;

  // Place agent on the sidewalk around the building
  const side = index % 4;
  let agx: number, agy: number;
  switch (side) {
    case 0: agx = building.gridX + (index % building.width); agy = building.gridY - 0.5; break;
    case 1: agx = building.gridX + building.width + 0.3; agy = building.gridY + (index % building.height); break;
    case 2: agx = building.gridX + (index % building.width); agy = building.gridY + building.height + 0.3; break;
    default: agx = building.gridX - 0.5; agy = building.gridY + (index % building.height); break;
  }

  const pos = iso(agx, agy);
  const avgAffinity = agent.brandAffinities.reduce((s, a) => s + a.score, 0) / Math.max(1, agent.brandAffinities.length);
  const haloColor = avgAffinity > 30 ? 'hsl(38,92%,50%)' : avgAffinity > 0 ? 'hsl(152,76%,44%)' : avgAffinity > -30 ? 'hsl(270,60%,55%)' : 'hsl(0,72%,50%)';

  const agentInteractions = interactions.filter(e => e.agentId === agent.id);

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      {/* Synapse lines */}
      {agentInteractions.map(event => {
        const targetB = allBuildings.find(b => b.id === event.buildingId);
        if (!targetB) return null;
        const tPos = iso(targetB.gridX + targetB.width / 2, targetB.gridY + targetB.height / 2);
        const lineColor = event.affinity > 0 ? 'hsl(38,92%,50%)' : 'hsl(0,72%,50%)';
        const age = (Date.now() - event.timestamp) / 5000;
        return (
          <line key={event.id} x1={pos.x} y1={pos.y - 6} x2={tPos.x} y2={tPos.y - 20}
            stroke={lineColor} strokeWidth={0.8} strokeOpacity={Math.max(0, 0.5 - age)}
            strokeDasharray="3 4">
            <animate attributeName="strokeDashoffset" from="0" to="-14" dur="0.8s" repeatCount="indefinite" />
          </line>
        );
      })}

      {/* Shadow */}
      <ellipse cx={pos.x} cy={pos.y + 2} rx={5} ry={2.5} fill="hsl(0,0%,0%)" fillOpacity={0.3} />

      {/* Halo */}
      <circle cx={pos.x} cy={pos.y - 6} r={10} fill="none" stroke={haloColor} strokeWidth={1} strokeOpacity={0.25}>
        <animate attributeName="r" values="8;11;8" dur="3s" repeatCount="indefinite" />
      </circle>

      {/* Body */}
      <ellipse cx={pos.x} cy={pos.y - 4} rx={6} ry={8} fill="hsl(240,16%,8%)" stroke={haloColor} strokeWidth={1} strokeOpacity={0.6} />

      {/* Avatar */}
      <text x={pos.x} y={pos.y - 1} textAnchor="middle" fontSize={10}>{agent.avatar}</text>

      {/* Name */}
      <text x={pos.x} y={pos.y + 12} textAnchor="middle" fontSize={5} fill="hsl(210,20%,75%)" fontFamily="JetBrains Mono" fontWeight={500} opacity={0.7}>
        {agent.name}
      </text>
    </g>
  );
});
AgentRenderer.displayName = 'AgentRenderer';

// ===== MAIN MAP =====
export const IsometricMap: React.FC<Props> = ({ zone, buildings, agents, adSlots, interactions, onBuildingClick, onAgentClick }) => {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.85);
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
    setZoom(z => Math.max(0.25, Math.min(3, z - e.deltaY * 0.001)));
  }, []);

  // Y-sort: render buildings back to front
  const sortedBuildings = useMemo(() =>
    [...buildings].sort((a, b) => (a.gridX + a.gridY) - (b.gridX + b.gridY)),
    [buildings]
  );

  // Sort agents by Y position too
  const sortedAgents = useMemo(() => {
    return agents.map((agent, i) => ({ agent, index: i })).sort((a, b) => {
      const ba = buildings.find(bld => bld.id === a.agent.currentBuildingId);
      const bb = buildings.find(bld => bld.id === b.agent.currentBuildingId);
      return ((ba?.gridY ?? 0) + (ba?.gridX ?? 0)) - ((bb?.gridY ?? 0) + (bb?.gridX ?? 0));
    });
  }, [agents, buildings]);

  return (
    <div className="w-full h-full overflow-hidden bg-background relative" style={{ cursor: dragging ? 'grabbing' : 'grab' }}>
      {/* Ambient gradients */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 35%, hsla(152,76%,44%,0.02) 0%, transparent 60%), radial-gradient(ellipse at 60% 50%, hsla(38,92%,50%,0.015) 0%, transparent 40%)',
      }} />

      <svg width="100%" height="100%" viewBox="0 0 1000 600"
        onMouseDown={onMouseDown} onMouseMove={onMouseMove}
        onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
        onWheel={onWheel}>
        <defs>
          <filter id="glow-gold" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id="vignette" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="80%" stopColor="transparent" />
            <stop offset="100%" stopColor="hsl(240,20%,3.9%)" stopOpacity="0.85" />
          </radialGradient>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          <GroundLayer zone={zone} />

          {/* Interleave buildings and agents by Y-sort */}
          {sortedBuildings.map(b => (
            <BuildingRenderer key={b.id} b={b} adSlots={adSlots} onClick={() => onBuildingClick(b)} />
          ))}

          {sortedAgents.map(({ agent, index }) => (
            <AgentRenderer key={agent.id} agent={agent} index={index}
              building={buildings.find(bld => bld.id === agent.currentBuildingId)}
              interactions={interactions} allBuildings={buildings}
              onClick={() => onAgentClick(agent)} />
          ))}
        </g>

        <rect width="1000" height="600" fill="url(#vignette)" pointerEvents="none" />
      </svg>

      {/* Zoom */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1">
        <button onClick={() => setZoom(z => Math.min(3, z + 0.15))} className="w-8 h-8 rounded bg-surface-elevated border border-border flex items-center justify-center text-foreground hover:border-primary transition-colors text-sm font-mono">+</button>
        <button onClick={() => setZoom(z => Math.max(0.25, z - 0.15))} className="w-8 h-8 rounded bg-surface-elevated border border-border flex items-center justify-center text-foreground hover:border-primary transition-colors text-sm font-mono">−</button>
      </div>

      {/* Mini legend */}
      <div className="absolute top-3 left-3 bg-card/90 backdrop-blur-sm rounded border border-border px-3 py-2 text-xs font-mono space-y-1">
        <div className="text-muted-foreground font-semibold mb-1">MAP LEGEND</div>
        <div className="flex items-center gap-2"><span className="w-3 h-1.5 rounded-sm" style={{ background: 'hsl(220,8%,14%)' }} /> 도로</div>
        <div className="flex items-center gap-2"><span className="w-3 h-1.5 rounded-sm" style={{ background: 'hsl(38,20%,16%)' }} /> 광장</div>
        <div className="flex items-center gap-2"><span className="w-3 h-1.5 rounded-sm" style={{ background: 'hsl(140,30%,12%)' }} /> 초지</div>
        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: 'hsl(38,92%,50%)' }} /> 광고</div>
      </div>
    </div>
  );
};
