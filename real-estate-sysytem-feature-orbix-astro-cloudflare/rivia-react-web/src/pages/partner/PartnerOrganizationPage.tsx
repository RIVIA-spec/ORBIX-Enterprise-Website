import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LoadingState } from '../../components/ui/LoadingState';
import { useOrganizationContext } from '../../hooks/useOrganizationContext';

export function PartnerOrganizationPage() {
  const { organizationId } = useParams();
  const {
    currentOrganization,
    currentMembership,
    branches,
    permissions,
    loading,
    setCurrentOrganizationId,
  } = useOrganizationContext();

  useEffect(() => {
    setCurrentOrganizationId(organizationId || null);
  }, [organizationId, setCurrentOrganizationId]);

  if (loading) return <LoadingState label="Loading organization..." />;

  if (!currentOrganization || currentOrganization.id !== organizationId) {
    return (
      <section className="container section">
        <h1>Organization not available</h1>
        <p className="muted">This account does not have an active membership for the requested organization.</p>
      </section>
    );
  }

  return (
    <section className="container section">
      <div className="section-head">
        <div>
          <span className="eyebrow">Partner</span>
          <h1>{currentOrganization.name}</h1>
          <p className="muted">{currentOrganization.type} / {currentMembership?.role || 'member'}</p>
        </div>
        <Link className="btn primary" to={`/partner/${currentOrganization.id}/real-estate`}>
          Real estate foundation
        </Link>
      </div>

      <div className="admin-booking-list">
        <div className="admin-simple-list-card">
          <strong>Branches</strong>
          <span className="muted">{branches.length}</span>
        </div>
        <div className="admin-simple-list-card">
          <strong>Permissions</strong>
          <span className="muted">{permissions.length}</span>
        </div>
      </div>
    </section>
  );
}
