import React from 'react';
import type { Zone } from '@/data/world';

interface Props {
  tick: number;
  agentCount: number;
  activeAds: number;
  currentZone: Zone;
  zones: Zone[];
  onZoneChange: (zoneId: string) => void;
  onSponsorDashboard: () => void;
}

export const TopBar: React.FC<Props> = ({ tick, agentCount, activeAds, currentZone, zones, onZoneChange, onSponsorDashboard }) => {
  return (
    <header className="h-12 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 z-30">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-bold text-foreground font-mono">
          <span className="text-primary text-glow-green">AI</span>
          <span className="text-muted-foreground mx-1">Social</span>
          <span className="text-secondary">World</span>
        </h1>
        <div className="h-4 w-px bg-border" />

        {/* Zone selector */}
        <div className="flex items-center gap-1">
          {zones.map(zone => (
            <button
              key={zone.id}
              onClick={() => !zone.locked && onZoneChange(zone.id)}
              className={`text-xs font-mono px-2 py-0.5 rounded transition-colors ${
                zone.id === currentZone.id
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : zone.locked
                  ? 'text-muted-foreground/40 cursor-not-allowed'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              title={zone.locked ? `${zone.name} — Coming Soon` : zone.name}
            >
              {zone.emoji} {zone.locked && '🔒'}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-border" />
        <span className="text-xs text-muted-foreground font-mono">{currentZone.emoji} {currentZone.name}</span>
        <span className="text-xs text-muted-foreground/60 font-mono">T#{tick}</span>
      </div>
      <div className="flex items-center gap-4">
        <Stat label="Agents" value={agentCount} color="text-primary" />
        <Stat label="Ads" value={activeAds} color="text-accent" />
        <button
          onClick={onSponsorDashboard}
          className="text-xs font-mono px-3 py-1 rounded border border-accent/40 text-accent hover:bg-accent/10 transition-colors"
        >
          /sponsor
        </button>
      </div>
    </header>
  );
};

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground font-mono">{label}</span>
      <span className={`text-xs font-bold font-mono ${color}`}>{value}</span>
    </div>
  );
}
