-- 0007_buyer_journey_extended_schema.sql
-- Additive migration: introduces multi-tenant and lifecycle tracking tables
-- Safe to run multiple times (IF NOT EXISTS); does not drop existing tables.

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Types
DO $$ BEGIN
  CREATE TYPE public.person_role AS ENUM ('buyer','agent','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.priority_level AS ENUM ('low','medium','high','urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.item_status AS ENUM ('open','in_progress','done','blocked','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Organizations (FUB account / brokerage)
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  fub_account_id TEXT,
  fub_stages_config JSONB,
  timeline_automation_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  action_item_automation_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);

-- Persons (unified people directory)
CREATE TABLE IF NOT EXISTS public.persons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  role public.person_role NOT NULL DEFAULT 'buyer',
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  fub_person_id TEXT,
  fub_stage TEXT,
  fub_stage_id TEXT,
  fub_stage_order_weight INT,
  pre_approval_amount NUMERIC(12,2),
  budget_approved BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_persons_org ON public.persons(organization_id);
CREATE INDEX IF NOT EXISTS idx_persons_email ON public.persons(email);

-- Deals (opportunities / transactions)
CREATE TABLE IF NOT EXISTS public.deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  buyer_person_id UUID REFERENCES public.persons(id) ON DELETE SET NULL,
  agent_person_id UUID REFERENCES public.persons(id) ON DELETE SET NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  title TEXT,
  stage TEXT, -- external stage label (e.g., FUB)
  external_id TEXT, -- CRM deal id
  expected_close_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deals_org ON public.deals(organization_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON public.deals(stage);

-- Timelines (progress tracking across pre-escrow and escrow)
CREATE TABLE IF NOT EXISTS public.timelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  person_id UUID REFERENCES public.persons(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  phase TEXT, -- e.g., pre-escrow, escrow, post-escrow
  current_step INT,
  detection_method TEXT, -- e.g., fub_stage, events_keyword
  confidence NUMERIC(4,2),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timelines_org ON public.timelines(organization_id);
CREATE INDEX IF NOT EXISTS idx_timelines_deal ON public.timelines(deal_id);

-- Milestones (key dates inside a timeline)
CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timeline_id UUID REFERENCES public.timelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT, -- pending, completed, etc.
  due_date DATE,
  completed_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_milestones_timeline ON public.milestones(timeline_id);

-- Action Items (tasks derived from stage changes / timelines)
CREATE TABLE IF NOT EXISTS public.action_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  person_id UUID REFERENCES public.persons(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority public.priority_level NOT NULL DEFAULT 'medium',
  status public.item_status NOT NULL DEFAULT 'open',
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_action_items_org ON public.action_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_action_items_person ON public.action_items(person_id);

-- Events (ingested signals used for detection)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  person_id UUID REFERENCES public.persons(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  type TEXT,
  source TEXT, -- e.g., fub, app, manual
  payload JSONB,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_org ON public.events(organization_id);
CREATE INDEX IF NOT EXISTS idx_events_person ON public.events(person_id);

-- Custom fields (extensible attributes for any entity)
CREATE TABLE IF NOT EXISTS public.custom_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL, -- e.g., 'person','deal','property','timeline'
  entity_id UUID NOT NULL,
  key TEXT NOT NULL,
  value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, entity_type, entity_id, key)
);

CREATE INDEX IF NOT EXISTS idx_custom_fields_org ON public.custom_fields(organization_id);
CREATE INDEX IF NOT EXISTS idx_custom_fields_entity ON public.custom_fields(entity_type, entity_id);

-- Timestamps maintenance trigger function (safe to re-run)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $func$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER organizations_set_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER persons_set_updated_at
  BEFORE UPDATE ON public.persons
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER deals_set_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER timelines_set_updated_at
  BEFORE UPDATE ON public.timelines
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;



