import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface DonationEffect {
    id: string;
    type: 'item_drop' | 'agent_boost' | 'announce' | 'weather';
    label: string;
    emoji: string;
    donor: string;
    amount?: number; // KRW or superchats points
    timestamp: number;
}

interface DonationEffectsProps {
    effects: DonationEffect[];
}

/**
 * Phase 4-3: 후원(Donation) 기반 시청자 개입 이펙트 오버레이
 * - 시청자 후원 발생 시 화면에 극적인 팡파르 효과
 * - 에이전트 스태미나 충전 또는 아이템 드랍 시각화
 */
export const DonationEffectsOverlay: React.FC<DonationEffectsProps> = ({ effects }) => {
    if (effects.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50 pointer-events-none max-w-sm">
            {effects.slice(0, 5).map((effect) => (
                <DonationCard key={effect.id} effect={effect} />
            ))}
        </div>
    );
};

const DonationCard: React.FC<{ effect: DonationEffect }> = ({ effect }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const t = setTimeout(() => setVisible(false), 5000);
        return () => clearTimeout(t);
    }, []);

    if (!visible) return null;

    const bgColor = {
        item_drop: 'from-yellow-500/20 to-orange-500/10 border-yellow-500/30',
        agent_boost: 'from-green-500/20 to-emerald-500/10 border-green-500/30',
        announce: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30',
        weather: 'from-purple-500/20 to-violet-500/10 border-purple-500/30',
    }[effect.type];

    return (
        <div
            className={`flex items-center gap-3 bg-gradient-to-r ${bgColor} border backdrop-blur-md rounded-xl px-4 py-2.5 shadow-lg animate-fade-in`}
        >
            <span className="text-2xl animate-bounce">{effect.emoji}</span>
            <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">{effect.donor}</span>
                    {effect.amount && (
                        <span className="text-[10px] bg-yellow-500/20 text-yellow-300 rounded-full px-1.5 font-mono">
                            ₩{effect.amount.toLocaleString()}
                        </span>
                    )}
                </div>
                <span className="text-[11px] text-white/80">{effect.label}</span>
            </div>
        </div>
    );
};

/**
 * 후원 유형별 기본 효과 생성 헬퍼
 */
export function useDonationTemplates() {
    const { t } = useTranslation();
    return {
        item_drop: { emoji: '🎁', label: t('donations.item_drop') },
        agent_boost: { emoji: '⚡', label: t('donations.agent_boost') },
        announce: { emoji: '📢', label: t('donations.announce') },
        weather: { emoji: '🌦️', label: t('donations.weather') },
    };
}

export function createDonationEffect(
    donor: string,
    type: DonationEffect['type'],
    templates: any, // Pass templates from hook
    amount?: number
): DonationEffect {
    const { emoji, label } = templates[type];
    return {
        id: `donation_${Date.now()}_${Math.random()}`,
        type,
        label,
        emoji,
        donor,
        amount,
        timestamp: Date.now(),
    };
}
