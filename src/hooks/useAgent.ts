import { useQuery } from '@tanstack/react-query';
import { dataService } from '@/services';
import { Agent } from '@/services/api/types';

export const useAgent = (agentId: string | null) => {
  return useQuery<Agent | null>({
    queryKey: ['agent', agentId],
    queryFn: async () => {
      console.log('useAgent - Fetching agent with ID:', agentId);
      
      if (!agentId) {
        console.log('useAgent - No agentId provided, returning null');
        return null;
      }

      try {
        console.log('useAgent - Calling dataService.getAgentById');
        const startTime = Date.now();
        
        const response = await dataService.getAgentById(agentId);
        
        console.log(`useAgent - Received response in ${Date.now() - startTime}ms`, {
          success: response.success,
          hasData: !!response.data,
          error: response.error
        });
        
        if (!response.success) {
          console.error('useAgent - Error response from getAgentById:', {
            error: response.error,
            agentId
          });
          return null;
        }

        if (!response.data) {
          console.warn('useAgent - No agent data found for ID:', agentId);
          return null;
        }

        console.log('useAgent - Successfully retrieved agent data:', response.data);
        return response.data;
      } catch (error) {
        console.error('useAgent - Exception in queryFn:', {
          error,
          agentId,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
        return null;
      }
    },
    enabled: !!agentId, // Only run the query if agentId is provided
    retry: (failureCount, error: any) => {
      // Don't retry if it's a 404 (agent not found)
      if (error?.status === 404) {
        console.log('useAgent - Not retrying, agent not found (404)');
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false // Don't refetch when window regains focus
  });
};
