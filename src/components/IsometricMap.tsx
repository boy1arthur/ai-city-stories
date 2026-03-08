import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import type { Building, Agent, AdSlot, InteractionEvent, Zone } from '@/data/world';
import { getTileTypeFromMap, isRoadCenterInZone, getZonePalette } from '@/data/world';
import type { SpeechBubble, AdReaction, AgentVisualState } from '@/hooks/useWorldSimulation';

// Isometric constants - 2:1 diamond ratio
const TILE_W = 48;
const TILE_H = 24;
const WALL_H_UNIT = 16;
const MOVE_DURATION = 1200; // ms for agent travel animation

function iso(gx: number, gy: number): { x: number; y: number } {
  return {
    x: (gx - gy) * (TILE_W / 2) + 500,
    y: (gx + gy) * (TILE_H / 2) + 40,
  };
}

function diamond(cx: number, cy: number): string {
  return `${cx},${cy - TILE_H / 2} ${cx + TILE_W / 2},${cy} ${cx},${cy + TILE_H / 2} ${cx - TILE_W / 2},${cy}`;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(1, Math.max(0, t));
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

interface Props {
  zone: Zone;
  buildings: Building[];
  agents: Agent[];
  adSlots: AdSlot[];
  interactions: InteractionEvent[];
  speechBubbles: SpeechBubble[];
  adReactions: AdReaction[];
  agentVisuals: Map<string, AgentVisualState>;
  onBuildingClick: (b: Building) => void;
  onAgentClick: (a: Agent) => void;
}

// ===== GROUND LAYER =====
const GroundLayer: React.FC<{ zone: Zone }> = React.memo(({ zone }) => {
  const tiles: React.ReactNode[] = [];
  const GRID = zone.gridSize;
  const palette = getZonePalette(zone.id);

  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      const type = getTileTypeFromMap(zone.tileMap, gx, gy, GRID);
      const colors = palette[type];
      const pos = iso(gx, gy);

      tiles.push(
        <polygon key={`t_${gx}_${gy}`} points={diamond(pos.x, pos.y)}
          fill={colors.fill} stroke={colors.stroke} strokeWidth={0.5} strokeOpacity={0.4} />
      );

      if (isRoadCenterInZone(zone.tileMap, gx, gy, GRID)) {
        const isVert = (gx === 7 || gx === 13);
        tiles.push(
          <line key={`rm_${gx}_${gy}`}
            x1={isVert ? pos.x : pos.x - 6} y1={isVert ? pos.y - 3 : pos.y}
            x2={isVert ? pos.x : pos.x + 6} y2={isVert ? pos.y + 3 : pos.y}
            stroke="hsl(45,80%,75%)" strokeWidth={0.8} strokeOpacity={0.4} strokeDasharray="2 3" />
        );
      }

      if (type === 'grass' && ((gx * 7 + gy * 13) % 5 === 0)) {
        const ox = ((gx * 3 + gy * 7) % 11 - 5) * 1.2;
        const oy = ((gx * 5 + gy * 3) % 7 - 3) * 0.8;
        tiles.push(<circle key={`gd_${gx}_${gy}`} cx={pos.x + ox} cy={pos.y + oy} r={1.2} fill="hsl(125,25%,38%)" opacity={0.5} />);
      }

      if (type === 'park' && ((gx + gy) % 3 === 0)) {
        tiles.push(
          <g key={`tree_${gx}_${gy}`}>
            <line x1={pos.x} y1={pos.y} x2={pos.x} y2={pos.y - 10} stroke="hsl(25,30%,30%)" strokeWidth={1.5} />
            <circle cx={pos.x} cy={pos.y - 12} r={5} fill="hsl(130,30%,38%)" opacity={0.85} />
            <circle cx={pos.x - 2} cy={pos.y - 14} r={3.5} fill="hsl(135,35%,42%)" opacity={0.75} />
          </g>
        );
      }

      if (type === 'water') {
        tiles.push(
          <line key={`ws_${gx}_${gy}`} x1={pos.x - 6} y1={pos.y} x2={pos.x + 6} y2={pos.y}
            stroke="hsl(200,50%,55%)" strokeWidth={0.5} strokeOpacity={0.4}>
            <animate attributeName="strokeOpacity" values="0.2;0.5;0.2" dur="3s" repeatCount="indefinite" />
          </line>
        );
      }

      if (type === 'plaza_stone' && (gx + gy) % 2 === 0) {
        tiles.push(<polygon key={`pd_${gx}_${gy}`} points={diamond(pos.x, pos.y)} fill="hsl(35,15%,52%)" fillOpacity={0.2} stroke="none" />);
      }
    }
  }
  return <g>{tiles}</g>;
});
GroundLayer.displayName = 'GroundLayer';

