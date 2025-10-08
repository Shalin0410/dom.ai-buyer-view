import { useQuery } from '@tanstack/react-query';
import { dataService } from '@/services';
import { Agent } from '@/services/api/types';

export const useAgent = (agentId: string | null) => {
  return useQuery<Agent | null>({
    queryKey: ['agent', agentId],
    queryFn: async () => {
      if (!agentId) {
        return null;
      }

      try {
        const response = await dataService.getAgentById(agentId);
        
        if (!response.success) {
          return null;
        }

        if (!response.data) {
          return null;
        }
        return response.data;
      } catch (error) {
        return null;
      }
    },
    enabled: !!agentId, // Only run the query if agentId is provided
    retry: (failureCount, error: any) => {
      // Don't retry if it's a 404 (agent not found)
      if (error?.status === 404) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false // Don't refetch when window regains focus
  });
};
