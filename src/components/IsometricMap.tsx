import React, { useState, useRef, useCallback, useMemo } from 'react';
import type { Building, Agent, AdSlot, InteractionEvent } from '@/data/world';
import { ROAD_SEGMENTS } from '@/data/world';

const TILE_W = 64;
const TILE_H = 32;
const GRID_SIZE = 18;

function isoToScreen(gx: number, gy: number) {
  return {
    x: (gx - gy) * (TILE_W / 2) + (GRID_SIZE * TILE_W) / 2,
    y: (gx + gy) * (TILE_H / 2) + 80,
  };
}

const COLOR_MAP: Record<string, { main: string; light: string; dark: string }> = {
  primary: { main: 'hsl(152,76%,44%)', light: 'hsl(152,76%,55%)', dark: 'hsl(152,76%,25%)' },
  secondary: { main: 'hsl(270,60%,55%)', light: 'hsl(270,60%,65%)', dark: 'hsl(270,60%,35%)' },
  accent: { main: 'hsl(38,92%,50%)', light: 'hsl(38,92%,62%)', dark: 'hsl(38,92%,32%)' },
};

interface Props {
  buildings: Building[];
  agents: Agent[];
  adSlots: AdSlot[];
  interactions: InteractionEvent[];
  onBuildingClick: (b: Building) => void;
  onAgentClick: (a: Agent) => void;
}

// ===== GROUND LAYER =====
const GroundLayer: React.FC = React.memo(() => {
  const tiles: React.ReactNode[] = [];

  for (let gx = 0; gx < GRID_SIZE; gx++) {
    for (let gy = 0; gy < GRID_SIZE; gy++) {
      const pos = isoToScreen(gx, gy);
      // Distance from center (9,9) for vignette
      const dist = Math.sqrt((gx - 9) ** 2 + (gy - 9) ** 2);
      const maxDist = 12;
      const fade = Math.max(0, 1 - dist / maxDist);

      // Plaza zone highlight (7-10, 6-9)
      const isPlazaZone = gx >= 7 && gx <= 10 && gy >= 6 && gy <= 9;

      const baseFill = isPlazaZone
        ? `hsla(38,92%,50%,${0.04 + fade * 0.06})`
        : `hsla(152,76%,44%,${fade * 0.025})`;

      tiles.push(
        <polygon
          key={`tile_${gx}_${gy}`}
          points={`${pos.x},${pos.y - TILE_H / 2} ${pos.x + TILE_W / 2},${pos.y} ${pos.x},${pos.y + TILE_H / 2} ${pos.x - TILE_W / 2},${pos.y}`}
          fill={baseFill}
          stroke={`hsla(240,14%,100%,${fade * 0.04})`}
          strokeWidth={0.5}
        />
      );
    }
  }

  return <g>{tiles}</g>;
});
GroundLayer.displayName = 'GroundLayer';

// ===== ROADS =====
const RoadLayer: React.FC = React.memo(() => {
  return (
    <g>
      {ROAD_SEGMENTS.map((seg, i) => {
        const from = isoToScreen(seg.from.x, seg.from.y);
        const to = isoToScreen(seg.to.x, seg.to.y);
        return (
          <g key={`road_${i}`}>
            <line
              x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke="hsla(152,76%,44%,0.08)"
              strokeWidth={8}
              strokeLinecap="round"
            />
            <line
              x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke="hsla(152,76%,44%,0.15)"
              strokeWidth={1.5}
              strokeDasharray="4 6"
              strokeLinecap="round"
            />
          </g>
        );
      })}
    </g>
  );
});
RoadLayer.displayName = 'RoadLayer';

