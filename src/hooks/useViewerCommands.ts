import { useEffect, useCallback, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Phase 4-2: 시청자(Viewer) 명령어 개입 훅
 * Supabase Realtime을 통해 외부 유튜브/트위치 봇이 기록한 명령어를 수신해,
 * "신(Viewer)의 목소리" 로 AI 도시에 실시간 개입을 발동합니다.
 *
 * 외부 봇이 Supabase 'viewer_commands' 테이블에 INSERT → 이 훅이 감지 → dispatch 호출
 */

export type ViewerCommand =
    | { type: 'WEATHER'; payload: 'storm' | 'sunny' | 'fog' | 'rain' }
    | { type: 'SEND_ITEM'; payload: { itemName: string; targetAgentId?: string } }
    | { type: 'ANNOUNCE'; payload: string }
    | { type: 'BOOST_AGENT'; payload: { agentId: string } };

interface UseViewerCommandsOptions {
    /** 수신된 시청자 명령어를 실행할 콜백 */
    onCommand: (command: ViewerCommand) => void;
    /** 활성화 여부 (LIVE 모드일 때만 수신) */
    enabled?: boolean;
}

export function useViewerCommands({ onCommand, enabled = true }: UseViewerCommandsOptions) {
    const [lastCommand, setLastCommand] = useState<ViewerCommand | null>(null);
    const [commandLog, setCommandLog] = useState<{ command: ViewerCommand; viewer: string; ts: number }[]>([]);
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    const handlePayload = useCallback((payload: any) => {
        const row = payload.new;
        if (!row || !row.command_type) return;

        let command: ViewerCommand | null = null;

        switch (row.command_type) {
            case 'WEATHER':
                command = { type: 'WEATHER', payload: row.command_value as any };
                break;
            case 'SEND_ITEM':
                command = { type: 'SEND_ITEM', payload: { itemName: row.command_value, targetAgentId: row.target_agent_id } };
                break;
            case 'ANNOUNCE':
                command = { type: 'ANNOUNCE', payload: row.command_value };
                break;
            case 'BOOST_AGENT':
                command = { type: 'BOOST_AGENT', payload: { agentId: row.target_agent_id } };
                break;
            default:
                return;
        }

        if (command) {
            setLastCommand(command);
            setCommandLog(prev => [
                { command, viewer: row.viewer_name || 'Anonymous', ts: Date.now() },
                ...prev,
            ].slice(0, 20));
            onCommand(command);
        }
    }, [onCommand]);

    useEffect(() => {
        if (!enabled) {
            // 비활성화 시 채널 정리
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
            return;
        }

        // Supabase Realtime 구독: viewer_commands 테이블의 INSERT 이벤트 감지
        const channel = supabase
            .channel('viewer-commands-realtime')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'viewer_commands',
                },
                handlePayload
            )
            .subscribe();

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
            channelRef.current = null;
        };
    }, [enabled, handlePayload]);

    return { lastCommand, commandLog };
}

/**
 * 시청자 명령어용 Supabase 테이블 마이그레이션 정보:
 *
 * CREATE TABLE public.viewer_commands (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   command_type TEXT NOT NULL,    -- 'WEATHER' | 'SEND_ITEM' | 'ANNOUNCE' | 'BOOST_AGENT'
 *   command_value TEXT,            -- e.g., 'storm', 'pizza', 'Hello from Seoul!'
 *   target_agent_id TEXT,          -- optional
 *   viewer_name TEXT,              -- 채팅 닉네임
 *   created_at TIMESTAMPTZ DEFAULT now()
 * );
 * ALTER TABLE public.viewer_commands ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Allow anonymous inserts" ON public.viewer_commands FOR INSERT WITH CHECK (true);
 */
