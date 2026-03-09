import React, { useState } from 'react';

interface AffiliateClick {
    brand: string;
    agentName: string;
    timestamp: number;
    sessionId: string;
}

interface AffiliateTrackerProps {
    clicks: AffiliateClick[];
}

/**
 * Phase 6-2: 제휴 링크(Affiliate) 클릭 & 전환 트래커
 * - 시청자가 에이전트 언급 브랜드를 클릭한 히스토리를 집계
 * - 실제 커머스 연동 시 수수료 정산 기반 데이터 제공
 */
export const AffiliateTracker: React.FC<AffiliateTrackerProps> = ({ clicks }) => {
    // 브랜드별 클릭 집계
    const brandSummary = clicks.reduce<Record<string, { count: number; agents: Set<string> }>>((acc, click) => {
        if (!acc[click.brand]) acc[click.brand] = { count: 0, agents: new Set() };
        acc[click.brand].count += 1;
        acc[click.brand].agents.add(click.agentName);
        return acc;
    }, {});

    const sorted = Object.entries(brandSummary).sort((a, b) => b[1].count - a[1].count);

    return (
        <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">💰</span>
                <div>
                    <h3 className="text-sm font-bold text-foreground">제휴 링크 전환 트래커</h3>
                    <p className="text-[10px] text-muted-foreground">에이전트 PPL → 시청자 클릭 → 구매 전환 수수료</p>
                </div>
                <span className="ml-auto text-xs font-bold text-primary">{clicks.length} 클릭</span>
            </div>

            {sorted.length === 0 ? (
                <div className="text-center py-4">
                    <p className="text-3xl mb-2">📊</p>
                    <p className="text-xs text-muted-foreground">아직 클릭된 제휴 링크가 없습니다.</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">LIVE 시청자가 에이전트 PPL 링크를 클릭하면 여기에 기록됩니다.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {sorted.map(([brand, data]) => (
                        <div key={brand} className="flex items-center gap-3 border border-border/40 rounded-lg p-2.5 hover:border-primary/30 transition-colors">
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-semibold text-foreground">{brand}</span>
                                    <span className="text-xs font-bold text-accent">{data.count}회 클릭</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-muted-foreground">추천 에이전트:</span>
                                    {[...data.agents].map(a => (
                                        <span key={a} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{a}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="text-right">
                                {/* 예상 수수료: 클릭당 750원 기준 */}
                                <p className="text-xs font-bold text-green-400">≈ ₩{(data.count * 750).toLocaleString()}</p>
                                <p className="text-[9px] text-muted-foreground/60">예상 수수료</p>
                            </div>
                        </div>
                    ))}

                    <div className="mt-3 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-green-400">총 예상 적립 수수료</span>
                            <span className="text-sm font-bold text-green-400">
                                ₩{(clicks.length * 750).toLocaleString()}
                            </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">실제 정산은 제휴 파트너십 계약 기준 적용</p>
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * 제휴 클릭 이벤트 생성 헬퍼 (외부에서 호출)
 */
export function createAffiliateClick(brand: string, agentName: string): AffiliateClick {
    return {
        brand,
        agentName,
        timestamp: Date.now(),
        sessionId: `session_${Math.random().toString(36).slice(2, 9)}`,
    };
}

export type { AffiliateClick };
