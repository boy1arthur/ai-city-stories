import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Phase 4-2 (Refined): 스트림 리스너 훅
 * Supabase Realtime을 통해 외부(Twitch/YouTube)에서 들어오는 시청자 개입 이벤트를 수신합니다.
 */

export interface StreamEvent {
    id: string;
    type: 'WEATHER' | 'SPAWN_ITEM' | 'BOOST_AGENT' | 'ANNOUNCE';
    value: string;
    viewerName: string;
    targetAgentId?: string;
    timestamp: number;
}

interface UseStreamListenerOptions {
    onEvent: (event: StreamEvent) => void;
    enabled?: boolean;
}

export function useStreamListener({ onEvent, enabled = true }: UseStreamListenerOptions) {
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    const handlePayload = useCallback((payload: any) => {
        const row = payload.new;
        if (!row) return;

        // DB 테이블 'viewer_commands' (Phase 4에서 기구축) 구조를 매핑
        const event: StreamEvent = {
            id: row.id,
            type: row.command_type as StreamEvent['type'],
            value: row.command_value || '',
            viewerName: row.viewer_name || 'Anonymous',
            targetAgentId: row.target_agent_id,
            timestamp: Date.now(),
        };

        onEvent(event);
    }, [onEvent]);

    useEffect(() => {
        if (!enabled) return;

        const channel = supabase
            .channel('stream-intervention-refined')
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
        };
    }, [enabled, handlePayload]);
}
