import { useCallback, useEffect, useState } from 'react';
import { listBranches } from '../services/branchService';
import type { Branch } from '../types/organization';

export function useBranches(organizationId?: string) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(Boolean(organizationId));
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!organizationId) {
      setBranches([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setBranches(await listBranches(organizationId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load branches');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { branches, loading, error, reload };
}
