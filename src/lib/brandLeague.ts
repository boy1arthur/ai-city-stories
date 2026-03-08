// ===== BRAND LEAGUE SYSTEM =====
// Season-based competitive scoring for brands in AI Social World

export interface BrandLeagueSeason {
  id: string;
  name: string;
  startTick: number;
  endTick: number;
  brandIds: string[];
}

export interface BrandLeagueScore {
  brandId: string;
  rank: number;
  esv: number;
  mentions: number;
  affinity: number;
  totalScore: number;
}

export interface BrandLeagueInput {
  esv: number;
  mentions: number;
  positive: number;
  negative: number;
  avgAffinity?: number;
}

export function isSeasonActive(season: BrandLeagueSeason, currentTick: number): boolean {
  return currentTick >= season.startTick && currentTick <= season.endTick;
}

export function getSeasonProgress(season: BrandLeagueSeason, currentTick: number): number {
  const total = season.endTick - season.startTick;
  if (total <= 0) return 1;
  return Math.min(1, Math.max(0, (currentTick - season.startTick) / total));
}

// Weights for score composition
const W_ESV = 0.45;
const W_MENTIONS = 0.25;
const W_AFFINITY = 0.30;

export function calcLeagueScores(
  season: BrandLeagueSeason,
  brandStats: Map<string, BrandLeagueInput>,
  currentTick: number,
): BrandLeagueScore[] {
  if (!isSeasonActive(season, currentTick)) return [];

  const rawScores = season.brandIds.map(brandId => {
    const stats = brandStats.get(brandId);
    if (!stats) return { brandId, esv: 0, mentions: 0, affinity: 0, rawTotal: 0 };

    const affinityScore = stats.avgAffinity ?? (
      (stats.positive - stats.negative) / Math.max(1, stats.positive + stats.negative) * 100
    );

    return {
      brandId,
      esv: stats.esv,
      mentions: stats.mentions,
      affinity: Math.max(0, affinityScore),
      rawTotal: 0,
    };
  });

  // Normalize each dimension (0-100)
  const maxESV = Math.max(1, ...rawScores.map(s => s.esv));
  const maxMentions = Math.max(1, ...rawScores.map(s => s.mentions));
  const maxAffinity = Math.max(1, ...rawScores.map(s => s.affinity));

  const scored = rawScores.map(s => ({
    ...s,
    totalScore: Math.round(
      W_ESV * (s.esv / maxESV * 100) +
      W_MENTIONS * (s.mentions / maxMentions * 100) +
      W_AFFINITY * (s.affinity / maxAffinity * 100)
    ),
  }));

  scored.sort((a, b) => b.totalScore - a.totalScore);

  return scored.map((s, i) => ({
    brandId: s.brandId,
    rank: i + 1,
    esv: s.esv,
    mentions: s.mentions,
    affinity: Math.round(s.affinity),
    totalScore: s.totalScore,
  }));
}
