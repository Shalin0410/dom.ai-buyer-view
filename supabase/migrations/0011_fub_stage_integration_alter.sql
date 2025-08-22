-- Refine schema for FUB stage integration and buyer journey without data loss
-- This migration only adds types, columns, tables, and indexes; it does not drop/rename existing fields
-- Safe to run multiple times due to IF NOT EXISTS guards

-- 1) Types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fub_stage') THEN
    CREATE TYPE fub_stage AS ENUM (
      'lead',
      'hot_prospect',
      'nurture',
      'active_client',
      'pending',
      'closed',
      'past_client',
      'sphere',
      'trash',
      'unresponsive'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'timeline_phase') THEN
    CREATE TYPE timeline_phase AS ENUM (
      'pre_escrow',
      'escrow',
      'post_escrow',
      'inactive'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pre_escrow_step') THEN
    CREATE TYPE pre_escrow_step AS ENUM (
      'initial_consultation',
      'financial_preparation',
      'search_strategy',
      'property_tours',
      'review_disclosures',
      'offer_strategy'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'action_item_type') THEN
    CREATE TYPE action_item_type AS ENUM (
      'conduct_buyer_consultation',
      'connect_buyer_with_lender',
      'verify_proof_of_funds',
      'set_up_property_search',
      'schedule_attend_showings',
      'review_disclosures_reports',
      'discuss_offer_strategy',
      'prepare_offer_paperwork',
      'submit_contract_to_escrow',
      'ensure_earnest_money_deposited',
      'review_preliminary_title_report',
      'confirm_title_search_ordered',
      'schedule_all_inspections',
      'negotiate_repairs_credits',
      'schedule_final_walkthrough',
      'review_closing_disclosure',
      'confirm_buyer_wires_funds',
      'coordinate_notary_signing',
      'deliver_keys',
      'mark_as_irrelevant'
    );
  END IF;
END$$;

-- 2) Organizations: enrich business + FUB fields
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS organization_type text,
  ADD COLUMN IF NOT EXISTS fub_account_id text,
  ADD COLUMN IF NOT EXISTS business_address jsonb,
  ADD COLUMN IF NOT EXISTS business_phone text,
  ADD COLUMN IF NOT EXISTS business_email text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS timezone text;

-- 3) Persons: unify agent/buyer + financials and tracking
ALTER TABLE public.persons
  ADD COLUMN IF NOT EXISTS organization_id uuid,
  ADD COLUMN IF NOT EXISTS middle_name text,
  ADD COLUMN IF NOT EXISTS agent_id uuid,
  ADD COLUMN IF NOT EXISTS price_min int,
  ADD COLUMN IF NOT EXISTS price_max int,
  ADD COLUMN IF NOT EXISTS budget_approved boolean,
  ADD COLUMN IF NOT EXISTS pre_approval_amount numeric,
  ADD COLUMN IF NOT EXISTS pre_approval_expiry date,
  ADD COLUMN IF NOT EXISTS last_contact_date date,
  ADD COLUMN IF NOT EXISTS next_followup_date date,
  ADD COLUMN IF NOT EXISTS last_synced_with_fub timestamptz;

-- FK references (added separately to avoid failure if rows violate now)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE c.conname = 'persons_organization_id_fk_new' AND t.relname = 'persons'
  ) THEN
    BEGIN
      ALTER TABLE public.persons
        ADD CONSTRAINT persons_organization_id_fk_new
        FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      -- Ignore if existing different FK or data not yet consistent
      NULL;
    END;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE c.conname = 'persons_agent_id_fk_new' AND t.relname = 'persons'
  ) THEN
    BEGIN
      ALTER TABLE public.persons
        ADD CONSTRAINT persons_agent_id_fk_new
        FOREIGN KEY (agent_id) REFERENCES public.persons(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN NULL; END;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_persons_organization_role ON public.persons(organization_id, role);
CREATE INDEX IF NOT EXISTS idx_persons_agent_id ON public.persons(agent_id);

-- 4) Timelines: add refined phase/steps + FUB fields while preserving existing phase
ALTER TABLE public.timelines
  ADD COLUMN IF NOT EXISTS current_phase timeline_phase,
  ADD COLUMN IF NOT EXISTS previous_phase timeline_phase,
  ADD COLUMN IF NOT EXISTS current_pre_escrow_step pre_escrow_step,
  ADD COLUMN IF NOT EXISTS pre_escrow_completed_steps pre_escrow_step[] DEFAULT '{}'::pre_escrow_step[],
  ADD COLUMN IF NOT EXISTS escrow_steps text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS escrow_step_dates date[] DEFAULT '{}'::date[],
  ADD COLUMN IF NOT EXISTS current_escrow_step_index int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fub_stage fub_stage,
  ADD COLUMN IF NOT EXISTS fub_stage_id int,
  ADD COLUMN IF NOT EXISTS fub_stage_order_weight int,
  ADD COLUMN IF NOT EXISTS stage_last_updated timestamptz,
  ADD COLUMN IF NOT EXISTS custom_timeline_data jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS timeline_notes text;

