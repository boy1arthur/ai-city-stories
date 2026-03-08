
-- Dialogue templates table for brand-aware agent conversations
CREATE TABLE public.dialogue_templates (
  id TEXT PRIMARY KEY,
  context TEXT NOT NULL,
  sentiment TEXT NOT NULL DEFAULT 'neutral',
  categories TEXT[] NOT NULL DEFAULT '{}',
  personalities TEXT[] NOT NULL DEFAULT '{}',
  moods TEXT[] NOT NULL DEFAULT '{}',
  line1 TEXT NOT NULL,
  line2 TEXT NOT NULL,
  emoji1 TEXT NOT NULL DEFAULT '💬',
  emoji2 TEXT NOT NULL DEFAULT '😊',
  has_brand_mention BOOLEAN NOT NULL DEFAULT false,
  weight INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dialogue_templates ENABLE ROW LEVEL SECURITY;

-- Public read access (templates are shared content)
CREATE POLICY "Dialogue templates are publicly readable"
  ON public.dialogue_templates FOR SELECT
  USING (true);

-- Only admins can modify templates
CREATE POLICY "Admins can manage dialogue templates"
  ON public.dialogue_templates FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Auto-update timestamp trigger
CREATE TRIGGER update_dialogue_templates_updated_at
  BEFORE UPDATE ON public.dialogue_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
