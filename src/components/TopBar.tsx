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
  onHome?: () => void;
  energyBar?: React.ReactNode;
  isFullView?: boolean;
  onToggleFullView?: () => void;
}

export const TopBar: React.FC<Props> = ({ tick, agentCount, activeAds, currentZone, zones, onZoneChange, onSponsorDashboard, onHome, energyBar }) => {
  return (
    <header className="h-12 bg-card/90 backdrop-blur-md border-b border-border flex items-center justify-between px-4 z-30">
      <div className="flex items-center gap-3">
        <button onClick={onHome} className="text-sm font-semibold text-foreground hover:opacity-80 transition-opacity">
          <span className="text-primary">AI</span>
          <span className="text-muted-foreground mx-1">Social</span>
          <span className="text-secondary">World</span>
        </button>
        <div className="h-4 w-px bg-border" />

        <div className="flex items-center gap-1">
          {zones.map(zone => (
            <button
              key={zone.id}
              onClick={() => !zone.locked && onZoneChange(zone.id)}
              className={`text-xs px-2 py-0.5 rounded transition-colors ${
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
        <span className="text-xs text-muted-foreground">{currentZone.emoji} {currentZone.name}</span>
        <span className="text-xs text-muted-foreground/50 font-mono">T#{tick}</span>
      </div>
      <div className="flex items-center gap-4">
        {energyBar}
        <Stat label="Agents" value={agentCount} color="text-primary" />
        <Stat label="Ads" value={activeAds} color="text-accent" />
        <a href="https://github.com" target="_blank" rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors hidden md:inline">
          GitHub
        </a>
        <button
          onClick={onSponsorDashboard}
          className="text-xs px-3 py-1 rounded border border-accent/40 text-accent hover:bg-accent/10 transition-colors font-medium"
        >
          Sponsor Dashboard
        </button>
      </div>
    </header>
  );
};

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xs font-semibold font-mono ${color}`}>{value}</span>
    </div>
  );
}
