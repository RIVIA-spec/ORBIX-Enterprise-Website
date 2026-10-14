import { useCallback, useEffect, useState } from 'react';
import { listOrganizationMembers } from '../services/organizationMemberService';
import type { OrganizationMember } from '../types/organization';

export function useOrganizationMembers(organizationId?: string) {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(Boolean(organizationId));
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!organizationId) {
      setMembers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setMembers(await listOrganizationMembers(organizationId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load organization members');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { members, loading, error, reload };
}
