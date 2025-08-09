-- Ensure buyers present in auth/buyers are represented in public.persons

-- Ensure enum exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'person_role') THEN
    CREATE TYPE public.person_role AS ENUM ('buyer','agent','other');
  END IF;
END $$;

-- Ensure persons table has required columns
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='persons') THEN
    EXECUTE 'ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS organization_id UUID';
    EXECUTE 'ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS role public.person_role';
    EXECUTE 'ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS email TEXT';
    EXECUTE 'ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS first_name TEXT';
    EXECUTE 'ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS last_name TEXT';
    EXECUTE 'ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS phone TEXT';
    EXECUTE 'ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ';
    EXECUTE 'ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ';
  END IF;
END $$;

-- If fub_person_id exists and is NOT NULL, relax it so we can seed buyers without FUB linkage yet
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='persons' AND column_name='fub_person_id' AND is_nullable='NO'
  ) THEN
    EXECUTE 'ALTER TABLE public.persons ALTER COLUMN fub_person_id DROP NOT NULL';
  END IF;
END $$;

-- Ensure at least one organization exists; create a default if none
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.organizations) THEN
    INSERT INTO public.organizations (name, slug) VALUES ('Default Organization', 'default') ON CONFLICT DO NOTHING;
  END IF;
END $$;

WITH any_org AS (
  SELECT id AS org_id FROM public.organizations ORDER BY created_at LIMIT 1
)
-- 1) Sync from existing buyers (preferred: keeps names/phone)
INSERT INTO public.persons (
  id,
  organization_id,
  role,
  email,
  first_name,
  last_name,
  phone,
  created_at,
  updated_at
)
SELECT 
  b.id,
  (SELECT org_id FROM any_org) AS organization_id,
  'buyer'::public.person_role,
  b.email,
  b.first_name,
  b.last_name,
  b.phone,
  NOW(),
  NOW()
FROM public.buyers b
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone,
    organization_id = COALESCE(public.persons.organization_id, EXCLUDED.organization_id),
    role = COALESCE(public.persons.role, EXCLUDED.role),
    updated_at = NOW();

-- 2) Fallback: insert from auth.users for specific buyer emails not in persons
WITH any_org AS (
  SELECT id AS org_id FROM public.organizations ORDER BY created_at LIMIT 1
)
INSERT INTO public.persons (
  id,
  organization_id,
  role,
  email,
  created_at,
  updated_at
)
SELECT 
  u.id,
  (SELECT org_id FROM any_org) AS organization_id,
  'buyer'::public.person_role,
  u.email,
  NOW(),
  NOW()
FROM auth.users u
WHERE LOWER(u.email) IN (
  'shalinshah1998@gmail.com',
  'shalin41098@yahoo.com.sg'
)
ON CONFLICT (id) DO NOTHING;

-- Skip backfilling fub_person_id to avoid type mismatches across environments

-- Backfill org if any nulls remain
WITH any_org AS (
  SELECT id AS org_id FROM public.organizations ORDER BY created_at LIMIT 1
)
UPDATE public.persons SET organization_id = (SELECT org_id FROM any_org)
WHERE organization_id IS NULL;


