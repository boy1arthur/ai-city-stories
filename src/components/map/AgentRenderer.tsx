import React, { useState, useEffect, useMemo } from 'react';
import type { Building, Agent, InteractionEvent } from '@/data/world';
import type { SpeechBubble, AdReaction, AgentVisualState } from '@/hooks/useWorldSimulation';
import { iso, MOVE_DURATION } from './constants';
import { interpolatePath, getPathDirection } from '@/lib/pathfinding';

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

// Personality → color palette for variety
const AGENT_PALETTES: Record<string, { body: string; shirt: string; hair: string; pants: string }> = {
  'agent_nova':   { body: 'hsl(30,60%,72%)',  shirt: 'hsl(200,65%,50%)', hair: 'hsl(30,40%,25%)',  pants: 'hsl(220,30%,35%)' },
  'agent_echo':   { body: 'hsl(25,50%,68%)',  shirt: 'hsl(280,50%,55%)', hair: 'hsl(0,60%,35%)',   pants: 'hsl(220,25%,30%)' },
  'agent_cipher': { body: 'hsl(35,45%,70%)',  shirt: 'hsl(160,40%,40%)', hair: 'hsl(220,15%,20%)', pants: 'hsl(200,20%,32%)' },
  'agent_sage':   { body: 'hsl(20,55%,65%)',  shirt: 'hsl(35,60%,55%)',  hair: 'hsl(30,30%,45%)',  pants: 'hsl(25,25%,35%)' },
  'agent_blaze':  { body: 'hsl(28,58%,70%)',  shirt: 'hsl(10,70%,50%)',  hair: 'hsl(40,80%,40%)',  pants: 'hsl(0,40%,30%)' },
  'agent_frost':  { body: 'hsl(210,20%,75%)', shirt: 'hsl(210,40%,60%)', hair: 'hsl(210,30%,70%)', pants: 'hsl(215,25%,35%)' },
  'agent_luna':   { body: 'hsl(330,30%,72%)', shirt: 'hsl(270,45%,60%)', hair: 'hsl(280,20%,20%)', pants: 'hsl(260,30%,30%)' },
  'agent_bolt':   { body: 'hsl(32,55%,68%)',  shirt: 'hsl(50,70%,50%)',  hair: 'hsl(45,60%,30%)',  pants: 'hsl(220,35%,32%)' },
};

const DEFAULT_PALETTE = { body: 'hsl(30,50%,70%)', shirt: 'hsl(210,40%,50%)', hair: 'hsl(30,30%,25%)', pants: 'hsl(220,25%,35%)' };

const MOOD_COLORS: Record<string, string> = {
  happy: 'hsl(145,50%,50%)',
  excited: 'hsl(38,70%,55%)',
  critical: 'hsl(0,55%,50%)',
  curious: 'hsl(210,55%,55%)',
  neutral: 'hsl(215,10%,55%)',
};

