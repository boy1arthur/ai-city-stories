import { useState, useEffect, useCallback, useRef } from 'react';
import { AGENTS, BUILDINGS, INITIAL_AD_SLOTS, generateBrandDialogue, type Agent, type AdSlot } from '@/data/world';

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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addLog = useCallback((msg: string) => {
    setWorldLog(prev => [msg, ...prev].slice(0, 100));
  }, []);

  // Simulation tick
  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setTick(t => t + 1);

      setAgents(prev => prev.map(agent => {
        // 30% chance to move
        if (Math.random() < 0.3) {
          const newBuilding = pickRandom(BUILDINGS);
          if (newBuilding.id !== agent.currentBuildingId) {
            addLog(`${agent.avatar} ${agent.name}이(가) ${newBuilding.name}(으)로 이동`);
            
            // Check for ads at new building and update affinity
            const buildingAds = adSlots.filter(s => s.buildingId === newBuilding.id && s.brand);
            const updatedAffinities = [...agent.brandAffinities];
            
            buildingAds.forEach(ad => {
              if (ad.brand) {
                // Increase impressions
                setAdSlots(prev => prev.map(s => s.id === ad.id ? { ...s, impressions: s.impressions + 1 } : s));
                
                // Generate dialogue 10% of the time
                if (Math.random() < 0.1) {
                  const catAffinity = updatedAffinities.find(a => true); // simplified
                  const score = catAffinity?.score ?? 0;
                  const dialogue = generateBrandDialogue(agent.name, ad.brand, score);
                  addLog(dialogue);
                }
              }
            });

            return { ...agent, currentBuildingId: newBuilding.id, brandAffinities: updatedAffinities };
          }
        }

        // 10% chance to change mood
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
  }, [isPaused, adSlots, addLog]);

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
  };
}
