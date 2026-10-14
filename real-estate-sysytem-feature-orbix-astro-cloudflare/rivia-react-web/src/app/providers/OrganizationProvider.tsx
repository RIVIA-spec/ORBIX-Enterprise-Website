import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { listBranches } from '../../services/branchService';
import { listUserOrganizations, type UserOrganization } from '../../services/organizationService';
import { useAuth } from '../../hooks/useAuth';
import { getRolePermissions } from '../../types/permissions';
import type { Branch, Organization, OrganizationMember } from '../../types/organization';
import type { OrganizationRole, Permission } from '../../types/permissions';

type OrganizationContextValue = {
  organizations: Organization[];
  memberships: OrganizationMember[];
  currentOrganization: Organization | null;
  currentMembership: OrganizationMember | null;
  organizationRole: OrganizationRole | null;
  currentBranch: Branch | null;
  branches: Branch[];
  permissions: readonly Permission[];
  loading: boolean;
  error: string | null;
  setCurrentOrganizationId: (organizationId: string | null) => void;
  setCurrentBranchId: (branchId: string | null) => void;
  refreshOrganizations: () => Promise<void>;
};

export const OrganizationContext = createContext<OrganizationContextValue | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [userOrganizations, setUserOrganizations] = useState<UserOrganization[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentOrganizationId, setCurrentOrganizationId] = useState<string | null>(null);
  const [currentBranchId, setCurrentBranchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshOrganizations = useCallback(async () => {
    if (!user) {
      setUserOrganizations([]);
      setBranches([]);
      setCurrentOrganizationId(null);
      setCurrentBranchId(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const items = await listUserOrganizations(user.uid);
      setUserOrganizations(items);
      setCurrentOrganizationId((current) => current || items[0]?.organization.id || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load organizations');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) void refreshOrganizations();
  }, [authLoading, refreshOrganizations]);

  const currentOrganization = useMemo(
    () => userOrganizations.find((item) => item.organization.id === currentOrganizationId)?.organization || null,
    [currentOrganizationId, userOrganizations],
  );

  const currentMembership = useMemo(
    () => userOrganizations.find((item) => item.organization.id === currentOrganizationId)?.membership || null,
    [currentOrganizationId, userOrganizations],
  );

  useEffect(() => {
    if (!currentOrganization?.id) {
      setBranches([]);
      setCurrentBranchId(null);
      return;
    }

    let active = true;
    void listBranches(currentOrganization.id)
      .then((items) => {
        if (!active) return;
        setBranches(items);
        setCurrentBranchId((current) => current || items[0]?.id || null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unable to load branches');
      });

    return () => {
      active = false;
    };
  }, [currentOrganization?.id]);

  const currentBranch = useMemo(
    () => branches.find((branch) => branch.id === currentBranchId) || null,
    [branches, currentBranchId],
  );

  const organizationRole = currentMembership?.role || null;
  const permissions = useMemo(
    () => getRolePermissions(organizationRole),
    [organizationRole],
  );

  const value = useMemo<OrganizationContextValue>(() => ({
    organizations: userOrganizations.map((item) => item.organization),
    memberships: userOrganizations.map((item) => item.membership),
    currentOrganization,
    currentMembership,
    organizationRole,
    currentBranch,
    branches,
    permissions,
    loading: authLoading || loading,
    error,
    setCurrentOrganizationId,
    setCurrentBranchId,
    refreshOrganizations,
  }), [
    authLoading,
    branches,
    currentBranch,
    currentMembership,
    currentOrganization,
    error,
    loading,
    organizationRole,
    permissions,
    refreshOrganizations,
    userOrganizations,
  ]);

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}
