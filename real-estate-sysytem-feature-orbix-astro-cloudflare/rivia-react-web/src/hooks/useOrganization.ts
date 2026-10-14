import { useCallback, useEffect, useState } from 'react';
import { getOrganizationById } from '../services/organizationService';
import type { Organization } from '../types/organization';

export function useOrganization(organizationId?: string) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(Boolean(organizationId));
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!organizationId) {
      setOrganization(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setOrganization(await getOrganizationById(organizationId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load organization');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { organization, loading, error, reload };
}
