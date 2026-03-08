import React from 'react';

interface Highlight {
  id: string;
  text: string;
  timestamp: number;
  type: 'positive' | 'neutral' | 'negative' | 'event';
}

interface Props {
  highlights: Highlight[];
}

export const TodayHighlights: React.FC<Props> = ({ highlights }) => {
  const typeConfig = {
    positive: { emoji: '💚', color: 'hsl(145,35%,45%)' },
    neutral: { emoji: '💬', color: 'hsl(215,10%,55%)' },
    negative: { emoji: '🔴', color: 'hsl(0,50%,48%)' },
    event: { emoji: '⚡', color: 'hsl(38,65%,55%)' },
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">📰 오늘의 하이라이트</h3>
      {highlights.length === 0 ? (
        <p className="text-xs text-muted-foreground">아직 기록된 하이라이트가 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {highlights.slice(0, 5).map(h => {
            const cfg = typeConfig[h.type];
            const timeStr = new Date(h.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
            return (
              <div key={h.id} className="flex items-start gap-2 p-2 rounded bg-muted/20">
                <span className="text-sm mt-0.5">{cfg.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground leading-relaxed">{h.text}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{timeStr}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export type { Highlight };
