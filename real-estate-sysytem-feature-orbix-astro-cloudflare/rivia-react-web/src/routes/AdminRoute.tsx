import type { ReactElement } from 'react';
import { Card } from '../components/ui/Card';
import { LoadingState } from '../components/ui/LoadingState';
import { useAuth } from '../hooks/useAuth';
import { hasAdminAccess } from '../lib/adminAccess';

export function AdminRoute({ children }: { children: ReactElement }) {
  const { profile, loading, isAdmin, isOwner } = useAuth();

  if (loading) return <LoadingState label="جاري التحقق من الصلاحيات" />;

  // TODO: Real authorization should use Firebase Custom Claims instead of users/{uid}.role.
  if (!profile || (!hasAdminAccess(profile) && !isAdmin && !isOwner)) {
    return (
      <section className="container section">
        <Card className="auth-card">
          <h1>لا تملك صلاحية الوصول إلى هذه الصفحة.</h1>
          <p className="muted">هذه الصفحة متاحة للمشرفين والمالكين فقط.</p>
        </Card>
      </section>
    );
  }

  return children;
}
