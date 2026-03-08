import React from 'react';
import type { BrandStats } from '@/lib/esv';
import type { BrandLeagueScore } from '@/lib/brandLeague';
import type { Agent } from '@/data/world';
import type { WorldEvent } from '@/components/WorldEventBanner';
import { getBrandInsight } from '@/lib/brandInsights';
import { VIRTUAL_BRANDS } from '@/data/demoSeed';

interface Props {
  brandId: string;
  brandStats: BrandStats[];
  leagueScores: BrandLeagueScore[];
  agents: Agent[];
  worldLog: string[];
  worldEvents: WorldEvent[];
  onAgentClick?: (agentId: string) => void;
  onClose: () => void;
}

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

export const BrandDetailPanel: React.FC<Props> = ({
  brandId, brandStats, leagueScores, agents, worldLog, worldEvents,
  onAgentClick, onClose,
}) => {
  const insight = getBrandInsight(brandId, brandStats, leagueScores, agents, worldLog, worldEvents);
  const virtualBrand = VIRTUAL_BRANDS.find(b => b.name === brandId);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md h-full bg-card border-l border-border overflow-y-auto animate-slide-in-right"
        onClick={e => e.stopPropagation()}>
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {virtualBrand && (
                  <span className="w-3 h-3 rounded-full inline-block" style={{ background: virtualBrand.color }} />
                )}
                <h2 className="text-lg font-bold text-foreground">{brandId}</h2>
                {insight.leagueScore && (
                  <span className="text-sm">
                    {insight.leagueScore.rank <= 3 ? RANK_MEDALS[insight.leagueScore.rank - 1] : `#${insight.leagueScore.rank}`}
                  </span>
                )}
              </div>
              {virtualBrand && (
                <p className="text-xs text-muted-foreground italic">"{virtualBrand.tagline}"</p>
              )}
              {virtualBrand && (
                <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{virtualBrand.category}</span>
              )}
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm p-1">✕</button>
          </div>

          {/* KPI Row */}
          {insight.stats && (
            <div className="grid grid-cols-4 gap-2 mb-5">
              <MiniKPI label="ESV" value={`$${insight.stats.totalESV.toLocaleString()}`} />
              <MiniKPI label="노출" value={insight.stats.totalImpressions.toLocaleString()} />
              <MiniKPI label="멘션" value={insight.stats.totalMentions.toLocaleString()} />
              <MiniKPI label="긍정률" value={`${Math.round(insight.stats.positiveRatio * 100)}%`} accent />
            </div>
          )}

          {/* League Score */}
          {insight.leagueScore && (
            <div className="bg-muted/40 rounded-lg p-3 mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">리그 점수</span>
                <span className="text-lg font-bold text-accent">{insight.leagueScore.totalScore}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-xs text-muted-foreground">ESV</div>
                  <div className="text-sm font-semibold text-foreground">{insight.leagueScore.esv}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">멘션</div>
                  <div className="text-sm font-semibold text-foreground">{insight.leagueScore.mentions}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">호감도</div>
                  <div className="text-sm font-semibold text-foreground">{insight.leagueScore.affinity}</div>
                </div>
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
                  <span className="text-xs font-mono text-accent shrink-0">{affinity > 0 ? '+' : ''}{affinity}</span>
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
                    <span className="font-mono text-[10px] text-accent mr-1">T{evt.tick}</span>
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
                <div key={i} className="text-[11px] text-muted-foreground leading-relaxed border-l-2 border-border pl-2 py-0.5">
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

function MiniKPI({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-muted/30 rounded-lg p-2 text-center">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={`text-sm font-bold ${accent ? 'text-accent' : 'text-foreground'}`}>{value}</div>
    </div>
  );
}
