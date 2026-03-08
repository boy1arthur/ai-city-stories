import React, { useState } from 'react';
import { IsometricMap } from '@/components/IsometricMap';
import { WorldPanel } from '@/components/WorldPanel';
import { WorldLog } from '@/components/WorldLog';
import { TopBar } from '@/components/TopBar';
import { SponsorDashboard } from '@/components/SponsorDashboard';
import { useWorldSimulation } from '@/hooks/useWorldSimulation';
import type { Building, Agent } from '@/data/world';

const Index = () => {
  const {
    agents, allAgents, adSlots, allAdSlots, worldLog, tick,
    isPaused, setIsPaused, placeBrandAd, buildings, interactions,
    currentZoneId, setCurrentZoneId, currentZone, zones,
    speechBubbles, adReactions, agentVisuals,
  } = useWorldSimulation();

  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);

  const activeAds = adSlots.filter(s => s.brand).length;

  if (showDashboard) {
    return (
      <SponsorDashboard
        adSlots={adSlots}
        allAdSlots={allAdSlots}
        agents={agents}
        currentZone={currentZone}
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
      />

      <div className="flex-1 relative overflow-hidden">
        <IsometricMap
          zone={currentZone}
          buildings={buildings}
          agents={agents}
          adSlots={adSlots}
          interactions={interactions}
          speechBubbles={speechBubbles}
          adReactions={adReactions}
          agentVisuals={agentVisuals}
          onBuildingClick={(b) => { setSelectedBuilding(b); setSelectedAgent(null); }}
          onAgentClick={(a) => { setSelectedAgent(a); setSelectedBuilding(null); }}
        />
        <WorldPanel
          selectedBuilding={selectedBuilding}
          selectedAgent={selectedAgent}
          adSlots={adSlots}
          onPlaceAd={placeBrandAd}
          onClose={() => { setSelectedBuilding(null); setSelectedAgent(null); }}
        />
      </div>

      <WorldLog logs={worldLog} isPaused={isPaused} onTogglePause={() => setIsPaused(!isPaused)} />
    </div>
  );
};

export default Index;
