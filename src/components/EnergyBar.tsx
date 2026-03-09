import React from 'react';
import { useTranslation } from 'react-i18next';
import type { CityEnergyState } from '@/lib/cityEnergy';

interface Props {
  energy: CityEnergyState;
}

export const EnergyBar: React.FC<Props> = ({ energy }) => {
  const { t } = useTranslation();
  const color =
    energy.status === 'stable' ? 'hsl(160, 45%, 45%)' :
      energy.status === 'low' ? 'hsl(35, 75%, 50%)' :
        'hsl(0, 65%, 50%)';

  const bgGlow =
    energy.status === 'stable' ? 'hsl(160, 45%, 45%)' :
      energy.status === 'low' ? 'hsl(35, 75%, 50%)' :
        'hsl(0, 65%, 50%)';

  const label =
    energy.status === 'stable' ? t('energybar.stable') :
      energy.status === 'low' ? t('energybar.low') :
        t('energybar.critical');

  return (
    <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-muted/30">
      <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap font-medium">{label}</span>
      <div className="w-20 h-2.5 bg-muted/60 rounded-full overflow-hidden relative">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out relative"
          style={{
            width: `${energy.value}%`,
            backgroundColor: color,
            boxShadow: `0 0 8px ${bgGlow}40`,
            animation: energy.status === 'critical' ? 'pulse 1.5s ease-in-out infinite' : undefined,
          }}
        />
      </div>
      <span className="text-[10px] font-mono text-muted-foreground/70 font-semibold w-6 text-right">
        {Math.round(energy.value)}
      </span>
    </div>
  );
};
