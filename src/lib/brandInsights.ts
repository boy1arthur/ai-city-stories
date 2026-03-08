// ===== Brand Insights Helpers =====
// Read-only utilities for brand detail views

import type { BrandStats } from '@/lib/esv';
import type { BrandLeagueScore } from '@/lib/brandLeague';
import type { Agent, AdSlot, AdSlotType, AD_SLOT_LABELS } from '@/data/world';
import type { WorldEvent } from '@/components/WorldEventBanner';

export interface BrandAdAsset {
  type: AdSlotType;
  count: number;
  slots: AdSlot[];
}

export interface BrandInsight {
  brand: string;
  stats: BrandStats | null;
  leagueScore: BrandLeagueScore | null;
  topAgents: { agent: Agent; affinity: number; recentMention: string | null }[];
  recentLogs: string[];
  recentEvents: WorldEvent[];
  adAssets: BrandAdAsset[];
}

/** Get agents most engaged with a brand (by category match + mentions in logs) */
export function getBrandTopAgents(
  brandId: string,
  agents: Agent[],
  worldLog: string[],
  limit = 5,
): { agent: Agent; affinity: number; recentMention: string | null }[] {
  const scored = agents.map(agent => {
    const affinitySum = agent.brandAffinities.reduce((s, ba) => s + ba.score, 0);
    const mentionLogs = worldLog.filter(
      log => log.includes(agent.name) && log.includes(brandId)
    );
    const mentionBonus = mentionLogs.length * 10;
    return {
      agent,
      affinity: affinitySum + mentionBonus,
      recentMention: mentionLogs[0] || null,
    };
  });

  return scored
    .sort((a, b) => b.affinity - a.affinity)
    .slice(0, limit);
}

/** Get recent logs mentioning a brand */
export function getBrandRecentLogs(brandId: string, worldLog: string[], limit = 10): string[] {
  return worldLog.filter(log => log.includes(brandId)).slice(0, limit);
}

/** Get ad assets (slots) grouped by type for a brand */
export function getBrandAdAssets(brandId: string, allAdSlots: AdSlot[]): BrandAdAsset[] {
  const brandSlots = allAdSlots.filter(s => s.brand === brandId);
  const typeMap = new Map<AdSlotType, AdSlot[]>();
  for (const slot of brandSlots) {
    const arr = typeMap.get(slot.type) || [];
    arr.push(slot);
    typeMap.set(slot.type, arr);
  }
  return Array.from(typeMap.entries()).map(([type, slots]) => ({
    type,
    count: slots.length,
    slots,
  }));
}

/** Assemble full brand insight */
export function getBrandInsight(
  brandId: string,
  brandStats: BrandStats[],
  leagueScores: BrandLeagueScore[],
  agents: Agent[],
  worldLog: string[],
  worldEvents: WorldEvent[],
  allAdSlots: AdSlot[] = [],
): BrandInsight {
  return {
    brand: brandId,
    stats: brandStats.find(b => b.brand === brandId) || null,
    leagueScore: leagueScores.find(s => s.brandId === brandId) || null,
    topAgents: getBrandTopAgents(brandId, agents, worldLog),
    recentLogs: getBrandRecentLogs(brandId, worldLog),
    recentEvents: worldEvents.filter(e => e.brandId === brandId).slice(0, 5),
    adAssets: getBrandAdAssets(brandId, allAdSlots),
  };
}