// ===== BUILDING RENDERER =====
function renderRoof(b: Building, cx: number, topY: number, bw: number, bh: number, colors: typeof COLOR_MAP.primary) {
  const roofElements: React.ReactNode[] = [];
  switch (b.roofShape) {
    case 'dome':
      roofElements.push(
        <ellipse key="dome" cx={cx} cy={topY - bh * 0.3} rx={bw * 0.6} ry={bh * 0.5} fill={colors.main} fillOpacity={0.15} stroke={colors.main} strokeWidth={1} strokeOpacity={0.5} />,
        <line key="dome-peak" x1={cx} y1={topY - bh * 0.8} x2={cx} y2={topY - bh * 0.3} stroke={colors.light} strokeWidth={1} strokeOpacity={0.6} />
      );
      break;
    case 'antenna':
      roofElements.push(
        <line key="ant1" x1={cx} y1={topY} x2={cx} y2={topY - 25} stroke={colors.main} strokeWidth={1.5} strokeOpacity={0.8} />,
        <circle key="ant-tip" cx={cx} cy={topY - 27} r={2.5} fill={colors.light} fillOpacity={0.9}>
          <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" />
        </circle>,
        <line key="ant2" x1={cx - 6} y1={topY - 15} x2={cx + 6} y2={topY - 15} stroke={colors.main} strokeWidth={1} strokeOpacity={0.5} />
      );
      break;
    case 'dish':
      roofElements.push(
        <path key="dish" d={`M${cx - 10},${topY - 5} Q${cx},${topY - 18} ${cx + 10},${topY - 5}`} fill="none" stroke={colors.main} strokeWidth={1.5} strokeOpacity={0.7} />,
        <circle key="dish-center" cx={cx} cy={topY - 10} r={2} fill={colors.light} fillOpacity={0.8}>
          <animate attributeName="r" values="1.5;3;1.5" dur="3s" repeatCount="indefinite" />
        </circle>
      );
      break;
    case 'spire':
      roofElements.push(
        <polygon key="spire" points={`${cx},${topY - 22} ${cx - 5},${topY - 3} ${cx + 5},${topY - 3}`} fill={colors.main} fillOpacity={0.2} stroke={colors.main} strokeWidth={1} strokeOpacity={0.6} />,
        <line key="spire-l1" x1={cx - 3} y1={topY - 8} x2={cx + 3} y2={topY - 8} stroke={colors.light} strokeWidth={0.5} strokeOpacity={0.4} />,
        <line key="spire-l2" x1={cx - 2} y1={topY - 13} x2={cx + 2} y2={topY - 13} stroke={colors.light} strokeWidth={0.5} strokeOpacity={0.4} />
      );
      break;
    case 'garden':
      roofElements.push(
        <ellipse key="bush1" cx={cx - 6} cy={topY - 4} rx={5} ry={4} fill="hsl(152,76%,35%)" fillOpacity={0.4} />,
        <ellipse key="bush2" cx={cx + 5} cy={topY - 3} rx={6} ry={5} fill="hsl(152,76%,40%)" fillOpacity={0.35} />,
        <ellipse key="bush3" cx={cx} cy={topY - 6} rx={4} ry={3.5} fill="hsl(152,76%,50%)" fillOpacity={0.3}>
          <animate attributeName="ry" values="3;4;3" dur="4s" repeatCount="indefinite" />
        </ellipse>
      );
      break;
    case 'gear':
      const gearR = 8;
      const teeth = 6;
      let gearPath = '';
      for (let t = 0; t < teeth; t++) {
        const a1 = (t / teeth) * Math.PI * 2;
        const a2 = ((t + 0.4) / teeth) * Math.PI * 2;
        const a3 = ((t + 0.5) / teeth) * Math.PI * 2;
        const a4 = ((t + 0.9) / teeth) * Math.PI * 2;
        gearPath += `${t === 0 ? 'M' : 'L'}${cx + Math.cos(a1) * gearR},${topY - 8 + Math.sin(a1) * gearR * 0.5} `;
        gearPath += `L${cx + Math.cos(a2) * (gearR + 4)},${topY - 8 + Math.sin(a2) * (gearR + 4) * 0.5} `;
        gearPath += `L${cx + Math.cos(a3) * (gearR + 4)},${topY - 8 + Math.sin(a3) * (gearR + 4) * 0.5} `;
        gearPath += `L${cx + Math.cos(a4) * gearR},${topY - 8 + Math.sin(a4) * gearR * 0.5} `;
      }
      gearPath += 'Z';
      roofElements.push(
        <path key="gear" d={gearPath} fill={colors.main} fillOpacity={0.15} stroke={colors.main} strokeWidth={1} strokeOpacity={0.5}>
          <animateTransform attributeName="transform" type="rotate" from={`0 ${cx} ${topY - 8}`} to={`360 ${cx} ${topY - 8}`} dur="20s" repeatCount="indefinite" />
        </path>
      );
      break;
    case 'lantern':
      roofElements.push(
        <rect key="lant-base" x={cx - 3} y={topY - 12} width={6} height={8} rx={1} fill={colors.main} fillOpacity={0.1} stroke={colors.main} strokeWidth={0.8} />,
        <circle key="lant-glow" cx={cx} cy={topY - 8} r={4} fill={colors.light} fillOpacity={0.2}>
          <animate attributeName="fillOpacity" values="0.1;0.35;0.1" dur="2.5s" repeatCount="indefinite" />
        </circle>
      );
      break;
    case 'telescope':
      roofElements.push(
        <line key="tube" x1={cx - 8} y1={topY - 2} x2={cx + 5} y2={topY - 18} stroke={colors.main} strokeWidth={2.5} strokeOpacity={0.7} strokeLinecap="round" />,
        <circle key="lens" cx={cx + 6} cy={topY - 19} r={3} fill={colors.light} fillOpacity={0.3} stroke={colors.main} strokeWidth={1}>
          <animate attributeName="fillOpacity" values="0.2;0.5;0.2" dur="3s" repeatCount="indefinite" />
        </circle>
      );
      break;
    default: // flat
      break;
  }
  return roofElements;
}

