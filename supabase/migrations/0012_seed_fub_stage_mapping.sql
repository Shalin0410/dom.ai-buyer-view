-- Seed default FUB stage mappings for each organization
-- Uses INSERT ... SELECT with ON CONFLICT DO NOTHING to keep it idempotent

-- Note: selecting directly from public.organizations avoids CTE scope issues
-- Lead → pre_escrow step 1
INSERT INTO public.fub_stage_mapping (
  organization_id, fub_stage_name, fub_stage_id, fub_order_weight,
  mapped_timeline_phase, mapped_pre_escrow_step, mapped_escrow_step,
  detection_priority, auto_progression_enabled, api_detection_method
)
SELECT id, 'lead', 2, 1000, 'pre_escrow', 'initial_consultation', NULL, 10, true, 'fub-contacts'
FROM public.organizations
ON CONFLICT (organization_id, fub_stage_id) DO NOTHING;

-- Hot Prospect → pre_escrow step 2
INSERT INTO public.fub_stage_mapping (
  organization_id, fub_stage_name, fub_stage_id, fub_order_weight,
  mapped_timeline_phase, mapped_pre_escrow_step, mapped_escrow_step,
  detection_priority, auto_progression_enabled, api_detection_method
)
SELECT id, 'hot_prospect', 12, 2000, 'pre_escrow', 'financial_preparation', NULL, 20, true, 'fub-contacts'
FROM public.organizations
ON CONFLICT (organization_id, fub_stage_id) DO NOTHING;

-- Nurture → pre_escrow step 3
INSERT INTO public.fub_stage_mapping (
  organization_id, fub_stage_name, fub_stage_id, fub_order_weight,
  mapped_timeline_phase, mapped_pre_escrow_step, mapped_escrow_step,
  detection_priority, auto_progression_enabled, api_detection_method
)
SELECT id, 'nurture', 13, 3000, 'pre_escrow', 'search_strategy', NULL, 30, true, 'fub-contacts'
FROM public.organizations
ON CONFLICT (organization_id, fub_stage_id) DO NOTHING;

-- Active Client → pre_escrow step 4 (tours)
INSERT INTO public.fub_stage_mapping (
  organization_id, fub_stage_name, fub_stage_id, fub_order_weight,
  mapped_timeline_phase, mapped_pre_escrow_step, mapped_escrow_step,
  detection_priority, auto_progression_enabled, api_detection_method
)
SELECT id, 'active_client', 17, 4000, 'pre_escrow', 'property_tours', NULL, 40, true, 'fub-contacts'
FROM public.organizations
ON CONFLICT (organization_id, fub_stage_id) DO NOTHING;

-- Pending → escrow (no fixed step, dynamic)
INSERT INTO public.fub_stage_mapping (
  organization_id, fub_stage_name, fub_stage_id, fub_order_weight,
  mapped_timeline_phase, mapped_pre_escrow_step, mapped_escrow_step,
  detection_priority, auto_progression_enabled, api_detection_method
)
SELECT id, 'pending', 14, 5000, 'escrow', NULL, 'open_escrow', 50, true, 'fub-deals'
FROM public.organizations
ON CONFLICT (organization_id, fub_stage_id) DO NOTHING;

-- Closed → post_escrow
INSERT INTO public.fub_stage_mapping (
  organization_id, fub_stage_name, fub_stage_id, fub_order_weight,
  mapped_timeline_phase, mapped_pre_escrow_step, mapped_escrow_step,
  detection_priority, auto_progression_enabled, api_detection_method
)
SELECT id, 'closed', 8, 6000, 'post_escrow', NULL, NULL, 60, true, 'fub-deals'
FROM public.organizations
ON CONFLICT (organization_id, fub_stage_id) DO NOTHING;

-- Past Client → post_escrow
INSERT INTO public.fub_stage_mapping (
  organization_id, fub_stage_name, fub_stage_id, fub_order_weight,
  mapped_timeline_phase, mapped_pre_escrow_step, mapped_escrow_step,
  detection_priority, auto_progression_enabled, api_detection_method
)
SELECT id, 'past_client', 15, 7000, 'post_escrow', NULL, NULL, 70, true, 'fub-contacts'
FROM public.organizations
ON CONFLICT (organization_id, fub_stage_id) DO NOTHING;

-- Sphere → inactive
INSERT INTO public.fub_stage_mapping (
  organization_id, fub_stage_name, fub_stage_id, fub_order_weight,
  mapped_timeline_phase, mapped_pre_escrow_step, mapped_escrow_step,
  detection_priority, auto_progression_enabled, api_detection_method
)
SELECT id, 'sphere', 16, 8000, 'inactive', NULL, NULL, 80, false, 'fub-contacts'
FROM public.organizations
ON CONFLICT (organization_id, fub_stage_id) DO NOTHING;

-- Trash → inactive
INSERT INTO public.fub_stage_mapping (
  organization_id, fub_stage_name, fub_stage_id, fub_order_weight,
  mapped_timeline_phase, mapped_pre_escrow_step, mapped_escrow_step,
  detection_priority, auto_progression_enabled, api_detection_method
)
SELECT id, 'trash', 11, 9000, 'inactive', NULL, NULL, 90, false, 'fub-contacts'
FROM public.organizations
ON CONFLICT (organization_id, fub_stage_id) DO NOTHING;

-- Unresponsive → inactive
INSERT INTO public.fub_stage_mapping (
  organization_id, fub_stage_name, fub_stage_id, fub_order_weight,
  mapped_timeline_phase, mapped_pre_escrow_step, mapped_escrow_step,
  detection_priority, auto_progression_enabled, api_detection_method
)
SELECT id, 'unresponsive', 18, 10000, 'inactive', NULL, NULL, 100, false, 'fub-contacts'
FROM public.organizations
ON CONFLICT (organization_id, fub_stage_id) DO NOTHING;