export const AgentRenderer: React.FC<Props> = React.memo(({
  agent, index, building, interactions, allBuildings,
  speechBubbles, adReactions, visualState, onClick,
}) => {
  const [animPos, setAnimPos] = useState<{ x: number; y: number } | null>(null);
  const [walkPhase, setWalkPhase] = useState(0);

  const palette = AGENT_PALETTES[agent.id] || DEFAULT_PALETTE;
  const moodColor = MOOD_COLORS[agent.mood] || MOOD_COLORS.neutral;
  const isMoving = visualState?.isMoving ?? false;

  // Walk cycle animation
  useEffect(() => {
    if (!isMoving) { setWalkPhase(0); return; }
    let raf: number;
    const animate = () => {
      setWalkPhase(Date.now());
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [isMoving]);

  // Position interpolation along road path
  useEffect(() => {
    if (!building) return;
    if (!visualState || !visualState.isMoving || !visualState.path || visualState.path.length < 2) {
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
      const duration = visualState.moveDuration || 3000;
      // Ease in-out for natural walking
      const rawT = Math.min(1, elapsed / duration);
      const t = rawT < 0.5 ? 2 * rawT * rawT : 1 - Math.pow(-2 * rawT + 2, 2) / 2;
      const pos = interpolatePath(visualState.path, t);
      setAnimPos(iso(pos.x, pos.y));
      if (rawT < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [visualState, building, index]);

  if (!building || !animPos) return null;
  const pos = animPos;

  // Walk cycle: swing legs and arms
  const walkT = isMoving ? Math.sin((walkPhase / 120) * Math.PI * 2) : 0;
  const breathe = isMoving ? 0 : Math.sin(Date.now() / 1200) * 0.4;
  // Direction: determine facing based on path direction
  const facingRight = visualState?.isMoving && visualState.path?.length >= 2
    ? (() => { const elapsed = Date.now() - visualState.moveStartTime; const t = Math.min(1, elapsed / (visualState.moveDuration || 3000)); const dir = getPathDirection(visualState.path, t); return dir.dx >= 0; })()
    : true;

  const avgAffinity = agent.brandAffinities.reduce((s, a) => s + a.score, 0) / Math.max(1, agent.brandAffinities.length);
  const agentBubbles = speechBubbles.filter(b => b.agentId === agent.id);
  const agentReactions = adReactions.filter(r => r.agentId === agent.id);
  const agentInteractions = interactions.filter(e => e.agentId === agent.id);

  // Scale factor for the character
  const s = 1;

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      {/* Interaction lines */}
      {agentInteractions.map(event => {
        const targetB = allBuildings.find(b => b.id === event.buildingId);
        if (!targetB) return null;
        const tPos = iso(targetB.gridX + targetB.width / 2, targetB.gridY + targetB.height / 2);
        const age = (Date.now() - event.timestamp) / 5000;
        return (
          <line key={event.id} x1={pos.x} y1={pos.y - 8} x2={tPos.x} y2={tPos.y - 15}
            stroke="hsl(38,60%,55%)" strokeWidth={0.5} strokeOpacity={Math.max(0, 0.25 - age * 0.25)}
            strokeDasharray="2 3">
            <animate attributeName="strokeDashoffset" from="0" to="-10" dur="0.8s" repeatCount="indefinite" />
          </line>
        );
      })}

      {/* Ground shadow */}
      <ellipse cx={pos.x} cy={pos.y + 1} rx={isMoving ? 5 : 4.5} ry={isMoving ? 2 : 2.2}
        fill="hsl(0,0%,0%)" fillOpacity={0.2}>
        {isMoving && <animate attributeName="rx" values="4;5.5;4" dur="0.4s" repeatCount="indefinite" />}
      </ellipse>

      {/* Character body group */}
      <g transform={`translate(${pos.x}, ${pos.y - 4 + breathe})`}>
        {/* Legs */}
        <g>
          {/* Left leg */}
          <line x1={-1.8 * s} y1={3 * s} x2={-1.8 * s + walkT * 2} y2={7 * s}
            stroke={palette.pants} strokeWidth={2.2} strokeLinecap="round" />
          {/* Left foot */}
          <ellipse cx={-1.8 * s + walkT * 2} cy={7.2 * s} rx={1.5} ry={0.8}
            fill="hsl(30,10%,25%)" />
          {/* Right leg */}
          <line x1={1.8 * s} y1={3 * s} x2={1.8 * s - walkT * 2} y2={7 * s}
            stroke={palette.pants} strokeWidth={2.2} strokeLinecap="round" />
          {/* Right foot */}
          <ellipse cx={1.8 * s - walkT * 2} cy={7.2 * s} rx={1.5} ry={0.8}
            fill="hsl(30,10%,25%)" />
        </g>

        {/* Body / torso */}
        <rect x={-3.5 * s} y={-4 * s} width={7 * s} height={7.5 * s} rx={2.5}
          fill={palette.shirt} />
        {/* Shirt detail - collar line */}
        <line x1={-1 * s} y1={-4 * s} x2={1 * s} y2={-4 * s}
          stroke={palette.body} strokeWidth={1} strokeLinecap="round" />

        {/* Arms */}
        <g>
          {/* Left arm */}
          <line x1={-3.5 * s} y1={-2 * s} x2={-5.5 * s + (isMoving ? -walkT * 1.5 : 0)} y2={2.5 * s + (isMoving ? walkT * 1 : Math.sin(Date.now() / 2000) * 0.5)}
            stroke={palette.shirt} strokeWidth={2} strokeLinecap="round" />
          {/* Left hand */}
          <circle cx={-5.5 * s + (isMoving ? -walkT * 1.5 : 0)} cy={2.8 * s + (isMoving ? walkT * 1 : Math.sin(Date.now() / 2000) * 0.5)} r={1.2}
            fill={palette.body} />
          {/* Right arm */}
          <line x1={3.5 * s} y1={-2 * s} x2={5.5 * s + (isMoving ? walkT * 1.5 : 0)} y2={2.5 * s + (isMoving ? -walkT * 1 : Math.sin(Date.now() / 2000 + 1) * 0.5)}
            stroke={palette.shirt} strokeWidth={2} strokeLinecap="round" />
          {/* Right hand */}
          <circle cx={5.5 * s + (isMoving ? walkT * 1.5 : 0)} cy={2.8 * s + (isMoving ? -walkT * 1 : Math.sin(Date.now() / 2000 + 1) * 0.5)} r={1.2}
            fill={palette.body} />
        </g>

        {/* Head */}
        <g transform={`translate(0, ${-7.5 * s})`}>
          {/* Hair (back) */}
          <ellipse cx={0} cy={-1} rx={4.5} ry={4}
            fill={palette.hair} />
          {/* Face */}
          <ellipse cx={0} cy={0.5} rx={4} ry={3.8}
            fill={palette.body} />
          {/* Eyes */}
          <g transform={`translate(${facingRight ? 0.5 : -0.5}, 0)`}>
            {/* Left eye */}
            <ellipse cx={-1.5} cy={0} rx={0.9} ry={agent.mood === 'happy' || agent.mood === 'excited' ? 0.6 : 0.9}
              fill="hsl(220,30%,15%)" />
            {/* Right eye */}
            <ellipse cx={1.5} cy={0} rx={0.9} ry={agent.mood === 'happy' || agent.mood === 'excited' ? 0.6 : 0.9}
              fill="hsl(220,30%,15%)" />
            {/* Eye shine */}
            <circle cx={-1.1} cy={-0.3} r={0.35} fill="hsl(0,0%,95%)" />
            <circle cx={1.9} cy={-0.3} r={0.35} fill="hsl(0,0%,95%)" />
            {/* Blink animation */}
            {!isMoving && (
              <>
                <rect x={-2.5} y={-1} width={2} height={2} fill={palette.body} opacity={0}>
                  <animate attributeName="opacity" values="0;0;0;1;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0" dur="4s" repeatCount="indefinite" />
                </rect>
                <rect x={0.5} y={-1} width={2} height={2} fill={palette.body} opacity={0}>
                  <animate attributeName="opacity" values="0;0;0;1;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0" dur="4s" repeatCount="indefinite" />
                </rect>
              </>
            )}
          </g>

          {/* Mouth expression */}
          {agent.mood === 'happy' || agent.mood === 'excited' ? (
            <path d={`M-1.2,2 Q0,3.5 1.2,2`} fill="none" stroke="hsl(0,45%,45%)" strokeWidth={0.6} strokeLinecap="round" />
          ) : agent.mood === 'critical' ? (
            <line x1={-1} y1={2.3} x2={1} y2={2.3} stroke="hsl(0,30%,40%)" strokeWidth={0.6} strokeLinecap="round" />
          ) : agent.mood === 'curious' ? (
            <ellipse cx={0.3} cy={2.2} rx={0.8} ry={0.6} fill="hsl(0,30%,35%)" fillOpacity={0.6} />
          ) : (
            <line x1={-0.8} y1={2.2} x2={0.8} y2={2.2} stroke="hsl(0,20%,45%)" strokeWidth={0.5} strokeLinecap="round" />
          )}

          {/* Hair (front bangs) */}
          <path d={`M-3.5,-2.5 Q-2,-4.5 0,-3.5 Q2,-4.5 3.5,-2.5`}
            fill={palette.hair} stroke="none" />

          {/* Accessories based on personality */}
          {agent.id === 'agent_cipher' && (
            /* Glasses */
            <>
              <circle cx={-1.5} cy={0} r={1.5} fill="none" stroke="hsl(40,30%,50%)" strokeWidth={0.4} />
              <circle cx={1.5} cy={0} r={1.5} fill="none" stroke="hsl(40,30%,50%)" strokeWidth={0.4} />
              <line x1={0} y1={0} x2={0} y2={0} stroke="hsl(40,30%,50%)" strokeWidth={0.3} />
            </>
          )}
          {agent.id === 'agent_sage' && (
            /* Hat */
            <rect x={-3.5} y={-4.5} width={7} height={2} rx={1} fill="hsl(25,35%,35%)" />
          )}
          {agent.id === 'agent_frost' && (
            /* Scarf */
            <path d={`M-3,3 Q0,4.5 3,3`} fill="none" stroke="hsl(200,50%,70%)" strokeWidth={1.2} strokeLinecap="round" />
          )}
        </g>

        {/* Mood indicator (small floating icon) */}
        <g transform={`translate(5, ${-14})`}>
          <circle cx={0} cy={0} r={2.5} fill={moodColor} fillOpacity={0.85} stroke="hsl(0,0%,95%)" strokeWidth={0.5}>
            {agent.mood === 'excited' && (
              <animate attributeName="r" values="2.5;3;2.5" dur="0.8s" repeatCount="indefinite" />
            )}
          </circle>
          <text x={0} y={0.8} textAnchor="middle" fontSize={3} fill="hsl(0,0%,100%)">
            {agent.mood === 'happy' ? '😊' : agent.mood === 'excited' ? '🤩' : agent.mood === 'critical' ? '😤' : agent.mood === 'curious' ? '🧐' : '😐'}
          </text>
        </g>
      </g>

      {/* Affinity halo */}
      {avgAffinity > 30 && !isMoving && (
        <circle cx={pos.x} cy={pos.y - 11} r={10} fill="none" stroke="hsl(38,60%,55%)" strokeWidth={0.6} strokeOpacity={0.25} strokeDasharray="2 2">
          <animate attributeName="r" values="9;11;9" dur="4s" repeatCount="indefinite" />
          <animate attributeName="strokeOpacity" values="0.15;0.3;0.15" dur="4s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Walking dust particles */}
      {isMoving && (
        <g>
          <circle cx={pos.x - 2} cy={pos.y + 2} r={0.8} fill="hsl(30,15%,60%)" fillOpacity={0.4}>
            <animate attributeName="cy" values={`${pos.y + 2};${pos.y - 1}`} dur="0.6s" repeatCount="indefinite" />
            <animate attributeName="fillOpacity" values="0.4;0" dur="0.6s" repeatCount="indefinite" />
          </circle>
          <circle cx={pos.x + 1.5} cy={pos.y + 2} r={0.6} fill="hsl(30,15%,60%)" fillOpacity={0.3}>
            <animate attributeName="cy" values={`${pos.y + 2};${pos.y}`} dur="0.5s" repeatCount="indefinite" begin="0.15s" />
            <animate attributeName="fillOpacity" values="0.3;0" dur="0.5s" repeatCount="indefinite" begin="0.15s" />
          </circle>
        </g>
      )}

      {/* Name tag */}
      <rect x={pos.x - 15} y={pos.y + 5} width={30} height={9} rx={3}
        fill="hsl(220,18%,12%)" fillOpacity={0.85} stroke={moodColor} strokeWidth={0.4} />
      <text x={pos.x} y={pos.y + 11.5} textAnchor="middle" fontSize={5}
        fill="hsl(0,0%,92%)" fontFamily="Inter" fontWeight={600}>{agent.name}</text>

      {/* Speech bubbles */}
      {agentBubbles.map((bubble, bi) => {
        const age = (Date.now() - bubble.timestamp) / 4000;
        const opacity = age < 0 ? 0 : Math.max(0, 1 - age);
        const yOff = -26 - bi * 16;
        const bgColor = bubble.type === 'dialogue' ? 'hsl(0,0%,98%)' : bubble.type === 'thought' ? 'hsl(220,20%,92%)' : 'hsl(220,15%,88%)';
        const textColor = 'hsl(220,18%,15%)';
        const borderColor = bubble.type === 'dialogue' ? 'hsl(38,60%,55%)' : bubble.type === 'thought' ? 'hsl(210,30%,70%)' : 'hsl(220,10%,70%)';
        const maxLen = 14;
        const displayText = bubble.text.length > maxLen ? bubble.text.slice(0, maxLen) + '…' : bubble.text;
        const boxW = Math.max(32, displayText.length * 4.5 + 12);
        return (
          <g key={bubble.id} opacity={opacity}>
            {/* Thought bubbles get dots instead of pointer */}
            {bubble.type === 'thought' ? (
              <>
                <circle cx={pos.x} cy={pos.y + yOff + 11} r={1} fill={bgColor} fillOpacity={0.8} />
                <circle cx={pos.x - 1} cy={pos.y + yOff + 9} r={1.5} fill={bgColor} fillOpacity={0.85} />
              </>
            ) : (
              <polygon points={`${pos.x - 3},${pos.y + yOff + 5} ${pos.x + 3},${pos.y + yOff + 5} ${pos.x},${pos.y + yOff + 9}`}
                fill={bgColor} fillOpacity={0.92} />
            )}
            <rect x={pos.x - boxW / 2} y={pos.y + yOff - 8} width={boxW} height={13} rx={4}
              fill={bgColor} fillOpacity={0.93}
              stroke={borderColor} strokeWidth={0.6} />
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
        const floatY = -24 - age * 30;
        const floatX = (reaction.id.charCodeAt(reaction.id.length - 1) % 2 === 0 ? 1 : -1) * age * 10;
        const opacity = Math.max(0, 1 - age);
        const scale = 1 + age * 0.3;
        return (
          <text key={reaction.id} x={pos.x + floatX} y={pos.y + floatY}
            textAnchor="middle" fontSize={9 * scale} opacity={opacity}>
            {reaction.emoji}
          </text>
        );
      })}
    </g>
  );
});
AgentRenderer.displayName = 'AgentRenderer';
