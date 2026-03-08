import React from 'react';
import type { Agent } from '@/data/world';

interface Props {
  agent: Agent;
  worldLog: string[];
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

export const AgentProfilePanel: React.FC<Props> = ({ agent, worldLog, onBrandClick, onClose }) => {
  const mood = MOOD_INFO[agent.mood] || MOOD_INFO.neutral;
  const tags = PERSONALITY_TAGS[agent.id] || [];
  const agentLogs = worldLog.filter(log => log.includes(agent.name)).slice(0, 8);

  // Sort affinities for display
  const sortedAffinities = [...agent.brandAffinities].sort((a, b) => b.score - a.score);
  const maxAbs = Math.max(1, ...sortedAffinities.map(a => Math.abs(a.score)));

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm h-full bg-card border-l border-border overflow-y-auto animate-slide-in-right"
        onClick={e => e.stopPropagation()}>
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
                return (
                  <div key={ba.category}
                    className="cursor-pointer hover:bg-muted/40 rounded-lg p-1.5 transition-colors"
                    onClick={() => onBrandClick?.(ba.category)}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-foreground">{ba.category}</span>
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

          {/* Recent Activity */}
          <div>
            <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">📋 최근 활동</div>
            <div className="space-y-1 max-h-52 overflow-y-auto">
              {agentLogs.length > 0 ? agentLogs.map((log, i) => (
                <div key={i} className="text-[11px] text-muted-foreground leading-relaxed border-l-2 border-border pl-2 py-0.5">
                  {log}
                </div>
              )) : (
                <p className="text-xs text-muted-foreground">아직 활동 로그가 없습니다.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