const BuildingRenderer: React.FC<{
  b: Building;
  adSlots: AdSlot[];
  onClick: () => void;
}> = React.memo(({ b, adSlots, onClick }) => {
  const pos = isoToScreen(b.gridX + b.width / 2, b.gridY + b.height / 2);
  const colors = COLOR_MAP[b.color] || COLOR_MAP.primary;
  const buildingAds = adSlots.filter(s => s.buildingId === b.id);
  const hasAds = buildingAds.some(s => s.brand);
  const wallWrapAd = buildingAds.find(s => s.type === 'wall_wrap' && s.brand);

  const bw = b.width * TILE_W * 0.38;
  const bh = b.height * TILE_H * 0.38;
  const buildingHeight = 20 + b.heightLevel * 22;

  const topY = pos.y - buildingHeight;
  const wallColor = wallWrapAd ? 'hsl(38,92%,50%)' : colors.main;
  const wallOpacityR = wallWrapAd ? 0.25 : 0.15;
  const wallOpacityL = wallWrapAd ? 0.18 : 0.08;

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      {/* Base shadow */}
      <ellipse cx={pos.x} cy={pos.y + 6} rx={bw * 0.8} ry={bh * 0.45} fill="hsl(0,0%,0%)" fillOpacity={0.35}>
        <animate attributeName="fillOpacity" values="0.25;0.4;0.25" dur="4s" repeatCount="indefinite" />
      </ellipse>

      {/* Base platform */}
      <polygon
        points={`${pos.x},${pos.y - 4} ${pos.x + bw},${pos.y + bh / 2 - 4} ${pos.x},${pos.y + bh - 4} ${pos.x - bw},${pos.y + bh / 2 - 4}`}
        fill={colors.dark} fillOpacity={0.3} stroke={colors.main} strokeWidth={0.5} strokeOpacity={0.2}
      />

      {/* Right wall */}
      <polygon
        points={`${pos.x},${topY} ${pos.x + bw},${topY + bh / 2} ${pos.x + bw},${pos.y + bh / 2} ${pos.x},${pos.y + bh}`}
        fill={wallColor} fillOpacity={wallOpacityR}
        stroke={wallColor} strokeWidth={1.2} strokeOpacity={0.5}
      />
      {/* Window lines on right wall */}
      {[...Array(b.heightLevel)].map((_, i) => {
        const wy = topY + (buildingHeight / (b.heightLevel + 1)) * (i + 1);
        return (
          <line key={`rw_${i}`} x1={pos.x + 4} y1={wy + bh * 0.1} x2={pos.x + bw - 4} y2={wy + bh * 0.35}
            stroke={colors.light} strokeWidth={0.6} strokeOpacity={0.3} />
        );
      })}

      {/* Left wall */}
      <polygon
        points={`${pos.x},${topY} ${pos.x - bw},${topY + bh / 2} ${pos.x - bw},${pos.y + bh / 2} ${pos.x},${pos.y + bh}`}
        fill={wallColor} fillOpacity={wallOpacityL}
        stroke={wallColor} strokeWidth={0.8} strokeOpacity={0.35}
      />
      {/* Window lines on left wall */}
      {[...Array(Math.max(1, b.heightLevel - 1))].map((_, i) => {
        const wy = topY + (buildingHeight / b.heightLevel) * (i + 0.5);
        return (
          <line key={`lw_${i}`} x1={pos.x - 4} y1={wy + bh * 0.1} x2={pos.x - bw + 4} y2={wy + bh * 0.35}
            stroke={colors.light} strokeWidth={0.5} strokeOpacity={0.2} />
        );
      })}

      {/* Top face */}
      <polygon
        points={`${pos.x},${topY - bh / 2} ${pos.x + bw},${topY} ${pos.x},${topY + bh / 2} ${pos.x - bw},${topY}`}
        fill={colors.main} fillOpacity={0.2}
        stroke={colors.main} strokeWidth={1} strokeOpacity={0.4}
      />

      {/* Roof details */}
      {renderRoof(b, pos.x, topY - bh / 2, bw, bh, colors)}

      {/* Billboard ad slot */}
      {buildingAds.filter(s => s.type === 'billboard').map((slot, i) => {
        const bx = pos.x + bw + 3;
        const by = topY + i * 14;
        return (
          <g key={slot.id}>
            <rect x={bx} y={by} width={18} height={10} rx={1}
              fill={slot.brand ? 'hsl(38,92%,50%)' : 'hsl(240,14%,14%)'}
              fillOpacity={slot.brand ? 0.7 : 0.4}
              stroke={slot.brand ? 'hsl(38,92%,50%)' : colors.main}
              strokeWidth={0.8} strokeOpacity={0.6}
            />
            {slot.brand && (
              <>
                <text x={bx + 9} y={by + 7} textAnchor="middle" fontSize={4} fill="hsl(240,20%,3.9%)" fontFamily="JetBrains Mono" fontWeight={700}>
                  {slot.brand.slice(0, 6)}
                </text>
                <rect x={bx} y={by} width={18} height={10} rx={1} fill="hsl(38,92%,50%)" fillOpacity={0.1}>
                  <animate attributeName="fillOpacity" values="0.05;0.2;0.05" dur="2s" repeatCount="indefinite" />
                </rect>
              </>
            )}
          </g>
        );
      })}

      {/* Kiosk */}
      {buildingAds.filter(s => s.type === 'kiosk').map((slot, i) => {
        const kx = pos.x - bw - 12 + i * 8;
        const ky = pos.y + bh / 2 - 2;
        return (
          <g key={slot.id}>
            <rect x={kx} y={ky - 12} width={5} height={12} rx={0.5}
              fill={slot.brand ? 'hsl(38,92%,50%)' : 'hsl(240,16%,8%)'}
              fillOpacity={slot.brand ? 0.6 : 0.3}
              stroke={slot.brand ? 'hsl(38,92%,60%)' : 'hsl(240,14%,18%)'}
              strokeWidth={0.6}
            />
            {slot.brand && (
              <circle cx={kx + 2.5} cy={ky - 6} r={1.5} fill="hsl(38,92%,50%)" fillOpacity={0.8}>
                <animate attributeName="fillOpacity" values="0.5;1;0.5" dur="1.8s" repeatCount="indefinite" />
              </circle>
            )}
          </g>
        );
      })}

      {/* Bus stop */}
      {buildingAds.filter(s => s.type === 'bus_stop').map((slot, i) => {
        const sx = pos.x + (i % 2 === 0 ? -bw * 0.3 : bw * 0.3);
        const sy = pos.y + bh + 4 + i * 3;
        return (
          <g key={slot.id}>
            <line x1={sx} y1={sy} x2={sx} y2={sy - 8} stroke={slot.brand ? 'hsl(38,92%,50%)' : 'hsl(240,14%,18%)'} strokeWidth={1} strokeOpacity={0.7} />
            <rect x={sx - 4} y={sy - 8} width={8} height={5} rx={0.5}
              fill={slot.brand ? 'hsl(38,92%,50%)' : 'hsl(240,16%,8%)'}
              fillOpacity={slot.brand ? 0.5 : 0.2}
              stroke={slot.brand ? 'hsl(38,92%,55%)' : 'hsl(240,14%,15%)'}
              strokeWidth={0.5}
            />
            {slot.brand && (
              <text x={sx} y={sy - 4.5} textAnchor="middle" fontSize={3} fill="hsl(240,20%,3.9%)" fontFamily="JetBrains Mono" fontWeight={600}>
                {slot.brand.slice(0, 4)}
              </text>
            )}
          </g>
        );
      })}

      {/* Naming rights glow */}
      {buildingAds.filter(s => s.type === 'naming_rights' && s.brand).map(slot => (
        <g key={slot.id}>
          <text x={pos.x} y={topY - bh / 2 - 28} textAnchor="middle" fontSize={6} fill="hsl(38,92%,50%)" fontFamily="JetBrains Mono" fontWeight={700} opacity={0.9}>
            {slot.brand}
          </text>
          <text x={pos.x} y={topY - bh / 2 - 28} textAnchor="middle" fontSize={6} fill="hsl(38,92%,50%)" fontFamily="JetBrains Mono" fontWeight={700} filter="url(#glow-gold)">
            {slot.brand}
          </text>
        </g>
      ))}

      {/* Ad indicator dot for buildings with any ads */}
      {hasAds && !buildingAds.some(s => s.type === 'naming_rights' && s.brand) && (
        <circle cx={pos.x + bw - 2} cy={topY - bh / 2 - 6} r={3} fill="hsl(38,92%,50%)" fillOpacity={0.8}>
          <animate attributeName="r" values="2;4;2" dur="2s" repeatCount="indefinite" />
          <animate attributeName="fillOpacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Emoji */}
      <text x={pos.x} y={topY - bh / 2 - 16} textAnchor="middle" fontSize={b.heightLevel === 3 ? 20 : b.heightLevel === 2 ? 16 : 14}>
        {b.emoji}
      </text>

      {/* Name label */}
      <text x={pos.x} y={pos.y + bh + 16 + (buildingAds.some(s => s.type === 'bus_stop') ? 8 : 0)} textAnchor="middle" fontSize={7} fill={colors.main} fontFamily="JetBrains Mono" fontWeight={600} opacity={0.8}>
        {b.name}
      </text>
    </g>
  );
});
BuildingRenderer.displayName = 'BuildingRenderer';

// ===== AGENT RENDERER =====
const AgentRenderer: React.FC<{
  agent: Agent;
  index: number;
  building: Building | undefined;
  interactions: InteractionEvent[];
  onClick: () => void;
}> = React.memo(({ agent, index, building, interactions, onClick }) => {
  if (!building) return null;
  const pos = isoToScreen(building.gridX + building.width / 2, building.gridY + building.height / 2);
  const angle = (index / 8) * Math.PI * 2;
  const radius = 20 + (index % 3) * 8;
  const ox = Math.cos(angle) * radius;
  const oy = Math.sin(angle) * radius * 0.5;

  const ax = pos.x + ox;
  const ay = pos.y - 10 + oy;

  const agentInteractions = interactions.filter(e => e.agentId === agent.id);
  const avgAffinity = agent.brandAffinities.reduce((s, a) => s + a.score, 0) / Math.max(1, agent.brandAffinities.length);

  // Halo color based on affinity
  const haloColor = avgAffinity > 30 ? 'hsl(38,92%,50%)' : avgAffinity > 0 ? 'hsl(152,76%,44%)' : avgAffinity > -30 ? 'hsl(270,60%,55%)' : 'hsl(0,72%,50%)';
  const haloOpacity = Math.min(0.6, Math.abs(avgAffinity) / 100);

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      {/* Synapse lines to building center (when interacting with ads) */}
      {agentInteractions.map(event => {
        const targetBuilding = building;
        if (!targetBuilding) return null;
        const bPos = isoToScreen(targetBuilding.gridX + targetBuilding.width / 2, targetBuilding.gridY + targetBuilding.height / 2);
        const lineColor = event.affinity > 0 ? 'hsl(38,92%,50%)' : 'hsl(0,72%,50%)';
        const age = (Date.now() - event.timestamp) / 5000;
        return (
          <line key={event.id}
            x1={ax} y1={ay} x2={bPos.x} y2={bPos.y - 20}
            stroke={lineColor} strokeWidth={0.8} strokeOpacity={Math.max(0, 0.6 - age)}
            strokeDasharray="3 4"
          >
            <animate attributeName="strokeDashoffset" from="0" to="-14" dur="0.8s" repeatCount="indefinite" />
          </line>
        );
      })}

      {/* Affinity halo */}
      <circle cx={ax} cy={ay} r={12} fill="none" stroke={haloColor} strokeWidth={1.5} strokeOpacity={haloOpacity}>
        <animate attributeName="r" values="10;14;10" dur="3s" repeatCount="indefinite" />
        <animate attributeName="strokeOpacity" values={`${haloOpacity * 0.5};${haloOpacity};${haloOpacity * 0.5}`} dur="3s" repeatCount="indefinite" />
      </circle>

      {/* Agent body */}
      <circle cx={ax} cy={ay} r={9} fill="hsl(240,16%,6%)" stroke={haloColor} strokeWidth={1.2} strokeOpacity={0.7} />

      {/* Agent emoji */}
      <text x={ax} y={ay + 4} textAnchor="middle" fontSize={11}>
        {agent.avatar}
      </text>

      {/* Mood indicator */}
      <text x={ax + 8} y={ay - 6} fontSize={6} opacity={0.7}>
        {agent.mood === 'happy' && '😊'}
        {agent.mood === 'curious' && '🤔'}
        {agent.mood === 'critical' && '😤'}
        {agent.mood === 'neutral' && '😐'}
        {agent.mood === 'excited' && '🤩'}
      </text>

      {/* Name */}
      <text x={ax} y={ay + 16} textAnchor="middle" fontSize={5.5} fill="hsl(210,20%,80%)" fontFamily="JetBrains Mono" fontWeight={500} opacity={0.7}>
        {agent.name}
      </text>
    </g>
  );
});
AgentRenderer.displayName = 'AgentRenderer';

