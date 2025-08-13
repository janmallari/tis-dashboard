-- 1. Create ENUM for agency status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agency_status') THEN
    CREATE TYPE public.agency_status AS ENUM ('onboarding', 'active', 'suspended');
  END IF;
END$$;

-- 2. Add status column to agencies
ALTER TABLE public.agencies
ADD COLUMN IF NOT EXISTS status public.agency_status DEFAULT 'onboarding' NOT NULL;

-- Create enum for integration status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'integration_status') THEN
    CREATE TYPE public.integration_status AS ENUM ('active', 'disabled', 'removed');
  END IF;
END$$;

-- 3. Create storage_integrations table
CREATE TABLE IF NOT EXISTS public.storage_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id BIGINT NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('google_drive', 'sharepoint')),
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    status public.integration_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Trigger for updated_at on storage_integrations
CREATE OR REPLACE FUNCTION public.update_storage_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_storage_integrations_updated_at ON public.storage_integrations;
CREATE TRIGGER update_storage_integrations_updated_at
BEFORE UPDATE ON public.storage_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_storage_integrations_updated_at();

-- 5. Enable RLS for storage_integrations
ALTER TABLE public.storage_integrations ENABLE ROW LEVEL SECURITY;

-- 6. Policies for storage_integrations
CREATE POLICY "Agency admins manage storage integrations"
ON public.storage_integrations
USING (
  EXISTS (
    SELECT 1
    FROM public.agency_users au
    WHERE au.user_id = auth.uid()
      AND au.agency_id = storage_integrations.agency_id
      AND au.role = 'admin'
      AND au.is_active = true
  )
  OR EXISTS (
    SELECT 1
    FROM public.user_profiles up
    WHERE up.id = auth.uid()
      AND up.user_type = 'super_admin'
  )
);

-- Get current active integration of the agency
CREATE OR REPLACE FUNCTION public.get_active_integration(p_agency_id BIGINT)
RETURNS TABLE (
    id UUID,
    provider TEXT,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    status public.integration_status
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id, provider, access_token, refresh_token, expires_at, status
  FROM public.storage_integrations
  WHERE agency_id = p_agency_id
    AND status = 'active'
  LIMIT 1;
$$;

-- Disable the integration
CREATE OR REPLACE FUNCTION public.disable_integration(p_integration_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.storage_integrations
  SET status = 'disabled', updated_at = NOW()
  WHERE id = p_integration_id;
END;
$$;

-- Remove the integration
CREATE OR REPLACE FUNCTION public.remove_integration(p_integration_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.storage_integrations
  SET status = 'removed', updated_at = NOW()
  WHERE id = p_integration_id;
END;
$$;

-- 7. Update create_agency_with_admin to set onboarding status
CREATE OR REPLACE FUNCTION public.create_agency_with_admin(
    agency_name text,
    slug text,
    created_by uuid,
    admin_name text,
    admin_email text
) RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  existing_user_id uuid;
  new_user_id uuid;
  new_agency_id integer;
BEGIN
  SELECT id INTO existing_user_id FROM auth.users WHERE email = admin_email;
  IF existing_user_id IS NOT NULL THEN
    RETURN json_build_object('success', false, 'message', 'User with email exists');
  END IF;

  INSERT INTO auth.users (email, full_name)
  VALUES (admin_email, admin_name)
  RETURNING id INTO new_user_id;

  INSERT INTO public.agencies (name, slug, created_by, status)
  VALUES (agency_name, slug, created_by, 'onboarding')
  RETURNING id INTO new_agency_id;

  INSERT INTO public.agency_users (user_id, agency_id, role)
  VALUES (new_user_id, new_agency_id, 'admin');

  RETURN json_build_object('success', true, 'agency_id', new_agency_id, 'user_id', new_user_id);
END;
$$;

-- 8. Function to change agency status (super_admin only)
CREATE OR REPLACE FUNCTION public.set_agency_status(
    target_agency_id bigint,
    new_status public.agency_status
) RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.agencies
  SET status = new_status
  WHERE id = target_agency_id;
END;
$$;

-- 9. Enable RLS on relevant tables if not enabled
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_users ENABLE ROW LEVEL SECURITY;

-- Optional: enable if these exist
-- DO $$ BEGIN
--   IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reports') THEN
--     EXECUTE 'ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY';
--   END IF;
--   IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') THEN
--     EXECUTE 'ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY';
--   END IF;
-- END $$;

-- 10. Policies for agencies table
CREATE POLICY "Super admin full agencies access"
ON public.agencies
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND user_type = 'super_admin'
  )
);

CREATE POLICY "Agency users access own agency when active/onboarding"
ON public.agencies
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.agency_users au
    JOIN public.agencies a ON a.id = au.agency_id
    WHERE au.user_id = auth.uid()
      AND a.id = agencies.id
      AND a.status IN ('active', 'onboarding')
  )
);

