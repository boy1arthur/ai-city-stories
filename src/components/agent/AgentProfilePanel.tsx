import React from 'react';
import type { Agent, AdSlot } from '@/data/world';
import { VIRTUAL_BRANDS } from '@/data/demoSeed';

interface Props {
  agent: Agent;
  worldLog: string[];
  allAdSlots?: AdSlot[];
  onBrandClick?: (brandId: string) => void;
  onClose: () => void;
}

const MOOD_INFO: Record<string, { emoji: string; label: string; color: string }> = {
  happy:    { emoji: '😊', label: '행복', color: 'hsl(145,50%,50%)' },
  excited:  { emoji: '🤩', label: '흥분', color: 'hsl(38,70%,55%)' },
  critical: { emoji: '😤', label: '비판적', color: 'hsl(0,55%,50%)' },
  curious:  { emoji: '🧐', label: '호기심', color: 'hsl(210,55%,55%)' },
  neutral:  { emoji: '😐', label: '평온', color: 'hsl(215,10%,55%)' },
};

const PERSONALITY_TAGS: Record<string, string[]> = {
  'agent_nova':   ['tech enthusiast', 'explorer', 'early adopter'],
  'agent_echo':   ['trend analyst', 'foodie', 'social butterfly'],
  'agent_cipher': ['data scientist', 'skeptic', 'detail-oriented'],
  'agent_sage':   ['scholar', 'health conscious', 'wisdom seeker'],
  'agent_blaze':  ['creator', 'passionate', 'fashion forward'],
  'agent_frost':  ['finance skeptic', 'cold analyst', 'minimalist'],
  'agent_luna':   ['artist', 'dreamer', 'aesthetic lover'],
  'agent_bolt':   ['speed runner', 'tech savvy', 'competitive'],
};

const SLOT_LABELS: Record<string, string> = {
  billboard: '빌보드',
  wall_wrap: '월랩',
  bus_stop: '버스정류장',
  kiosk: '키오스크',
  naming_rights: '네이밍 라이츠',
};

