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
import { getPurchaseIntentLabel, getWorkflowStatusLabel, getWorkflowStatusTone } from '../../lib/statusLabels';
import { getMyDeals } from '../../services/dealService';
import type { Deal } from '../../types/models';

export function MyDealsPage() {
  const { user, isAdmin, isOwner, loading: authLoading } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selected, setSelected] = useState<Deal | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const shouldRedirect = !authLoading && Boolean(user && !(isAdmin || isOwner));

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);
    setError(null);
    getMyDeals(user.uid)
      .then((items) => {
        if (active) setDeals(items);
      })
      .catch((err) => {
        if (active) setError(getFirebaseErrorMessage(err, 'تعذر تحميل الصفقات.'));
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
    return deals.filter((deal) =>
      !needle
        ? true
        : [
            deal.dealId,
            deal.propertyId,
            deal.propertyTitle,
            deal.property_title,
            deal.listingType,
            deal.dealType,
            deal.customerName,
            deal.customerPhone,
            deal.customerEmail,
            deal.status,
            deal.purchaseIntent,
            deal.preferredContactMethod,
            deal.proposedPrice,
            deal.paymentStatus,
            deal.contractStatus,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(needle),
    );
  }, [deals, search]);

  if (loading) return <LoadingState label="جارٍ تحميل الصفقات" />;

  return (
    <div>
      <div className="page-heading compact">
        <span className="eyebrow">صفقاتي</span>
        <h1>الصفقات</h1>
      </div>
      <div className="filter-bar">
        <Input label="بحث" value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>
      {error && <ErrorMessage message={error} />}
      <div className="stack-list">
        {filtered.map((deal) => (
          <Card key={deal.id} className="list-card">
            <div>
              <h3>{deal.dealId || deal.id}</h3>
              <p>{deal.propertyTitle || deal.property_title || deal.propertyId ? `العقار: ${deal.propertyTitle || deal.property_title || deal.propertyId}` : deal.listingType || 'صفقة'}</p>
              <p className="muted">{formatDate(deal.createdAt || deal.created_at)}</p>
            </div>
            <StatusBadge status={getWorkflowStatusLabel(deal.status)} tone={getWorkflowStatusTone(deal.status)} />
            <strong>{formatNumber(deal.totalAmount || deal.total_amount || deal.proposedPrice || deal.proposed_price || 0)}</strong>
            <div className="inline-actions">
              <Button variant="outline" onClick={() => setSelected(deal)}>
                التفاصيل
              </Button>
              {deal.propertyId && (
                <Button as={Link} to={`/properties/${deal.propertyId}`} variant="ghost">
                  العقار
                </Button>
              )}
            </div>
          </Card>
        ))}
        {filtered.length === 0 && !error && <EmptyState title="لا توجد صفقات" description="لم يتم العثور على صفقات مرتبطة بحسابك." />}
      </div>

      <DetailsDrawer open={Boolean(selected)} title="تفاصيل الصفقة" onClose={() => setSelected(null)}>
        {selected && (
          <dl className="details-grid">
            <div>
              <dt>العقار</dt>
              <dd>{selected.propertyTitle || selected.property_title || selected.propertyId || 'غير محدد'}</dd>
            </div>
            <div>
              <dt>نوع الطلب</dt>
              <dd>{getPurchaseIntentLabel(selected.purchaseIntent)}</dd>
            </div>
            <div>
              <dt>السعر المقترح</dt>
              <dd>{formatNumber(selected.proposedPrice || selected.totalAmount || selected.total_amount || 0)}</dd>
            </div>
            <div>
              <dt>حالة الدفع</dt>
              <dd>{selected.paymentStatus || 'غير محدد'}</dd>
            </div>
            <div>
              <dt>حالة العقد</dt>
              <dd>{selected.contractStatus || 'غير محدد'}</dd>
            </div>
            <div>
              <dt>الحالة</dt>
              <dd>{getWorkflowStatusLabel(selected.status)}</dd>
            </div>
            {Object.entries(selected)
              .filter(([key]) => !['propertyTitle', 'property_title', 'propertyId', 'purchaseIntent', 'proposedPrice', 'totalAmount', 'total_amount', 'paymentStatus', 'contractStatus', 'status'].includes(key))
              .map(([key, value]) => (
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
