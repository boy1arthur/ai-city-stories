import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AGENTS, ZONES, INITIAL_AD_SLOTS, generateBrandDialogue, getZoneById, type Agent, type AdSlot, type InteractionEvent, type Building } from '@/data/world';
import { applyDemoSeed } from '@/data/demoSeed';
import { aggregateBrandStats, type BrandStats, type SlotStats } from '@/lib/esv';
import { initCityEnergy, tickCityEnergy, type CityEnergyState } from '@/lib/cityEnergy';
import type { Highlight } from '@/components/sponsor/TodayHighlights';

const TICK_MS = 2500;

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Speech bubble that auto-dismisses
export interface SpeechBubble {
  id: string;
  agentId: string;
  text: string;
  emoji: string;
  timestamp: number;
  type: 'dialogue' | 'reaction' | 'thought';
}

// Agent animated position for smooth movement
export interface AgentVisualState {
  agentId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  moveStartTime: number;
  isMoving: boolean;
}

// Ad reaction particle
export interface AdReaction {
  id: string;
  agentId: string;
  buildingId: string;
  brand: string;
  emoji: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  timestamp: number;
}

function getAgentPositionAroundBuilding(building: Building, index: number): { x: number; y: number } {
  const side = index % 4;
  const jitter = ((index * 7 + 3) % 5) * 0.3;
  switch (side) {
    case 0: return { x: building.gridX + (index % building.width) + jitter, y: building.gridY - 0.6 };
    case 1: return { x: building.gridX + building.width + 0.4, y: building.gridY + (index % building.height) + jitter };
    case 2: return { x: building.gridX + (index % building.width) + jitter, y: building.gridY + building.height + 0.4 };
    default: return { x: building.gridX - 0.6, y: building.gridY + (index % building.height) + jitter };
  }
}

const REACTION_EMOJIS = {
  positive: ['👍', '❤️', '✨', '🔥', '💯', '👏'],
  neutral: ['🤔', '👀', '💭', '📋', '🔍'],
  negative: ['😒', '👎', '💤', '❌', '😑'],
};

const IDLE_THOUGHTS = [
  '☀️ 날씨 좋다~',
  '🎵 ~♪',
  '☕ 커피 마시고 싶다',
  '📱 ...',
  '🌿 산책하자',
  '💡 아이디어!',
  '😊',
];

