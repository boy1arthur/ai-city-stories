import React from 'react';
import type { CityEnergyState } from '@/lib/cityEnergy';

interface Props {
  energy: CityEnergyState;
}

export const EnergyBar: React.FC<Props> = ({ energy }) => {
  const color =
    energy.status === 'stable' ? 'hsl(160,45%,45%)' :
    energy.status === 'low' ? 'hsl(35,75%,50%)' :
    'hsl(0,65%,50%)';

  const label =
    energy.status === 'stable' ? '⚡ Stable' :
    energy.status === 'low' ? '⚠️ Low' :
    '🔴 Critical';

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">{label}</span>
      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden relative">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${energy.value}%`,
            backgroundColor: color,
            animation: energy.status === 'critical' ? 'pulse 1.5s ease-in-out infinite' : undefined,
          }}
        />
      </div>
      <span className="text-[10px] font-mono text-muted-foreground">{Math.round(energy.value)}</span>
    </div>
  );
};
