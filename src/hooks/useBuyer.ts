// Updated Buyer Hook using Service Layer
import { useQuery } from '@tanstack/react-query';
import { dataService, Buyer } from '@/services';

export const useBuyer = (email: string) => {
  return useQuery<Buyer | null>({
    queryKey: ['buyer', email],
    queryFn: async () => {
      if (!email) {
        return null;
      }

      const response = await dataService.getBuyerByEmail(email);
      
      if (!response.success) {
        if (response.error === 'Buyer not found') {
          return null;
        }
        throw new Error(response.error || 'Failed to fetch buyer');
      }

      return response.data;
    },
    enabled: !!email,
  });
};

// Additional hook for fetching all buyers with agents
export const useBuyers = () => {
  return useQuery<Buyer[]>({
    queryKey: ['buyers'],
    queryFn: async () => {
      const response = await dataService.getBuyersWithAgents();
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch buyers');
      }

      return response.data || [];
    },
  });
};

// Hook for fetching buyers by agent ID
export const useBuyersByAgent = (agentId: string) => {
  return useQuery<Buyer[]>({
    queryKey: ['buyers', 'agent', agentId],
    queryFn: async () => {
      const response = await dataService.getBuyersByAgentId(agentId);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch buyers by agent');
      }

      return response.data || [];
    },
    enabled: !!agentId,
  });
};
