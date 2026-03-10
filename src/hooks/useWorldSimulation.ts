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

const TICK_MS = 2500;

export function useWorldSimulation() {
  const [state, dispatch] = useReducer(simulationReducer, INITIAL_SIMULATION_STATE);
  const { memories, addMemory } = useAgentMemories();
  const memoriesLoadedRef = useRef(false);

  const prevLeaderRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // === Streamable LLM/Template Brand Conversation Engine ===
  const brandDialogueTickRef = useRef(0);
  useEffect(() => {
    if (state.isPaused || state.tick === 0) return;
    if (state.tick - brandDialogueTickRef.current < 8) return;
    brandDialogueTickRef.current = state.tick;

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

      // 2. Fetch SSE from Supabase Edge Function
      const invokeLLM = async () => {
        try {
          // Switch between Supabase Edge Function or Local LLM (Ollama/Tunnels)
          const localLLMUrl = import.meta.env.VITE_LLM_API_URL;
          const EdgeURL = localLLMUrl
            ? `${localLLMUrl}/v1/chat/completions`
            : import.meta.env.VITE_SUPABASE_URL + '/functions/v1/llm-dialogue';

          console.log(`[LLM] Calling endpoint: ${EdgeURL}`);

          const { data: { session } } = await supabase.auth.getSession();
          const systemPrompt = `당신은 'AI Social World' 시뮬레이션의 에이전트들을 조종하는 마스터 디렉터입니다.
현재 상황: 구역 "${matchCtx.zoneName}", 건물 "${matchCtx.buildingName}".
에이전트 1: ${matchCtx.agent1Name} (성격: ${matchCtx.agent1Personality}, 기분: ${matchCtx.agent1Mood})
에이전트 2: ${matchCtx.agent2Name} (성격: ${matchCtx.agent2Personality}, 기분: ${matchCtx.agent2Mood})
주변 브랜드: ${matchCtx.nearbyBrands.join(', ')}.

대화 지침:
1. 두 에이전트 사이의 자연스럽고 창발적인 대화를 생성하세요.
2. 짧은 대화(최대 2-3회 왕복)로 구성하세요.
3. **중요**: 한국의 인터넷 커뮤니티 감성(K-meme, 초성체 'ㅋㅋ', 'ㅠㅠ' 등)을 적절히 사용하여 생동감을 불어넣으세요.
4. 각자의 성격과 기분에 맞춰 말투를 차별화하세요 (예: 냉철하면 차갑게, 열정적이면 하이텐션으로).
5. 주변 브랜드가 있다면 자연스럽게 언급하거나 브랜드를 주제로 불평/칭찬하게 하세요.
6. 형식: 에이전트이름: 할말\\n에이전트이름: 할말\\n... 
7. 답변은 반드시 한국어로만 작성하세요.`;

          const response = await fetch(EdgeURL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify(localLLMUrl ? {
              model: "llama3", // Ollama default
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: "Start the conversation." }
              ],
              stream: true
            } : { messageContext: matchCtx })
          });

          if (!response.ok || !response.body) {
            dispatch({ type: 'SET_LLM_STATUS', payload: 'error' });
            throw new Error('Edge function fetch failed');
          }

          dispatch({ type: 'SET_LLM_STATUS', payload: 'ready' });

          const reader = response.body.getReader();
          const decoder = new TextDecoder('utf-8');

          let isFirstLine = true;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.substring(6);
                if (dataStr === '[DONE]') break;

                try {
                  const { text } = JSON.parse(dataStr);

                  // Simple heuristic to split dialogue between A1 and A2.
                  // Real implementation would have structured chunks.
                  if (text === '\\n') {
                    isFirstLine = !isFirstLine;
                    continue;
                  }

                  dispatch({
                    type: 'UPDATE_SPEECH_BUBBLE',
                    payload: {
                      id: isFirstLine ? b1Id : b2Id,
                      textChunk: text
                    }
                  });
                } catch (e) {
                  // ignore parse error for chunk fragments
                }
              }
            }
          }
        } catch (error) {
          console.error("LLM Stream Error:", error);
          dispatch({ type: 'SET_LLM_STATUS', payload: 'offline' });
          // Fallback to update bubble with error
          dispatch({ type: 'UPDATE_SPEECH_BUBBLE', payload: { id: b1Id, textChunk: '...대화 연결 지연 중 (로컬 서버 확인 필요)...' } });
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
    if (state.isPaused) return;

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
