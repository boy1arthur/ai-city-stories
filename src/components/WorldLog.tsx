import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  logs: string[];
  isPaused: boolean;
  onTogglePause: () => void;
  llmStatus?: 'ready' | 'error' | 'offline';
}

export const WorldLog: React.FC<Props> = ({ logs, isPaused, onTogglePause, llmStatus = 'ready' }) => {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && !isPaused) {
      scrollRef.current.scrollTop = 0;
    }
  }, [logs, isPaused]);

  return (
    <div className="bg-card/80 backdrop-blur-sm border-t border-border/50 px-4 py-3 h-40 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
          <h3 className="text-[11px] font-bold text-foreground/80 uppercase tracking-widest">{t('worldlog.title')}</h3>
          {llmStatus !== 'ready' && (
            <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter ${llmStatus === 'error' ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
              }`}>
              {llmStatus === 'error' ? t('worldlog.llm_error') : t('worldlog.llm_offline')}
            </div>
          )}
        </div>
        <button
          onClick={onTogglePause}
          className={`text-[11px] px-2.5 py-1 rounded-md border transition-all font-medium ${isPaused
            ? 'border-secondary/30 text-secondary bg-secondary/8 hover:bg-secondary/12'
            : 'border-border/50 text-muted-foreground hover:border-primary/25 hover:text-foreground'
            }`}
        >
          {isPaused ? t('worldlog.resume') : t('worldlog.pause')}
        </button>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-px scrollbar-thin">
        {logs.length === 0 && (
          <p className="text-xs text-muted-foreground/50 italic">{t('worldlog.waiting')}</p>
        )}
        {logs.map((log, i) => (
          <div
            key={i}
            className="text-[11px] text-foreground/70 font-mono leading-relaxed px-2 py-0.5 rounded hover:bg-muted/30 transition-colors"
            style={{ opacity: Math.max(0.25, 1 - i * 0.06) }}
          >
            {log}
          </div>
        ))}
      </div>
    </div>
  );
};
