import { FormEvent, useEffect, useMemo, useState } from 'react';
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
import { createInvoice, getAllInvoices, updateInvoiceStatus } from '../../services/invoiceService';
import type { Invoice } from '../../types/models';

const statusOptions = ['pending', 'paid', 'cancelled', 'overdue'];

export function InvoicesPage() {
  const { isAdmin, isOwner } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [nextStatus, setNextStatus] = useState('pending');
  const [dealId, setDealId] = useState('');
  const [customerUserId, setCustomerUserId] = useState('');
  const [ownerUserId, setOwnerUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      setInvoices(await getAllInvoices());
    } catch (err) {
      setError(getFirebaseErrorMessage(err, 'تعذر تحميل الفواتير.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return invoices.filter((invoice) => {
      const source = [invoice.invoiceId, invoice.dealId, invoice.customerUserId, invoice.ownerUserId, invoice.status]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return (status === 'all' || invoice.status === status) && (!needle || source.includes(needle));
    });
  }, [invoices, search, status]);

  const createNewInvoice = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setActionMessage(null);
    try {
      await createInvoice({
        dealId,
        customerUserId,
        ownerUserId,
        amount: Number(amount) || 0,
        status: 'pending',
      });
      setActionMessage('تم إنشاء الفاتورة بنجاح.');
      setDealId('');
      setCustomerUserId('');
      setOwnerUserId('');
      setAmount('');
      await reload();
    } catch (err) {
      setError(getFirebaseErrorMessage(err, 'تعذر إنشاء الفاتورة حاليًا. تحقق من صلاحيات حسابك وحاول مجددًا.'));
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selected) return;
    setError(null);
    setActionMessage(null);
    try {
      await updateInvoiceStatus(selected.docPath, selected.id, nextStatus);
      await reload();
      setSelected(null);
    } catch (err) {
      setError(getFirebaseErrorMessage(err, 'تعذر تحديث الفاتورة حاليًا. تحقق من صلاحيات حسابك وحاول مجددًا.'));
    }
  };

  if (loading) return <LoadingState label="جارٍ تحميل الفواتير" />;

  return (
    <div>
      <div className="page-heading compact">
        <span className="eyebrow">إدارة الفواتير</span>
        <h1>الفواتير</h1>
      </div>

      <Card className="list-card">
        <h2>إنشاء فاتورة</h2>
        <form className="form-stack" onSubmit={createNewInvoice}>
          <Input label="معرّف الصفقة" value={dealId} onChange={(event) => setDealId(event.target.value)} required />
          <div className="grid-two">
            <Input label="معرّف العميل" value={customerUserId} onChange={(event) => setCustomerUserId(event.target.value)} required />
            <Input label="معرّف المالك" value={ownerUserId} onChange={(event) => setOwnerUserId(event.target.value)} required />
          </div>
          <Input type="number" min={0} label="المبلغ" value={amount} onChange={(event) => setAmount(event.target.value)} required />
          <Button type="submit" loading={saving}>
            إنشاء
          </Button>
        </form>
      </Card>

      <div className="filter-bar">
        <Input label="بحث" value={search} onChange={(event) => setSearch(event.target.value)} />
        <Select
          label="الحالة"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          options={[
            { value: 'all', label: 'الكل' },
            { value: 'pending', label: 'قيد المراجعة' },
            { value: 'paid', label: 'مدفوعة' },
            { value: 'cancelled', label: 'ملغاة' },
            { value: 'overdue', label: 'متأخرة' },
          ]}
        />
      </div>

      {error && <ErrorMessage message={error} />}
      {actionMessage && <div className="form-success">{actionMessage}</div>}

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
              <Button variant="outline" onClick={() => { setSelected(invoice); setNextStatus(invoice.status || 'pending'); }}>
                التفاصيل
              </Button>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && !error && <EmptyState title="لا توجد فواتير" description="لم يتم العثور على فواتير مطابقة." />}
      </div>

      <DetailsDrawer open={Boolean(selected)} title="تفاصيل الفاتورة" onClose={() => setSelected(null)}>
        {selected && (
          <div className="form-stack">
            <dl className="details-grid">
              {Object.entries(selected).map(([key, value]) => (
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
                  options={statusOptions.map((item) => ({ value: item, label: item }))}
                />
                <Button onClick={handleStatusUpdate}>حفظ الحالة</Button>
              </>
            )}
          </div>
        )}
      </DetailsDrawer>
    </div>
  );
}
