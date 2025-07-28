import { useState, useEffect, useCallback } from 'react';
import { dataService } from '@/services';
import { Property, PropertyFilter, PropertySummary, PropertyActivity } from '@/services/api/types';

export const useProperties = (buyerId?: string, initialFilter?: PropertyFilter, mode: 'tracked' | 'available' = 'tracked') => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<PropertyFilter>(initialFilter || {});

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (mode === 'available') {
        // Pass both the filter and buyerId to getAvailableProperties
        response = await dataService.getAvailableProperties(filter, buyerId);
        
        // If no properties found for the buyer, show a message
        if (response.success && response.data?.length === 0 && buyerId) {
          setError('No properties found for this buyer. Please check back later or contact your agent.');
        }
      } else {
        response = await dataService.getProperties(buyerId, filter);
      }
      
      if (response.success && response.data) {
        setProperties(response.data);
      } else {
        setError(response.error || 'Failed to fetch properties');
        setProperties([]);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [buyerId, filter, mode]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const updateFilter = useCallback((newFilter: PropertyFilter) => {
    setFilter(newFilter);
  }, []);

  const clearFilter = useCallback(() => {
    setFilter({});
  }, []);

  const refreshProperties = useCallback(() => {
    fetchProperties();
  }, [fetchProperties]);

  return {
    properties,
    loading,
    error,
    filter,
    updateFilter,
    clearFilter,
    refreshProperties
  };
};

export const useProperty = (propertyId: string) => {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProperty = useCallback(async () => {
    if (!propertyId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await dataService.getPropertyById(propertyId);
      
      if (response.success && response.data) {
        setProperty(response.data);
      } else {
        setError(response.error || 'Failed to fetch property');
        setProperty(null);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setProperty(null);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchProperty();
  }, [fetchProperty]);

  const updateProperty = useCallback(async (updates: Partial<Property>) => {
    if (!property) return false;
    
    try {
      const response = await dataService.updateProperty(property.id, updates);
      
      if (response.success && response.data) {
        setProperty(response.data);
        return true;
      } else {
        setError(response.error || 'Failed to update property');
        return false;
      }
    } catch (err) {
      setError('An unexpected error occurred');
      return false;
    }
  }, [property]);

  const refreshProperty = useCallback(() => {
    fetchProperty();
  }, [fetchProperty]);

  return {
    property,
    loading,
    error,
    updateProperty,
    refreshProperty
  };
};

export const usePropertySummary = (buyerId: string) => {
  const [summary, setSummary] = useState<PropertySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!buyerId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await dataService.getPropertySummary(buyerId);
      
      if (response.success && response.data) {
        setSummary(response.data);
      } else {
        setError(response.error || 'Failed to fetch property summary');
        setSummary(null);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [buyerId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const refreshSummary = useCallback(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    loading,
    error,
    refreshSummary
  };
};

export const usePropertyActivities = (propertyId: string) => {
  const [activities, setActivities] = useState<PropertyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    if (!propertyId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await dataService.getPropertyActivities(propertyId);
      
      if (response.success && response.data) {
        setActivities(response.data);
      } else {
        setError(response.error || 'Failed to fetch activities');
        setActivities([]);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const addActivity = useCallback(async (activity: Omit<PropertyActivity, 'id' | 'created_at'>) => {
    try {
      const response = await dataService.addPropertyActivity(activity);
      
      if (response.success && response.data) {
        setActivities(prev => [response.data!, ...prev]);
        return true;
      } else {
        setError(response.error || 'Failed to add activity');
        return false;
      }
    } catch (err) {
      setError('An unexpected error occurred');
      return false;
    }
  }, []);

  const refreshActivities = useCallback(() => {
    fetchActivities();
  }, [fetchActivities]);

  return {
    activities,
    loading,
    error,
    addActivity,
    refreshActivities
  };
};
