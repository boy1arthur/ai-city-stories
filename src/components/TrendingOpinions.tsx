import React from 'react';
import type { Highlight } from '@/components/sponsor/TodayHighlights';

interface Props {
  highlights: Highlight[];
}

export const TrendingOpinions: React.FC<Props> = ({ highlights }) => {
  const brandHighlights = highlights.filter(h => h.type !== 'event').slice(0, 4);

  if (brandHighlights.length === 0) return null;

  return (
    <div className="absolute top-14 right-3 z-20 w-56 space-y-1.5 pointer-events-none">
      <div className="bg-card/90 backdrop-blur-sm rounded-lg border border-border px-3 py-1.5 pointer-events-auto">
        <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">🔥 Trending</span>
      </div>
      {brandHighlights.map((h, i) => {
        const opacity = 1 - i * 0.15;
        const typeEmoji = h.type === 'positive' ? '💚' : h.type === 'negative' ? '🔴' : '💬';
        return (
          <div key={h.id}
            className="bg-card/85 backdrop-blur-sm rounded-lg border border-border px-3 py-2 pointer-events-auto transition-opacity"
            style={{ opacity }}>
            <div className="flex items-start gap-1.5">
              <span className="text-xs mt-0.5">{typeEmoji}</span>
              <p className="text-[11px] text-foreground leading-relaxed">{h.text}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
