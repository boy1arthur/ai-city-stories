-- Phase 4-2: 시청자(Viewer) 명령어 테이블
-- 외부 트위치/유튜브 봇이 채팅 명령어를 저장 → Realtime 구독으로 도시에 즉각 반영

CREATE TABLE IF NOT EXISTS public.viewer_commands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  command_type TEXT NOT NULL CHECK (command_type IN ('WEATHER', 'SEND_ITEM', 'ANNOUNCE', 'BOOST_AGENT')),
  command_value TEXT,
  target_agent_id TEXT,
  viewer_name TEXT DEFAULT 'Anonymous',
  donation_amount INTEGER,
  is_processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 활성화
ALTER TABLE public.viewer_commands ENABLE ROW LEVEL SECURITY;

-- 봇/외부 인서트 허용 (익명으로도 기록 가능하게)
CREATE POLICY "allow_bot_inserts" ON public.viewer_commands
  FOR INSERT WITH CHECK (true);

-- 앱은 자신의 명령어를 조회할 수 있음
CREATE POLICY "allow_read_all" ON public.viewer_commands
  FOR SELECT USING (true);

-- Realtime 퍼블리케이션 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE public.viewer_commands;

-- 오래된 명령어 자동 정리 (7일 이상 된 것)
CREATE OR REPLACE FUNCTION cleanup_old_viewer_commands()
RETURNS void LANGUAGE sql AS $$
  DELETE FROM public.viewer_commands WHERE created_at < NOW() - INTERVAL '7 days';
$$;

COMMENT ON TABLE public.viewer_commands IS 
  'Phase 4: 시청자 명령 저장소 — 트위치/유튜브 봇이 채팅 명령어를 기록하면 Realtime으로 게임 월드에 즉시 반영됩니다.';
