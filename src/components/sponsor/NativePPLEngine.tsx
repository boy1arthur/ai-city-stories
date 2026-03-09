import React, { useMemo } from 'react';
import type { Agent, AdSlot } from '@/data/world';

interface NativePPLAction {
    agentId: string;
    agentName: string;
    agentAvatar: string;
    brand: string;
    action: 'use' | 'recommend' | 'showcase';
    quote: string;
    timestamp: number;
    affiliateUrl?: string;
}

interface NativePPLEngineProps {
    agents: Agent[];
    adSlots: AdSlot[];
    /** 외부에서 기록된 PPL 행동 로그 */
    pplActions: NativePPLAction[];
    onAffiliateClick: (brand: string, agentName: string) => void;
}

/**
 * Phase 6-1: 다이내믹 네이티브 PPL 엔진 UI
 * - 에이전트가 스폰서 제품을 '사용'하거나 다른 에이전트에게 추천하는 행동 피드
 * - 시청자가 에이전트 언급 브랜드를 클릭하면 제휴 링크(Affiliate)로 연결
 */
export const NativePPLEngine: React.FC<NativePPLEngineProps> = ({
    agents,
    adSlots,
    pplActions,
    onAffiliateClick,
}) => {
    // 현재 광고 중인 브랜드 목록
    const activeBrands = useMemo(() => {
        return [...new Set(adSlots.filter(s => s.brand).map(s => s.brand!))];
    }, [adSlots]);

    // 시뮬레이션: 에이전트-브랜드 매칭으로 PPL 행동 생성
    const simulatedPPL = useMemo<NativePPLAction[]>(() => {
        if (activeBrands.length === 0) return [];

        const actionTemplates = {
            use: (brand: string) => `"지금 ${brand} 쓰고 있는데 진짜 좋음. 여기있는 사람들 다 써봐야 함"`,
            recommend: (brand: string) => `"야 ${brand} 알아? 이거 완전 폼 미쳤는데 한번 써봐. ㄹㅇ 인생템임"`,
            showcase: (brand: string) => `"${brand}에서 받은 거 보여줄게 — 이거 진짜 감사합니다 🙏 퀄리티 미쳤다"`,
        };

        return agents.slice(0, 6).map((agent, i) => {
            const brand = activeBrands[i % activeBrands.length];
            const actionTypes: ('use' | 'recommend' | 'showcase')[] = ['use', 'recommend', 'showcase'];
            const action = actionTypes[i % 3];
            return {
                agentId: agent.id,
                agentName: agent.name,
                agentAvatar: agent.avatar,
                brand,
                action,
                quote: actionTemplates[action](brand),
                timestamp: Date.now() - i * 60000,
                affiliateUrl: `https://example.com/shop/${brand.toLowerCase().replace(/\s+/g, '-')}?ref=ai-social&agent=${agent.id}`,
            };
        });
    }, [agents, activeBrands]);

    const displayActions = pplActions.length > 0 ? pplActions : simulatedPPL;

    const actionIcon = {
        use: '🎯',
        recommend: '📣',
        showcase: '✨',
    };
    const actionLabel = {
        use: '사용 중',
        recommend: '추천',
        showcase: '언박싱',
    };

    return (
        <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🛍️</span>
                <div>
                    <h3 className="text-sm font-bold text-foreground">Native PPL 엔진</h3>
                    <p className="text-[10px] text-muted-foreground">에이전트의 자연스러운 브랜드 행동 & 제휴 링크</p>
                </div>
                {activeBrands.length > 0 && (
                    <div className="ml-auto flex gap-1 flex-wrap justify-end max-w-48">
                        {activeBrands.slice(0, 3).map(b => (
                            <span key={b} className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent">{b}</span>
                        ))}
                    </div>
                )}
            </div>

            {displayActions.length === 0 ? (
                <div className="text-center py-6">
                    <p className="text-3xl mb-2">🏪</p>
                    <p className="text-xs text-muted-foreground">활성 캠페인이 있을 때 PPL 행동이 표시됩니다.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {displayActions.map((action, idx) => (
                        <div
                            key={`${action.agentId}_${idx}`}
                            className="border border-border/50 rounded-lg p-3 hover:border-accent/30 transition-colors group"
                        >
                            <div className="flex items-start gap-2.5">
                                <span className="text-xl flex-shrink-0">{action.agentAvatar}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className="text-xs font-semibold text-foreground">{action.agentName}</span>
                                        <span className="text-[10px] text-muted-foreground">{actionIcon[action.action]} {actionLabel[action.action]}</span>
                                        <button
                                            onClick={() => onAffiliateClick(action.brand, action.agentName)}
                                            className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 transition-colors font-medium opacity-0 group-hover:opacity-100"
                                        >
                                            🔗 {action.brand} 구매하기
                                        </button>
                                    </div>
                                    <p className="text-xs text-muted-foreground italic leading-relaxed">{action.quote}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
