import React, { useState, useEffect } from 'react';

export interface WorldEvent {
  id: string;
  type: string;
  brandId?: string;
  tick: number;
  message: string;
}

interface Props {
  events: WorldEvent[];
}

export const WorldEventBanner: React.FC<Props> = ({ events }) => {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [visible, setVisible] = useState<string | null>(null);

  const latest = events.find(e => !dismissed.has(e.id));

  useEffect(() => {
    if (!latest) { setVisible(null); return; }
    setVisible(latest.id);
    const timer = setTimeout(() => {
      setDismissed(prev => new Set(prev).add(latest.id));
      setVisible(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [latest?.id]); // eslint-disable-line

  if (!visible || !latest) return null;

  const bgColor = latest.type === 'league.lead_change' ? 'bg-accent/90' : 'bg-primary/90';

  return (
    <div className={`absolute top-14 left-1/2 -translate-x-1/2 z-50 ${bgColor} backdrop-blur-sm text-primary-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in`}>
      <span className="text-sm">🏆</span>
      <span className="text-xs font-semibold">{latest.message}</span>
      <button onClick={() => { setDismissed(prev => new Set(prev).add(latest.id)); setVisible(null); }}
        className="text-xs opacity-70 hover:opacity-100 ml-2">✕</button>
    </div>
  );
};
