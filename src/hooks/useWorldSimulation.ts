import { useState, useEffect, useCallback, useRef } from 'react';
import { AGENTS, BUILDINGS, INITIAL_AD_SLOTS, generateBrandDialogue, type Agent, type AdSlot, type InteractionEvent } from '@/data/world';

const TICK_MS = 3000;

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function useWorldSimulation() {
  const [agents, setAgents] = useState<Agent[]>(AGENTS);
  const [adSlots, setAdSlots] = useState<AdSlot[]>(INITIAL_AD_SLOTS);
  const [worldLog, setWorldLog] = useState<string[]>([]);
  const [tick, setTick] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [interactions, setInteractions] = useState<InteractionEvent[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addLog = useCallback((msg: string) => {
    setWorldLog(prev => [msg, ...prev].slice(0, 100));
  }, []);

  const addInteraction = useCallback((event: InteractionEvent) => {
    setInteractions(prev => [event, ...prev.filter(e => Date.now() - e.timestamp < 5000)].slice(0, 20));
  }, []);

  // Clean up old interactions
  useEffect(() => {
    const cleanup = setInterval(() => {
      setInteractions(prev => prev.filter(e => Date.now() - e.timestamp < 5000));
    }, 1000);
    return () => clearInterval(cleanup);
  }, []);

  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setTick(t => t + 1);

      setAgents(prev => prev.map(agent => {
        if (Math.random() < 0.3) {
          const newBuilding = pickRandom(BUILDINGS);
          if (newBuilding.id !== agent.currentBuildingId) {
            addLog(`${agent.avatar} ${agent.name}이(가) ${newBuilding.name}(으)로 이동`);
            
            const buildingAds = adSlots.filter(s => s.buildingId === newBuilding.id && s.brand);
            const updatedAffinities = [...agent.brandAffinities];
            
            buildingAds.forEach(ad => {
              if (ad.brand) {
                setAdSlots(prev => prev.map(s => s.id === ad.id ? { ...s, impressions: s.impressions + 1 } : s));
                
                const catAffinity = updatedAffinities[0];
                const score = catAffinity?.score ?? 0;
                
                // Always create interaction event for visual feedback
                addInteraction({
                  id: `${agent.id}_${ad.id}_${Date.now()}`,
                  agentId: agent.id,
                  buildingId: newBuilding.id,
                  brand: ad.brand,
                  affinity: score,
                  timestamp: Date.now(),
                });
                
                if (Math.random() < 0.15) {
                  const dialogue = generateBrandDialogue(agent.name, ad.brand, score);
                  addLog(dialogue);
                }
              }
            });

            return { ...agent, currentBuildingId: newBuilding.id, brandAffinities: updatedAffinities };
          }
        }

        if (Math.random() < 0.1) {
          const moods = ['happy', 'curious', 'critical', 'neutral', 'excited'] as const;
          return { ...agent, mood: pickRandom([...moods]) };
        }

        return agent;
      }));
    }, TICK_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, adSlots, addLog, addInteraction]);

  const placeBrandAd = useCallback((slotId: string, brandName: string) => {
    setAdSlots(prev => prev.map(s => s.id === slotId ? { ...s, brand: brandName } : s));
    addLog(`📢 "${brandName}" 광고가 설치되었습니다`);
  }, [addLog]);

  return {
    agents,
    adSlots,
    worldLog,
    tick,
    isPaused,
    setIsPaused,
    placeBrandAd,
    buildings: BUILDINGS,
    interactions,
  };
}
