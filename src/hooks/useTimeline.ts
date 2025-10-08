// Timeline Hooks with Real-time Synchronization
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { timelineDataService } from '@/services/supabase/timeline';
import { realtimeService } from '@/services/supabase/realtime';
import {
  Timeline,
  TimelineStep,
  TimelineSummary,
  UpdateTimelineStepRequest,
} from '@/services/api/types';

/**
 * Hook to fetch and subscribe to timeline changes for a person
 */
export const useTimeline = (personId: string | undefined, enableRealtime = true) => {
  const queryClient = useQueryClient();

  const query = useQuery<Timeline | null>({
    queryKey: ['timeline', personId],
    queryFn: async () => {
      if (!personId) return null;

      const response = await timelineDataService.getTimelineByPersonId(personId);

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch timeline');
      }

      return response.data;
    },
    enabled: !!personId,
    staleTime: 1000 * 60, // 1 minute
  });

  // Real-time subscription
  useEffect(() => {
    if (!personId || !enableRealtime || !query.data) return;

    const unsubscribe = realtimeService.subscribeToAllTimelineUpdates(
      personId,
      query.data.id,
      {
        onTimelineChange: (payload) => {
          console.log('[useTimeline] Timeline changed, refetching...', payload);
          queryClient.invalidateQueries({ queryKey: ['timeline', personId] });
          queryClient.invalidateQueries({ queryKey: ['timeline-summary', personId] });
        },
        onStepChange: (payload) => {
          console.log('[useTimeline] Step changed, refetching...', payload);
          queryClient.invalidateQueries({ queryKey: ['timeline', personId] });
          queryClient.invalidateQueries({ queryKey: ['timeline-summary', personId] });
        },
      }
    );

    return () => unsubscribe();
  }, [personId, enableRealtime, query.data, queryClient]);

  return query;
};

/**
 * Hook to fetch timeline summary
 */
export const useTimelineSummary = (personId: string | undefined, enableRealtime = true) => {
  const queryClient = useQueryClient();

  const query = useQuery<TimelineSummary | null>({
    queryKey: ['timeline-summary', personId],
    queryFn: async () => {
      if (!personId) return null;

      const response = await timelineDataService.getTimelineSummary(personId);

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch timeline summary');
      }

      return response.data;
    },
    enabled: !!personId,
    staleTime: 1000 * 30, // 30 seconds
  });

  // Real-time subscription
  useEffect(() => {
    if (!personId || !enableRealtime) return;

    const unsubscribe = realtimeService.subscribeToTimelineChanges(
      personId,
      (payload) => {
        console.log('[useTimelineSummary] Timeline changed, refetching...', payload);
        queryClient.invalidateQueries({ queryKey: ['timeline-summary', personId] });
      }
    );

    return () => unsubscribe();
  }, [personId, enableRealtime, queryClient]);

  return query;
};

/**
 * Hook to fetch timeline by buyer-property relationship
 */
export const usePropertyTimeline = (buyerPropertyId: string | undefined, enableRealtime = true) => {
  const queryClient = useQueryClient();

  const query = useQuery<Timeline | null>({
    queryKey: ['property-timeline', buyerPropertyId],
    queryFn: async () => {
      if (!buyerPropertyId) return null;

      const response = await timelineDataService.getTimelineByBuyerPropertyId(buyerPropertyId);

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch property timeline');
      }

      return response.data;
    },
    enabled: !!buyerPropertyId,
    staleTime: 1000 * 60,
  });

  // Real-time subscription
  useEffect(() => {
    if (!buyerPropertyId || !enableRealtime || !query.data) return;

    const personId = query.data.person_id;
    if (!personId) return;

    const unsubscribe = realtimeService.subscribeToAllTimelineUpdates(
      personId,
      query.data.id,
      {
        onTimelineChange: () => {
          queryClient.invalidateQueries({ queryKey: ['property-timeline', buyerPropertyId] });
        },
        onStepChange: () => {
          queryClient.invalidateQueries({ queryKey: ['property-timeline', buyerPropertyId] });
        },
      }
    );

    return () => unsubscribe();
  }, [buyerPropertyId, enableRealtime, query.data, queryClient]);

  return query;
};

/**
 * Mutation hook to update a timeline step
 */
export const useUpdateTimelineStep = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      stepId,
      updates,
    }: {
      stepId: string;
      updates: UpdateTimelineStepRequest;
    }) => {
      const response = await timelineDataService.updateTimelineStep(stepId, updates);

      if (!response.success) {
        throw new Error(response.error || 'Failed to update timeline step');
      }

      return response.data;
    },
    onSuccess: () => {
      // Invalidate all timeline queries to refetch
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      queryClient.invalidateQueries({ queryKey: ['timeline-summary'] });
      queryClient.invalidateQueries({ queryKey: ['property-timeline'] });
    },
  });
};

/**
 * Mutation hook to mark step as completed
 */
export const useCompleteTimelineStep = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      stepId,
      completionNotes,
    }: {
      stepId: string;
      completionNotes?: string;
    }) => {
      const response = await timelineDataService.completeTimelineStep(stepId, completionNotes);

      if (!response.success) {
        throw new Error(response.error || 'Failed to complete timeline step');
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      queryClient.invalidateQueries({ queryKey: ['timeline-summary'] });
      queryClient.invalidateQueries({ queryKey: ['property-timeline'] });
    },
  });
};

/**
 * Mutation hook to mark step as incomplete
 */
export const useUncompleteTimelineStep = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (stepId: string) => {
      const response = await timelineDataService.uncompleteTimelineStep(stepId);

      if (!response.success) {
        throw new Error(response.error || 'Failed to uncomplete timeline step');
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      queryClient.invalidateQueries({ queryKey: ['timeline-summary'] });
      queryClient.invalidateQueries({ queryKey: ['property-timeline'] });
    },
  });
};

/**
 * Combined hook for timeline operations
 */
export const useTimelineOperations = (personId: string | undefined) => {
  const timeline = useTimeline(personId);
  const summary = useTimelineSummary(personId);
  const updateStep = useUpdateTimelineStep();
  const completeStep = useCompleteTimelineStep();
  const uncompleteStep = useUncompleteTimelineStep();

  const toggleStepCompletion = useCallback(
    (stepId: string, currentStatus: boolean, completionNotes?: string) => {
      if (currentStatus) {
        uncompleteStep.mutate(stepId);
      } else {
        completeStep.mutate({ stepId, completionNotes });
      }
    },
    [completeStep, uncompleteStep]
  );

  return {
    timeline: timeline.data,
    summary: summary.data,
    isLoading: timeline.isLoading || summary.isLoading,
    error: timeline.error || summary.error,
    updateStep,
    completeStep,
    uncompleteStep,
    toggleStepCompletion,
    refetch: () => {
      timeline.refetch();
      summary.refetch();
    },
  };
};
