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
    <div className={`absolute top-3 right-14 z-50 ${bgColor} backdrop-blur-sm text-primary-foreground px-3 py-1.5 rounded-md shadow-md flex items-center gap-2 animate-fade-in max-w-[220px]`}>
      <span className="text-xs">🏆</span>
      <span className="text-[10px] font-medium leading-tight">{latest.message}</span>
      <button onClick={() => { setDismissed(prev => new Set(prev).add(latest.id)); setVisible(null); }}
        className="text-[10px] opacity-60 hover:opacity-100 ml-1 shrink-0">✕</button>
    </div>
  );
};
