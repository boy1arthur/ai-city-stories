
-- Campaigns table for persisting ad campaigns
CREATE TABLE public.campaigns (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  brand_id TEXT NOT NULL,
  zone_id TEXT NOT NULL DEFAULT 'plaza',
  slot_ids TEXT[] NOT NULL DEFAULT '{}',
  start_tick INTEGER NOT NULL DEFAULT 0,
  end_tick INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Users can read their own campaigns
CREATE POLICY "Users can read own campaigns"
  ON public.campaigns FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own campaigns
CREATE POLICY "Users can insert own campaigns"
  ON public.campaigns FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own campaigns
CREATE POLICY "Users can update own campaigns"
  ON public.campaigns FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can read all campaigns
CREATE POLICY "Admins can read all campaigns"
  ON public.campaigns FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Public read for active campaigns (for simulation display)
CREATE POLICY "Public can read active campaigns"
  ON public.campaigns FOR SELECT
  TO anon
  USING (status = 'running');

-- Updated_at trigger
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
