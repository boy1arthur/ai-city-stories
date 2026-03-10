import type { BrandCategory } from '@/data/world';

export type AdCampaignStatus = 'scheduled' | 'running' | 'ended';

export interface AdCampaign {
  id: string;
  brandId: string;
  brandCategory: BrandCategory;
  zoneId: string;
  slotIds: string[];
  startTick: number;
  endTick: number;
  status: AdCampaignStatus;
}

export function isCampaignActive(campaign: AdCampaign, currentTick: number): boolean {
  return currentTick >= campaign.startTick && currentTick < campaign.endTick && campaign.status !== 'ended';
}

export function getCampaignStatus(campaign: AdCampaign, currentTick: number): AdCampaignStatus {
  if (campaign.status === 'ended') return 'ended';
  if (currentTick < campaign.startTick) return 'scheduled';
  if (currentTick >= campaign.endTick) return 'ended';
  return 'running';
}
