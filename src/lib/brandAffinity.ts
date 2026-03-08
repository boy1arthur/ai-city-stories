// ===== BRAND AFFINITY SYSTEM =====
// Structured model for tracking agent-brand relationships

export interface BrandAffinityScore {
  category: string;
  brand: string;
  /** Base affinity from persona x category match (-100 to 100) */
  baseAffinity: number;
  /** Accumulated exposure score from ad views (0+) */
  exposureScore: number;
  /** Accumulated interaction score from mentions/quests/items (0+) */
  interactionScore: number;
}

/** Compute total affinity score from components */
export function calcTotalAffinity(aff: BrandAffinityScore): number {
  // Weights can be tuned later
  const W_BASE = 1.0;
  const W_EXPOSURE = 0.3;
  const W_INTERACTION = 0.5;
  return (
    aff.baseAffinity * W_BASE +
    aff.exposureScore * W_EXPOSURE +
    aff.interactionScore * W_INTERACTION
  );
}

/** Create a new affinity entry */
export function createAffinity(
  category: string,
  brand: string,
  baseAffinity: number,
): BrandAffinityScore {
  return { category, brand, baseAffinity, exposureScore: 0, interactionScore: 0 };
}

/** Record an ad exposure (agent saw the ad) */
export function recordExposure(aff: BrandAffinityScore, weight = 1): BrandAffinityScore {
  return { ...aff, exposureScore: aff.exposureScore + weight };
}

/** Record an interaction (mention, quest, item use) */
export function recordInteraction(aff: BrandAffinityScore, weight = 1): BrandAffinityScore {
  return { ...aff, interactionScore: aff.interactionScore + weight };
}

/** Sentiment bucket from total score */
export function getSentiment(totalScore: number): 'positive' | 'neutral' | 'negative' {
  if (totalScore > 30) return 'positive';
  if (totalScore > -10) return 'neutral';
  return 'negative';
}
