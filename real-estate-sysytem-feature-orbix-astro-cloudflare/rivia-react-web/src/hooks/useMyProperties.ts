import { useCallback, useEffect, useState } from 'react';
import { getMyProperties } from '../services/propertyService';
import { getMyPropertyRequests } from '../services/propertyRequestService';
import type { Property, PropertyRequest } from '../types/models';
import { useAuth } from './useAuth';

export function useMyProperties() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [requests, setRequests] = useState<PropertyRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [ownedProperties, propertyRequests] = await Promise.all([getMyProperties(user.uid), getMyPropertyRequests(user.uid)]);
      setProperties(ownedProperties);
      setRequests(propertyRequests);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل عقاراتي');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { properties, requests, loading, error, reload };
}