CREATE POLICY "Agency admins update own agency when active/onboarding"
ON public.agencies
FOR UPDATE
USING (
  public.user_is_agency_admin(auth.uid(), id)
  AND status IN ('active', 'onboarding')
);

-- 11. Policies for agency_users table
CREATE POLICY "Super admin full agency_users access"
ON public.agency_users
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND user_type = 'super_admin'
  )
);

CREATE POLICY "Agency users view own agency_users when active/onboarding"
ON public.agency_users
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.agency_users au
    JOIN public.agencies a ON a.id = au.agency_id
    WHERE au.user_id = auth.uid()
      AND agency_users.agency_id = a.id
      AND a.status IN ('active', 'onboarding')
  )
);

CREATE POLICY "Agency admins update agency_users when active/onboarding"
ON public.agency_users
FOR UPDATE
USING (
  public.user_is_agency_admin(auth.uid(), agency_id)
  AND EXISTS (
    SELECT 1 FROM public.agencies a
    WHERE a.id = agency_users.agency_id
      AND a.status IN ('active', 'onboarding')
  )
);

CREATE POLICY "Agency admins delete agency_users when active/onboarding"
ON public.agency_users
FOR DELETE
USING (
  public.user_is_agency_admin(auth.uid(), agency_id)
  AND EXISTS (
    SELECT 1 FROM public.agencies a
    WHERE a.id = agency_users.agency_id
      AND a.status IN ('active', 'onboarding')
  )
);

CREATE POLICY "Agency users insert to agency_users when active/onboarding"
ON public.agency_users
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.agency_users au
    JOIN public.agencies a ON a.id = au.agency_id
    WHERE au.user_id = auth.uid()
      AND agency_users.agency_id = a.id
      AND a.status IN ('active', 'onboarding')
  )
);

-- 12. Deny agency_users, reports, clients access if suspended
CREATE POLICY "Agency users blocked if suspended"
ON public.agency_users
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.agencies a
    WHERE a.id = agency_users.agency_id
      AND a.status != 'suspended'
  )
);

-- Reports
-- CREATE POLICY "Agency users view reports when active/onboarding"
-- ON public.reports
-- FOR SELECT
-- USING (
--   EXISTS (
--     SELECT 1 FROM public.agency_users au
--     JOIN public.agencies a ON a.id = au.agency_id
--     WHERE au.user_id = auth.uid()
--       AND reports.agency_id = a.id
--       AND a.status IN ('active', 'onboarding')
--   )
-- );

-- Clients
-- CREATE POLICY "Agency users view clients when active/onboarding"
-- ON public.clients
-- FOR SELECT
-- USING (
--   EXISTS (
--     SELECT 1 FROM public.agency_users au
--     JOIN public.agencies a ON a.id = au.agency_id
--     WHERE au.user_id = auth.uid()
--       AND clients.agency_id = a.id
--       AND a.status IN ('active', 'onboarding')
--   )
-- );