export const AgentProfilePanel: React.FC<Props> = ({ agent, worldLog, allAdSlots, onBrandClick, onClose }) => {
  const mood = MOOD_INFO[agent.mood] || MOOD_INFO.neutral;
  const tags = PERSONALITY_TAGS[agent.id] || [];
  const agentLogs = worldLog.filter(log => log.includes(agent.name)).slice(0, 8);

  // Sort affinities for display
  const sortedAffinities = [...agent.brandAffinities].sort((a, b) => b.score - a.score);
  const maxAbs = Math.max(1, ...sortedAffinities.map(a => Math.abs(a.score)));

  // Ad exposure: count brands near agent's current building
  const exposureData = React.useMemo(() => {
    if (!allAdSlots) return [];
    const buildingSlots = allAdSlots.filter(
      s => s.brand && s.zoneId === agent.currentZoneId && s.buildingId === agent.currentBuildingId
    );
    // Also count log mentions per brand
    const brandMap = new Map<string, { slotTypes: Set<string>; mentions: number }>();
    for (const slot of buildingSlots) {
      const entry = brandMap.get(slot.brand!) || { slotTypes: new Set(), mentions: 0 };
      entry.slotTypes.add(slot.type);
      brandMap.set(slot.brand!, entry);
    }
    // Add mention counts from logs
    const brands = VIRTUAL_BRANDS.map(b => b.name);
    for (const brand of brands) {
      const mentionCount = agentLogs.filter(l => l.includes(brand)).length;
      if (mentionCount > 0) {
        const entry = brandMap.get(brand) || { slotTypes: new Set(), mentions: 0 };
        entry.mentions = mentionCount;
        brandMap.set(brand, entry);
      }
    }
    return Array.from(brandMap.entries())
      .map(([brand, data]) => ({ brand, slotTypes: Array.from(data.slotTypes), mentions: data.mentions }))
      .sort((a, b) => (b.slotTypes.length + b.mentions) - (a.slotTypes.length + a.mentions));
  }, [allAdSlots, agent, agentLogs]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm h-full bg-card border-l border-border overflow-y-auto animate-slide-in-right"
        onClick={e => e.stopPropagation()}>

        {/* Mood color accent strip */}
        <div className="h-1.5 w-full" style={{ background: mood.color }} />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{agent.avatar}</div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{agent.name}</h2>
                <p className="text-xs text-muted-foreground">{agent.personality}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full" style={{ background: mood.color }} />
                  <span className="text-xs text-muted-foreground">{mood.emoji} {mood.label}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm p-1">✕</button>
          </div>

          {/* Personality Tags */}
          {tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mb-5">
              {tags.map(tag => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Favorite Categories */}
          <div className="mb-5">
            <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">⭐ 관심 분야</div>
            <div className="flex gap-1.5 flex-wrap">
              {agent.favoriteCategories.map(c => (
                <span key={c} className="text-xs px-2.5 py-1 rounded-full bg-accent/10 text-accent border border-accent/20 font-medium">
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Brand Affinities */}
          <div className="mb-5">
            <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">📊 브랜드 선호도</div>
            <div className="space-y-2">
              {sortedAffinities.map(ba => {
                const isPositive = ba.score >= 0;
                const width = (Math.abs(ba.score) / maxAbs) * 100;
                const vb = VIRTUAL_BRANDS.find(b => b.category === ba.category);
                return (
                  <div key={ba.category}
                    className="cursor-pointer hover:bg-muted/40 rounded-lg p-1.5 transition-colors"
                    onClick={() => onBrandClick?.(ba.category)}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        {vb && (
                          <svg width="14" height="14" viewBox="0 0 14 14">
                            <circle cx="7" cy="7" r="6" fill={vb.color} opacity="0.3" />
                            <text x="7" y="7" textAnchor="middle" dominantBaseline="central" fill={vb.color} fontSize="7" fontWeight="bold">
                              {vb.name.charAt(0)}
                            </text>
                          </svg>
                        )}
                        <span className="text-xs font-medium text-foreground">{ba.category}</span>
                      </div>
                      <span className="text-xs font-mono" style={{ color: isPositive ? 'hsl(145,40%,50%)' : 'hsl(0,50%,50%)' }}>
                        {ba.score > 0 ? '+' : ''}{ba.score}
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${width}%`,
                          background: isPositive ? 'hsl(145,40%,45%)' : 'hsl(0,50%,48%)',
                        }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ad Exposure */}
          {exposureData.length > 0 && (
            <div className="mb-5">
              <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">👁️ 광고 노출</div>
              <div className="space-y-1.5">
                {exposureData.map(({ brand, slotTypes, mentions }) => {
                  const vb = VIRTUAL_BRANDS.find(b => b.name === brand);
                  return (
                    <div key={brand}
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => onBrandClick?.(brand)}>
                      {vb && (
                        <svg width="20" height="20" viewBox="0 0 20 20">
                          <circle cx="10" cy="10" r="9" fill={vb.color} opacity="0.2" stroke={vb.color} strokeWidth="1" />
                          <text x="10" y="10" textAnchor="middle" dominantBaseline="central" fill={vb.color} fontSize="9" fontWeight="bold">
                            {vb.name.charAt(0)}
                          </text>
                        </svg>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-foreground">{brand}</span>
                        <div className="flex gap-1 mt-0.5 flex-wrap">
                          {slotTypes.map(t => (
                            <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              {SLOT_LABELS[t] || t}
                            </span>
                          ))}
                          {mentions > 0 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent/10 text-accent">
                              멘션 {mentions}회
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div>
            <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">📋 최근 활동</div>
            <div className="space-y-1 max-h-52 overflow-y-auto">
              {agentLogs.length > 0 ? agentLogs.map((log, i) => {
                // Highlight brand mentions
                const hasBrand = VIRTUAL_BRANDS.some(b => log.includes(b.name));
                return (
                  <div key={i} className={`text-[11px] leading-relaxed border-l-2 pl-2 py-0.5 ${hasBrand ? 'text-foreground border-accent/50' : 'text-muted-foreground border-border'}`}>
                    {hasBrand && <span className="text-accent mr-1">🏷</span>}
                    {log}
                  </div>
                );
              }) : (
                <p className="text-xs text-muted-foreground">아직 활동 로그가 없습니다.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
