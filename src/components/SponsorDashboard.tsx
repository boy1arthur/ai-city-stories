import React from 'react';
import type { AdSlot, Agent, Zone } from '@/data/world';
import { SPONSOR_TIERS, ZONES, type SponsorTier } from '@/data/world';
import type { BrandStats } from '@/lib/esv';
import type { CityEnergyState } from '@/lib/cityEnergy';
import type { AdCampaign } from '@/lib/adCampaign';
import type { Highlight } from '@/components/sponsor/TodayHighlights';
import { BrandRanking } from '@/components/sponsor/BrandRanking';
import { TodayHighlights } from '@/components/sponsor/TodayHighlights';
import { CampaignForm } from '@/components/sponsor/CampaignForm';
import { CampaignList } from '@/components/sponsor/CampaignList';
import { EnergyBar } from '@/components/EnergyBar';

interface Props {
  adSlots: AdSlot[];
  allAdSlots: AdSlot[];
  agents: Agent[];
  currentZone: Zone;
  brandStats: BrandStats[];
  highlights: Highlight[];
  cityEnergy: CityEnergyState;
  campaigns: AdCampaign[];
  currentTick: number;
  zones: Zone[];
  onCreateCampaign: (input: { brandId: string; zoneId: string; slotIds: string[]; durationTicks: number; startTick: number }) => void;
  onEndCampaign: (id: string) => void;
  onBack: () => void;
}

