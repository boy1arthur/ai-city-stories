-- Drop restrictive authenticated-only policies
DROP POLICY "Authenticated users can update slots" ON public.slots;
DROP POLICY "Authenticated users can insert slots" ON public.slots;

-- Allow anon + authenticated to update (dev/admin phase)
CREATE POLICY "Anyone can update slots"
  ON public.slots FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can insert slots"
  ON public.slots FOR INSERT
  WITH CHECK (true);