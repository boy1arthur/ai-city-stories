import React from 'react';
import type { BrandLeagueSeason, BrandLeagueScore } from '@/lib/brandLeague';
import { getSeasonProgress } from '@/lib/brandLeague';

interface Props {
  season: BrandLeagueSeason | null;
  scores: BrandLeagueScore[];
  currentTick: number;
}

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

export const LeagueStandings: React.FC<Props> = ({ season, scores, currentTick }) => {
  if (!season || scores.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">🏆 Brand League</h3>
        <p className="text-sm text-muted-foreground">현재 진행 중인 리그가 없습니다.</p>
      </div>
    );
  }

  const progress = getSeasonProgress(season, currentTick);
  const remainingTicks = Math.max(0, season.endTick - currentTick);

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-primary uppercase tracking-wider">🏆 Brand League</h3>
        <span className="text-xs text-muted-foreground font-mono">T-{remainingTicks.toLocaleString()}</span>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-foreground">{season.name}</span>
          <span className="text-xs text-muted-foreground">{Math.round(progress * 100)}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      <div className="space-y-1.5">
        {scores.map((score, i) => {
          const barWidth = scores[0].totalScore > 0 ? (score.totalScore / scores[0].totalScore) * 100 : 0;
          return (
            <div key={score.brandId} className="flex items-center gap-2 group">
              <span className="text-sm w-6 text-center shrink-0">
                {i < 3 ? RANK_MEDALS[i] : <span className="text-xs text-muted-foreground font-mono">{score.rank}</span>}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-semibold text-foreground truncate">{score.brandId}</span>
                  <span className="text-xs font-bold text-primary font-mono">{score.totalScore}</span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${barWidth}%`,
                      background: i === 0 ? 'hsl(38,75%,50%)' : i === 1 ? 'hsl(210,50%,55%)' : 'hsl(var(--muted-foreground))',
                    }} />
                </div>
              </div>
              <div className="hidden group-hover:flex gap-2 text-xs text-muted-foreground shrink-0">
                <span>ESV:{score.esv}</span>
                <span>M:{score.mentions}</span>
                <span>A:{score.affinity}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
