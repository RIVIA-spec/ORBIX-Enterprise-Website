import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { getFirebaseErrorMessage } from '../../lib/firebaseErrors';
import { formatDate } from '../../lib/formatters';
import { getReports, updateReportStatus } from '../../services/adminService';
import type { Report } from '../../types/models';

const ACTIVE_REPORT_STATUSES = new Set(['pending', 'open']);

function normalizeReportStatus(status?: string) {
  const value = (status || 'pending').toLowerCase();
  if (ACTIVE_REPORT_STATUSES.has(value)) return 'active';
  if (value === 'closed' || value === 'resolved' || value === 'reviewed') return 'resolved';
  if (value === 'rejected') return 'rejected';
  return value;
}

function getReportStatusLabel(status?: string) {
  const normalized = normalizeReportStatus(status);
  if (normalized === 'active') return 'قيد المراجعة';
  if (normalized === 'resolved') return 'تمت المعالجة';
  if (normalized === 'rejected') return 'مرفوض';
  return status || 'قيد المراجعة';
}

function getReportStatusTone(status?: string) {
  const normalized = normalizeReportStatus(status);
  if (normalized === 'active') return 'amber';
  if (normalized === 'resolved') return 'green';
  if (normalized === 'rejected') return 'red';
  return 'blue';
}

export function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [tab, setTab] = useState<'property' | 'hotel'>('property');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      const [propertyReports, hotelReports] = await Promise.all([getReports('property_reports'), getReports('hotel_reports')]);
      setReports([...propertyReports, ...hotelReports]);
    } catch (err) {
      setError(getFirebaseErrorMessage(err, 'تعذر تحميل البلاغات'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return reports.filter((report) => {
      const source = [
        report.reason,
        report.reason_text,
        report.targetId,
        report.propertyId,
        report.property_id,
        report.hotelId,
        report.hotel_id,
        report.reporterId,
        report.reporter_id,
        report.userId,
      ].filter(Boolean).join(' ').toLowerCase();
      return report.type === tab && (status === 'all' || normalizeReportStatus(report.status) === status) && (!needle || source.includes(needle));
    });
  }, [reports, search, status, tab]);

  const updateStatus = async (report: Report, nextStatus: string) => {
    try {
      await updateReportStatus(report.type === 'hotel' ? 'hotel_reports' : 'property_reports', report.id, nextStatus);
      await reload();
    } catch (err) {
      setError(getFirebaseErrorMessage(err, 'تعذر تحديث البلاغ حاليًا. تحقق من صلاحيات حسابك وحاول مجددًا.'));
    }
  };

  if (loading) return <LoadingState label="جاري تحميل البلاغات" />;

  return (
    <div>
      <div className="page-heading compact"><h1>إدارة البلاغات</h1></div>
      {error && <EmptyState title="تعذر تنفيذ العملية" description={error} />}
      <div className="filter-bar">
        <Select label="النوع" value={tab} onChange={(event) => setTab(event.target.value as 'property' | 'hotel')} options={[{ value: 'property', label: 'عقارات' }, { value: 'hotel', label: 'فنادق' }]} />
        <Select label="الحالة" value={status} onChange={(event) => setStatus(event.target.value)} options={[{ value: 'all', label: 'الكل' }, { value: 'active', label: 'قيد المراجعة' }, { value: 'resolved', label: 'تمت المعالجة' }, { value: 'rejected', label: 'مرفوض' }]} />
        <Input label="بحث" value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>
      <div className="stack-list">
        {filtered.map((report) => (
          <Card key={`${report.type}-${report.id}`} className="list-card">
            <div>
              <h3>{report.reason || report.reason_text || 'بلاغ'}</h3>
              <p>{report.targetId || report.propertyId || report.property_id || report.hotelId || report.hotel_id || 'بدون هدف'} · {formatDate(report.created_at || report.createdAt)}</p>
            </div>
            <StatusBadge status={getReportStatusLabel(report.status)} tone={getReportStatusTone(report.status)} />
            <div className="inline-actions">
              <Button variant="ghost" onClick={() => updateStatus(report, 'pending')}>قيد المراجعة</Button>
              <Button variant="ghost" onClick={() => updateStatus(report, 'resolved')}>تمت المعالجة</Button>
              <Button variant="ghost" onClick={() => updateStatus(report, 'rejected')}>مرفوض</Button>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && !error && <EmptyState title="لا توجد بلاغات مطابقة" />}
      </div>
    </div>
  );
}
