import React from 'react';
import type { AdCampaign } from '@/lib/adCampaign';
import { getCampaignStatus } from '@/lib/adCampaign';

interface Props {
  campaigns: AdCampaign[];
  currentTick: number;
  onEndCampaign: (id: string) => void;
}

export const CampaignList: React.FC<Props> = ({ campaigns, currentTick, onEndCampaign }) => {
  const sorted = [...campaigns].sort((a, b) => {
    const order = { running: 0, scheduled: 1, ended: 2 };
    return order[getCampaignStatus(a, currentTick)] - order[getCampaignStatus(b, currentTick)];
  });

  const statusBadge = (status: string) => {
    const styles = {
      running: 'bg-primary/15 text-primary',
      scheduled: 'bg-accent/15 text-accent',
      ended: 'bg-muted text-muted-foreground',
    };
    return styles[status as keyof typeof styles] || styles.ended;
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-4">📦 캠페인 목록</h3>
      {sorted.length === 0 ? (
        <p className="text-xs text-muted-foreground">등록된 캠페인이 없습니다.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border">
                <th className="text-left py-2">브랜드</th>
                <th className="text-left py-2">구역</th>
                <th className="text-center py-2">슬롯</th>
                <th className="text-center py-2">상태</th>
                <th className="text-center py-2">남은 Tick</th>
                <th className="text-right py-2">액션</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(c => {
                const status = getCampaignStatus(c, currentTick);
                const remaining = status === 'running' ? Math.max(0, c.endTick - currentTick) :
                                  status === 'scheduled' ? c.endTick - c.startTick : 0;
                return (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="py-2 text-foreground font-semibold">{c.brandId}</td>
                    <td className="py-2 text-foreground">{c.zoneId}</td>
                    <td className="py-2 text-center text-foreground">{c.slotIds.length}</td>
                    <td className="py-2 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusBadge(status)}`}>
                        {status}
                      </span>
                    </td>
                    <td className="py-2 text-center font-mono text-muted-foreground">
                      {status === 'ended' ? '—' : remaining}
                    </td>
                    <td className="py-2 text-right">
                      {status !== 'ended' && (
                        <button onClick={() => onEndCampaign(c.id)}
                          className="text-[10px] px-2 py-0.5 rounded border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors">
                          종료
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
