import React, { useState, useMemo } from 'react';
import type { Agent } from '@/data/world';

interface FocusGroupConfig {
    productConcept: string;
    targetPersonalities: string[];
    campaignMessage: string;
}

interface SimulatedReaction {
    agentId: string;
    agentName: string;
    agentAvatar: string;
    personality: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    score: number; // -100 ~ +100
    quote: string;
    mood: string;
}

interface SyntheticFocusGroupProps {
    allAgents: Agent[];
}

/**
 * Phase 5-3: 합성 포커스 그룹 (Synthetic Focus Group)
 * 스폰서가 새 제품 컨셉을 에이전트들에게 노출시키고
 * 그 반응을 시뮬레이션으로 수집하는 SaaS 구독형 기능
 */
export const SyntheticFocusGroup: React.FC<SyntheticFocusGroupProps> = ({ allAgents }) => {
    const [config, setConfig] = useState<FocusGroupConfig>({
        productConcept: '',
        targetPersonalities: [],
        campaignMessage: '',
    });
    const [result, setResult] = useState<SimulatedReaction[] | null>(null);
    const [isRunning, setIsRunning] = useState(false);

    const personalities = useMemo(() => {
        const all = allAgents.map(a => a.personality);
        return [...new Set(all)];
    }, [allAgents]);

    const togglePersonality = (p: string) => {
        setConfig(prev => ({
            ...prev,
            targetPersonalities: prev.targetPersonalities.includes(p)
                ? prev.targetPersonalities.filter(x => x !== p)
                : [...prev.targetPersonalities, p],
        }));
    };

    const runSimulation = async () => {
        if (!config.productConcept.trim()) return;
        setIsRunning(true);
        setResult(null);

        // 타겟 에이전트 선정 (성향 필터)
        const targetAgents = config.targetPersonalities.length > 0
            ? allAgents.filter(a => config.targetPersonalities.includes(a.personality))
            : allAgents.slice(0, 8);

        // 실제 LLM 호출 시 → Edge Function 사용하면 됨
        // 여기서는 에이전트의 기존 성향 + mood 기반 결정론적 시뮬레이션
        await new Promise(res => setTimeout(res, 1200)); // 로딩 연출

        const positiveQuotes = [
            `"${config.productConcept}? 폼 미쳤는데 완전 지를 것 같음 ㄹㅇ"`,
            `"이거 완전 내 취향이잖아 ㅋㅋ 바로 구매각"`,
            `"뭐야 진짜 좋은 거 아니야? 친구들한테 알려줘야겠다"`,
            `"ㄹㅇ 가격만 맞으면 당장 사는 거심"`,
        ];
        const neutralQuotes = [
            `"음... 나쁘진 않은 것 같은데 더 알아봐야 할듯"`,
            `"${config.productConcept} 들어봤는데 아직 잘 모르겠어"`,
            `"괜찮긴 한데 지금 당장 필요하진 않을 것 같음"`,
        ];
        const negativeQuotes = [
            `"글쎄... 내 라이프스타일엔 안 맞는 것 같아"`,
            `"비슷한 게 더 싸게 있지 않나?"`,
            `"잘 모르겠슴 패스"`,
        ];

        const reactions: SimulatedReaction[] = targetAgents.slice(0, 8).map(agent => {
            // 에이전트 무드 + 성향으로 점수 결정
            const moodBoost = agent.mood === 'happy' || agent.mood === 'excited' ? 25
                : agent.mood === 'critical' || agent.mood === 'neutral' ? -20 : 0;
            const conceptKeywords = config.productConcept.toLowerCase().split(' ');
            const affinityBoost = agent.brandAffinities
                .filter(ba => conceptKeywords.some(kw => ba.category.toLowerCase().includes(kw)))
                .reduce((sum, ba) => sum + ba.score * 10, 0);

            const rawScore = 20 + moodBoost + affinityBoost + (Math.random() * 40 - 20);
            const score = Math.max(-100, Math.min(100, Math.round(rawScore)));

            const sentiment: SimulatedReaction['sentiment'] = score >= 35 ? 'positive' : score >= -15 ? 'neutral' : 'negative';
            const quotesPool = sentiment === 'positive' ? positiveQuotes
                : sentiment === 'neutral' ? neutralQuotes : negativeQuotes;

            return {
                agentId: agent.id,
                agentName: agent.name,
                agentAvatar: agent.avatar,
                personality: agent.personality,
                sentiment,
                score,
                quote: quotesPool[Math.floor(Math.random() * quotesPool.length)],
                mood: agent.mood,
            };
        });

        setResult(reactions);
        setIsRunning(false);
    };

    const summary = useMemo(() => {
        if (!result) return null;
        const pos = result.filter(r => r.sentiment === 'positive').length;
        const neg = result.filter(r => r.sentiment === 'negative').length;
        const neu = result.filter(r => r.sentiment === 'neutral').length;
        const avgScore = Math.round(result.reduce((s, r) => s + r.score, 0) / result.length);
        return { pos, neg, neu, avgScore };
    }, [result]);

    return (
        <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🔬</span>
                <div>
                    <h3 className="text-sm font-bold text-foreground">Synthetic Focus Group</h3>
                    <p className="text-[10px] text-muted-foreground">AI 에이전트를 대상으로 제품 컨셉을 시뮬레이션 테스트</p>
                </div>
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent">SaaS</span>
            </div>

            {/* Config Form */}
            <div className="space-y-3 mb-4">
                <div>
                    <label className="text-[11px] text-muted-foreground font-medium block mb-1">제품 / 서비스 컨셉</label>
                    <input
                        type="text"
                        value={config.productConcept}
                        onChange={e => setConfig(prev => ({ ...prev, productConcept: e.target.value }))}
                        placeholder="예: 다음 시즌 새로운 게이밍 의자"
                        className="w-full text-xs rounded-lg bg-muted/20 border border-border px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
                    />
                </div>
                <div>
                    <label className="text-[11px] text-muted-foreground font-medium block mb-1">타겟 성향 (선택 안 하면 전체)</label>
                    <div className="flex flex-wrap gap-1.5">
                        {personalities.map(p => (
                            <button
                                key={p}
                                onClick={() => togglePersonality(p)}
                                className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${config.targetPersonalities.includes(p)
                                    ? 'bg-primary/15 border-primary/40 text-primary'
                                    : 'border-border/50 text-muted-foreground hover:border-primary/25 hover:text-foreground'
                                    }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <button
                onClick={runSimulation}
                disabled={isRunning || !config.productConcept.trim()}
                className="w-full text-sm px-4 py-2.5 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2"
            >
                {isRunning ? (
                    <><span className="animate-spin">⚙️</span> 시뮬레이션 실행 중...</>
                ) : (
                    <><span>🧪</span> 포커스 그룹 시뮬레이션 실행</>
                )}
            </button>

            {/* Results */}
            {result && summary && (
                <div className="mt-5">
                    {/* Summary Row */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                        <SummaryStat label="긍정" value={summary.pos} emoji="😁" color="text-green-400" />
                        <SummaryStat label="중립" value={summary.neu} emoji="😐" color="text-muted-foreground" />
                        <SummaryStat label="부정" value={summary.neg} emoji="😤" color="text-red-400" />
                        <SummaryStat label="평균 스코어" value={`${summary.avgScore > 0 ? '+' : ''}${summary.avgScore}`} emoji="📊" color={summary.avgScore >= 0 ? "text-primary" : "text-red-400"} />
                    </div>

                    {/* Agent Reactions */}
                    <div className="space-y-2">
                        {result.map(r => (
                            <div
                                key={r.agentId}
                                className={`border rounded-lg p-3 transition-colors ${r.sentiment === 'positive' ? 'border-green-500/20 bg-green-500/5'
                                    : r.sentiment === 'negative' ? 'border-red-500/20 bg-red-500/5'
                                        : 'border-border/30 bg-muted/10'
                                    }`}
                            >
                                <div className="flex items-start gap-2">
                                    <span className="text-xl">{r.agentAvatar}</span>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-semibold text-foreground">{r.agentName}</span>
                                            <span className="text-[9px] text-muted-foreground">{r.personality}</span>
                                            <span className="text-[9px] text-muted-foreground">• 기분: {r.mood}</span>
                                            <ScoreBadge score={r.score} />
                                        </div>
                                        <p className="text-xs text-muted-foreground italic">{r.quote}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

function SummaryStat({ label, value, emoji, color }: { label: string; value: number | string; emoji: string; color: string }) {
    return (
        <div className="bg-muted/20 rounded-lg p-2 text-center">
            <div className="text-sm">{emoji}</div>
            <div className={`text-base font-bold ${color}`}>{value}</div>
            <div className="text-[9px] text-muted-foreground">{label}</div>
        </div>
    );
}

function ScoreBadge({ score }: { score: number }) {
    const color = score >= 35 ? 'bg-green-500/15 text-green-400'
        : score <= -15 ? 'bg-red-500/15 text-red-400'
            : 'bg-muted text-muted-foreground';
    return (
        <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-mono ${color}`}>
            {score > 0 ? '+' : ''}{score}pt
        </span>
    );
}
