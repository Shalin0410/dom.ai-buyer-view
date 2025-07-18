import { useState, useEffect } from 'react';
import { useBuyers } from './useBuyer';
import { Buyer } from '@/services';



export const useProfileSwitcher = (userEmail: string) => {
  const [selectedBuyerId, setSelectedBuyerId] = useState<string | null>(null);

  // Fetch all buyers for profile switching
  const { data: buyers, isLoading, error } = useBuyers();

  // Find the current user's buyer record
  const currentUserBuyer = buyers?.find(buyer => buyer.email === userEmail);

  // Set default selected buyer to current user's buyer
  useEffect(() => {
    if (currentUserBuyer && !selectedBuyerId) {
      setSelectedBuyerId(currentUserBuyer.id);
    }
  }, [currentUserBuyer, selectedBuyerId]);

  // Get the currently selected buyer (for testing)
  const selectedBuyer = buyers?.find(buyer => buyer.id === selectedBuyerId) || currentUserBuyer;

  const switchToBuyer = (buyerId: string) => {
    setSelectedBuyerId(buyerId);
  };

  return {
    buyers: buyers || [],
    selectedBuyer,
    currentUserBuyer,
    selectedBuyerId,
    switchToBuyer,
    isLoading,
  };
};
