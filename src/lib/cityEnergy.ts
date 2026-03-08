// ===== CITY ENERGY SYSTEM =====
// The city runs on sponsor energy — no ads means the city fades

export type CityEnergyStatus = 'stable' | 'low' | 'critical';

export interface CityEnergyState {
  value: number;       // 0~100
  status: CityEnergyStatus;
}

export interface CityEnergyContext {
  activeCampaignCount: number;
  totalESV: number;
}

export function initCityEnergy(): CityEnergyState {
  return { value: 65, status: 'stable' };
}

function getStatus(value: number): CityEnergyStatus {
  if (value >= 60) return 'stable';
  if (value >= 30) return 'low';
  return 'critical';
}

export function tickCityEnergy(
  current: CityEnergyState,
  ctx: CityEnergyContext,
): CityEnergyState {
  // Natural decay per tick
  const BASE_DECAY = 0.35;

  // Campaigns counteract decay and add energy
  const campaignBoost = ctx.activeCampaignCount * 0.25;

  // High ESV provides stability bonus
  const esvBonus = Math.min(0.3, ctx.totalESV * 0.00005);

  // Net change
  const delta = -BASE_DECAY + campaignBoost + esvBonus;

  const newValue = Math.max(0, Math.min(100, current.value + delta));

  return {
    value: newValue,
    status: getStatus(newValue),
  };
}
