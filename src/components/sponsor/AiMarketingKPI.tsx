import React, { useMemo } from 'react';
import type { Agent, AdSlot } from '@/data/world';
import type { BrandStats } from '@/lib/esv';

interface AiMarketingKPIProps {
    brandStats: BrandStats[];
    allAgents: Agent[];
    allAdSlots: AdSlot[];
    /** 현재까지 축적된 worldLog (대화 메시지 배열) */
    worldLog: string[];
}

/**
 * Phase 5-2: AI 마케팅 맞춤형 KPI 대시보드
 * 기존 Impressions/ESV를 넘어:
 * - "긍정 대화 지속 시간" (PosDwellTime)
 * - "성향별 에이전트 선호도 상승 수치"
 * - "브랜드 언급 밀도" (per tick basis)
 */
export const AiMarketingKPI: React.FC<AiMarketingKPIProps> = ({
    brandStats,
    allAgents,
    allAdSlots,
    worldLog,
}) => {
    const brandKPIs = useMemo(() => {
        return brandStats.map(stat => {
            // 긍정 대화 수: worldLog 중 해당 브랜드 언급 + 긍정 키워드 포함
            const positiveKeywords = ['좋다', '최고', '폼', '미쳤', '지름', '인정', '추천', '강추', '👍', '😍', '✨'];
            const brandMentions = worldLog.filter(log =>
                log.toLowerCase().includes(stat.brand.toLowerCase()) ||
                log.includes(`[${stat.brand}]`)
            );
            const positiveMentions = brandMentions.filter(log =>
                positiveKeywords.some(kw => log.includes(kw))
            );

            // 에이전트 성향 평균 친화도
            const relevantAgents = allAgents.filter(a =>
                a.brandAffinities.some(ba => ba.category.toLowerCase().includes(stat.brand.toLowerCase().split(' ')[0] || ''))
            );
            const avgAffinity = relevantAgents.length > 0
                ? relevantAgents.reduce((sum, a) => {
                    const affs = a.brandAffinities.filter(ba =>
                        ba.category.toLowerCase().includes(stat.brand.toLowerCase().split(' ')[0] || '')
                    );
                    return sum + affs.reduce((s, x) => s + x.score, 0) / Math.max(affs.length, 1);
                }, 0) / relevantAgents.length
                : 0;

            // 슬롯 점유율
            const occupiedSlots = allAdSlots.filter(s => s.brand === stat.brand).length;
            const totalSlots = allAdSlots.length;

            return {
                brandId: stat.brand,
                totalMentions: brandMentions.length,
                positiveMentions: positiveMentions.length,
                positiveMentionRate: brandMentions.length > 0
                    ? Math.round((positiveMentions.length / brandMentions.length) * 100)
                    : 0,
                avgAffinity: Math.round(avgAffinity * 10) / 10,
                slotOccupancy: totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0,
                impressions: stat.totalImpressions,
                esv: stat.totalESV,
            };
        }).sort((a, b) => b.positiveMentions - a.positiveMentions);
    }, [brandStats, allAgents, allAdSlots, worldLog]);

    if (brandKPIs.length === 0) {
        return (
            <div className="bg-card border border-border rounded-xl p-6 text-center">
                <p className="text-3xl mb-2">📊</p>
                <p className="text-sm text-muted-foreground">활성 브랜드 캠페인이 없습니다.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">캠페인을 등록하면 상세 AI KPI가 집계됩니다.</p>
            </div>
        );
    }

    return (
        <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🧠</span>
                <div>
                    <h3 className="text-sm font-bold text-foreground">AI Marketing KPI</h3>
                    <p className="text-[10px] text-muted-foreground">노출 수를 넘어선 에이전트 반응 기반 지표</p>
                </div>
            </div>

            <div className="space-y-3">
                {brandKPIs.map((kpi) => (
                    <div key={kpi.brandId} className="border border-border/50 rounded-lg p-3 hover:border-primary/30 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-foreground">{kpi.brandId}</span>
                            <div className="flex items-center gap-1.5">
                                <PositiveRateBadge rate={kpi.positiveMentionRate} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <MiniStat
                                label="총 언급"
                                value={kpi.totalMentions}
                                icon="💬"
                                color="text-primary"
                            />
                            <MiniStat
                                label="긍정 대화"
                                value={kpi.positiveMentions}
                                icon="😍"
                                color="text-green-400"
                            />
                            <MiniStat
                                label="슬롯 점유율"
                                value={`${kpi.slotOccupancy}%`}
                                icon="📍"
                                color="text-accent"
                            />
                            <MiniStat
                                label="평균 친화도"
                                value={kpi.avgAffinity === 0 ? 'N/A' : `+${kpi.avgAffinity}`}
                                icon="⭐"
                                color="text-yellow-400"
                            />
                        </div>

                        {/* 긍정 반응률 프로그레스 바 */}
                        <div className="mt-2">
                            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                                <span>긍정 반응률</span>
                                <span>{kpi.positiveMentionRate}%</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{
                                        width: `${kpi.positiveMentionRate}%`,
                                        backgroundColor: kpi.positiveMentionRate >= 70
                                            ? 'hsl(145,50%,45%)'
                                            : kpi.positiveMentionRate >= 40
                                                ? 'hsl(45,80%,55%)'
                                                : 'hsl(0,60%,50%)',
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

function PositiveRateBadge({ rate }: { rate: number }) {
    if (rate >= 70) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 font-medium">우수 {rate}%</span>;
    if (rate >= 40) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 font-medium">보통 {rate}%</span>;
    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 font-medium">개선 필요 {rate}%</span>;
}

function MiniStat({ label, value, icon, color }: { label: string; value: number | string; icon: string; color: string }) {
    return (
        <div className="bg-muted/20 rounded-lg p-2 text-center">
            <div className="text-sm mb-0.5">{icon}</div>
            <div className={`text-sm font-bold ${color}`}>{value}</div>
            <div className="text-[9px] text-muted-foreground/70 uppercase tracking-wide">{label}</div>
        </div>
    );
}
