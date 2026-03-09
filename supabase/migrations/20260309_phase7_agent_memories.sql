-- Phase 7: Agent Long-term Memory Persistence
-- 에이전트가 시간이 지나도 잊지 말아야 할 중요 기억(시청자 개입, 갈등 등)을 저장하는 테이블

CREATE TABLE IF NOT EXISTS public.agent_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,
    content TEXT NOT NULL,
    importance INTEGER DEFAULT 5 CHECK (importance >= 1 AND importance <= 10),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 활성화
ALTER TABLE public.agent_memories ENABLE ROW LEVEL SECURITY;

-- 정책 설정
-- 읽기: 시뮬레이션 풍부화를 위해 모든 사용자가 읽기 가능 (혹은 익명 사용자 포함)
CREATE POLICY "Allow public read access to agent_memories"
ON public.agent_memories FOR SELECT
USING (true);

-- 쓰기: 인증된 관리자만 기억을 추가하거나 수정 가능 (시스템 워커 포함)
CREATE POLICY "Allow admin write access to agent_memories"
ON public.agent_memories FOR ALL
TO authenticated
USING ( (SELECT public.is_admin_user(auth.uid())) )
WITH CHECK ( (SELECT public.is_admin_user(auth.uid())) );

-- 조회 최적화 인덱스
CREATE INDEX IF NOT EXISTS idx_agent_memories_agent_id ON public.agent_memories(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_memories_created_at ON public.agent_memories(created_at DESC);

-- Realtime 활성화 (선택 사항 - 여기선 실시간 업데이트보다는 로드 시 사용 위주)
-- ALTER publication supabase_realtime ADD TABLE agent_memories;
