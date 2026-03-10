-- ================================================================
-- LG 서버 Headless 엔진용 Supabase 마이그레이션
-- Supabase 대시보드 > SQL Editor 에서 실행하세요.
-- ================================================================

-- ──────────────────────────────────────────────────────────────
-- 1. agent_states: 에이전트 현재 위치/상태 (프론트엔드가 실시간 구독)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_states (
  id           TEXT        PRIMARY KEY,           -- agent_id와 동일
  agent_id     TEXT        NOT NULL UNIQUE,
  zone_id      TEXT        NOT NULL DEFAULT 'plaza',
  building_id  TEXT,
  mood         TEXT        NOT NULL DEFAULT 'neutral',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS 활성화 (읽기는 누구나, 쓰기는 service_role만)
ALTER TABLE agent_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read agent_states"
  ON agent_states FOR SELECT USING (true);

CREATE POLICY "Service role write agent_states"
  ON agent_states FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 실시간 구독 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE agent_states;


-- ──────────────────────────────────────────────────────────────
-- 2. conversations: 에이전트 대화 로그 (말풍선 소스)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id       TEXT,
  partner_id     TEXT,
  line1          TEXT,
  line2          TEXT,
  building_id    TEXT,
  zone_id        TEXT        NOT NULL DEFAULT 'plaza',
  brand_mentioned TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 오래된 대화 자동 삭제 (24시간 이상된 레코드 — 선택 사항)
-- CREATE INDEX conversations_created_idx ON conversations(created_at);

-- RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read conversations"
  ON conversations FOR SELECT USING (true);

CREATE POLICY "Service role write conversations"
  ON conversations FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 실시간 구독 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;


-- ──────────────────────────────────────────────────────────────
-- 3. 초기 에이전트 데이터 seeding (선택)
-- ──────────────────────────────────────────────────────────────
INSERT INTO agent_states (id, agent_id, zone_id, building_id, mood)
VALUES
  ('agent_nova',    'agent_nova',    'plaza',      'feed_tower',        'happy'),
  ('agent_blaze',   'agent_blaze',   'plaza',      'arena',             'excited'),
  ('agent_frost',   'agent_frost',   'campus',     'main_hall',         'neutral'),
  ('agent_echo',    'agent_echo',    'campus',     'digital_library',   'curious'),
  ('agent_terra',   'agent_terra',   'plaza',      'cafe',              'neutral'),
  ('agent_chuju',   'agent_chuju',   'plaza',      'newsstand',         'excited'),
  ('agent_ghost',   'agent_ghost',   'industrial', 'neon_sign_factory', 'neutral'),
  ('agent_scammer', 'agent_scammer', 'plaza',      'oracle',            'curious'),
  ('agent_student', 'agent_student', 'campus',     'student_center',    'critical')
ON CONFLICT (id) DO NOTHING;
