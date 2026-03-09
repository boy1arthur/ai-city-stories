import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

interface CinematicViewProps {
    isActive: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    /** 실시간으로 발생하는 중요 사건 로그 (갈등, 브랜드 언급 등) */
    events?: CinematicEvent[];
}

export interface CinematicEvent {
    id: string;
    type: 'CONFLICT' | 'BRAND_ENGAGEMENT' | 'VIEWER_ACTION';
    title: string;
    description: string;
    icon: string;
    timestamp: number;
}

/**
 * Phase 4-1: 시네마틱 뷰 컴포넌트
 * - OBS 송출 최적화 (모든 부가 UI 숨김)
 * - 중앙 시네마틱 토스트 알림 연출
 */
export const CinematicView: React.FC<CinematicViewProps> = ({
    isActive,
    onToggle,
    children,
    events = [],
}) => {
    const { t } = useTranslation();
    // F9 단축키 리스너
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F9') {
                e.preventDefault();
                onToggle();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onToggle]);

    if (!isActive) return <>{children}</>;

    return (
        <div className="fixed inset-0 z-[100] bg-black overflow-hidden flex items-center justify-center">
            {/* 메인 시뮬레이션 콘텐츠 */}
            <div className="w-full h-full relative">
                {children}

                {/* 시네마틱 토스트 컨테이너 */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center pointer-events-none">
                    <CinematicToastManager events={events} />
                </div>

                {/* 하단 방송 상태 바 */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-between px-8 pb-4 pointer-events-none">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 animate-pulse">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                            <span className="text-[10px] font-bold text-white tracking-widest uppercase">{t('cinematic.status')}</span>
                        </div>
                    </div>
                    <div className="text-[10px] font-mono text-white/40 tracking-tighter">
                        AI-SOCIAL-CITY-ENGINE // VER 2.5 // OBS_SAFE
                    </div>
                </div>

                <CinematicExitHint onExit={onToggle} />
            </div>
        </div>
    );
};

/**
 * 중앙 팝업 토스트 매니저
 */
const CinematicToastManager: React.FC<{ events: CinematicEvent[] }> = ({ events }) => {
    const { t } = useTranslation();
    // 최근 5초 이내의 이벤트만 표시
    const activeEvents = useMemo(() => {
        const now = Date.now();
        return events
            .filter(e => now - e.timestamp < 5000)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 1); // 한 번에 하나만 강조
    }, [events]);

    if (activeEvents.length === 0) return null;

    const event = activeEvents[0];

    const colors = {
        CONFLICT: 'border-red-500/50 bg-red-500/10 text-red-400',
        BRAND_ENGAGEMENT: 'border-accent/50 bg-accent/10 text-accent',
        VIEWER_ACTION: 'border-primary/50 bg-primary/10 text-primary',
    };

    return (
        <div className="animate-in fade-in zoom-in slide-in-from-bottom-8 duration-700 flex flex-col items-center">
            <div className={`
                px-8 py-5 rounded-2xl border-2 backdrop-blur-xl
                shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col items-center gap-2
                ${colors[event.type]}
            `}>
                <span className="text-4xl mb-1">{event.icon}</span>
                <h2 className="text-xl font-black tracking-tighter uppercase">{event.title}</h2>
                <p className="text-sm font-medium text-white/80">{event.description}</p>
            </div>
            <div className="mt-4 px-4 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] text-white/40 tracking-widest uppercase animate-pulse">
                {t('cinematic.eventDetected')}
            </div>
        </div>
    );
};

const CinematicExitHint: React.FC<{ onExit: () => void }> = ({ onExit }) => {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(true);
    useEffect(() => {
        const t = setTimeout(() => setVisible(false), 3000);
        return () => clearTimeout(t);
    }, []);

    if (!visible) return null;

    return (
        <div
            className="absolute top-8 left-1/2 -translate-x-1/2 bg-white/5 border border-white/10 backdrop-blur-md px-4 py-2 rounded-full text-[10px] text-white/60 cursor-pointer hover:bg-white/10 transition-colors"
            onClick={onExit}
        >
            🎬 <kbd className="bg-white/20 p-1 rounded mx-1">F9</kbd> {t('cinematic.exitHint')}
        </div>
    );
};

/**
 * 시네마틱 모드 토글 버튼 (TopBar에 삽입용)
 */
export const CinematicToggleButton: React.FC<{ isActive: boolean; onToggle: () => void }> = ({
    isActive,
    onToggle,
}) => {
    const { t } = useTranslation();
    return (
        <button
            onClick={onToggle}
            title={`${t('cinematic.liveButton')} (F9)`}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all font-medium hidden md:inline-flex items-center gap-1.5 ${isActive
                ? 'border-red-500/40 text-red-400 bg-red-500/10 shadow-sm shadow-red-500/20 animate-pulse'
                : 'border-border/50 text-muted-foreground hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5'
                }`}
        >
            {isActive ? t('cinematic.stopButton') : t('cinematic.liveButton')}
        </button>
    );
};
