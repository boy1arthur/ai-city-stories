// ===== Brand Insights Helpers =====
// Read-only utilities for brand detail views

import type { BrandStats } from '@/lib/esv';
import type { BrandLeagueScore } from '@/lib/brandLeague';
import type { Agent } from '@/data/world';
import type { WorldEvent } from '@/components/WorldEventBanner';

export interface BrandInsight {
  brand: string;
  stats: BrandStats | null;
  leagueScore: BrandLeagueScore | null;
  topAgents: { agent: Agent; affinity: number; recentMention: string | null }[];
  recentLogs: string[];
  recentEvents: WorldEvent[];
}

/** Get agents most engaged with a brand (by category match + mentions in logs) */
export function getBrandTopAgents(
  brandId: string,
  agents: Agent[],
  worldLog: string[],
  limit = 5,
): { agent: Agent; affinity: number; recentMention: string | null }[] {
  const scored = agents.map(agent => {
    // Sum affinity from matching categories
    const affinitySum = agent.brandAffinities.reduce((s, ba) => s + ba.score, 0);
    // Count mentions in logs
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

/** Assemble full brand insight */
export function getBrandInsight(
  brandId: string,
  brandStats: BrandStats[],
  leagueScores: BrandLeagueScore[],
  agents: Agent[],
  worldLog: string[],
  worldEvents: WorldEvent[],
): BrandInsight {
  return {
    brand: brandId,
    stats: brandStats.find(b => b.brand === brandId) || null,
    leagueScore: leagueScores.find(s => s.brandId === brandId) || null,
    topAgents: getBrandTopAgents(brandId, agents, worldLog),
    recentLogs: getBrandRecentLogs(brandId, worldLog),
    recentEvents: worldEvents.filter(e => e.brandId === brandId).slice(0, 5),
  };
}
