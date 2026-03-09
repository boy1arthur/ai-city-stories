import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AgentMemory {
    id: string;
    agent_id: string;
    content: string;
    importance: number;
    metadata: any;
    created_at: string;
}

/**
 * Phase 7-2: 에이전트 기억 관리용 훅
 * - 에이전트의 장기 기억(Long-term memory)을 조회하고 새 기억을 저장합니다.
 */
export function useAgentMemories(agentId?: string) {
    const queryClient = useQueryClient();

    // 특정 에이전트 혹은 전체 에이전트의 최근 기억 조회
    const { data: memories, isLoading } = useQuery({
        queryKey: ['agent_memories', agentId],
        queryFn: async () => {
            let query = (supabase
                .from('agent_memories' as any) as any)
                .select('*')
                .order('created_at', { ascending: false });

            if (agentId) {
                query = query.eq('agent_id', agentId);
            }

            // 최근 20개까지만 가져옴 (성능 및 컨텍스트 한계 고려)
            const { data, error } = await query.limit(20);
            if (error) throw error;
            return data as AgentMemory[];
        },
        enabled: true,
    });

    // 새 기억 추가 (중요 사건 발생 시 호출)
    const addMemory = useMutation({
        mutationFn: async (newMemory: Omit<AgentMemory, 'id' | 'created_at'>) => {
            const { data, error } = await (supabase
                .from('agent_memories' as any) as any)
                .insert([newMemory])
                .select()
                .single();

            if (error) throw error;
            return data as AgentMemory;
        },
        onSuccess: (data: AgentMemory) => {
            queryClient.invalidateQueries({ queryKey: ['agent_memories', data.agent_id] });
            queryClient.invalidateQueries({ queryKey: ['agent_memories', undefined] });
        },
    });

    return { memories, isLoading, addMemory };
}
