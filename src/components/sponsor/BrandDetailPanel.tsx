import React from 'react';
import type { BrandStats } from '@/lib/esv';
import type { BrandLeagueScore } from '@/lib/brandLeague';
import type { Agent, AdSlot, AD_SLOT_LABELS } from '@/data/world';
import type { WorldEvent } from '@/components/WorldEventBanner';
import { getBrandInsight } from '@/lib/brandInsights';
import { VIRTUAL_BRANDS } from '@/data/demoSeed';

interface Props {
  brandId: string;
  brandStats: BrandStats[];
  leagueScores: BrandLeagueScore[];
  agents: Agent[];
  allAdSlots: AdSlot[];
  worldLog: string[];
  worldEvents: WorldEvent[];
  onAgentClick?: (agentId: string) => void;
  onClose: () => void;
}

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

const SLOT_ICONS: Record<string, string> = {
  billboard: '📺',
  wall_wrap: '🎨',
  bus_stop: '🚏',
  kiosk: '📱',
  naming_rights: '👑',
};

const SLOT_LABELS: Record<string, string> = {
  billboard: '빌보드',
  wall_wrap: '월랩',
  bus_stop: '버스정류장',
  kiosk: '키오스크',
  naming_rights: '네이밍 라이츠',
};

export const BrandDetailPanel: React.FC<Props> = ({
  brandId, brandStats, leagueScores, agents, allAdSlots, worldLog, worldEvents,
  onAgentClick, onClose,
}) => {
  const insight = getBrandInsight(brandId, brandStats, leagueScores, agents, worldLog, worldEvents, allAdSlots);
  const virtualBrand = VIRTUAL_BRANDS.find(b => b.name === brandId);
  const brandColor = virtualBrand?.color || 'hsl(210,10%,50%)';

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md h-full bg-card border-l border-border overflow-y-auto animate-slide-in-right"
        onClick={e => e.stopPropagation()}>

        {/* Brand color accent strip */}
        <div className="h-1.5 w-full" style={{ background: brandColor }} />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              {/* SVG Logo */}
              <svg width="44" height="44" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="21" fill={brandColor} opacity="0.15" stroke={brandColor} strokeWidth="1.5" />
                <text x="22" y="22" textAnchor="middle" dominantBaseline="central"
                  fill={brandColor} fontWeight="bold" fontSize="18">
                  {brandId.charAt(0)}
                </text>
              </svg>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="text-lg font-bold text-foreground">{brandId}</h2>
                  {insight.leagueScore && (
                    <span className="text-sm font-semibold" style={{ color: brandColor }}>
                      {insight.leagueScore.rank <= 3 ? RANK_MEDALS[insight.leagueScore.rank - 1] : `#${insight.leagueScore.rank}`}
                    </span>
                  )}
                </div>
                {virtualBrand && (
                  <p className="text-xs text-muted-foreground italic">"{virtualBrand.tagline}"</p>
                )}
                {virtualBrand && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{virtualBrand.category}</span>
                    {insight.adAssets.length > 0 && (
                      <div className="flex gap-0.5">
                        {insight.adAssets.map(a => (
                          <span key={a.type} className="text-xs" title={SLOT_LABELS[a.type]}>
                            {SLOT_ICONS[a.type]}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm p-1">✕</button>
          </div>

          {/* KPI Row */}
          {insight.stats && (
            <div className="grid grid-cols-4 gap-2 mb-5">
              <MiniKPI label="ESV" value={`$${insight.stats.totalESV.toLocaleString()}`} brandColor={brandColor} />
              <MiniKPI label="노출" value={insight.stats.totalImpressions.toLocaleString()} />
              <MiniKPI label="멘션" value={insight.stats.totalMentions.toLocaleString()} />
              <MiniKPI label="긍정률" value={`${Math.round(insight.stats.positiveRatio * 100)}%`} brandColor={brandColor} />
            </div>
          )}

          {/* League Score */}
          {insight.leagueScore && (
            <div className="rounded-lg p-3 mb-5 border" style={{ borderColor: brandColor + '33', background: brandColor + '08' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: brandColor }}>리그 점수</span>
                <span className="text-lg font-bold" style={{ color: brandColor }}>{insight.leagueScore.totalScore}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <ScorePill label="ESV" value={insight.leagueScore.esv} />
                <ScorePill label="멘션" value={insight.leagueScore.mentions} />
                <ScorePill label="호감도" value={insight.leagueScore.affinity} />
              </div>
            </div>
          )}

          {/* Sentiment Bar */}
          {insight.stats && (
            <div className="mb-5">
              <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">감정 분포</div>
              <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                <div className="rounded-l-full" style={{ width: `${Math.round(insight.stats.positiveRatio * 100)}%`, background: 'hsl(145,40%,45%)' }} />
                <div style={{ width: `${Math.round((1 - insight.stats.positiveRatio - insight.stats.negativeRatio) * 100)}%`, background: 'hsl(215,10%,50%)' }} />
                <div className="rounded-r-full" style={{ width: `${Math.round(insight.stats.negativeRatio * 100)}%`, background: 'hsl(0,50%,48%)' }} />
              </div>
              <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                <span>긍정 {Math.round(insight.stats.positiveRatio * 100)}%</span>
                <span>부정 {Math.round(insight.stats.negativeRatio * 100)}%</span>
              </div>
            </div>
          )}

          {/* Ad Assets */}
          {insight.adAssets.length > 0 && (
            <div className="mb-5">
              <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">📦 광고 자산</div>
              <div className="grid grid-cols-2 gap-2">
                {insight.adAssets.map(asset => (
                  <div key={asset.type} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/50">
                    <span className="text-lg">{SLOT_ICONS[asset.type]}</span>
                    <div>
                      <div className="text-xs font-semibold text-foreground">{SLOT_LABELS[asset.type]}</div>
                      <div className="text-[10px] text-muted-foreground">{asset.count}개 슬롯 · {asset.slots.reduce((s, sl) => s + sl.impressions, 0).toLocaleString()} 노출</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Agents */}
          <div className="mb-5">
            <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">🤖 대표 에이전트</div>
            <div className="space-y-1.5">
              {insight.topAgents.slice(0, 5).map(({ agent, affinity, recentMention }) => (
                <div key={agent.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onAgentClick?.(agent.id)}>
                  <span className="text-lg">{agent.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-foreground">{agent.name}</span>
                      <span className="text-[10px] text-muted-foreground">{agent.personality}</span>
                    </div>
                    {recentMention && (
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">"{recentMention}"</p>
                    )}
                  </div>
                  <span className="text-xs font-mono shrink-0" style={{ color: affinity > 0 ? 'hsl(145,40%,50%)' : 'hsl(0,50%,50%)' }}>
                    {affinity > 0 ? '+' : ''}{affinity}
                  </span>
                </div>
              ))}
              {insight.topAgents.length === 0 && (
                <p className="text-xs text-muted-foreground">아직 관련 에이전트가 없습니다.</p>
              )}
            </div>
          </div>

          {/* Recent Events */}
          {insight.recentEvents.length > 0 && (
            <div className="mb-5">
              <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">⚡ 이벤트</div>
              <div className="space-y-1">
                {insight.recentEvents.map(evt => (
                  <div key={evt.id} className="text-xs text-muted-foreground bg-muted/20 rounded px-2 py-1.5">
                    <span className="font-mono text-[10px] mr-1" style={{ color: brandColor }}>T{evt.tick}</span>
                    {evt.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Logs */}
          <div>
            <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">📋 최근 타임라인</div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {insight.recentLogs.length > 0 ? insight.recentLogs.map((log, i) => (
                <div key={i} className="text-[11px] text-muted-foreground leading-relaxed border-l-2 pl-2 py-0.5" style={{ borderColor: brandColor + '40' }}>
                  {log}
                </div>
              )) : (
                <p className="text-xs text-muted-foreground">아직 로그가 없습니다.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function MiniKPI({ label, value, brandColor }: { label: string; value: string; brandColor?: string }) {
  return (
    <div className="bg-muted/30 rounded-lg p-2 text-center">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-sm font-bold" style={brandColor ? { color: brandColor } : undefined}>
        {value}
      </div>
    </div>
  );
}

function ScorePill({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}
