import { Link } from 'react-router-dom';
import { LoadingState } from '../../components/ui/LoadingState';
import { useOrganizationContext } from '../../hooks/useOrganizationContext';

export function PartnerLandingPage() {
  const { organizations, memberships, loading, error } = useOrganizationContext();

  if (loading) return <LoadingState label="Loading organizations..." />;

  return (
    <section className="container section">
      <div className="section-head">
        <div>
          <span className="eyebrow">Partner</span>
          <h1>Organizations</h1>
          <p className="muted">This foundation is ready for future partner dashboards.</p>
        </div>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      {organizations.length === 0 ? (
        <p className="muted">No active organization membership was found for this account.</p>
      ) : (
        <div className="admin-booking-list">
          {organizations.map((organization) => {
            const membership = memberships.find((item) => item.organizationId === organization.id);
            return (
              <Link className="admin-simple-list-card" key={organization.id} to={`/partner/${organization.id}`}>
                <span>
                  <strong>{organization.name}</strong>
                  <small>{organization.type} / {membership?.role || 'member'}</small>
                </span>
                <span className="muted">{organization.status}</span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