-- Backfill current_phase from legacy text phase ('pre-escrow'|'escrow'|'closed')
UPDATE public.timelines
SET current_phase = CASE phase
  WHEN 'pre-escrow' THEN 'pre_escrow'::timeline_phase
  WHEN 'escrow' THEN 'escrow'::timeline_phase
  WHEN 'closed' THEN 'post_escrow'::timeline_phase
  ELSE current_phase
END
WHERE current_phase IS NULL;

CREATE INDEX IF NOT EXISTS idx_timelines_current_phase ON public.timelines(current_phase);

-- 5) Action Items: add typed action + richer context, keep legacy columns
ALTER TABLE public.action_items
  ADD COLUMN IF NOT EXISTS organization_id uuid,
  ADD COLUMN IF NOT EXISTS deal_id uuid,
  ADD COLUMN IF NOT EXISTS property_id uuid,
  ADD COLUMN IF NOT EXISTS template_id text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS estimated_time text,
  ADD COLUMN IF NOT EXISTS timeline_id uuid,
  ADD COLUMN IF NOT EXISTS action_type action_item_type,
  ADD COLUMN IF NOT EXISTS applicable_phase timeline_phase,
  ADD COLUMN IF NOT EXISTS applicable_pre_escrow_step pre_escrow_step,
  ADD COLUMN IF NOT EXISTS applicable_escrow_step text,
  ADD COLUMN IF NOT EXISTS priority text,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS assigned_to uuid,
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS completed_date date,
  ADD COLUMN IF NOT EXISTS completion_notes text,
  ADD COLUMN IF NOT EXISTS fub_event_keywords text,
  ADD COLUMN IF NOT EXISTS triggered_by_fub_event boolean DEFAULT false;

-- Backfill applicable_phase from legacy action_items.phase
UPDATE public.action_items ai
SET applicable_phase = CASE ai.phase
  WHEN 'pre-escrow' THEN 'pre_escrow'::timeline_phase
  WHEN 'escrow' THEN 'escrow'::timeline_phase
  ELSE applicable_phase
END
WHERE applicable_phase IS NULL;

CREATE INDEX IF NOT EXISTS idx_action_items_organization_person ON public.action_items(organization_id, person_id);
CREATE INDEX IF NOT EXISTS idx_action_items_timeline_order ON public.action_items(timeline_id, item_order);
CREATE INDEX IF NOT EXISTS idx_action_items_type ON public.action_items(action_type);
CREATE INDEX IF NOT EXISTS idx_action_items_phase ON public.action_items(applicable_phase);
CREATE INDEX IF NOT EXISTS idx_action_items_status ON public.action_items(status);
CREATE INDEX IF NOT EXISTS idx_action_items_due_date ON public.action_items(due_date);

-- 6) Properties: enrich to support listings + FUB sync
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS organization_id uuid,
  ADD COLUMN IF NOT EXISTS listing_agent_id uuid,
  ADD COLUMN IF NOT EXISTS listing_price numeric,
  ADD COLUMN IF NOT EXISTS purchase_price numeric,
  ADD COLUMN IF NOT EXISTS property_type text,
  ADD COLUMN IF NOT EXISTS mls_number text,
  ADD COLUMN IF NOT EXISTS listing_url text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS hoa_fee numeric,
  ADD COLUMN IF NOT EXISTS property_tax numeric,
  ADD COLUMN IF NOT EXISTS days_on_market int,
  ADD COLUMN IF NOT EXISTS coordinates jsonb,
  ADD COLUMN IF NOT EXISTS features jsonb,
  ADD COLUMN IF NOT EXISTS schools jsonb,
  ADD COLUMN IF NOT EXISTS neighborhood_info jsonb,
  ADD COLUMN IF NOT EXISTS fub_property_id int,
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz;