// ===== BUILDING RENDERER (unchanged logic, keeping concise) =====
const BuildingRenderer: React.FC<{
  b: Building; adSlots: AdSlot[]; onClick: () => void;
}> = React.memo(({ b, adSlots, onClick }) => {
  const buildingAds = adSlots.filter(s => s.buildingId === b.id);
  const wallWrapAd = buildingAds.find(s => s.type === 'wall_wrap' && s.brand);
  const namingAd = buildingAds.find(s => s.type === 'naming_rights' && s.brand);
  const wallHeight = WALL_H_UNIT * b.heightLevel;
  const nw = iso(b.gridX, b.gridY);
  const ne = iso(b.gridX + b.width, b.gridY);
  const se = iso(b.gridX + b.width, b.gridY + b.height);
  const sw = iso(b.gridX, b.gridY + b.height);
  const wColor = wallWrapAd ? 'hsl(38,50%,45%)' : b.wallColor;
  const wColorDark = b.wallColor.replace(/(\d+)%\)$/, (_, n) => `${Math.max(0, parseInt(n) - 6)}%)`);
  const rColor = b.roofColor;
  const center = iso(b.gridX + b.width / 2, b.gridY + b.height / 2);
  const displayName = namingAd ? `${namingAd.brand} ${b.name}` : b.name;

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      {/* Floor shadow */}
      <polygon points={`${nw.x},${nw.y + 3} ${ne.x},${ne.y + 3} ${se.x},${se.y + 3} ${sw.x},${sw.y + 3}`}
        fill="hsl(0,0%,0%)" fillOpacity={0.15} stroke="none" />

      {/* South wall */}
      <polygon points={`${se.x},${se.y} ${sw.x},${sw.y} ${sw.x},${sw.y - wallHeight} ${se.x},${se.y - wallHeight}`}
        fill={wColor} fillOpacity={0.85} stroke={wColorDark} strokeWidth={0.6} />
      {[...Array(b.width)].map((_, wi) => {
        const t = (wi + 0.5) / b.width;
        const wx = sw.x + (se.x - sw.x) * t;
        const wy = sw.y + (se.y - sw.y) * t;
        return [...Array(b.heightLevel)].map((_, hi) => {
          const winY = wy - wallHeight + (wallHeight / (b.heightLevel + 1)) * (hi + 1);
          return <rect key={`sw_${wi}_${hi}`} x={wx - 3} y={winY - 2.5} width={6} height={4} rx={0.5}
            fill="hsl(200,25%,60%)" fillOpacity={0.35} stroke="hsl(210,15%,55%)" strokeWidth={0.3} />;
        });
      })}

      {/* Wall wrap */}
      {wallWrapAd && (
        <>
          <polygon points={`${se.x},${se.y} ${sw.x},${sw.y} ${sw.x},${sw.y - wallHeight} ${se.x},${se.y - wallHeight}`}
            fill="hsl(38,75%,50%)" fillOpacity={0.1} />
          <text x={(sw.x + se.x) / 2} y={(sw.y + se.y) / 2 - wallHeight / 2}
            textAnchor="middle" fontSize={7} fill="hsl(38,75%,50%)" fontFamily="Inter" fontWeight={700} opacity={0.6}>
            {wallWrapAd.brand}
          </text>
        </>
      )}

      {/* East wall */}
      <polygon points={`${ne.x},${ne.y} ${se.x},${se.y} ${se.x},${se.y - wallHeight} ${ne.x},${ne.y - wallHeight}`}
        fill={wColorDark} fillOpacity={0.75} stroke={wColorDark} strokeWidth={0.6} />
      {[...Array(b.height)].map((_, wi) => {
        const t = (wi + 0.5) / b.height;
        const wx = ne.x + (se.x - ne.x) * t;
        const wy = ne.y + (se.y - ne.y) * t;
        return [...Array(b.heightLevel)].map((_, hi) => {
          const winY = wy - wallHeight + (wallHeight / (b.heightLevel + 1)) * (hi + 1);
          return <rect key={`ew_${wi}_${hi}`} x={wx - 2.5} y={winY - 2.5} width={5} height={4} rx={0.5}
            fill="hsl(200,20%,55%)" fillOpacity={0.3} stroke="hsl(210,12%,50%)" strokeWidth={0.3} />;
        });
      })}

      {/* Roof */}
      <polygon points={`${nw.x},${nw.y - wallHeight} ${ne.x},${ne.y - wallHeight} ${se.x},${se.y - wallHeight} ${sw.x},${sw.y - wallHeight}`}
        fill={rColor} fillOpacity={0.75} stroke={wColorDark} strokeWidth={0.8} strokeOpacity={0.5} />

      {/* Roof shapes */}
      {b.roofShape === 'gabled' && (
        <polygon points={`${(nw.x + sw.x) / 2},${(nw.y + sw.y) / 2 - wallHeight - 8} ${nw.x},${nw.y - wallHeight} ${sw.x},${sw.y - wallHeight}`}
          fill={rColor} fillOpacity={0.5} stroke={wColorDark} strokeWidth={0.6} />
      )}
      {b.roofShape === 'hip' && (
        <>
          <polygon points={`${center.x},${center.y - wallHeight - 6} ${nw.x},${nw.y - wallHeight} ${ne.x},${ne.y - wallHeight}`}
            fill={rColor} fillOpacity={0.45} stroke={wColorDark} strokeWidth={0.5} />
          <polygon points={`${center.x},${center.y - wallHeight - 6} ${sw.x},${sw.y - wallHeight} ${nw.x},${nw.y - wallHeight}`}
            fill={rColor} fillOpacity={0.55} stroke={wColorDark} strokeWidth={0.5} />
        </>
      )}
      {b.roofShape === 'antenna' && (
        <g>
          <line x1={center.x} y1={center.y - wallHeight} x2={center.x} y2={center.y - wallHeight - 18}
            stroke="hsl(215,8%,55%)" strokeWidth={1.2} />
          <circle cx={center.x} cy={center.y - wallHeight - 20} r={1.5} fill="hsl(0,60%,50%)" opacity={0.7}>
            <animate attributeName="opacity" values="0.4;0.9;0.4" dur="2s" repeatCount="indefinite" />
          </circle>
        </g>
      )}
      {b.roofShape === 'dome' && (
        <ellipse cx={center.x} cy={center.y - wallHeight - 3}
          rx={Math.min(b.width, b.height) * TILE_W * 0.13} ry={Math.min(b.width, b.height) * TILE_H * 0.13 + 4}
          fill={rColor} fillOpacity={0.5} stroke={wColorDark} strokeWidth={0.6} />
      )}
      {b.roofShape === 'garden' && (
        <g>{[...Array(3)].map((_, i) => (
          <circle key={i} cx={center.x + (i - 1) * 10} cy={center.y - wallHeight - 3} r={4} fill="hsl(130,28%,40%)" fillOpacity={0.7} />
        ))}</g>
      )}
      {b.roofShape === 'gear' && (
        <circle cx={center.x} cy={center.y - wallHeight - 3} r={5}
          fill="none" stroke="hsl(215,8%,50%)" strokeWidth={1.2} strokeOpacity={0.5} strokeDasharray="3 2">
          <animateTransform attributeName="transform" type="rotate" from={`0 ${center.x} ${center.y - wallHeight - 3}`} to={`360 ${center.x} ${center.y - wallHeight - 3}`} dur="20s" repeatCount="indefinite" />
        </circle>
      )}
      {b.roofShape === 'lantern' && (
        <circle cx={center.x} cy={center.y - wallHeight - 4} r={2.5} fill="hsl(40,70%,55%)" fillOpacity={0.4}>
          <animate attributeName="fillOpacity" values="0.25;0.55;0.25" dur="2.5s" repeatCount="indefinite" />
        </circle>
      )}
      {b.roofShape === 'telescope' && (
        <g>
          <line x1={center.x - 5} y1={center.y - wallHeight} x2={center.x + 3} y2={center.y - wallHeight - 12}
            stroke="hsl(215,10%,50%)" strokeWidth={1.8} strokeLinecap="round" />
          <circle cx={center.x + 4} cy={center.y - wallHeight - 13} r={2} fill="hsl(200,20%,55%)" fillOpacity={0.5} />
        </g>
      )}

      {/* === AD VISUALS === */}
      {buildingAds.filter(s => s.type === 'billboard').map((slot, i) => {
        const signPos = iso(b.gridX + b.width + 0.5, b.gridY + i * 1.2);
        const has = !!slot.brand;
        return (
          <g key={slot.id}>
            <line x1={signPos.x} y1={signPos.y} x2={signPos.x} y2={signPos.y - 20} stroke="hsl(215,6%,40%)" strokeWidth={1.5} />
            <rect x={signPos.x - 10} y={signPos.y - 28} width={20} height={10} rx={1}
              fill={has ? 'hsl(0,0%,92%)' : 'hsl(215,5%,35%)'} fillOpacity={has ? 0.9 : 0.5}
              stroke={has ? 'hsl(38,75%,50%)' : 'hsl(215,5%,40%)'} strokeWidth={has ? 1.2 : 0.6} />
            <text x={signPos.x} y={signPos.y - 21.5} textAnchor="middle" fontSize={has ? 5 : 3.5}
              fill={has ? 'hsl(220,18%,15%)' : 'hsl(215,8%,50%)'} fontFamily="Inter" fontWeight={has ? 700 : 400}>
              {has ? slot.brand!.slice(0, 7) : 'AD SPACE'}
            </text>
          </g>
        );
      })}
      {buildingAds.filter(s => s.type === 'kiosk').map((slot, i) => {
        const kPos = iso(b.gridX - 0.5, b.gridY + b.height - 1 + i);
        const has = !!slot.brand;
        return (
          <g key={slot.id}>
            <rect x={kPos.x - 3} y={kPos.y - 14} width={6} height={14} rx={1}
              fill={has ? 'hsl(215,8%,42%)' : 'hsl(215,5%,30%)'} stroke={has ? 'hsl(215,10%,50%)' : 'hsl(215,5%,35%)'} strokeWidth={0.5} />
            <rect x={kPos.x - 2} y={kPos.y - 12} width={4} height={6} rx={0.5}
              fill={has ? 'hsl(38,75%,50%)' : 'hsl(210,10%,35%)'} fillOpacity={has ? 0.5 : 0.3} />
          </g>
        );
      })}
      {buildingAds.filter(s => s.type === 'bus_stop').map((slot, i) => {
        const bsPos = iso(b.gridX + i, b.gridY + b.height + 0.5);
        const has = !!slot.brand;
        return (
          <g key={slot.id}>
            <rect x={bsPos.x - 8} y={bsPos.y - 12} width={16} height={2} rx={0.5} fill="hsl(215,6%,45%)" fillOpacity={0.6} />
            <line x1={bsPos.x - 7} y1={bsPos.y - 10} x2={bsPos.x - 7} y2={bsPos.y} stroke="hsl(215,5%,40%)" strokeWidth={0.8} />
            <line x1={bsPos.x + 7} y1={bsPos.y - 10} x2={bsPos.x + 7} y2={bsPos.y} stroke="hsl(215,5%,40%)" strokeWidth={0.8} />
            <rect x={bsPos.x - 5} y={bsPos.y - 10} width={10} height={8} rx={0.5}
              fill={has ? 'hsl(0,0%,90%)' : 'hsl(200,10%,45%)'} fillOpacity={has ? 0.8 : 0.25}
              stroke={has ? 'hsl(38,75%,50%)' : 'hsl(210,8%,45%)'} strokeWidth={has ? 0.8 : 0.4} />
            <text x={bsPos.x} y={bsPos.y - 5} textAnchor="middle" fontSize={has ? 3.5 : 2.5}
              fill={has ? 'hsl(220,18%,15%)' : 'hsl(215,8%,50%)'} fontFamily="Inter" fontWeight={has ? 600 : 400}>
              {has ? slot.brand!.slice(0, 5) : 'BUS'}
            </text>
            <rect x={bsPos.x - 5} y={bsPos.y - 1} width={10} height={2} rx={0.5} fill="hsl(25,20%,35%)" fillOpacity={0.6} />
          </g>
        );
      })}
      {buildingAds.filter(s => s.type === 'naming_rights').map(slot => (
        <g key={slot.id}>
          {slot.brand ? (
            <>
              <rect x={center.x - 20} y={center.y - wallHeight - 18} width={40} height={10} rx={1.5}
                fill="hsl(0,0%,95%)" fillOpacity={0.85} stroke="hsl(38,75%,50%)" strokeWidth={0.8} />
              <text x={center.x} y={center.y - wallHeight - 11.5} textAnchor="middle" fontSize={6}
                fill="hsl(220,18%,15%)" fontFamily="Inter" fontWeight={800}>{slot.brand}</text>
            </>
          ) : (
            <text x={center.x} y={center.y - wallHeight - 12} textAnchor="middle" fontSize={4}
              fill="hsl(215,8%,50%)" fontFamily="Inter" opacity={0.5}>NAMING AVAILABLE</text>
          )}
        </g>
      ))}

      {/* Building label */}
      <text x={center.x} y={center.y - wallHeight - 4} textAnchor="middle" fontSize={12}>{b.emoji}</text>
      <text x={center.x} y={se.y + 10} textAnchor="middle" fontSize={6}
        fill="hsl(210,15%,75%)" fontFamily="Inter" fontWeight={600} opacity={0.8}>{displayName}</text>
    </g>
  );
});
BuildingRenderer.displayName = 'BuildingRenderer';

