import React from 'react';

interface Props {
  logs: string[];
  isPaused: boolean;
  onTogglePause: () => void;
}

export const WorldLog: React.FC<Props> = ({ logs, isPaused, onTogglePause }) => {
  return (
    <div className="bg-card border-t border-border p-3 h-44 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-primary uppercase tracking-widest font-mono">World Log</h3>
        <button
          onClick={onTogglePause}
          className="text-xs font-mono px-2 py-0.5 rounded border border-border hover:border-primary text-foreground transition-colors"
        >
          {isPaused ? '▶ Resume' : '⏸ Pause'}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-0.5 scanline">
        {logs.length === 0 && <p className="text-xs text-muted-foreground font-mono">시뮬레이션 시작 대기중...</p>}
        {logs.map((log, i) => (
          <div key={i} className="text-xs text-foreground/80 font-mono leading-relaxed" style={{ opacity: Math.max(0.3, 1 - i * 0.05) }}>
            {log}
          </div>
        ))}
      </div>
    </div>
  );
};