export const SponsorDashboard: React.FC<Props> = ({
  adSlots, allAdSlots, agents, currentZone, brandStats, highlights,
  cityEnergy, campaigns, currentTick, zones,
  onCreateCampaign, onEndCampaign, onBack,
}) => {
  const activeAds = allAdSlots.filter(s => s.brand);
  const zoneActiveAds = adSlots.filter(s => s.brand);
  const totalImpressions = activeAds.reduce((sum, s) => sum + s.impressions, 0);
  const totalESV = activeAds.reduce((sum, s) => sum + s.esv, 0);
  const uniqueBrands = [...new Set(activeAds.map(s => s.brand))];

  const premiumSlots = adSlots.filter(s => s.priority === 'premium');
  const standardSlots = adSlots.filter(s => s.priority === 'standard');
  const basicSlots = adSlots.filter(s => s.priority === 'basic');

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              <span className="text-accent">⚡</span> Sponsor Dashboard
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {currentZone.emoji} {currentZone.name} — AI Social World 광고 경제 리포트
            </p>
          </div>
          <div className="flex items-center gap-4">
            <EnergyBar energy={cityEnergy} />
            <button onClick={onBack} className="text-xs px-3 py-1.5 rounded border border-border hover:border-primary text-foreground transition-colors font-medium">
              ← 월드로 돌아가기
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          <KPICard label="활성 광고" value={activeAds.length.toString()} sub="전체 슬롯" color="primary" />
          <KPICard label="이 구역" value={zoneActiveAds.length.toString()} sub={currentZone.name} color="accent" />
          <KPICard label="총 노출" value={totalImpressions.toLocaleString()} sub="impressions" color="primary" />
          <KPICard label="총 ESV" value={`$${totalESV.toLocaleString()}`} sub="estimated value" color="accent" />
          <KPICard label="브랜드" value={uniqueBrands.length.toString()} sub="active brands" color="primary" />
        </div>

        {/* Brand Ranking + Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <BrandRanking brandStats={brandStats} />
          <TodayHighlights highlights={highlights} />
        </div>

        {/* Campaign Management */}
        <div className="space-y-4 mb-8">
          <CampaignForm zones={zones} allAdSlots={allAdSlots} currentTick={currentTick} onCreateCampaign={onCreateCampaign} />
          <CampaignList campaigns={campaigns} currentTick={currentTick} onEndCampaign={onEndCampaign} />
        </div>

        {/* Zone Inventory */}
        <div className="bg-card border border-border rounded-lg p-4 mb-8">
          <h3 className="text-xs font-semibold text-accent uppercase tracking-wider mb-4">📦 {currentZone.name} 광고 인벤토리</h3>
          <div className="grid grid-cols-3 gap-4">
            <InventoryCard label="프리미엄" slots={premiumSlots} color="text-accent" desc="네이밍 라이츠" />
            <InventoryCard label="스탠다드" slots={standardSlots} color="text-primary" desc="빌보드, 월랩" />
            <InventoryCard label="베이직" slots={basicSlots} color="text-muted-foreground" desc="키오스크, 버스정류장" />
          </div>
        </div>

        {/* District Overview */}
        <div className="bg-card border border-border rounded-lg p-4 mb-8">
          <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-4">🗺️ 디스트릭트 현황</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ZONES.map(zone => {
              const zSlots = allAdSlots.filter(s => s.zoneId === zone.id);
              const zActive = zSlots.filter(s => s.brand).length;
              return (
                <div key={zone.id} className={`rounded-lg border p-3 ${zone.locked ? 'border-border/50 opacity-50' : 'border-border hover:border-primary/40'} transition-colors`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{zone.emoji}</span>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{zone.name}</p>
                      <p className="text-xs text-muted-foreground">{zone.theme}</p>
                    </div>
                  </div>
                  {zone.locked ? (
                    <p className="text-xs text-muted-foreground">🔒 Coming Soon</p>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-primary font-mono">{zActive}/{zSlots.length} 슬롯</span>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${zSlots.length > 0 ? (zActive / zSlots.length) * 100 : 0}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sponsor Tiers */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {(Object.entries(SPONSOR_TIERS) as [SponsorTier, typeof SPONSOR_TIERS[SponsorTier]][]).map(([key, tier]) => (
            <div key={key} className="bg-card border border-border rounded-lg p-4 hover:border-accent/50 transition-colors">
              <div className="text-2xl mb-2">{tier.emoji}</div>
              <h3 className="text-sm font-bold text-foreground">{tier.label} Tier</h3>
              <p className="text-xs text-muted-foreground mt-1">최소 예산: ${tier.minBudget}</p>
              <ul className="mt-2 space-y-0.5">
                {tier.perks.map(p => (
                  <li key={p} className="text-xs text-muted-foreground">• {p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Sentiment + Agent reactions */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-4">감정 분포</h3>
            <div className="flex gap-4 items-end h-32">
              <SentimentBar label="긍정" value={42} color="hsl(145,35%,42%)" />
              <SentimentBar label="중립" value={35} color="hsl(215,12%,55%)" />
              <SentimentBar label="부정" value={23} color="hsl(0,60%,48%)" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-4">에이전트 반응</h3>
            <div className="space-y-2">
              {agents.slice(0, 4).map(agent => (
                <div key={agent.id} className="flex items-center gap-2 bg-muted/30 rounded p-2">
                  <span className="text-lg">{agent.avatar}</span>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-foreground">{agent.name}</p>
                    <div className="flex gap-1 mt-0.5">
                      {agent.brandAffinities.map(ba => (
                        <span key={ba.category} className="text-xs px-1 py-0.5 rounded bg-muted"
                          style={{ color: ba.score > 0 ? 'hsl(145,35%,50%)' : 'hsl(0,60%,50%)' }}>
                          {ba.category}: {ba.score > 0 ? '+' : ''}{ba.score}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function KPICard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  const colorMap: Record<string, string> = {
    primary: 'border-primary/30 text-primary',
    accent: 'border-accent/30 text-accent',
  };
  return (
    <div className={`bg-card border rounded-lg p-3 ${colorMap[color]?.split(' ')[0] || 'border-border'}`}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-xl font-bold ${colorMap[color]?.split(' ')[1] || 'text-foreground'}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function InventoryCard({ label, slots, color, desc }: { label: string; slots: AdSlot[]; color: string; desc: string }) {
  const filled = slots.filter(s => s.brand).length;
  return (
    <div className="text-center">
      <p className={`text-2xl font-bold ${color}`}>{filled}/{slots.length}</p>
      <p className="text-xs font-semibold text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}

function SentimentBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex-1 flex flex-col items-center gap-1">
      <div className="w-full rounded-t-sm" style={{ height: `${value * 1.2}px`, backgroundColor: color, opacity: 0.8 }} />
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-bold text-foreground">{value}%</span>
    </div>
  );
}
