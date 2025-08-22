-- Forward-only refinements to earlier schema: add RLS guards and VALIDATE FKs later

-- Enable RLS where missing (idempotent)
DO $$ BEGIN
  EXECUTE 'ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY';
  EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  EXECUTE 'ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY';
  EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  EXECUTE 'ALTER TABLE public.timelines ENABLE ROW LEVEL SECURITY';
  EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  EXECUTE 'ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY';
  EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  EXECUTE 'ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY';
  EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  EXECUTE 'ALTER TABLE public.property_photos ENABLE ROW LEVEL SECURITY';
  EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  EXECUTE 'ALTER TABLE public.buyer_properties ENABLE ROW LEVEL SECURITY';
  EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  EXECUTE 'ALTER TABLE public.events ENABLE ROW LEVEL SECURITY';
  EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  EXECUTE 'ALTER TABLE public.fub_stage_mapping ENABLE ROW LEVEL SECURITY';
  EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  EXECUTE 'ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY';
  EXCEPTION WHEN others THEN NULL; END $$;

-- Add relaxed FKs where helpful using NOT VALID to avoid immediate failures
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'buyer_properties_property_id_fkey'
  ) THEN
    ALTER TABLE public.buyer_properties
      ADD CONSTRAINT buyer_properties_property_id_fkey
      FOREIGN KEY (property_id) REFERENCES public.properties(id) NOT VALID;
  END IF;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'buyer_properties_buyer_id_fkey'
  ) THEN
    ALTER TABLE public.buyer_properties
      ADD CONSTRAINT buyer_properties_buyer_id_fkey
      FOREIGN KEY (buyer_id) REFERENCES public.buyers(id) NOT VALID;
  END IF;
EXCEPTION WHEN others THEN NULL; END $$;

-- Optional: validate when data is clean (commented by default)
-- ALTER TABLE public.buyer_properties VALIDATE CONSTRAINT buyer_properties_property_id_fkey;
-- ALTER TABLE public.buyer_properties VALIDATE CONSTRAINT buyer_properties_buyer_id_fkey;

-- Index hygiene: ensure critical indexes exist
CREATE INDEX IF NOT EXISTS idx_properties_mls_number ON public.properties(mls_number);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON public.properties(created_at);
CREATE INDEX IF NOT EXISTS idx_persons_created_at ON public.persons(created_at);



