import { useEffect, useState } from 'react';
import { AdminAppHeader } from '../../components/admin/AdminAppHeader';
import { getAdminContactSettings, saveAdminContactSettings, type AdminContactSettings } from '../../services/adminWorkflowService';

const initial: AdminContactSettings = { countryCode: '+963', phone: '', email: '' };

export function AdminContactPage() {
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => { getAdminContactSettings().then(setForm).catch(() => setMessage('تعذر تحميل بيانات التواصل.')).finally(() => setLoading(false)); }, []);
  const save = async (kind: 'phone' | 'email') => { setSaving(kind); setMessage(''); try { await saveAdminContactSettings(form); setMessage('تم حفظ بيانات التواصل بنجاح.'); } catch (error) { setMessage('لا يمكن حفظ بيانات التواصل من هذا الحساب. هذه العملية متاحة للمالك فقط.'); if (import.meta.env.DEV) console.warn('[admin contact] save denied', error); } finally { setSaving(''); } };
  return <div className="admin-app-page"><AdminAppHeader title="رقم الأدمن" /><div className="admin-mobile-content">{message && <p className="admin-inline-message">{message}</p>}{loading ? <div className="admin-app-loading">جاري تحميل البيانات...</div> : <>
    <section className="admin-form-card"><h2>تحديث رقم الواتساب</h2><div className="admin-phone-row"><label>كود الدولة<input dir="ltr" value={form.countryCode} onChange={(event) => setForm({ ...form, countryCode: event.target.value })} /></label><label>رقم الهاتف<input dir="ltr" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label></div><button className="admin-save-whatsapp" disabled={saving === 'phone'} onClick={() => void save('phone')}>{saving === 'phone' ? 'جاري الحفظ...' : 'حفظ الرقم'}</button></section>
    <section className="admin-form-card"><h2>تحديث إيميل الدعم</h2><label>البريد الإلكتروني<input type="email" dir="ltr" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><button className="admin-save-email" disabled={saving === 'email'} onClick={() => void save('email')}>{saving === 'email' ? 'جاري الحفظ...' : 'حفظ الإيميل'}</button></section>
  </>}</div></div>;
}
