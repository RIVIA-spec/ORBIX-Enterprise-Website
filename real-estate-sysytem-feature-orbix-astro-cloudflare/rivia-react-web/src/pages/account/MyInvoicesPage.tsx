import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DetailsDrawer } from '../../components/ui/DetailsDrawer';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { getFirebaseErrorMessage } from '../../lib/firebaseErrors';
import { formatDate, formatNumber } from '../../lib/formatters';
import { getMyInvoices } from '../../services/invoiceService';
import type { Invoice } from '../../types/models';

export function MyInvoicesPage() {
  const { user, isAdmin, isOwner, loading: authLoading } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const shouldRedirect = !authLoading && Boolean(user && !(isAdmin || isOwner));

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);
    setError(null);
    getMyInvoices(user.uid)
      .then((items) => {
        if (active) setInvoices(items);
      })
      .catch((err) => {
        if (active) setError(getFirebaseErrorMessage(err, 'تعذر تحميل الفواتير.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  if (shouldRedirect) {
    return <Navigate to="/my-requests" replace />;
  }

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return invoices.filter((invoice) =>
      !needle
        ? true
        : [invoice.invoiceId, invoice.dealId, invoice.customerUserId, invoice.ownerUserId, invoice.status]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(needle),
    );
  }, [invoices, search]);

  if (loading) return <LoadingState label="جارٍ تحميل الفواتير" />;

  return (
    <div>
      <div className="page-heading compact">
        <span className="eyebrow">فواتيري</span>
        <h1>الفواتير</h1>
      </div>
      <div className="filter-bar">
        <Input label="بحث" value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>
      {error && <ErrorMessage message={error} />}
      <div className="stack-list">
        {filtered.map((invoice) => (
          <Card key={invoice.id} className="list-card">
            <div>
              <h3>{invoice.invoiceId || invoice.id}</h3>
              <p>{invoice.dealId ? `صفقة: ${invoice.dealId}` : 'فاتورة'}</p>
              <p className="muted">{formatDate(invoice.createdAt || invoice.created_at)}</p>
            </div>
            <StatusBadge status={invoice.status || 'pending'} />
            <strong>{formatNumber(invoice.totalAmount || invoice.amount || 0)}</strong>
            <div className="inline-actions">
              <Button variant="outline" onClick={() => setSelected(invoice)}>
                التفاصيل
              </Button>
              {invoice.dealId && (
                <Button as={Link} to="/my-deals" variant="ghost">
                  عرض الصفقة
                </Button>
              )}
            </div>
          </Card>
        ))}
        {filtered.length === 0 && !error && <EmptyState title="لا توجد فواتير" description="لم يتم العثور على فواتير مرتبطة بحسابك." />}
      </div>

      <DetailsDrawer open={Boolean(selected)} title="تفاصيل الفاتورة" onClose={() => setSelected(null)}>
        {selected && (
          <dl className="details-grid">
            {Object.entries(selected).map(([key, value]) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{String(value ?? '')}</dd>
              </div>
            ))}
          </dl>
        )}
      </DetailsDrawer>
    </div>
  );
}
