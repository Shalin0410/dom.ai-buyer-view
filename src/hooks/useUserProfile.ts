import { useQuery } from '@tanstack/react-query';
import { dataService } from '@/services';

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  agent_id?: string;
  price_min?: number;
  price_max?: number;
  budget_approved?: boolean;
  pre_approval_amount?: number;
  pre_approval_expiry?: string;
  buyer_needs?: string;
  background?: string;
  tags?: string;
  last_contact_date?: string;
  next_followup_date?: string;
  agent?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
  } | null;
}

export const useUserProfile = (email: string | undefined) => {
  return useQuery<UserProfile | null>({
    queryKey: ['userProfile', email],
    queryFn: async () => {
      if (!email) {
        return null;
      }

      const response = await dataService.getBuyerByEmail(email);
      
      if (!response.success) {
        if (response.error === 'Buyer not found') {
          return null;
        }
        throw new Error(response.error || 'Failed to fetch user profile');
      }

      return response.data;
    },
    enabled: !!email,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });
};