// ===== ANIMATED AGENT =====
const AgentRenderer: React.FC<{
  agent: Agent;
  index: number;
  building: Building | undefined;
  interactions: InteractionEvent[];
  allBuildings: Building[];
  speechBubbles: SpeechBubble[];
  adReactions: AdReaction[];
  visualState: AgentVisualState | undefined;
  onClick: () => void;
}> = React.memo(({ agent, index, building, interactions, allBuildings, speechBubbles, adReactions, visualState, onClick }) => {
  // Hooks must be before any early return
  const [animPos, setAnimPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!building) return;

    if (!visualState || !visualState.isMoving) {
      const side = index % 4;
      const jitter = ((index * 7 + 3) % 5) * 0.3;
      let gx: number, gy: number;
      switch (side) {
        case 0: gx = building.gridX + (index % building.width) + jitter; gy = building.gridY - 0.6; break;
        case 1: gx = building.gridX + building.width + 0.4; gy = building.gridY + (index % building.height) + jitter; break;
        case 2: gx = building.gridX + (index % building.width) + jitter; gy = building.gridY + building.height + 0.4; break;
        default: gx = building.gridX - 0.6; gy = building.gridY + (index % building.height) + jitter; break;
      }
      setAnimPos(iso(gx, gy));
      return;
    }

    let raf: number;
    const animate = () => {
      const elapsed = Date.now() - visualState.moveStartTime;
      const t = easeInOutQuad(Math.min(1, elapsed / MOVE_DURATION));
      const gx = lerp(visualState.fromX, visualState.toX, t);
      const gy = lerp(visualState.fromY, visualState.toY, t);
      setAnimPos(iso(gx, gy));
      if (t < 1) {
        raf = requestAnimationFrame(animate);
      }
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [visualState, building, index]);

  if (!building || !animPos) return null;
  const pos = animPos;

  const avgAffinity = agent.brandAffinities.reduce((s, a) => s + a.score, 0) / Math.max(1, agent.brandAffinities.length);
  const moodColor = agent.mood === 'happy' ? 'hsl(145,40%,50%)'
    : agent.mood === 'excited' ? 'hsl(38,65%,55%)'
      : agent.mood === 'critical' ? 'hsl(0,50%,50%)'
        : agent.mood === 'curious' ? 'hsl(210,50%,55%)'
          : 'hsl(215,10%,55%)';

  const isMoving = visualState?.isMoving ?? false;
  const agentBubbles = speechBubbles.filter(b => b.agentId === agent.id);
  const agentReactions = adReactions.filter(r => r.agentId === agent.id);
  const agentInteractions = interactions.filter(e => e.agentId === agent.id);

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      {/* Interaction lines to buildings */}
      {agentInteractions.map(event => {
        const targetB = allBuildings.find(b => b.id === event.buildingId);
        if (!targetB) return null;
        const tPos = iso(targetB.gridX + targetB.width / 2, targetB.gridY + targetB.height / 2);
        const age = (Date.now() - event.timestamp) / 5000;
        return (
          <line key={event.id} x1={pos.x} y1={pos.y - 5} x2={tPos.x} y2={tPos.y - 15}
            stroke="hsl(38,60%,55%)" strokeWidth={0.6} strokeOpacity={Math.max(0, 0.3 - age * 0.3)}
            strokeDasharray="3 4">
            <animate attributeName="strokeDashoffset" from="0" to="-14" dur="1s" repeatCount="indefinite" />
          </line>
        );
      })}

      {/* Shadow - bounces when moving */}
      <ellipse cx={pos.x} cy={pos.y + 2} rx={isMoving ? 4 : 5} ry={isMoving ? 1.5 : 2.5}
        fill="hsl(0,0%,0%)" fillOpacity={isMoving ? 0.15 : 0.25} />

      {/* Agent body circle */}
      <circle cx={pos.x} cy={pos.y - 8} r={5.5}
        fill="hsl(0,0%,95%)" fillOpacity={0.92}
        stroke={moodColor} strokeWidth={1.5}>
        {/* Idle breathing animation */}
        {!isMoving && (
          <animate attributeName="r" values="5.5;6;5.5" dur="3s" repeatCount="indefinite" />
        )}
      </circle>

      {/* Avatar emoji */}
      <text x={pos.x} y={pos.y - 5.5} textAnchor="middle" fontSize={7}>
        {agent.avatar}
      </text>

      {/* Mood indicator dot */}
      <circle cx={pos.x + 4.5} cy={pos.y - 12} r={2} fill={moodColor} stroke="hsl(0,0%,95%)" strokeWidth={0.8} />

      {/* Walking indicator - footstep dots */}
      {isMoving && (
        <g opacity={0.5}>
          <circle cx={pos.x - 3} cy={pos.y + 1} r={1} fill={moodColor}>
            <animate attributeName="opacity" values="0.5;0;0.5" dur="0.4s" repeatCount="indefinite" />
          </circle>
          <circle cx={pos.x + 3} cy={pos.y + 1} r={1} fill={moodColor}>
            <animate attributeName="opacity" values="0;0.5;0" dur="0.4s" repeatCount="indefinite" />
          </circle>
        </g>
      )}

      {/* Brand affinity halo */}
      {avgAffinity > 30 && !isMoving && (
        <circle cx={pos.x} cy={pos.y - 8} r={8} fill="none" stroke="hsl(38,60%,55%)" strokeWidth={0.8} strokeOpacity={0.3}>
          <animate attributeName="r" values="7;9;7" dur="4s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Name label */}
      <rect x={pos.x - 14} y={pos.y + 4} width={28} height={9} rx={2}
        fill="hsl(220,18%,8%)" fillOpacity={0.8} />
      <text x={pos.x} y={pos.y + 11} textAnchor="middle" fontSize={5}
        fill="hsl(0,0%,90%)" fontFamily="Inter" fontWeight={600}>
        {agent.name}
      </text>

      {/* === SPEECH BUBBLES === */}
      {agentBubbles.map((bubble, bi) => {
        const age = (Date.now() - bubble.timestamp) / 4000;
        const opacity = age < 0 ? 0 : Math.max(0, 1 - age);
        const yOff = -22 - bi * 16;
        const bgColor = bubble.type === 'dialogue' ? 'hsl(0,0%,98%)' : 'hsl(220,15%,88%)';
        const textColor = bubble.type === 'dialogue' ? 'hsl(220,18%,15%)' : 'hsl(220,12%,30%)';
        const maxLen = 12;
        const displayText = bubble.text.length > maxLen ? bubble.text.slice(0, maxLen) + '…' : bubble.text;
        const boxW = Math.max(30, displayText.length * 4.5 + 10);

        return (
          <g key={bubble.id} opacity={opacity}>
            {/* Bubble body */}
            <rect x={pos.x - boxW / 2} y={pos.y + yOff - 8} width={boxW} height={13} rx={3}
              fill={bgColor} fillOpacity={0.92}
              stroke={bubble.type === 'dialogue' ? 'hsl(38,60%,55%)' : 'hsl(220,10%,70%)'} strokeWidth={0.6} />
            {/* Tail */}
            <polygon points={`${pos.x - 3},${pos.y + yOff + 5} ${pos.x + 3},${pos.y + yOff + 5} ${pos.x},${pos.y + yOff + 9}`}
              fill={bgColor} fillOpacity={0.92} />
            {/* Text */}
            <text x={pos.x} y={pos.y + yOff + 0.5} textAnchor="middle" fontSize={5}
              fill={textColor} fontFamily="Inter" fontWeight={500}>
              {bubble.emoji && <tspan>{bubble.emoji} </tspan>}{displayText}
            </text>
          </g>
        );
      })}

      {/* === AD REACTION PARTICLES === */}
      {agentReactions.map((reaction) => {
        const age = (Date.now() - reaction.timestamp) / 3000;
        if (age < 0) return null;
        const floatY = -20 - age * 30;
        const floatX = (reaction.id.charCodeAt(reaction.id.length - 1) % 2 === 0 ? 1 : -1) * age * 8;
        const opacity = Math.max(0, 1 - age);
        return (
          <text key={reaction.id} x={pos.x + floatX} y={pos.y + floatY}
            textAnchor="middle" fontSize={10 + age * 3} opacity={opacity}>
            {reaction.emoji}
          </text>
        );
      })}
    </g>
  );
});
AgentRenderer.displayName = 'AgentRenderer';

// ===== MAIN MAP =====
export const IsometricMap: React.FC<Props> = ({
  zone, buildings, agents, adSlots, interactions,
  speechBubbles, adReactions, agentVisuals,
  onBuildingClick, onAgentClick,
}) => {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.85);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // Force re-render for animations
  const [, setFrame] = useState(0);
  useEffect(() => {
    let raf: number;
    const tick = () => {
      setFrame(f => f + 1);
      raf = requestAnimationFrame(tick);
    };
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
    setZoom(z => Math.max(0.25, Math.min(3, z - e.deltaY * 0.001)));
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

  return (
    <div className="w-full h-full overflow-hidden bg-background relative" style={{ cursor: dragging ? 'grabbing' : 'grab' }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 40%, hsla(210,20%,20%,0.3) 0%, transparent 60%)',
      }} />

      <svg width="100%" height="100%" viewBox="0 0 1000 600"
        onMouseDown={onMouseDown} onMouseMove={onMouseMove}
        onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
        onWheel={onWheel}>
        <defs>
          <radialGradient id="vignette" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="75%" stopColor="transparent" />
            <stop offset="100%" stopColor="hsl(220,18%,8%)" stopOpacity="0.6" />
          </radialGradient>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          <GroundLayer zone={zone} />

          {sortedBuildings.map(b => (
            <BuildingRenderer key={b.id} b={b} adSlots={adSlots} onClick={() => onBuildingClick(b)} />
          ))}

          {sortedAgents.map(({ agent, index }) => (
            <AgentRenderer key={agent.id} agent={agent} index={index}
              building={buildings.find(bld => bld.id === agent.currentBuildingId)}
              interactions={interactions} allBuildings={buildings}
              speechBubbles={speechBubbles} adReactions={adReactions}
              visualState={agentVisuals.get(agent.id)}
              onClick={() => onAgentClick(agent)} />
          ))}
        </g>

        <rect width="1000" height="600" fill="url(#vignette)" pointerEvents="none" />
      </svg>

      {/* Zoom */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1">
        <button onClick={() => setZoom(z => Math.min(3, z + 0.15))} className="w-8 h-8 rounded bg-surface-elevated border border-border flex items-center justify-center text-foreground hover:border-primary transition-colors text-sm">+</button>
        <button onClick={() => setZoom(z => Math.max(0.25, z - 0.15))} className="w-8 h-8 rounded bg-surface-elevated border border-border flex items-center justify-center text-foreground hover:border-primary transition-colors text-sm">−</button>
      </div>

      {/* Legend */}
      <div className="absolute top-3 left-3 bg-card/90 backdrop-blur-sm rounded-lg border border-border px-3 py-2 text-xs space-y-1">
        <div className="text-muted-foreground font-semibold mb-1.5 font-mono text-[10px] uppercase tracking-wider">Map Legend</div>
        <div className="flex items-center gap-2"><span className="w-3 h-1.5 rounded-sm" style={{ background: 'hsl(220,6%,28%)' }} /> <span className="text-muted-foreground">도로</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-1.5 rounded-sm" style={{ background: 'hsl(35,12%,48%)' }} /> <span className="text-muted-foreground">광장</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-1.5 rounded-sm" style={{ background: 'hsl(120,22%,32%)' }} /> <span className="text-muted-foreground">초지</span></div>
        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: 'hsl(38,75%,50%)' }} /> <span className="text-muted-foreground">광고</span></div>
      </div>
    </div>
  );
};
