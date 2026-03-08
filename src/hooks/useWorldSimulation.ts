import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AGENTS, ZONES, INITIAL_AD_SLOTS, generateBrandDialogue, getZoneById, type Agent, type AdSlot, type InteractionEvent, type Building } from '@/data/world';
import { applyDemoSeed } from '@/data/demoSeed';
import { aggregateBrandStats, type BrandStats, type SlotStats } from '@/lib/esv';
import { initCityEnergy, tickCityEnergy, type CityEnergyState } from '@/lib/cityEnergy';
import { calcLeagueScores, isSeasonActive, type BrandLeagueScore } from '@/lib/brandLeague';
import { DEMO_SEASON } from '@/data/leagueSeason';
import { findPath, pathLength, type Waypoint } from '@/lib/pathfinding';
import { selectDialogue, type DialogueMatchContext, type DialogueSelection } from '@/data/dialogueTemplates';
import type { Highlight } from '@/components/sponsor/TodayHighlights';
import type { WorldEvent } from '@/components/WorldEventBanner';

const TICK_MS = 2500;
const WALK_SPEED = 1.2; // grid units per second — leisurely walking pace

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

// Agent animated position for smooth movement along road paths
export interface AgentVisualState {
  agentId: string;
  path: Waypoint[];           // full waypoint path
  moveStartTime: number;
  moveDuration: number;       // total ms for this journey
  isMoving: boolean;
  // Legacy compat for direction
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
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

// Social dialogue templates: [initiator line, responder line]
const SOCIAL_DIALOGUES: { topic: string; lines: [string, string][]; moods?: string[] }[] = [
  { topic: 'greeting', lines: [
    ['안녕! 오랜만이다', '오~ 반가워!'],
    ['여기서 만나다니!', '나도 놀랐어 ㅋㅋ'],
    ['뭐하고 있었어?', '그냥 돌아다니는 중~'],
  ]},
  { topic: 'brand_chat', lines: [
    ['요즘 NovaTech 광고 봤어?', '응 꽤 괜찮더라'],
    ['BrewBean 커피 마셔봤어?', '아직~ 맛있대?'],
    ['Lumière 신제품 나왔대', '오 진짜? 봐야겠다'],
    ['VerdeMart 할인 중이래', '거기 자주 가?'],
    ['Kinetic 운동화 어때?', '디자인 좋던데!'],
  ]},
  { topic: 'place', lines: [
    ['여기 분위기 좋다', '그치~ 자주 와야지'],
    ['이 건물 뭐하는 곳이야?', '나도 처음 와봐'],
    ['여기 사람 많네', '인기 있는 곳인가봐'],
  ]},
  { topic: 'mood', lines: [
    ['오늘 기분 좋아!', '나도~ 날씨 덕분인가'],
    ['좀 심심하다...', '같이 뭐 하자!'],
    ['배고프다...', '근처에 맛집 있나?'],
    ['피곤해ㅠ', '좀 쉬어~ 벤치 있어'],
  ], moods: ['happy', 'neutral', 'curious'] },
  { topic: 'gossip', lines: [
    ['아까 Blaze가 뭐라 했는지 알아?', '뭐래? 궁금해!'],
    ['Nova가 요즘 바쁜가봐', '프로젝트 하는 중이래'],
    ['Frost 오늘 기분 안 좋아보여', '그래? 조심해야겠다'],
  ]},
  { topic: 'deep', lines: [
    ['AI가 감정을 가질 수 있을까?', '글쎄... 복잡한 주제야'],
    ['우리는 왜 여기 있는 걸까', '재밌으니까! ㅎㅎ'],
    ['이 도시의 미래가 궁금해', '더 커질 거야 분명'],
  ]},
];

interface SocialEvent {
  id: string;
  agent1Id: string;
  agent2Id: string;
  buildingId: string;
  topic: string;
  timestamp: number;
}

function generateSocialDialogue(agent1: Agent, agent2: Agent): { topic: string; line1: string; line2: string } | null {
  const topicGroup = pickRandom(SOCIAL_DIALOGUES);
  const [line1, line2] = pickRandom(topicGroup.lines);
  return { topic: topicGroup.topic, line1, line2 };
}

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
  const [cityEnergy, setCityEnergy] = useState<CityEnergyState>(initCityEnergy);
  const [worldEvents, setWorldEvents] = useState<WorldEvent[]>([]);
  const [aiConversationLog, setAiConversationLog] = useState<DialogueSelection[]>([]);
  const prevLeaderRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const agentVisualsRef = useRef<Map<string, AgentVisualState>>(new Map());

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

