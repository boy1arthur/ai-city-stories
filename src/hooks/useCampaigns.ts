import { useState, useCallback } from 'react';
import type { AdCampaign } from '@/lib/adCampaign';

let campaignIdCounter = 0;

// Demo seed campaigns
const DEMO_CAMPAIGNS: AdCampaign[] = [
  { id: 'camp_demo_1', brandId: 'NovaTech', zoneId: 'plaza', slotIds: ['plaza_arena_naming_rights_0', 'plaza_arena_billboard_0'], startTick: 0, endTick: 500, status: 'running' },
  { id: 'camp_demo_2', brandId: 'BrewBean', zoneId: 'plaza', slotIds: ['plaza_tavern_billboard_0', 'plaza_garden_kiosk_0'], startTick: 0, endTick: 400, status: 'running' },
  { id: 'camp_demo_3', brandId: 'Lumière', zoneId: 'plaza', slotIds: ['plaza_plaza_wall_wrap_0', 'plaza_plaza_bus_stop_0'], startTick: 0, endTick: 450, status: 'running' },
  { id: 'camp_demo_4', brandId: 'EduSpark', zoneId: 'plaza', slotIds: ['plaza_library_billboard_0', 'plaza_library_bus_stop_0'], startTick: 0, endTick: 350, status: 'running' },
  { id: 'camp_demo_5', brandId: 'FinFlow', zoneId: 'plaza', slotIds: ['plaza_oracle_kiosk_0', 'plaza_oracle_wall_wrap_0'], startTick: 0, endTick: 300, status: 'running' },
];

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>(DEMO_CAMPAIGNS);

  const createCampaign = useCallback((input: {
    brandId: string;
    zoneId: string;
    slotIds: string[];
    durationTicks: number;
    startTick: number;
  }) => {
    const id = `camp_${Date.now()}_${++campaignIdCounter}`;
    const newCampaign: AdCampaign = {
      id,
      brandId: input.brandId,
      zoneId: input.zoneId,
      slotIds: input.slotIds,
      startTick: input.startTick,
      endTick: input.startTick + input.durationTicks,
      status: 'scheduled',
    };
    setCampaigns(prev => [...prev, newCampaign]);
  }, []);

  const endCampaign = useCallback((id: string) => {
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: 'ended' as const } : c));
  }, []);

  const updateCampaignSlots = useCallback((id: string, slotIds: string[]) => {
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, slotIds } : c));
  }, []);

  return { campaigns, createCampaign, endCampaign, updateCampaignSlots };
}
