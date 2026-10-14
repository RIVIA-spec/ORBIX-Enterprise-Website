import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { LoadingState } from '../../components/ui/LoadingState';
import { useOrganizationContext } from '../../hooks/useOrganizationContext';

export function PartnerRealEstateFoundationPage() {
  const { organizationId } = useParams();
  const { currentOrganization, organizationRole, currentBranch, loading, setCurrentOrganizationId } = useOrganizationContext();

  useEffect(() => {
    setCurrentOrganizationId(organizationId || null);
  }, [organizationId, setCurrentOrganizationId]);

  if (loading) return <LoadingState label="Loading partner foundation..." />;

  return (
    <section className="container section">
      <div className="section-head">
        <div>
          <span className="eyebrow">Real estate</span>
          <h1>{currentOrganization?.name || 'Partner foundation'}</h1>
          <p className="muted">
            Organization context is available. The real estate dashboard module has not been implemented yet.
          </p>
        </div>
      </div>

      <div className="admin-booking-list">
        <div className="admin-simple-list-card">
          <strong>Organization role</strong>
          <span className="muted">{organizationRole || 'none'}</span>
        </div>
        <div className="admin-simple-list-card">
          <strong>Current branch</strong>
          <span className="muted">{currentBranch?.name || 'none'}</span>
        </div>
      </div>
    </section>
  );
}
