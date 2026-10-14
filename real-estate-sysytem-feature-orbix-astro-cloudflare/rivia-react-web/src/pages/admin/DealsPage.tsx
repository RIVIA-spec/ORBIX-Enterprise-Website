import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DetailsDrawer } from '../../components/ui/DetailsDrawer';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { getFirebaseErrorMessage } from '../../lib/firebaseErrors';
import { formatDate, formatNumber } from '../../lib/formatters';
import { getPurchaseIntentLabel, getWorkflowStatusLabel, getWorkflowStatusTone } from '../../lib/statusLabels';
import { createContractForDeal, queueAdminEmail } from '../../services/functionsService';
import { getAllDeals, updateDealFieldsByPath } from '../../services/dealService';
import type { Deal } from '../../types/models';

const statusOptions = ['pending', 'confirmed', 'rejected', 'cancelled', 'negotiating'];

export function DealsPage() {
  const { isAdmin, isOwner } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selected, setSelected] = useState<Deal | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [nextStatus, setNextStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      setDeals(await getAllDeals());
    } catch (err) {
      setError(getFirebaseErrorMessage(err, 'تعذر تحميل الصفقات.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return deals.filter((deal) => {
      const source = [
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
        deal.customerUserId,
        deal.ownerUserId,
        deal.proposedPrice,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return (status === 'all' || deal.status === status) && (!needle || source.includes(needle));
    });
  }, [deals, search, status]);

  const handleStatusUpdate = async (statusOverride?: string) => {
    if (!selected) return;
    setActionMessage(null);
    setError(null);
    try {
      await updateDealFieldsByPath(selected.docPath, selected.id, { status: statusOverride || nextStatus });
      await reload();
      setSelected(null);
    } catch (err) {
      setError(getFirebaseErrorMessage(err, 'تعذر تحديث الصفقة. قد تمنع قواعد قاعدة البيانات هذه العملية.'));
    }
  };

  const handleCreateContract = async () => {
    if (!selected) return;
    setActionMessage(null);
    try {
      await createContractForDeal(selected.dealId || selected.id);
      setActionMessage('تم إرسال طلب إنشاء العقد بنجاح.');
    } catch (err) {
      setActionMessage(getFirebaseErrorMessage(err, 'تعذر إنشاء العقد عبر الوظيفة السحابية.'));
    }
  };

  const handleQueueEmail = async () => {
    if (!selected) return;
    setActionMessage(null);
    try {
      await queueAdminEmail('CONTRACT_REQUEST', selected.dealId || selected.id);
      setActionMessage('تمت جدولة الإشعار الإداري.');
    } catch (err) {
      setActionMessage(getFirebaseErrorMessage(err, 'تعذر جدولة الإشعار الإداري.'));
    }
  };

  if (loading) return <LoadingState label="جارٍ تحميل الصفقات" />;

  return (
    <div>
      <div className="page-heading compact">
        <span className="eyebrow">إدارة الصفقات</span>
        <h1>الصفقات</h1>
      </div>

      <div className="filter-bar">
        <Input label="بحث" value={search} onChange={(event) => setSearch(event.target.value)} />
        <Select
          label="الحالة"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          options={[
            { value: 'all', label: 'الكل' },
            { value: 'pending', label: 'قيد المراجعة' },
            { value: 'confirmed', label: 'مؤكدة' },
            { value: 'rejected', label: 'مرفوضة' },
            { value: 'cancelled', label: 'ملغاة' },
          ]}
        />
      </div>

      {error && <ErrorMessage message={error} />}
      {actionMessage && <div className="form-success">{actionMessage}</div>}

      <div className="stack-list">
        {filtered.map((deal) => (
          <Card key={deal.id} className="list-card">
            <div>
              <h3>{deal.dealId || deal.id}</h3>
              <p>{deal.propertyTitle || deal.property_title || deal.propertyId ? `العقار: ${deal.propertyTitle || deal.property_title || deal.propertyId}` : deal.listingType || 'صفقة'}</p>
              <p className="muted">{formatDate(deal.createdAt || deal.created_at)}</p>
            </div>
            <StatusBadge status={getWorkflowStatusLabel(deal.status)} tone={getWorkflowStatusTone(deal.status)} />
            <strong>{formatNumber(deal.totalAmount || deal.total_amount || deal.proposedPrice || 0)}</strong>
            <div className="inline-actions">
              <Button variant="outline" onClick={() => { setSelected(deal); setNextStatus(deal.status || 'pending'); }}>
                التفاصيل
              </Button>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && !error && <EmptyState title="لا توجد صفقات" description="لم يتم العثور على صفقات مطابقة." />}
      </div>

      <DetailsDrawer open={Boolean(selected)} title="تفاصيل الصفقة" onClose={() => setSelected(null)}>
        {selected && (
          <div className="form-stack">
            <dl className="details-grid">
              <div>
                <dt>العقار</dt>
                <dd>{selected.propertyTitle || selected.property_title || selected.propertyId || 'غير محدد'}</dd>
              </div>
              <div>
                <dt>العميل</dt>
                <dd>{selected.customerName || 'غير محدد'}</dd>
              </div>
              <div>
                <dt>الهاتف</dt>
                <dd>{selected.customerPhone || 'غير محدد'}</dd>
              </div>
              <div>
                <dt>بريد العميل</dt>
                <dd>{selected.customerEmail || 'غير محدد'}</dd>
              </div>
              <div>
                <dt>نوع الاهتمام</dt>
                <dd>{getPurchaseIntentLabel(selected.purchaseIntent)}</dd>
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
                <dt>الحالة الحالية</dt>
                <dd>{getWorkflowStatusLabel(selected.status)}</dd>
              </div>
              {Object.entries(selected)
                .filter(([key]) => !['propertyTitle', 'property_title', 'propertyId', 'customerName', 'customerPhone', 'customerEmail', 'purchaseIntent', 'paymentStatus', 'contractStatus', 'status'].includes(key))
                .map(([key, value]) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{String(value ?? '')}</dd>
              </div>
                ))}
            </dl>
            {(isAdmin || isOwner) && (
              <>
                <Select
                  label="تحديث الحالة"
                  value={nextStatus}
                  onChange={(event) => setNextStatus(event.target.value)}
                  options={statusOptions.map((item) => ({ value: item, label: getWorkflowStatusLabel(item) }))}
                />
                <div className="inline-actions">
                  <Button onClick={() => void handleStatusUpdate('negotiating')}>قيد التفاوض</Button>
                  <Button onClick={() => void handleStatusUpdate('confirmed')}>اعتماد</Button>
                  <Button variant="outline" onClick={() => void handleStatusUpdate('rejected')}>رفض</Button>
                  <Button variant="outline" onClick={handleCreateContract}>
                    إنشاء عقد
                  </Button>
                  <Button variant="ghost" onClick={handleQueueEmail}>
                    إرسال إشعار
                  </Button>
                  <Button variant="secondary" onClick={() => void handleStatusUpdate()}>حفظ الحالة</Button>
                </div>
              </>
            )}
          </div>
        )}
      </DetailsDrawer>
    </div>
  );
}
