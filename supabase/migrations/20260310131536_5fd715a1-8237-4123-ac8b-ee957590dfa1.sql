
-- 1. agent_memories 테이블
CREATE TABLE public.agent_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  content TEXT NOT NULL,
  importance INTEGER NOT NULL DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agent memories are publicly readable"
  ON public.agent_memories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert memories"
  ON public.agent_memories FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 2. viewer_commands 테이블
CREATE TABLE public.viewer_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  command_type TEXT NOT NULL,
  command_value TEXT DEFAULT '',
  target_agent_id TEXT,
  viewer_name TEXT DEFAULT 'Anonymous',
  donation_amount INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.viewer_commands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Viewer commands are publicly readable"
  ON public.viewer_commands FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert viewer commands"
  ON public.viewer_commands FOR INSERT
  TO public
  WITH CHECK (true);

-- Enable realtime for viewer_commands
ALTER PUBLICATION supabase_realtime ADD TABLE public.viewer_commands;
