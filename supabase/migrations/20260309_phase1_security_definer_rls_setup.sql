-- Phase 1: Security Definer for Admin and RLS policies

-- 1. Create SECURITY DEFINER function to check admin role without infinite loop
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with the privileges of the creator
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_id = is_admin_user.user_id 
    AND role IN ('admin', 'moderator')
  );
END;
$$;

-- 2. Explicitly Enable RLS on core tables
ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dialogue_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for slots (Public read, Admin all)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.slots;
CREATE POLICY "Enable read access for all users" ON public.slots 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable full access for admins" ON public.slots;
CREATE POLICY "Enable full access for admins" ON public.slots 
FOR ALL USING (
  (SELECT public.is_admin_user(auth.uid()))
);

-- 4. RLS Policies for dialogue_templates (Public read, Admin all)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.dialogue_templates;
CREATE POLICY "Enable read access for all users" ON public.dialogue_templates 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable full access for admins" ON public.dialogue_templates;
CREATE POLICY "Enable full access for admins" ON public.dialogue_templates 
FOR ALL USING (
  (SELECT public.is_admin_user(auth.uid()))
);

-- 5. RLS Policies for campaigns (Public read, Owner/Admin full)
-- Assuming campaigns table has `user_id` column for the owner
DROP POLICY IF EXISTS "Enable read access for all users" ON public.campaigns;
CREATE POLICY "Enable read access for all users" ON public.campaigns 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable full access for owner or admin" ON public.campaigns;
CREATE POLICY "Enable full access for owner or admin" ON public.campaigns 
FOR ALL USING (
  auth.uid() = user_id OR (SELECT public.is_admin_user(auth.uid()))
);

-- 6. RLS Policies for user_roles (Admin full, Owner read)
DROP POLICY IF EXISTS "Enable full access for admins" ON public.user_roles;
CREATE POLICY "Enable full access for admins" ON public.user_roles
FOR ALL USING (
  (SELECT public.is_admin_user(auth.uid()))
);

DROP POLICY IF EXISTS "Enable read access for owner" ON public.user_roles;
CREATE POLICY "Enable read access for owner" ON public.user_roles
FOR SELECT USING (
  auth.uid() = user_id
);
