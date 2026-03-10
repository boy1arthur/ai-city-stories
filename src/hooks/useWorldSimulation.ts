import React, { useEffect, useCallback, useMemo, useReducer, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ZONES, generateBrandDialogue, getZoneById, type Agent, type AdSlot, type BrandCategory } from '@/data/world';
import { aggregateBrandStats, type BrandStats, type SlotStats } from '@/lib/esv';
import { calcLeagueScores, isSeasonActive, type BrandLeagueScore } from '@/lib/brandLeague';
import { DEMO_SEASON } from '@/data/leagueSeason';
import { pickRandom } from '@/lib/utils';
import { selectDialogue, type DialogueMatchContext, type NearbyBrand } from '@/data/dialogueTemplates';
import type { Highlight } from '@/components/sponsor/TodayHighlights';
import type { WorldEvent } from '@/components/WorldEventBanner';

import { simulationReducer, INITIAL_SIMULATION_STATE } from './simulation/simulationReducer';
import { useAgentMemories } from './useAgentMemories';
import { brainLlmService } from '../services/brain_llm';
import { useSlots } from './useSlots';

const TICK_MS = 2500;

export function useWorldSimulation() {
  const [state, dispatch] = useReducer(simulationReducer, INITIAL_SIMULATION_STATE);
  const { memories, addMemory } = useAgentMemories();
  const memoriesLoadedRef = useRef(false);

  const prevLeaderRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // === Phase 14: Supabase 슬롯 데이터 동기화 (Lore Sync) ===
  const { data: dbSlots, isLoading: slotsLoading } = useSlots();

  useEffect(() => {
    if (dbSlots && dbSlots.length > 0) {
      dispatch({
        type: 'SYNC_AD_SLOTS',
        payload: dbSlots.map(s => ({
          id: s.id,
          zoneId: s.zone,
          buildingId: s.location?.buildingId || '',
          type: s.type as any, // Cast to any to bypass compatibility check with SlotType
          brand: s.ownerType === 'brand' ? (s.ownerName || null) : null,
          brandCategory: (s.displayConfig?.category as BrandCategory) || 'tech',
          impressions: 0,
          esv: 100,
          capacity: 1,
          priority: 'standard' as const
        }))
      });
      dispatch({ type: 'ADD_LOG', payload: '📟 행정 데이터(Supabase)와 세계관 동기화 완료.' });
    }
  }, [dbSlots]);

  // === Phase 7-2: 로드 시 장기 기억 주입 ===
  useEffect(() => {
    if (memories && memories.length > 0 && !memoriesLoadedRef.current) {
      dispatch({
        type: 'LOAD_MEMORIES',
        payload: memories.map(m => ({ agent_id: m.agent_id, content: m.content }))
      });
      memoriesLoadedRef.current = true;
    }
  }, [memories]);

  // === Phase 15: LG 서버 Headless 엔진 실시간동기화 (Step 3) ===
  useEffect(() => {
    // 0. 초기 상태 가져오기 (마운트 시점)
    const fetchInitialStates = async () => {
      const { data, error } = await supabase
        .from('agent_states' as any)
        .select('*');

      if (error) {
        console.error('❌ 에이전트 초기 상태 로드 실패:', error.message);
        return;
      }

      if (data) {
        data.forEach(newState => {
          dispatch({
            type: 'SYNC_AGENT_STATE',
            payload: {
              agentId: newState.agent_id as any,
              zoneId: newState.zone_id as any,
              buildingId: newState.building_id as any,
              mood: newState.mood as any
            }
          } as any);
        });
        dispatch({ type: 'ADD_LOG', payload: `✅ LG 서버로부터 에이전트 ${data.length}명의 상태를 동기화했습니다.` });
      }
    };

    fetchInitialStates();

    // 1. 에이전트 상태 업데이트 구독 (이동, 기분)
    // UPDATE 뿐만 아니라 모든 변경에 대해 대응하도록 변경 (upsert 대응)
    const agentChannel = supabase
      .channel('agent-states-sync')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'agent_states' },
        (payload) => {
          const newState = payload.new as any;
          if (!newState) return;
          dispatch({
            type: 'SYNC_AGENT_STATE',
            payload: {
              agentId: newState.agent_id,
              zoneId: newState.zone_id,
              buildingId: newState.building_id,
              mood: newState.mood
            }
          } as any);
        }
      )
      .subscribe();

    // 2. 대화 기록 구독 (말풍선 실시간 표시)
    const convoChannel = supabase
      .channel('convo-sync')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'conversations' },
        (payload) => {
          const newConvo = payload.new as any;
          dispatch({
            type: 'SYNC_CONVERSATION',
            payload: {
              agentId: newConvo.agent_id,
              partnerId: newConvo.partner_id,
              line1: newConvo.line1,
              line2: newConvo.line2,
              buildingId: newConvo.building_id,
              zoneId: newConvo.zone_id,
              brandMentioned: newConvo.brand_mentioned
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(agentChannel);
      supabase.removeChannel(convoChannel);
    };
  }, []);

  const currentZoneId = state.currentZoneId;
  const currentZone = useMemo(() => getZoneById(currentZoneId)!, [currentZoneId]);

  // Expose dispatch functions as familiar primitives
  const setAdSlots = useCallback((updater: any) => {
    console.warn("setAdSlots is deprecated. Use dispatch places directly.");
  }, []); // Only for refactoring edge cases where it was returned

  // Clean up expired bubbles & reactions
  useEffect(() => {
    let animationFrameId: number;
    let lastCleanup = Date.now();

    const cleanupLoop = () => {
      const now = Date.now();
      if (now - lastCleanup >= 500) {
        dispatch({ type: 'CLEANUP_EXPIRED', payload: { now } });
        lastCleanup = now;
      }
      animationFrameId = requestAnimationFrame(cleanupLoop);
    };

    animationFrameId = requestAnimationFrame(cleanupLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // === Phase 15.1: Local Simulation Toggle (For Sync Mode) ===
  const isSyncMode = true; // LG 서버 엔진이 주도권을 가짐

  // === Streamable LLM/Template Brand Conversation Engine ===
  const brandDialogueTickRef = useRef(0);
  useEffect(() => {
    if (isSyncMode || state.isPaused || state.tick === 0) return;
    if (state.tick - brandDialogueTickRef.current < 8) return;
    brandDialogueTickRef.current = state.tick;

    // ... (rest of local dialogue logic)

    const agentsByBuilding = new Map<string, typeof state.agents>();
    state.agents.forEach(a => {
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
    const nearbyBrands: NearbyBrand[] = state.adSlots
      .filter(s => s.zoneId === zoneId && s.buildingId === buildingId && s.brand)
      .map(s => ({
        name: s.brand!,
        category: s.brandCategory || 'tech' // Fallback to tech if unknown
      }))
      // Unique by name
      .filter((v, i, arr) => arr.findIndex(b => b.name === v.name) === i);

    const avgAffinity = a1.brandAffinities.reduce((s: number, ba: any) => s + ba.score, 0) / Math.max(a1.brandAffinities.length, 1);

    const matchCtx: DialogueMatchContext = {
      agent1Name: a1.name,
      agent2Name: a2.name,
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
    const isLlmStream = Math.random() > 0.5; // 50% chance to trigger LLM streaming dialogue

    if (isLlmStream) {
      // 1. Create Empty Speech Bubbles
      const b1Id = `llm_stream_${a1.id}_${now}`;
      const b2Id = `llm_stream_${a2.id}_${now}`;

      dispatch({
        type: 'ADD_SPEECH_BUBBLE',
        payload: { id: b1Id, agentId: a1.id, text: '', emoji: '💭', timestamp: now, type: 'dialogue' }
      });

      dispatch({
        type: 'ADD_SPEECH_BUBBLE',
        payload: { id: b2Id, agentId: a2.id, text: '', emoji: '💬', timestamp: now + 500, type: 'dialogue' }
      });

      dispatch({ type: 'ADD_LOG', payload: `⚡ ${a1.avatar} ${a1.name}과 ${a2.avatar} ${a2.name}가 실시간 LLM 대화를 시작합니다!` });

      // 2. Fetch SSE from Brain-LLM Service
      const invokeLLM = async () => {
        try {
          await brainLlmService.streamDialogue(matchCtx, {
            onChunk: (text) => {
              dispatch({
                type: 'UPDATE_SPEECH_BUBBLE',
                payload: { id: b1Id, textChunk: text } // align with reducer's textChunk
              });
            },
            onDone: () => {
              dispatch({ type: 'ADD_LOG', payload: `💬 ${a1.name}와 ${a2.name}의 대화가 종료되었습니다.` });
            },
            onError: (err) => {
              dispatch({ type: 'ADD_LOG', payload: `❌ LLM 대화 중 오류 발생: ${err.message}` });
            }
          });
        } catch (error) {
          console.error('[LLM] Error:', error);
        }
      };

      invokeLLM();
    } else {
      // Original 100% Template-based logic
      dispatch({
        type: 'ADD_SPEECH_BUBBLE',
        payload: {
          id: `tpl_${a1.id}_${now}`,
          agentId: a1.id,
          text: dialogue.line1,
          emoji: dialogue.emoji1,
          timestamp: now,
          type: 'dialogue',
        }
      });

      dispatch({
        type: 'ADD_SPEECH_BUBBLE',
        payload: {
          id: `tpl_${a2.id}_${now}`,
          agentId: a2.id,
          text: dialogue.line2,
          emoji: dialogue.emoji2,
          timestamp: now + 1500,
          type: 'dialogue',
        }
      });

      if (dialogue.brandMentioned) {
        dispatch({ type: 'ADD_LOG', payload: `💬✨ ${a1.avatar} ${a1.name} ↔ ${a2.avatar} ${a2.name}: "${dialogue.line1}" / "${dialogue.line2}" [${dialogue.brandMentioned}]` });
      } else {
        dispatch({ type: 'ADD_LOG', payload: `💬 ${a1.avatar} ${a1.name} ↔ ${a2.avatar} ${a2.name}: "${dialogue.line1}" / "${dialogue.line2}"` });
      }
    }
  }, [state.tick, state.isPaused, state.agents, state.adSlots, dispatch]);

  // Set Visuals for Zone changes directly via dispatch
  useEffect(() => {
    dispatch({ type: 'CHANGE_ZONE', payload: currentZoneId });
  }, [currentZoneId]);

  // Main Simulation Tick via requestAnimationFrame
  useEffect(() => {
    if (isSyncMode || state.isPaused) return;

    let animationFrameId: number;
    let lastTickTime = Date.now();

    const gameLoop = () => {
      const now = Date.now();
      if (now - lastTickTime >= TICK_MS) {
        dispatch({ type: 'TICK_ADVANCE', payload: { now } });
        lastTickTime = now;
      }
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [state.isPaused]);

  const placeBrandAd = useCallback((slotId: string, brandName: string, brandCategory: BrandCategory) => {
    dispatch({ type: 'PLACE_AD', payload: { slotId, brandName, brandCategory } });
  }, [dispatch]);

  const zoneAgents = state.agents;
  const zoneAdSlots = state.adSlots;
  const zoneInteractions = state.interactions.filter(i => i.zoneId === currentZoneId);
  const zoneBubbles = state.speechBubbles.filter(b => {
    const agent = state.agents.find(a => a.id === b.agentId);
    return agent?.currentZoneId === currentZoneId;
  });
  const zoneReactions = state.adReactions.filter(r => {
    const agent = state.agents.find(a => a.id === r.agentId);
    return agent?.currentZoneId === currentZoneId;
  });

  // Compute brand stats from all ad slots
  const brandStats: BrandStats[] = useMemo(() => {
    const activeSlots = state.allAdSlots.filter(s => s.brand);
    if (activeSlots.length === 0) return [];

    const slotData = activeSlots.map(slot => {
      const slotInteractions = state.interactions.filter(i => i.brand === slot.brand);
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
  }, [state.allAdSlots, state.interactions, state.tick]);

  // Generate highlights from recent logs
  const highlights: Highlight[] = useMemo(() => {
    return state.worldLog.slice(0, 10)
      .filter(log => log.includes('"') || log.includes('📢') || log.includes('→'))
      .slice(0, 5)
      .map((log, i) => ({
        id: `hl_${i}_${state.tick}`,
        text: log,
        timestamp: Date.now() - i * 30000,
        type: log.includes('좋아') || log.includes('기대') ? 'positive' as const
          : log.includes('별로') || log.includes('과대') ? 'negative' as const
            : log.includes('📢') ? 'event' as const
              : 'neutral' as const,
      }));
  }, [state.worldLog, state.tick]);

  // League scores
  const leagueSeason = isSeasonActive(DEMO_SEASON, state.tick) ? DEMO_SEASON : null;
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
    return calcLeagueScores(leagueSeason, statsMap, state.tick);
  }, [brandStats, state.tick, leagueSeason]);

  // Detect league lead changes -> world events
  useEffect(() => {
    if (leagueScores.length === 0) return;
    const leader = leagueScores[0].brandId;
    if (prevLeaderRef.current && prevLeaderRef.current !== leader) {
      const evt: WorldEvent = {
        id: `evt_${state.tick}_${leader}`,
        type: 'league.lead_change',
        brandId: leader,
        tick: state.tick,
        message: `${leader}이(가) Brand League 1위를 탈환했습니다!`,
      };
      dispatch({ type: 'LEAGUE_LEAD_CHANGE', payload: { evt, message: evt.message } });
    }
    prevLeaderRef.current = leader;
  }, [leagueScores, state.tick, dispatch]);

  const setIsPaused = useCallback((paused: boolean | ((p: boolean) => boolean)) => {
    const nextPaused = typeof paused === 'function' ? paused(state.isPaused) : paused;
    dispatch({ type: 'SET_PAUSED', payload: nextPaused });
  }, [state.isPaused, dispatch]);

  const setCurrentZoneId = useCallback((zoneId: string) => {
    dispatch({ type: 'CHANGE_ZONE', payload: zoneId });
  }, [dispatch]);

  // Per-zone data for full city view
  const getZoneData = useCallback((zoneId: string) => {
    const z = getZoneById(zoneId);
    if (!z) return null;
    const za = state.allAgents.filter(a => a.currentZoneId === zoneId);
    const zas = state.allAdSlots.filter(s => s.zoneId === zoneId);
    const zi = state.interactions.filter(i => i.zoneId === zoneId);
    const zb = state.speechBubbles.filter(b => {
      const agent = state.allAgents.find(a => a.id === b.agentId);
      return agent?.currentZoneId === zoneId;
    });
    const zr = state.adReactions.filter(r => {
      const agent = state.allAgents.find(a => a.id === r.agentId);
      return agent?.currentZoneId === zoneId;
    });
    return {
      zone: z,
      agents: za,
      adSlots: zas,
      interactions: zi,
      speechBubbles: zb,
      adReactions: zr,
      agentVisuals: state.agentVisuals,
    };
  }, [state.allAgents, state.allAdSlots, state.interactions, state.speechBubbles, state.adReactions, state.agentVisuals]);

  return {
    agents: zoneAgents,
    allAgents: state.allAgents,
    adSlots: zoneAdSlots,
    allAdSlots: state.allAdSlots,
    setAdSlots,
    worldLog: state.worldLog,
    tick: state.tick,
    isPaused: state.isPaused,
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
    agentVisuals: state.agentVisuals,
    llmStatus: state.llmStatus,
    brandStats,
    highlights,
    cityEnergy: state.cityEnergy,
    leagueSeason,
    leagueScores,
    worldEvents: state.worldEvents,
    getZoneData,
    aiConversationLog: state.aiConversationLog,
    changeWeather: (weather: 'sunny' | 'rain' | 'storm' | 'fog') => {
      dispatch({ type: 'CHANGE_WEATHER', payload: weather });
      addMemory.mutate({
        agent_id: 'world',
        content: `기상 이변: 하늘이 ${weather} 상태로 변했습니다.`,
        importance: 4,
        metadata: { weather }
      });
    },
    viewerIntervention: (payload: { type: string; value: string; viewerName: string; targetAgentId?: string }) => {
      dispatch({ type: 'VIEWER_INTERVENTION', payload });
      addMemory.mutate({
        agent_id: payload.targetAgentId || 'world',
        content: `${payload.viewerName}님의 개입: ${payload.type}(${payload.value})`,
        importance: 8,
        metadata: payload
      });
    },
  };
}
