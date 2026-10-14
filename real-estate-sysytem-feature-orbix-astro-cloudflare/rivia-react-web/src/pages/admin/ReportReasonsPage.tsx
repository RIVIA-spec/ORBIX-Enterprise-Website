import { useEffect, useState } from 'react';
import { AdminAppHeader } from '../../components/admin/AdminAppHeader';
import { addReportReason, deleteReportReason, listReportReasons, updateReportReason } from '../../services/adminWorkflowService';
import type { ReportReason } from '../../types/models';

export function ReportReasonsPage() {
  const [items, setItems] = useState<ReportReason[]>([]); const [reason, setReason] = useState(''); const [message, setMessage] = useState(''); const [loading, setLoading] = useState(true);
  const load = async () => { setLoading(true); try { setItems(await listReportReasons()); } catch { setMessage('تعذر تحميل أسباب الإبلاغ.'); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const add = async () => { if (!reason.trim()) return; try { await addReportReason(reason.trim()); setReason(''); await load(); } catch { setMessage('تعذر حفظ سبب الإبلاغ بسبب صلاحيات قاعدة البيانات.'); } };
  const edit = async (item: ReportReason) => { const current = item.reason || item.title || item.label || ''; const next = window.prompt('تعديل سبب الإبلاغ', current); if (!next?.trim()) return; try { await updateReportReason(item.id, next.trim()); await load(); } catch { setMessage('تعذر تعديل سبب الإبلاغ.'); } };
  const remove = async (item: ReportReason) => { if (!window.confirm('هل تريد حذف سبب الإبلاغ؟')) return; try { await deleteReportReason(item.id); setItems((current) => current.filter((value) => value.id !== item.id)); } catch { setMessage('تعذر حذف سبب الإبلاغ.'); } };
  return <div className="admin-app-page"><AdminAppHeader title="تغيير أسباب الإبلاغ" /><div className="admin-mobile-content"><section className="admin-form-card"><label>سبب جديد<input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="اكتب سبب الإبلاغ" /></label><button className="admin-save-email" onClick={() => void add()}>إضافة</button></section>{message && <p className="admin-inline-warning">{message}</p>}{loading ? <div className="admin-app-loading">جاري التحميل...</div> : items.map((item) => <article className="admin-simple-list-card" key={item.id}><div><h2>{item.reason || item.title || item.label}</h2></div><div className="admin-small-actions"><button className="admin-outline-blue" onClick={() => void edit(item)}>تعديل</button><button className="admin-outline-red" onClick={() => void remove(item)}>حذف</button></div></article>)}</div></div>;
}
