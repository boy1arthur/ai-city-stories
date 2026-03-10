
-- Fix all RLS policies to be PERMISSIVE (default) instead of RESTRICTIVE

-- agent_memories
DROP POLICY IF EXISTS "Agent memories are publicly readable" ON public.agent_memories;
DROP POLICY IF EXISTS "Authenticated users can insert memories" ON public.agent_memories;

CREATE POLICY "Agent memories are publicly readable"
  ON public.agent_memories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert memories"
  ON public.agent_memories FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- viewer_commands
DROP POLICY IF EXISTS "Viewer commands are publicly readable" ON public.viewer_commands;
DROP POLICY IF EXISTS "Anyone can insert viewer commands" ON public.viewer_commands;

CREATE POLICY "Viewer commands are publicly readable"
  ON public.viewer_commands FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert viewer commands"
  ON public.viewer_commands FOR INSERT
  TO public
  WITH CHECK (true);

-- dialogue_templates
DROP POLICY IF EXISTS "Dialogue templates are publicly readable" ON public.dialogue_templates;
DROP POLICY IF EXISTS "Admins can manage dialogue templates" ON public.dialogue_templates;

CREATE POLICY "Dialogue templates are publicly readable"
  ON public.dialogue_templates FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage dialogue templates"
  ON public.dialogue_templates FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- slots
DROP POLICY IF EXISTS "Slots are publicly readable" ON public.slots;
DROP POLICY IF EXISTS "Admins can insert slots" ON public.slots;
DROP POLICY IF EXISTS "Admins can update slots" ON public.slots;

CREATE POLICY "Slots are publicly readable"
  ON public.slots FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can insert slots"
  ON public.slots FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update slots"
  ON public.slots FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- campaigns
DROP POLICY IF EXISTS "Public can read active campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can read own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Admins can read all campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can insert own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can update own campaigns" ON public.campaigns;

CREATE POLICY "Public can read active campaigns"
  ON public.campaigns FOR SELECT
  TO anon
  USING (status = 'running');

CREATE POLICY "Users can read own campaigns"
  ON public.campaigns FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all campaigns"
  ON public.campaigns FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own campaigns"
  ON public.campaigns FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own campaigns"
  ON public.campaigns FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- user_roles
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;

CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
