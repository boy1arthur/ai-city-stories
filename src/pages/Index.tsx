import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IsometricMap } from '@/components/IsometricMap';
import { WorldPanel } from '@/components/WorldPanel';
import { WorldLog } from '@/components/WorldLog';
import { TopBar } from '@/components/TopBar';
import { EnergyBar } from '@/components/EnergyBar';
import { SponsorDashboard } from '@/components/SponsorDashboard';
import { TrendingOpinions } from '@/components/TrendingOpinions';
import { WorldEventBanner } from '@/components/WorldEventBanner';
import { AgentProfilePanel } from '@/components/agent/AgentProfilePanel';
import { SlotInteractionModal } from '@/components/SlotInteractionModal';
import { useWorldSimulation } from '@/hooks/useWorldSimulation';
import { useCampaigns } from '@/hooks/useCampaigns';
import { isCampaignActive } from '@/lib/adCampaign';
import { handleSlotInteraction } from '@/lib/slotInteraction';
import type { Building, Agent } from '@/data/world';
import type { Slot } from '@/data/slots';

const Index = () => {
  const sim = useWorldSimulation();
  const {
    agents, allAgents, adSlots, allAdSlots, setAdSlots, worldLog, tick,
    isPaused, setIsPaused, placeBrandAd, buildings, interactions,
    currentZoneId, setCurrentZoneId, currentZone, zones,
    speechBubbles, adReactions, agentVisuals,
    brandStats, highlights, cityEnergy,
    leagueSeason, leagueScores, worldEvents,
  } = sim;

  const { campaigns, createCampaign, endCampaign, updateCampaignSlots } = useCampaigns();

  const [searchParams] = useSearchParams();
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showDashboard, setShowDashboard] = useState(searchParams.get('tab') === 'sponsor');
  const [slotModalData, setSlotModalData] = useState<{ title: string; message: string; emoji: string; slot: Slot } | null>(null);
  const navigate = useNavigate();

  // Sync campaigns → AdSlots brand assignment
  useEffect(() => {
    setAdSlots(prev => prev.map(slot => {
      const activeCampaign = campaigns
        .filter(c => isCampaignActive(c, tick) && c.slotIds.includes(slot.id))
        .sort((a, b) => b.startTick - a.startTick)[0];
      if (activeCampaign) {
        return slot.brand === activeCampaign.brandId ? slot : { ...slot, brand: activeCampaign.brandId };
      }
      return slot;
    }));
  }, [tick, campaigns]); // eslint-disable-line

  const activeAds = adSlots.filter(s => s.brand).length;

  const onSlotClick = (slot: Slot) => {
    handleSlotInteraction(slot, setSlotModalData);
  };

  if (showDashboard) {
    return (
      <SponsorDashboard
        adSlots={adSlots}
        allAdSlots={allAdSlots}
        agents={agents}
        allAgents={allAgents}
        currentZone={currentZone}
        brandStats={brandStats}
        highlights={highlights}
        cityEnergy={cityEnergy}
        campaigns={campaigns}
        currentTick={tick}
        zones={zones}
        leagueSeason={leagueSeason}
        leagueScores={leagueScores}
        worldLog={worldLog}
        worldEvents={worldEvents}
        onCreateCampaign={createCampaign}
        onEndCampaign={endCampaign}
        onBack={() => setShowDashboard(false)}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <TopBar
        tick={tick}
        agentCount={agents.length}
        activeAds={activeAds}
        currentZone={currentZone}
        zones={zones}
        onZoneChange={(id) => {
          setCurrentZoneId(id);
          setSelectedBuilding(null);
          setSelectedAgent(null);
        }}
        onSponsorDashboard={() => setShowDashboard(true)}
        onHome={() => navigate('/')}
        energyBar={<EnergyBar energy={cityEnergy} />}
      />

      <div className="flex-1 relative overflow-hidden">
        <WorldEventBanner events={worldEvents} />
        <IsometricMap
          zone={currentZone}
          buildings={buildings}
          agents={agents}
          adSlots={adSlots}
          interactions={interactions}
          speechBubbles={speechBubbles}
          adReactions={adReactions}
          agentVisuals={agentVisuals}
          energyStatus={cityEnergy.status}
          onBuildingClick={(b) => { setSelectedBuilding(b); setSelectedAgent(null); }}
          onAgentClick={(a) => { setSelectedAgent(a); setSelectedBuilding(null); }}
          onSlotClick={onSlotClick}
        />
        <TrendingOpinions highlights={highlights} />
        <WorldPanel
          selectedBuilding={selectedBuilding}
          selectedAgent={selectedAgent}
          adSlots={adSlots}
          onPlaceAd={placeBrandAd}
          onClose={() => { setSelectedBuilding(null); setSelectedAgent(null); }}
        />
      </div>

      <WorldLog logs={worldLog} isPaused={isPaused} onTogglePause={() => setIsPaused(!isPaused)} />

      {selectedAgent && (
        <AgentProfilePanel
          agent={selectedAgent}
          worldLog={worldLog}
          allAdSlots={adSlots}
          onBrandClick={(brandId) => { setSelectedAgent(null); }}
          onClose={() => setSelectedAgent(null)}
        />
      )}

      {/* Slot interaction modal */}
      <SlotInteractionModal data={slotModalData} onClose={() => setSlotModalData(null)} />
    </div>
  );
};

export default Index;
