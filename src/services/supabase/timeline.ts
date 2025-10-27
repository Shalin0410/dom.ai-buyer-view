// Timeline Data Service - Supabase Implementation
import { supabase, supabaseAdmin } from '@/lib/supabaseClient';
import {
  Timeline,
  TimelineStep,
  TimelineSummary,
  TimelineHistory,
  CreateTimelineRequest,
  UpdateTimelineRequest,
  UpdateTimelineStepRequest,
  ApiResponse,
} from '../api/types';

export class TimelineDataService {
  /**
   * Get timeline for a specific person (buyer)
   */
  async getTimelineByPersonId(personId: string): Promise<ApiResponse<Timeline>> {
    try {
      // Use admin client to bypass RLS (buyer view uses mock auth)
      // First, try to get timeline via buyer_property (this will have timeline_steps)
      const { data: buyerProperty } = await supabaseAdmin
        .from('buyer_properties')
        .select('id')
        .eq('buyer_id', personId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let query = supabaseAdmin
        .from('timelines')
        .select(`
          *,
          steps:timeline_steps(
            *,
            template:step_templates(
              name,
              description
            )
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      // If buyer_property exists, prioritize timeline by buyer_property_id
      if (buyerProperty) {
        query = query.eq('buyer_property_id', buyerProperty.id);
      } else {
        // Fallback to person_id for legacy timelines
        query = query.eq('person_id', personId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching timeline:', error);
        return { data: null, error: error.message, success: false };
      }

      // Handle no results
      if (!data || data.length === 0) {
        return { data: null, error: null, success: true };
      }

      // Get first result
      const timeline = data[0];

      // Enrich steps with template information
      if (timeline && timeline.steps) {
        timeline.steps = timeline.steps.map((step: any) => ({
          ...step,
          template_name: step.template?.name || step.custom_step_name,
          template_description: step.template?.description,
        })).sort((a: any, b: any) => a.step_order - b.step_order);
      }

      return { data: timeline, error: null, success: true };
    } catch (error: any) {
      console.error('Error in getTimelineByPersonId:', error);
      return { data: null, error: error.message, success: false };
    }
  }

  /**
   * Get timeline for a specific buyer-property relationship
   */
  async getTimelineByBuyerPropertyId(buyerPropertyId: string): Promise<ApiResponse<Timeline>> {
    try {
      const { data, error } = await supabase
        .from('timelines')
        .select(`
          *,
          steps:timeline_steps(
            *,
            template:step_templates(
              name,
              description
            )
          ),
          person:persons(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('buyer_property_id', buyerPropertyId)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching timeline by buyer property:', error);
        return { data: null, error: error.message, success: false };
      }

      // Enrich steps
      if (data && data.steps) {
        data.steps = data.steps.map((step: any) => ({
          ...step,
          template_name: step.template?.name || step.custom_step_name,
          template_description: step.template?.description,
        })).sort((a: any, b: any) => a.step_order - b.step_order);
      }

      return { data, error: null, success: true };
    } catch (error: any) {
      console.error('Error in getTimelineByBuyerPropertyId:', error);
      return { data: null, error: error.message, success: false };
    }
  }

  /**
   * Get timeline summary for buyer view
   */
  async getTimelineSummary(personId: string): Promise<ApiResponse<TimelineSummary>> {
    try {
      const timelineResponse = await this.getTimelineByPersonId(personId);

      if (!timelineResponse.success || !timelineResponse.data) {
        return { data: null, error: timelineResponse.error, success: false };
      }

      const timeline = timelineResponse.data;
      const steps = timeline.steps || [];

      const totalSteps = steps.length;
      const completedSteps = steps.filter((s: TimelineStep) => s.is_completed).length;
      const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

      const nextStep = steps.find((s: TimelineStep) => !s.is_completed) || null;

      const recentCompletions = steps
        .filter((s: TimelineStep) => s.is_completed && s.completed_date)
        .sort((a: TimelineStep, b: TimelineStep) =>
          new Date(b.completed_date!).getTime() - new Date(a.completed_date!).getTime()
        )
        .slice(0, 5);

      const phaseNames: Record<string, string> = {
        pre_escrow: 'Pre-Escrow',
        escrow: 'In Escrow',
        post_escrow: 'Post-Escrow',
        inactive: 'Inactive',
      };

      const summary: TimelineSummary = {
        total_steps: totalSteps,
        completed_steps: completedSteps,
        current_phase: timeline.current_phase,
        current_phase_name: phaseNames[timeline.current_phase] || timeline.current_phase,
        progress_percentage: Math.round(progressPercentage),
        next_step: nextStep,
        recent_completions: recentCompletions,
      };

      return { data: summary, error: null, success: true };
    } catch (error: any) {
      console.error('Error in getTimelineSummary:', error);
      return { data: null, error: error.message, success: false };
    }
  }

  /**
   * Update a timeline step (mark as complete/incomplete)
   */
  async updateTimelineStep(
    stepId: string,
    updates: UpdateTimelineStepRequest
  ): Promise<ApiResponse<TimelineStep>> {
    try {
      const { data, error } = await supabase
        .from('timeline_steps')
        .update(updates)
        .eq('id', stepId)
        .select()
        .single();

      if (error) {
        console.error('Error updating timeline step:', error);
        return { data: null, error: error.message, success: false };
      }

      return { data, error: null, success: true };
    } catch (error: any) {
      console.error('Error in updateTimelineStep:', error);
      return { data: null, error: error.message, success: false };
    }
  }

  /**
   * Mark step as completed
   */
  async completeTimelineStep(
    stepId: string,
    completionNotes?: string
  ): Promise<ApiResponse<TimelineStep>> {
    return this.updateTimelineStep(stepId, {
      is_completed: true,
      completed_date: new Date().toISOString().split('T')[0],
      completion_notes: completionNotes,
    });
  }

  /**
   * Mark step as incomplete
   */
  async uncompleteTimelineStep(stepId: string): Promise<ApiResponse<TimelineStep>> {
    return this.updateTimelineStep(stepId, {
      is_completed: false,
      completed_date: null,
      completion_notes: null,
    });
  }

  /**
   * Get timeline history
   */
  async getTimelineHistory(timelineId: string): Promise<ApiResponse<TimelineHistory[]>> {
    try {
      const { data, error } = await supabase
        .from('timeline_history')
        .select('*')
        .eq('timeline_id', timelineId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching timeline history:', error);
        return { data: null, error: error.message, success: false };
      }

      return { data: data || [], error: null, success: true };
    } catch (error: any) {
      console.error('Error in getTimelineHistory:', error);
      return { data: null, error: error.message, success: false };
    }
  }

  /**
   * Update timeline metadata
   */
  async updateTimeline(
    timelineId: string,
    updates: UpdateTimelineRequest
  ): Promise<ApiResponse<Timeline>> {
    try {
      const { data, error } = await supabase
        .from('timelines')
        .update(updates)
        .eq('id', timelineId)
        .select()
        .single();

      if (error) {
        console.error('Error updating timeline:', error);
        return { data: null, error: error.message, success: false };
      }

      return { data, error: null, success: true };
    } catch (error: any) {
      console.error('Error in updateTimeline:', error);
      return { data: null, error: error.message, success: false };
    }
  }
}

// Export singleton instance
export const timelineDataService = new TimelineDataService();
