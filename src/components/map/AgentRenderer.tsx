import React, { useState, useEffect } from 'react';
import type { Building, Agent, InteractionEvent } from '@/data/world';
import type { SpeechBubble, AdReaction, AgentVisualState } from '@/hooks/useWorldSimulation';
import { iso, lerp, easeInOutQuad, MOVE_DURATION } from './constants';

interface Props {
  agent: Agent;
  index: number;
  building: Building | undefined;
  interactions: InteractionEvent[];
  allBuildings: Building[];
  speechBubbles: SpeechBubble[];
  adReactions: AdReaction[];
  visualState: AgentVisualState | undefined;
  onClick: () => void;
}

export const AgentRenderer: React.FC<Props> = React.memo(({
  agent, index, building, interactions, allBuildings,
  speechBubbles, adReactions, visualState, onClick,
}) => {
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
      if (t < 1) raf = requestAnimationFrame(animate);
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
      {/* Interaction lines */}
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

      {/* Shadow */}
      <ellipse cx={pos.x} cy={pos.y + 2} rx={isMoving ? 4 : 5} ry={isMoving ? 1.5 : 2.5}
        fill="hsl(0,0%,0%)" fillOpacity={isMoving ? 0.15 : 0.25} />

      {/* Body */}
      <circle cx={pos.x} cy={pos.y - 8} r={5.5}
        fill="hsl(0,0%,95%)" fillOpacity={0.92}
        stroke={moodColor} strokeWidth={1.5}>
        {!isMoving && <animate attributeName="r" values="5.5;6;5.5" dur="3s" repeatCount="indefinite" />}
      </circle>

      {/* Avatar */}
      <text x={pos.x} y={pos.y - 5.5} textAnchor="middle" fontSize={7}>{agent.avatar}</text>

      {/* Mood dot */}
      <circle cx={pos.x + 4.5} cy={pos.y - 12} r={2} fill={moodColor} stroke="hsl(0,0%,95%)" strokeWidth={0.8} />

      {/* Walking footsteps */}
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

      {/* Affinity halo */}
      {avgAffinity > 30 && !isMoving && (
        <circle cx={pos.x} cy={pos.y - 8} r={8} fill="none" stroke="hsl(38,60%,55%)" strokeWidth={0.8} strokeOpacity={0.3}>
          <animate attributeName="r" values="7;9;7" dur="4s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Name */}
      <rect x={pos.x - 14} y={pos.y + 4} width={28} height={9} rx={2}
        fill="hsl(220,18%,8%)" fillOpacity={0.8} />
      <text x={pos.x} y={pos.y + 11} textAnchor="middle" fontSize={5}
        fill="hsl(0,0%,90%)" fontFamily="Inter" fontWeight={600}>{agent.name}</text>

      {/* Speech bubbles */}
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
            <rect x={pos.x - boxW / 2} y={pos.y + yOff - 8} width={boxW} height={13} rx={3}
              fill={bgColor} fillOpacity={0.92}
              stroke={bubble.type === 'dialogue' ? 'hsl(38,60%,55%)' : 'hsl(220,10%,70%)'} strokeWidth={0.6} />
            <polygon points={`${pos.x - 3},${pos.y + yOff + 5} ${pos.x + 3},${pos.y + yOff + 5} ${pos.x},${pos.y + yOff + 9}`}
              fill={bgColor} fillOpacity={0.92} />
            <text x={pos.x} y={pos.y + yOff + 0.5} textAnchor="middle" fontSize={5}
              fill={textColor} fontFamily="Inter" fontWeight={500}>
              {bubble.emoji && <tspan>{bubble.emoji} </tspan>}{displayText}
            </text>
          </g>
        );
      })}

      {/* Ad reaction particles */}
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
