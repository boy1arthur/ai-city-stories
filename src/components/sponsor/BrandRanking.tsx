import React from 'react';
import type { BrandStats } from '@/lib/esv';

interface Props {
  brandStats: BrandStats[];
  onBrandClick?: (brandId: string) => void;
}

export const BrandRanking: React.FC<Props> = ({ brandStats, onBrandClick }) => {
  if (brandStats.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">🏆 브랜드 랭킹</h3>
        <p className="text-xs text-muted-foreground">아직 활성 브랜드가 없습니다. 광고를 배치하면 랭킹이 표시됩니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">🏆 오늘의 브랜드 랭킹</h3>
      <div className="space-y-2">
        {brandStats.map((brand, i) => {
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
          const positivePercent = Math.round(brand.positiveRatio * 100);
          const negativePercent = Math.round(brand.negativeRatio * 100);

          return (
            <div key={brand.brand} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => onBrandClick?.(brand.brand)}>
              <span className="text-sm w-6 text-center">{medal}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground truncate">{brand.brand}</span>
                  <span className="text-xs font-bold text-accent">${brand.totalESV.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-muted-foreground">{brand.totalImpressions} 노출</span>
                  <span className="text-[10px] text-muted-foreground">{brand.totalMentions} 멘션</span>
                  <span className="text-[10px] text-muted-foreground">{brand.slotCount} 슬롯</span>
                </div>
                {/* Sentiment bar */}
                <div className="flex gap-0.5 mt-1.5 h-1.5 rounded-full overflow-hidden">
                  <div className="rounded-l-full" style={{ width: `${positivePercent}%`, background: 'hsl(145,35%,45%)' }} />
                  <div style={{ width: `${100 - positivePercent - negativePercent}%`, background: 'hsl(215,10%,50%)' }} />
                  <div className="rounded-r-full" style={{ width: `${negativePercent}%`, background: 'hsl(0,50%,48%)' }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
