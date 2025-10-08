import { useState, useEffect, useCallback } from 'react';
import { dataService } from '@/services';
import { ActionItem } from '@/services/api/types';

export const useActionItems = (buyerId?: string) => {
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActionItems = useCallback(async () => {
    if (!buyerId) {
      setActionItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await dataService.getActionItems(buyerId);
      
      if (response.success && response.data) {
        setActionItems(response.data);
      } else {
        setError(response.error || 'Failed to fetch action items');
        setActionItems([]);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setActionItems([]);
    } finally {
      setLoading(false);
    }
  }, [buyerId]);

  useEffect(() => {
    fetchActionItems();
  }, [fetchActionItems]);

  const refreshActionItems = useCallback(() => {
    fetchActionItems();
  }, [fetchActionItems]);

  return {
    actionItems,
    loading,
    error,
    refreshActionItems
  };
};
