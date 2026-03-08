-- Create slots table
CREATE TABLE public.slots (
  id TEXT PRIMARY KEY,
  zone TEXT NOT NULL DEFAULT 'plaza',
  type TEXT NOT NULL,
  location JSONB NOT NULL DEFAULT '{}',
  label TEXT NOT NULL DEFAULT '',
  owner_type TEXT NOT NULL DEFAULT 'empty',
  owner_id TEXT,
  owner_name TEXT,
  owner_message TEXT,
  ai_hook_id TEXT,
  trigger_type TEXT DEFAULT 'click',
  display_config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;

-- Public read access (slots are public data)
CREATE POLICY "Slots are publicly readable"
  ON public.slots FOR SELECT
  USING (true);

-- Only authenticated users can update (admin check deferred to app layer for now)
CREATE POLICY "Authenticated users can update slots"
  ON public.slots FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Only authenticated users can insert
CREATE POLICY "Authenticated users can insert slots"
  ON public.slots FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_slots_updated_at
  BEFORE UPDATE ON public.slots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();