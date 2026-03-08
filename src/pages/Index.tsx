import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IsometricMap } from '@/components/IsometricMap';
import { FullCityMap } from '@/components/FullCityMap';
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
import { useAuth } from '@/hooks/useAuth';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useSlots, filterPatronTiles } from '@/hooks/useSlots';
import { useIsMobile } from '@/hooks/use-mobile';
import { isCampaignActive } from '@/lib/adCampaign';
import { handleSlotInteraction } from '@/lib/slotInteraction';
import { ZONES } from '@/data/world';
import type { Building, Agent, AdSlot } from '@/data/world';
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
    getZoneData,
  } = sim;

  const { campaigns, createCampaign, endCampaign, updateCampaignSlots } = useCampaigns();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();

  // Full city view state (PC only)
  const [isFullView, setIsFullView] = useState(!isMobile);
  const [focusedZoneId, setFocusedZoneId] = useState<string | null>(null);
  const [autoFocusZoneId, setAutoFocusZoneId] = useState<string | null>(null);

  // Fetch slots only for the active zone (focused zone in full view, current zone otherwise)
  const activeSlotZone = isFullView ? (focusedZoneId || 'plaza') : currentZoneId;
  const { data: dbSlots, isLoading: slotsLoading } = useSlots(activeSlotZone);

  const zoneSlots = useMemo(() => dbSlots ?? [], [dbSlots]);
  const patronSlots = useMemo(() => filterPatronTiles(zoneSlots), [zoneSlots]);

  // Build zone data map for full city view — only focused zone gets real data
  const zoneDataMap = useMemo(() => {
    const map = new Map<string, any>();
    if (!isFullView) return map;
    const activeZones = ZONES.filter(z => !z.locked);
    for (const zone of activeZones) {
      const data = getZoneData(zone.id);
      const isFocused = focusedZoneId === zone.id;
      if (data) {
        map.set(zone.id, {
          ...data,
          // Only pass slots/agents for focused zone to avoid unnecessary rendering
          zoneSlots: isFocused ? zoneSlots : [],
          patronSlots: isFocused ? patronSlots : [],
          agents: isFocused ? data.agents : [],
          adSlots: isFocused ? data.adSlots : [],
          interactions: isFocused ? data.interactions : [],
          speechBubbles: isFocused ? data.speechBubbles : [],
          adReactions: isFocused ? data.adReactions : [],
          agentVisuals: isFocused ? data.agentVisuals : new Map(),
        });
      }
    }
    return map;
  }, [isFullView, getZoneData, zoneSlots, patronSlots, focusedZoneId]);

  const [searchParams] = useSearchParams();
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showDashboard, setShowDashboard] = useState(searchParams.get('tab') === 'sponsor');
  const [slotModalData, setSlotModalData] = useState<{ title: string; message: string; emoji: string; slot: Slot } | null>(null);
  const navigate = useNavigate();

  // Switch to zone view on mobile
  useEffect(() => {
    if (isMobile && isFullView) setIsFullView(false);
  }, [isMobile]); // eslint-disable-line

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

  const onSlotClick = useCallback((slot: Slot) => {
    handleSlotInteraction(slot, setSlotModalData);
  }, []);

  const onAdSlotClick = useCallback((adSlot: AdSlot) => {
    const typeLabels: Record<string, string> = {
      billboard: '빌보드', kiosk: '키오스크', bus_stop: '버스 정류장',
      naming_rights: '네이밍 라이츠', wall_wrap: '벽면 광고',
    };
    const typeName = typeLabels[adSlot.type] || adSlot.type;
    const emoji = adSlot.type === 'billboard' ? '📋' : adSlot.type === 'kiosk' ? '🏪' : adSlot.type === 'bus_stop' ? '🚏' : adSlot.type === 'naming_rights' ? '🏷️' : '🖼️';
    const title = adSlot.brand ? `${adSlot.brand} — ${typeName}` : `빈 ${typeName}`;
    const message = adSlot.brand
      ? `이 ${typeName}에 ${adSlot.brand} 브랜드 광고가 게시되어 있습니다.\n위치: ${adSlot.buildingId}\n광고 유형: ${typeName}`
      : `이 ${typeName}은 아직 비어 있습니다.\n스폰서 대시보드에서 광고를 배치할 수 있어요.`;
    setSlotModalData({ title, message, emoji, slot: { id: adSlot.id, type: 'BRAND_SCREEN', label: title, zone: currentZoneId, ownerType: adSlot.brand ? 'brand' : 'empty', ownerName: adSlot.brand || null, ownerMessage: null, ownerId: null, location: { buildingId: adSlot.buildingId }, displayConfig: {}, triggerType: 'click', aiHookId: null } as Slot });
  }, [currentZoneId]);

  const handleZoneFocus = useCallback((zoneId: string) => {
    setFocusedZoneId(zoneId || null);
    if (zoneId) setCurrentZoneId(zoneId);
  }, [setCurrentZoneId]);

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
          if (isFullView) {
            setFocusedZoneId(id);
            setAutoFocusZoneId(id);
          }
        }}
        onSponsorDashboard={() => setShowDashboard(true)}
        onHome={() => navigate('/')}
        energyBar={<EnergyBar energy={cityEnergy} />}
        isFullView={isFullView}
        onToggleFullView={() => setIsFullView(v => !v)}
      />

      <div className="flex-1 relative overflow-hidden">
        <WorldEventBanner events={worldEvents} />

        {isFullView ? (
          <FullCityMap
            zones={zones}
            zoneDataMap={zoneDataMap}
            energyStatus={cityEnergy.status}
            focusedZoneId={focusedZoneId}
            autoFocusZoneId={autoFocusZoneId}
            onBuildingClick={(b) => { setSelectedBuilding(b); setSelectedAgent(null); }}
            onAgentClick={(a) => { setSelectedAgent(a); setSelectedBuilding(null); }}
            onSlotClick={onSlotClick}
            onAdSlotClick={onAdSlotClick}
            onZoneFocus={handleZoneFocus}
          />
        ) : (
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
            zoneSlots={zoneSlots}
            patronSlots={patronSlots}
            slotsLoading={slotsLoading}
            onBuildingClick={(b) => { setSelectedBuilding(b); setSelectedAgent(null); }}
            onAgentClick={(a) => { setSelectedAgent(a); setSelectedBuilding(null); }}
            onSlotClick={onSlotClick}
            onAdSlotClick={onAdSlotClick}
          />
        )}

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

      <SlotInteractionModal data={slotModalData} onClose={() => setSlotModalData(null)} />
    </div>
  );
};

export default Index;