-- Attempt to backfill listing_price from legacy price if present
UPDATE public.properties SET listing_price = price
WHERE listing_price IS NULL AND price IS NOT NULL;

-- Guard unique on MLS number
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'properties_mls_number_key'
  ) THEN
    BEGIN
      ALTER TABLE public.properties
        ADD CONSTRAINT properties_mls_number_key UNIQUE (mls_number);
    EXCEPTION WHEN others THEN NULL; END;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_properties_organization ON public.properties(organization_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_listing_agent ON public.properties(listing_agent_id);

-- 7) Property Photos: align ordering column but preserve legacy "order"
ALTER TABLE public.property_photos
  ADD COLUMN IF NOT EXISTS order_index int;

UPDATE public.property_photos SET order_index = "order"
WHERE order_index IS NULL;

-- 8) Buyer Properties: add organization/timeline linkage; keep existing enums
ALTER TABLE public.buyer_properties
  ADD COLUMN IF NOT EXISTS organization_id uuid,
  ADD COLUMN IF NOT EXISTS timeline_id uuid,
  ADD COLUMN IF NOT EXISTS offer_amount numeric,
  ADD COLUMN IF NOT EXISTS contract_date date,
  ADD COLUMN IF NOT EXISTS escrow_date date;

CREATE INDEX IF NOT EXISTS idx_buyer_properties_buyer ON public.buyer_properties(buyer_id);
CREATE INDEX IF NOT EXISTS idx_buyer_properties_property ON public.buyer_properties(property_id);
CREATE INDEX IF NOT EXISTS idx_buyer_properties_organization ON public.buyer_properties(organization_id);
CREATE INDEX IF NOT EXISTS idx_buyer_properties_status ON public.buyer_properties(status);

-- 9) Events: add timeline impact + FUB sync status
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS property_id uuid,
  ADD COLUMN IF NOT EXISTS timeline_id uuid,
  ADD COLUMN IF NOT EXISTS fub_sync_status text,
  ADD COLUMN IF NOT EXISTS detected_keywords text,
  ADD COLUMN IF NOT EXISTS keyword_category text,
  ADD COLUMN IF NOT EXISTS triggers_timeline_update boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS suggested_phase timeline_phase,
  ADD COLUMN IF NOT EXISTS suggested_step text,
  ADD COLUMN IF NOT EXISTS confidence_score int;

CREATE INDEX IF NOT EXISTS idx_events_person_date ON public.events(person_id, event_date);
CREATE INDEX IF NOT EXISTS idx_events_keyword_category ON public.events(keyword_category);

-- 10) FUB Stage Mapping: new table
CREATE TABLE IF NOT EXISTS public.fub_stage_mapping (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  fub_stage_name text NOT NULL,
  fub_stage_id int NOT NULL,
  fub_order_weight int NOT NULL,
  is_protected boolean DEFAULT false,
  mapped_timeline_phase timeline_phase NOT NULL,
  mapped_pre_escrow_step pre_escrow_step,
  mapped_escrow_step text,
  detection_priority int DEFAULT 0,
  auto_progression_enabled boolean DEFAULT true,
  api_detection_method text NOT NULL,
  api_endpoint text,
  detection_logic text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (organization_id, fub_stage_id)
);

CREATE INDEX IF NOT EXISTS idx_fub_stage_mapping_organization ON public.fub_stage_mapping(organization_id);

-- 11) updated_at trigger helper (idempotent)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper to create trigger if missing
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT 'organizations' AS tbl UNION ALL
           SELECT 'persons' UNION ALL
           SELECT 'timelines' UNION ALL
           SELECT 'action_items' UNION ALL
           SELECT 'properties' UNION ALL
           SELECT 'property_photos' UNION ALL
           SELECT 'buyer_properties' UNION ALL
           SELECT 'events' UNION ALL
           SELECT 'fub_stage_mapping'
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = format('set_updated_at_%s', r.tbl)
    ) THEN
      EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();',
                     format('set_updated_at_%s', r.tbl), r.tbl);
    END IF;
  END LOOP;
END$$;


