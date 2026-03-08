import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Agent, AdSlot } from '@/data/world';

export interface AIConversationLine {
  agentName: string;
  text: string;
  emoji: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  brandMention: string;
}

export interface AIConversation {
  lines: AIConversationLine[];
  topic: string;
  brandSentimentSummary: {
    brand: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    reason: string;
  }[];
}

interface AgentChatOptions {
  /** Minimum ticks between AI calls */
  cooldownTicks: number;
  /** Whether AI chat is enabled */
  enabled: boolean;
}

export function useAgentChat(options: AgentChatOptions = { cooldownTicks: 25, enabled: true }) {
  const lastCallTick = useRef(0);
  const pendingRef = useRef(false);

  const generateConversation = useCallback(async (
    type: 'social' | 'brand_reaction' | 'event_reaction',
    agents: Agent[],
    context: {
      zone: string;
      building: string;
      nearbyBrands?: string[];
      brandAffinity?: number;
      eventDescription?: string;
    }
  ): Promise<AIConversation | null> => {
    if (!options.enabled || pendingRef.current) return null;

    pendingRef.current = true;
    try {
      const { data, error } = await supabase.functions.invoke('agent-chat', {
        body: {
          type,
          agents: agents.map(a => ({
            name: a.name,
            personality: a.personality,
            mood: a.mood,
            favoriteCategories: a.favoriteCategories,
          })),
          context,
        },
      });

      if (error) {
        console.error('Agent chat error:', error);
        return null;
      }

      return data as AIConversation;
    } catch (e) {
      console.error('Agent chat failed:', e);
      return null;
    } finally {
      pendingRef.current = false;
    }
  }, [options.enabled]);

  const shouldTrigger = useCallback((currentTick: number): boolean => {
    if (!options.enabled) return false;
    if (pendingRef.current) return false;
    if (currentTick - lastCallTick.current < options.cooldownTicks) return false;
    lastCallTick.current = currentTick;
    return true;
  }, [options.cooldownTicks, options.enabled]);

  /** Find nearby brands for agents at a building */
  const getNearbyBrands = useCallback((
    agentZoneId: string,
    buildingId: string,
    adSlots: AdSlot[]
  ): string[] => {
    return adSlots
      .filter(s => s.zoneId === agentZoneId && s.buildingId === buildingId && s.brand)
      .map(s => s.brand!)
      .filter((v, i, arr) => arr.indexOf(v) === i);
  }, []);

  return {
    generateConversation,
    shouldTrigger,
    getNearbyBrands,
  };
}