// ===== MAIN MAP =====
export const IsometricMap: React.FC<Props> = ({ buildings, agents, adSlots, interactions, onBuildingClick, onAgentClick }) => {
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

  const sortedBuildings = useMemo(() =>
    [...buildings].sort((a, b) => (a.gridX + a.gridY) - (b.gridX + b.gridY)),
    [buildings]
  );

  return (
    <div className="w-full h-full overflow-hidden bg-background relative" style={{ cursor: dragging ? 'grabbing' : 'grab' }}>
      {/* Ambient gradient overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 40%, hsla(152,76%,44%,0.03) 0%, transparent 60%), radial-gradient(ellipse at 50% 50%, hsla(270,60%,55%,0.02) 0%, transparent 50%)',
      }} />

      <svg
        width="100%" height="100%"
        viewBox="0 0 1200 700"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
      >
        <defs>
          {/* Glow filters */}
          <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-gold" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-purple" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          {/* Vignette */}
          <radialGradient id="vignette" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="85%" stopColor="transparent" />
            <stop offset="100%" stopColor="hsl(240,20%,3.9%)" stopOpacity="0.8" />
          </radialGradient>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Ground */}
          <GroundLayer />

          {/* Roads */}
          <RoadLayer />

          {/* Buildings (sorted by depth) */}
          {sortedBuildings.map(b => (
            <BuildingRenderer key={b.id} b={b} adSlots={adSlots} onClick={() => onBuildingClick(b)} />
          ))}

          {/* Agents */}
          {agents.map((agent, i) => (
            <AgentRenderer
              key={agent.id}
              agent={agent}
              index={i}
              building={buildings.find(b => b.id === agent.currentBuildingId)}
              interactions={interactions}
              onClick={() => onAgentClick(agent)}
            />
          ))}
        </g>

        {/* Vignette overlay */}
        <rect width="1200" height="700" fill="url(#vignette)" pointerEvents="none" />
      </svg>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1">
        <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="w-8 h-8 rounded bg-surface-elevated border border-border flex items-center justify-center text-foreground hover:border-primary transition-colors text-sm font-mono">+</button>
        <button onClick={() => setZoom(z => Math.max(0.3, z - 0.2))} className="w-8 h-8 rounded bg-surface-elevated border border-border flex items-center justify-center text-foreground hover:border-primary transition-colors text-sm font-mono">−</button>
      </div>

      {/* Legend */}
      <div className="absolute top-3 left-3 bg-card/80 backdrop-blur-sm rounded-md border border-border px-3 py-2 text-xs font-mono space-y-1">
        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary" /> 건물</div>
        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-accent" /> 광고 슬롯</div>
        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-secondary" /> 에이전트</div>
      </div>
    </div>
  );
};
