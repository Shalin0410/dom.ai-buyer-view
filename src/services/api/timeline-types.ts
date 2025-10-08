// Timeline Types - Matching Supabase database schema

export type TimelinePhase = 'pre_escrow' | 'escrow' | 'post_escrow' | 'inactive';

export type FubStage =
  | 'lead'
  | 'hot_prospect'
  | 'nurture'
  | 'active_client'
  | 'pending'
  | 'closed'
  | 'past_client'
  | 'sphere'
  | 'trash'
  | 'unresponsive';

export type StepType = 'pre_escrow' | 'escrow' | 'post_escrow';

export interface TimelineStep {
  id: string;
  timeline_id: string;
  step_template_id: string | null;
  custom_step_name: string | null;
  step_type: StepType;
  step_order: number;
  is_completed: boolean;
  completed_date: string | null;
  due_date: string | null;
  notes: string | null;
  completion_notes: string | null;
  step_data: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Joined from step_templates
  template_name?: string;
  template_description?: string;
}

export interface Timeline {
  id: string;
  person_id: string | null;
  buyer_property_id: string | null;
  current_phase: TimelinePhase;
  current_fub_stage: FubStage;
  stage_last_updated: string;
  is_custom_timeline: boolean;
  timeline_name: string | null;
  timeline_notes: string | null;
  auto_advance_enabled: boolean;
  custom_data: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relationships
  steps?: TimelineStep[];
  person?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface TimelineHistory {
  id: string;
  timeline_id: string;
  changed_from: TimelinePhase | null;
  changed_to: TimelinePhase;
  fub_stage_from: FubStage | null;
  fub_stage_to: FubStage;
  changed_by: string | null;
  change_reason: string | null;
  system_generated: boolean;
  created_at: string;
}

export interface StepTemplate {
  id: string;
  organization_id: string | null;
  name: string;
  description: string | null;
  step_type: StepType;
  default_order: number;
  is_system_default: boolean;
  is_required: boolean;
  is_active: boolean;
  default_duration_days: number | null;
  business_rules: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Request/Response types for timeline operations
export interface CreateTimelineRequest {
  person_id: string;
  buyer_property_id?: string | null;
  current_phase?: TimelinePhase;
  timeline_name?: string | null;
  auto_advance_enabled?: boolean;
}

export interface UpdateTimelineRequest {
  current_phase?: TimelinePhase;
  current_fub_stage?: FubStage;
  timeline_name?: string | null;
  timeline_notes?: string | null;
  auto_advance_enabled?: boolean;
  is_active?: boolean;
}

export interface UpdateTimelineStepRequest {
  is_completed?: boolean;
  completed_date?: string | null;
  due_date?: string | null;
  notes?: string | null;
  completion_notes?: string | null;
  step_data?: Record<string, any>;
}

// Timeline summary for buyer view
export interface TimelineSummary {
  total_steps: number;
  completed_steps: number;
  current_phase: TimelinePhase;
  current_phase_name: string;
  progress_percentage: number;
  next_step: TimelineStep | null;
  recent_completions: TimelineStep[];
}