export function useWorldSimulation() {
  const [agents, setAgents] = useState<Agent[]>(AGENTS);
  const [adSlots, setAdSlots] = useState<AdSlot[]>(() => applyDemoSeed(INITIAL_AD_SLOTS));
  const [worldLog, setWorldLog] = useState<string[]>([]);
  const [tick, setTick] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [interactions, setInteractions] = useState<InteractionEvent[]>([]);
  const [currentZoneId, setCurrentZoneId] = useState('plaza');
  const [speechBubbles, setSpeechBubbles] = useState<SpeechBubble[]>([]);
  const [agentVisuals, setAgentVisuals] = useState<Map<string, AgentVisualState>>(new Map());
  const [adReactions, setAdReactions] = useState<AdReaction[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentZone = getZoneById(currentZoneId)!;

  const addLog = useCallback((msg: string) => {
    setWorldLog(prev => [msg, ...prev].slice(0, 100));
  }, []);

  const addInteraction = useCallback((event: InteractionEvent) => {
    setInteractions(prev => [event, ...prev.filter(e => Date.now() - e.timestamp < 5000)].slice(0, 20));
  }, []);

  const addSpeechBubble = useCallback((bubble: SpeechBubble) => {
    setSpeechBubbles(prev => [bubble, ...prev].slice(0, 12));
  }, []);

  const addAdReaction = useCallback((reaction: AdReaction) => {
    setAdReactions(prev => [reaction, ...prev].slice(0, 15));
  }, []);

  // Clean up expired bubbles & reactions
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setInteractions(prev => prev.filter(e => now - e.timestamp < 5000));
      setSpeechBubbles(prev => prev.filter(b => now - b.timestamp < 4000));
      setAdReactions(prev => prev.filter(r => now - r.timestamp < 3000));
    }, 500);
    return () => clearInterval(cleanup);
  }, []);

  // Initialize agent visual positions
  useEffect(() => {
    const zone = getZoneById(currentZoneId);
    if (!zone) return;
    const map = new Map<string, AgentVisualState>();
    agents.forEach((agent, i) => {
      const building = zone.buildings.find(b => b.id === agent.currentBuildingId);
      if (building) {
        const pos = getAgentPositionAroundBuilding(building, i);
        map.set(agent.id, {
          agentId: agent.id,
          fromX: pos.x, fromY: pos.y,
          toX: pos.x, toY: pos.y,
          moveStartTime: 0, isMoving: false,
        });
      }
    });
    setAgentVisuals(map);
  }, [currentZoneId]); // eslint-disable-line

  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setTick(t => t + 1);
      const now = Date.now();

      setAgents(prev => prev.map((agent, agentIndex) => {
        const agentZone = getZoneById(agent.currentZoneId);
        if (!agentZone || agentZone.locked) return agent;

        // Agent moves to a new building
        if (Math.random() < 0.3) {
          const zoneBuildings = agentZone.buildings;
          const newBuilding = pickRandom(zoneBuildings);
          if (newBuilding.id !== agent.currentBuildingId) {
            const oldBuilding = zoneBuildings.find(b => b.id === agent.currentBuildingId);
            addLog(`${agent.avatar} ${agent.name} → ${newBuilding.name}`);

            // Animate movement
            if (oldBuilding) {
              const fromPos = getAgentPositionAroundBuilding(oldBuilding, agentIndex);
              const toPos = getAgentPositionAroundBuilding(newBuilding, agentIndex);
              setAgentVisuals(prev => {
                const next = new Map(prev);
                next.set(agent.id, {
                  agentId: agent.id,
                  fromX: fromPos.x, fromY: fromPos.y,
                  toX: toPos.x, toY: toPos.y,
                  moveStartTime: now,
                  isMoving: true,
                });
                return next;
              });

              // End movement after transition
              setTimeout(() => {
                setAgentVisuals(prev => {
                  const next = new Map(prev);
                  const vs = next.get(agent.id);
                  if (vs) {
                    next.set(agent.id, { ...vs, fromX: vs.toX, fromY: vs.toY, isMoving: false });
                  }
                  return next;
                });
              }, 1200);
            }

            // Ad interactions at destination
            const buildingAds = adSlots.filter(s => s.zoneId === agent.currentZoneId && s.buildingId === newBuilding.id && s.brand);
            const updatedAffinities = [...agent.brandAffinities];

            buildingAds.forEach(ad => {
              if (ad.brand) {
                setAdSlots(prev => prev.map(s => s.id === ad.id ? { ...s, impressions: s.impressions + 1 } : s));

                const catAffinity = updatedAffinities[0];
                const score = catAffinity?.score ?? 0;

                addInteraction({
                  id: `${agent.id}_${ad.id}_${now}`,
                  agentId: agent.id,
                  zoneId: agent.currentZoneId,
                  buildingId: newBuilding.id,
                  brand: ad.brand,
                  affinity: score,
                  timestamp: now,
                });

                // Ad reaction particle
                const sentiment = score > 30 ? 'positive' : score > -10 ? 'neutral' : 'negative';
                addAdReaction({
                  id: `react_${agent.id}_${now}_${Math.random()}`,
                  agentId: agent.id,
                  buildingId: newBuilding.id,
                  brand: ad.brand,
                  emoji: pickRandom(REACTION_EMOJIS[sentiment]),
                  sentiment,
                  timestamp: now + 1300, // delay until agent arrives
                });

                // Speech bubble for dialogue
                if (Math.random() < 0.25) {
                  const dialogue = generateBrandDialogue(agent.name, ad.brand, score);
                  addLog(dialogue);
                  addSpeechBubble({
                    id: `speech_${agent.id}_${now}`,
                    agentId: agent.id,
                    text: ad.brand + (score > 30 ? ' 좋아!' : score > 0 ? ' 흠...' : ' 별로'),
                    emoji: score > 30 ? '❤️' : score > 0 ? '🤔' : '😒',
                    timestamp: now + 1500,
                    type: 'dialogue',
                  });
                }
              }
            });

            return { ...agent, currentBuildingId: newBuilding.id, brandAffinities: updatedAffinities };
          }
        }

        // Idle thoughts (random chatter)
        if (Math.random() < 0.06) {
          addSpeechBubble({
            id: `idle_${agent.id}_${now}`,
            agentId: agent.id,
            text: pickRandom(IDLE_THOUGHTS),
            emoji: '',
            timestamp: now,
            type: 'thought',
          });
        }

        // Mood change
        if (Math.random() < 0.08) {
          const moods = ['happy', 'curious', 'critical', 'neutral', 'excited'] as const;
          return { ...agent, mood: pickRandom([...moods]) };
        }

        return agent;
      }));
    }, TICK_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, adSlots, addLog, addInteraction, addSpeechBubble, addAdReaction]);

  const placeBrandAd = useCallback((slotId: string, brandName: string) => {
    setAdSlots(prev => prev.map(s => s.id === slotId ? { ...s, brand: brandName } : s));
    addLog(`📢 "${brandName}" 광고가 설치되었습니다`);
  }, [addLog]);

  const zoneAgents = agents.filter(a => a.currentZoneId === currentZoneId);
  const zoneAdSlots = adSlots.filter(s => s.zoneId === currentZoneId);
  const zoneInteractions = interactions.filter(i => i.zoneId === currentZoneId);
  const zoneBubbles = speechBubbles.filter(b => {
    const agent = agents.find(a => a.id === b.agentId);
    return agent?.currentZoneId === currentZoneId;
  });
  const zoneReactions = adReactions.filter(r => {
    const agent = agents.find(a => a.id === r.agentId);
    return agent?.currentZoneId === currentZoneId;
  });

  // Compute brand stats from all ad slots
  const brandStats: BrandStats[] = useMemo(() => {
    const activeSlots = adSlots.filter(s => s.brand);
    if (activeSlots.length === 0) return [];

    const slotData = activeSlots.map(slot => {
      const slotInteractions = interactions.filter(i => i.brand === slot.brand);
      const stats: SlotStats = {
        impressions: slot.impressions,
        positiveInteractions: slotInteractions.filter(i => i.affinity > 30).length,
        neutralInteractions: slotInteractions.filter(i => i.affinity > -10 && i.affinity <= 30).length,
        negativeInteractions: slotInteractions.filter(i => i.affinity <= -10).length,
        mentions: slotInteractions.length,
      };
      return { brand: slot.brand!, stats };
    });

    return aggregateBrandStats(slotData);
  }, [adSlots, interactions, tick]); // eslint-disable-line

  // Generate highlights from recent logs
  const highlights: Highlight[] = useMemo(() => {
    return worldLog.slice(0, 10)
      .filter(log => log.includes('"') || log.includes('📢') || log.includes('→'))
      .slice(0, 5)
      .map((log, i) => ({
        id: `hl_${i}_${tick}`,
        text: log,
        timestamp: Date.now() - i * 30000,
        type: log.includes('좋아') || log.includes('기대') ? 'positive' as const
          : log.includes('별로') || log.includes('과대') ? 'negative' as const
          : log.includes('📢') ? 'event' as const
          : 'neutral' as const,
      }));
  }, [worldLog, tick]);

  return {
    agents: zoneAgents,
    allAgents: agents,
    adSlots: zoneAdSlots,
    allAdSlots: adSlots,
    worldLog,
    tick,
    isPaused,
    setIsPaused,
    placeBrandAd,
    buildings: currentZone.buildings,
    interactions: zoneInteractions,
    currentZoneId,
    setCurrentZoneId,
    currentZone,
    zones: ZONES,
    speechBubbles: zoneBubbles,
    adReactions: zoneReactions,
    agentVisuals,
    brandStats,
    highlights,
  };
}