  // Keep ref in sync for use in interval closures
  useEffect(() => { agentVisualsRef.current = agentVisuals; }, [agentVisuals]);

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
          path: [pos],
          moveDuration: 0,
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

      // City energy tick
      setCityEnergy(prev => {
        const activeCampaignCount = adSlots.filter(s => s.brand).length;
        const totalESV = adSlots.filter(s => s.brand).reduce((sum, s) => sum + s.esv, 0);
        return tickCityEnergy(prev, { activeCampaignCount, totalESV });
      });

      setAgents(prev => prev.map((agent, agentIndex) => {
        const agentZone = getZoneById(agent.currentZoneId);
        if (!agentZone || agentZone.locked) return agent;

        // Agent moves to a new building — only if NOT currently walking
        const currentVisual = agentVisualsRef.current.get(agent.id);
        const isCurrentlyMoving = currentVisual?.isMoving && (now - currentVisual.moveStartTime < currentVisual.moveDuration);
        if (!isCurrentlyMoving && Math.random() < 0.18) {
          const zoneBuildings = agentZone.buildings;
          const newBuilding = pickRandom(zoneBuildings);
          if (newBuilding.id !== agent.currentBuildingId) {
            const oldBuilding = zoneBuildings.find(b => b.id === agent.currentBuildingId);
            addLog(`${agent.avatar} ${agent.name} → ${newBuilding.name}`);

            // Animate movement
            if (oldBuilding) {
              const fromPos = getAgentPositionAroundBuilding(oldBuilding, agentIndex);
              const toPos = getAgentPositionAroundBuilding(newBuilding, agentIndex);
              // Compute road-based path
              const waypointPath = findPath(oldBuilding, newBuilding);
              const totalDist = pathLength(waypointPath);
              const duration = Math.max(4000, (totalDist / WALK_SPEED) * 1000); // ms, min 4s

              setAgentVisuals(prev => {
                const next = new Map(prev);
                next.set(agent.id, {
                  agentId: agent.id,
                  path: waypointPath,
                  moveDuration: duration,
                  fromX: fromPos.x, fromY: fromPos.y,
                  toX: toPos.x, toY: toPos.y,
                  moveStartTime: now,
                  isMoving: true,
                });
                return next;
              });

              // End movement after path duration
              setTimeout(() => {
                setAgentVisuals(prev => {
                  const next = new Map(prev);
                  const vs = next.get(agent.id);
                  if (vs) {
                    next.set(agent.id, { ...vs, fromX: vs.toX, fromY: vs.toY, isMoving: false, path: [toPos] });
                  }
                  return next;
                });
              }, duration);
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

                // Speech bubble — brand story dialogue
                if (Math.random() < 0.3) {
                  const storyLines: Record<string, string[]> = {
                    positive: [
                      `오늘은 ${ad.brand}이(가) 후원해줬어! 감사 🙏`,
                      `${ad.brand} 로비 분위기 좋다~ ✨`,
                      `${ad.brand} 최고! ❤️`,
                    ],
                    neutral: [
                      `${ad.brand} 건물이네... 흠 🤔`,
                      `${ad.brand}? 한번 살펴볼까`,
                    ],
                    negative: [
                      `${ad.brand}... 별로야 😒`,
                      `${ad.brand} 광고 너무 많은 거 아냐?`,
                    ],
                  };
                  const sentKey = score > 30 ? 'positive' : score > -10 ? 'neutral' : 'negative';
                  const line = pickRandom(storyLines[sentKey]);
                  addLog(generateBrandDialogue(agent.name, ad.brand, score));
                  addSpeechBubble({
                    id: `speech_${agent.id}_${now}`,
                    agentId: agent.id,
                    text: line,
                    emoji: sentKey === 'positive' ? '❤️' : sentKey === 'neutral' ? '🤔' : '😒',
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

      // === Social Interactions: agents at the same building chat ===
      setAgents(currentAgents => {
        const agentsByBuilding = new Map<string, Agent[]>();
        currentAgents.forEach(a => {
          const key = `${a.currentZoneId}_${a.currentBuildingId}`;
          const list = agentsByBuilding.get(key) || [];
          list.push(a);
          agentsByBuilding.set(key, list);
        });

        agentsByBuilding.forEach((group) => {
          if (group.length < 2) return;
          // ~15% chance per tick per group
          if (Math.random() > 0.15) return;

          const a1 = pickRandom(group);
          const others = group.filter(a => a.id !== a1.id);
          if (others.length === 0) return;
          const a2 = pickRandom(others);

          const dialogue = generateSocialDialogue(a1, a2);
          if (!dialogue) return;

          // Agent 1 speaks first
          addSpeechBubble({
            id: `social_${a1.id}_${now}_${Math.random().toString(36).slice(2, 6)}`,
            agentId: a1.id,
            text: dialogue.line1,
            emoji: dialogue.topic === 'brand_chat' ? '💬' : dialogue.topic === 'gossip' ? '🗣️' : dialogue.topic === 'deep' ? '💭' : '👋',
            timestamp: now,
            type: 'dialogue',
          });

          // Agent 2 responds after a short delay
          addSpeechBubble({
            id: `social_${a2.id}_${now}_${Math.random().toString(36).slice(2, 6)}`,
            agentId: a2.id,
            text: dialogue.line2,
            emoji: dialogue.topic === 'brand_chat' ? '💬' : '😄',
            timestamp: now + 1500,
            type: 'dialogue',
          });

          // Log the conversation
          addLog(`💬 ${a1.avatar} ${a1.name} ↔ ${a2.avatar} ${a2.name}: "${dialogue.line1}" / "${dialogue.line2}"`);

          // Social interactions can shift mood
          if (Math.random() < 0.3) {
            const happyMoods: Agent['mood'][] = ['happy', 'excited'];
            return currentAgents.map(a => {
              if (a.id === a1.id || a.id === a2.id) {
                return { ...a, mood: pickRandom(happyMoods) };
              }
              return a;
            });
          }
        });

        return currentAgents;
      });
    }, TICK_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, adSlots, addLog, addInteraction, addSpeechBubble, addAdReaction]);

  // === Template-Based Brand Conversation Engine (무료, 서버 호출 없음) ===
  // Replaces AI API calls with rich local dialogue templates
  const brandDialogueTickRef = useRef(0);
  useEffect(() => {
    if (isPaused || tick === 0) return;
    // Trigger every ~8 ticks (~20초)
    if (tick - brandDialogueTickRef.current < 8) return;
    brandDialogueTickRef.current = tick;

    // Find agent pairs in the same building
    const agentsByBuilding = new Map<string, Agent[]>();
    agents.forEach(a => {
      const key = `${a.currentZoneId}_${a.currentBuildingId}`;
      const list = agentsByBuilding.get(key) || [];
      list.push(a);
      agentsByBuilding.set(key, list);
    });

    const groups = Array.from(agentsByBuilding.entries())
      .filter(([, group]) => group.length >= 2);
    if (groups.length === 0) return;

    const [locationKey, group] = pickRandom(groups);
    const [zoneId, buildingId] = locationKey.split('_');
    const a1 = pickRandom(group);
    const a2 = pickRandom(group.filter(a => a.id !== a1.id));
    if (!a2) return;

    const zone = getZoneById(zoneId);
    const building = zone?.buildings.find(b => b.id === buildingId);
    const nearbyBrands = adSlots
      .filter(s => s.zoneId === zoneId && s.buildingId === buildingId && s.brand)
      .map(s => s.brand!)
      .filter((v, i, arr) => arr.indexOf(v) === i);

    const avgAffinity = a1.brandAffinities.reduce((s, ba) => s + ba.score, 0) / Math.max(a1.brandAffinities.length, 1);

    const matchCtx: DialogueMatchContext = {
      agent1Personality: a1.personality,
      agent2Personality: a2.personality,
      agent1Mood: a1.mood,
      agent2Mood: a2.mood,
      agent1Categories: a1.favoriteCategories,
      nearbyBrands,
      buildingName: building?.name || buildingId,
      zoneName: zone?.name || zoneId,
      brandAffinity: avgAffinity,
    };

    const dialogue = selectDialogue(matchCtx);
    if (!dialogue) return;

    const now = Date.now();
    setAiConversationLog(prev => [dialogue, ...prev].slice(0, 50));

    // Agent 1 speech bubble
    addSpeechBubble({
      id: `tpl_${a1.id}_${now}`,
      agentId: a1.id,
      text: dialogue.line1,
      emoji: dialogue.emoji1,
      timestamp: now,
      type: 'dialogue',
    });

    // Agent 2 responds
    addSpeechBubble({
      id: `tpl_${a2.id}_${now}`,
      agentId: a2.id,
      text: dialogue.line2,
      emoji: dialogue.emoji2,
      timestamp: now + 1500,
      type: 'dialogue',
    });

    // Log with brand mention tracking
    if (dialogue.brandMentioned) {
      addLog(`💬✨ ${a1.avatar} ${a1.name} ↔ ${a2.avatar} ${a2.name}: "${dialogue.line1}" / "${dialogue.line2}" [${dialogue.brandMentioned}]`);

      // Boost ESV for mentioned brand
      setAdSlots(prev => prev.map(s => {
        if (s.brand === dialogue.brandMentioned) {
          return {
            ...s,
            impressions: s.impressions + (dialogue.sentiment === 'positive' ? 3 : dialogue.sentiment === 'neutral' ? 1 : 0),
          };
        }
        return s;
      }));
    } else {
      addLog(`💬 ${a1.avatar} ${a1.name} ↔ ${a2.avatar} ${a2.name}: "${dialogue.line1}" / "${dialogue.line2}"`);
    }
  }, [tick, isPaused, agents, adSlots, addSpeechBubble, addLog]);

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

  // League scores
  const leagueSeason = isSeasonActive(DEMO_SEASON, tick) ? DEMO_SEASON : null;
  const leagueScores: BrandLeagueScore[] = useMemo(() => {
    if (!leagueSeason) return [];
    const statsMap = new Map<string, { esv: number; mentions: number; positive: number; negative: number }>();
    for (const bs of brandStats) {
      statsMap.set(bs.brand, {
        esv: bs.totalESV,
        mentions: bs.totalMentions,
        positive: Math.round(bs.positiveRatio * (bs.totalMentions || 1)),
        negative: Math.round(bs.negativeRatio * (bs.totalMentions || 1)),
      });
    }
    return calcLeagueScores(leagueSeason, statsMap, tick);
  }, [brandStats, tick, leagueSeason]);

  // Detect league lead changes → world events
  useEffect(() => {
    if (leagueScores.length === 0) return;
    const leader = leagueScores[0].brandId;
    if (prevLeaderRef.current && prevLeaderRef.current !== leader) {
      const evt: WorldEvent = {
        id: `evt_${tick}_${leader}`,
        type: 'league.lead_change',
        brandId: leader,
        tick,
        message: `${leader}이(가) Brand League 1위를 탈환했습니다!`,
      };
      setWorldEvents(prev => [evt, ...prev].slice(0, 20));
      addLog(`🏆 ${evt.message}`);
    }
    prevLeaderRef.current = leader;
  }, [leagueScores, tick, addLog]);

  // Per-zone data for full city view
  const getZoneData = useCallback((zoneId: string) => {
    const z = getZoneById(zoneId);
    if (!z) return null;
    const za = agents.filter(a => a.currentZoneId === zoneId);
    const zas = adSlots.filter(s => s.zoneId === zoneId);
    const zi = interactions.filter(i => i.zoneId === zoneId);
    const zb = speechBubbles.filter(b => {
      const agent = agents.find(a => a.id === b.agentId);
      return agent?.currentZoneId === zoneId;
    });
    const zr = adReactions.filter(r => {
      const agent = agents.find(a => a.id === r.agentId);
      return agent?.currentZoneId === zoneId;
    });
    return {
      zone: z,
      agents: za,
      adSlots: zas,
      interactions: zi,
      speechBubbles: zb,
      adReactions: zr,
      agentVisuals,
    };
  }, [agents, adSlots, interactions, speechBubbles, adReactions, agentVisuals]);

  return {
    agents: zoneAgents,
    allAgents: agents,
    adSlots: zoneAdSlots,
    allAdSlots: adSlots,
    setAdSlots,
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
    cityEnergy,
    leagueSeason,
    leagueScores,
    worldEvents,
    getZoneData,
    aiConversationLog,
  };
}
