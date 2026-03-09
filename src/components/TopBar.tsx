import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { Zone } from '@/data/world';
import type { User } from '@supabase/supabase-js';

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
  user?: User | null;
  onSignOut?: () => void;
}

export const TopBar: React.FC<Props> = ({ tick, agentCount, activeAds, currentZone, zones, onZoneChange, onSponsorDashboard, onHome, energyBar, isFullView, onToggleFullView, user, onSignOut }) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'ko' ? 'en' : 'ko';
    i18n.changeLanguage(nextLang);
  };
  return (
    <header className="h-13 bg-card/80 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-4 z-30">
      <div className="flex items-center gap-3">
        <button onClick={onHome} className="flex items-center gap-1.5 text-sm font-bold text-foreground hover:opacity-80 transition-opacity">
          <div className="w-6 h-6 rounded-md bg-primary/12 flex items-center justify-center">
            <span className="text-xs">🏙️</span>
          </div>
          <span className="hidden md:inline">
            <span className="text-primary">AI</span>
            <span className="text-muted-foreground/80"> Social</span>
          </span>
        </button>

        <div className="h-4 w-px bg-border/50" />

        <div className="flex items-center gap-0.5">
          {zones.map(zone => (
            <button
              key={zone.id}
              onClick={() => !zone.locked && onZoneChange(zone.id)}
              className={`text-xs px-2 py-1 rounded-md transition-all ${zone.id === currentZone.id
                ? 'bg-primary/12 text-primary border border-primary/25 shadow-sm shadow-primary/10'
                : zone.locked
                  ? 'text-muted-foreground/30 cursor-not-allowed'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              title={zone.locked ? `${zone.name} — Coming Soon` : zone.name}
            >
              {zone.emoji} {zone.locked && '🔒'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {energyBar}

        <div className="hidden md:flex items-center gap-3 px-3 py-1 rounded-lg bg-muted/30">
          <Stat label="Agents" value={agentCount} color="text-primary" />
          <div className="w-px h-3 bg-border/50" />
          <Stat label="Ads" value={activeAds} color="text-accent" />
          <div className="w-px h-3 bg-border/50" />
          <span className="text-[10px] font-mono text-muted-foreground/60">T#{tick}</span>
        </div>

        {onToggleFullView && (
          <button
            onClick={onToggleFullView}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all font-medium hidden md:inline-flex items-center gap-1.5 ${isFullView
              ? 'border-primary/30 text-primary bg-primary/8 shadow-sm shadow-primary/10'
              : 'border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/25 hover:bg-muted/30'
              }`}
          >
            🗺️ {isFullView ? 'Zone' : 'City'}
          </button>
        )}

        <button
          onClick={onSponsorDashboard}
          className="text-xs px-3.5 py-1.5 rounded-lg bg-accent/10 border border-accent/25 text-accent hover:bg-accent/15 hover:border-accent/40 transition-all font-semibold shadow-sm shadow-accent/5"
        >
          ⚡ {t('topbar.dashboard')}
        </button>

        <button
          onClick={toggleLanguage}
          className="text-[10px] px-2 py-1 rounded border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all font-mono"
        >
          {i18n.language.toUpperCase()}
        </button>

        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground hidden md:inline truncate max-w-[100px]">
              {user.email}
            </span>
            <button
              onClick={onSignOut}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('topbar.signOut')}
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/auth')}
            className="text-xs px-3 py-1.5 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/25 transition-all font-medium"
          >
            Login
          </button>
        )}
      </div>
    </header>
  );
};

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">{label}</span>
      <span className={`text-xs font-bold font-mono ${color}`}>{value}</span>
    </div>
  );
}
