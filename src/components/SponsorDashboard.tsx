import React from 'react';
import type { AdSlot, Agent } from '@/data/world';
import { SPONSOR_TIERS, BUILDINGS, type SponsorTier } from '@/data/world';

interface Props {
  adSlots: AdSlot[];
  agents: Agent[];
  onBack: () => void;
}

export const SponsorDashboard: React.FC<Props> = ({ adSlots, agents, onBack }) => {
  const activeAds = adSlots.filter(s => s.brand);
  const totalImpressions = activeAds.reduce((sum, s) => sum + s.impressions, 0);
  const totalESV = activeAds.reduce((sum, s) => sum + s.esv, 0);
  const uniqueBrands = [...new Set(activeAds.map(s => s.brand))];

  // Sentiment distribution (mock)
  const sentimentDist = { positive: 42, neutral: 35, negative: 23 };

  return (
    <div className="min-h-screen bg-background p-6 font-mono">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              <span className="text-accent">⚡</span> Sponsor Dashboard
            </h1>
            <p className="text-xs text-muted-foreground mt-1">AI Social World 광고 경제 리포트</p>
          </div>
          <button onClick={onBack} className="text-xs font-mono px-3 py-1.5 rounded border border-border hover:border-primary text-foreground transition-colors">
            ← 월드로 돌아가기
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <KPICard label="활성 광고" value={activeAds.length.toString()} sub="slots" color="primary" />
          <KPICard label="총 노출" value={totalImpressions.toLocaleString()} sub="impressions" color="secondary" />
          <KPICard label="총 ESV" value={`$${totalESV.toLocaleString()}`} sub="estimated value" color="accent" />
          <KPICard label="브랜드" value={uniqueBrands.length.toString()} sub="active brands" color="primary" />
        </div>

        {/* Sponsor Tiers */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {(Object.entries(SPONSOR_TIERS) as [SponsorTier, typeof SPONSOR_TIERS[SponsorTier]][]).map(([key, tier]) => (
            <div key={key} className="bg-card border border-border rounded-lg p-4 hover:border-accent/50 transition-colors">
              <div className="text-2xl mb-2">{tier.emoji}</div>
              <h3 className="text-sm font-bold text-foreground">{tier.label} Tier</h3>
              <p className="text-xs text-muted-foreground mt-1">최소 예산: ${tier.minBudget}</p>
            </div>
          ))}
        </div>

        {/* Active Ads Table */}
        <div className="bg-card border border-border rounded-lg p-4 mb-8">
          <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-4">활성 광고 현황</h3>
          {activeAds.length === 0 ? (
            <p className="text-xs text-muted-foreground">아직 배치된 광고가 없습니다. 맵에서 건물을 클릭하여 광고를 배치하세요.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border">
                  <th className="text-left py-2">브랜드</th>
                  <th className="text-left py-2">건물</th>
                  <th className="text-left py-2">타입</th>
                  <th className="text-right py-2">노출</th>
                  <th className="text-right py-2">ESV</th>
                </tr>
              </thead>
              <tbody>
                {activeAds.map(ad => {
                  const building = BUILDINGS.find(b => b.id === ad.buildingId);
                  return (
                    <tr key={ad.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2 text-foreground font-semibold">{ad.brand}</td>
                      <td className="py-2 text-foreground">{building?.emoji} {building?.name}</td>
                      <td className="py-2 text-muted-foreground">{ad.type}</td>
                      <td className="py-2 text-right text-foreground">{ad.impressions}</td>
                      <td className="py-2 text-right text-accent">${ad.esv}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Sentiment Distribution */}
        <div className="bg-card border border-border rounded-lg p-4 mb-8">
          <h3 className="text-xs font-bold text-secondary uppercase tracking-widest mb-4">에이전트 감정 분포</h3>
          <div className="flex gap-4 items-end h-32">
            <SentimentBar label="긍정" value={sentimentDist.positive} color="hsl(152 76% 44%)" />
            <SentimentBar label="중립" value={sentimentDist.neutral} color="hsl(215 16% 52%)" />
            <SentimentBar label="부정" value={sentimentDist.negative} color="hsl(0 72% 50%)" />
          </div>
        </div>

        {/* Agent Mentions */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-xs font-bold text-secondary uppercase tracking-widest mb-4">에이전트 브랜드 반응</h3>
          <div className="grid grid-cols-2 gap-3">
            {agents.slice(0, 4).map(agent => (
              <div key={agent.id} className="flex items-start gap-3 bg-muted/30 rounded-md p-3">
                <span className="text-xl">{agent.avatar}</span>
                <div>
                  <p className="text-xs font-semibold text-foreground">{agent.name}</p>
                  <p className="text-xs text-muted-foreground">{agent.personality}</p>
                  <div className="flex gap-1 mt-1">
                    {agent.brandAffinities.map(ba => (
                      <span key={ba.category} className="text-xs px-1.5 py-0.5 rounded bg-surface-elevated" style={{ color: ba.score > 0 ? 'hsl(152 76% 44%)' : 'hsl(0 72% 50%)' }}>
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
  );
};

function KPICard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  const colorMap: Record<string, string> = {
    primary: 'border-primary/30 text-primary',
    secondary: 'border-secondary/30 text-secondary',
    accent: 'border-accent/30 text-accent',
  };
  return (
    <div className={`bg-card border rounded-lg p-4 ${colorMap[color]?.split(' ')[0] || 'border-border'}`}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colorMap[color]?.split(' ')[1] || 'text-foreground'}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
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
