import { useEffect, useMemo, useState } from 'react';
import { AdminAppHeader } from '../../components/admin/AdminAppHeader';
import { useAuth } from '../../hooks/useAuth';
import { hasAdminAccess } from '../../lib/adminAccess';
import { getUsers } from '../../services/adminService';
import { sendAdminNotifications } from '../../services/adminWorkflowService';
import type { UserProfile } from '../../types/models';

export function AdminNotificationsSendPage() {
  const { user, profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    getUsers(300).then((result) => setUsers(result.filter((item) => item.role !== 'owner'))).catch((error) => {
      setMessage('تعذر تحميل المستخدمين بسبب صلاحيات قاعدة البيانات.');
      if (import.meta.env.DEV) console.warn('[admin notifications] users load failed', error);
    }).finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return users.filter((item) => !needle || [item.displayName, item.username, item.email].filter(Boolean).join(' ').toLowerCase().includes(needle));
  }, [search, users]);

  const toggleAll = () => setSelected((current) => current.size === visible.length ? new Set() : new Set(visible.map((item) => item.uid)));
  const toggle = (uid: string) => setSelected((current) => {
    const next = new Set(current);
    if (next.has(uid)) next.delete(uid); else next.add(uid);
    return next;
  });

  const submit = async () => {
    if (!title.trim() || !body.trim() || !selected.size || !user) return;
    setSending(true);
    setMessage('');
    try {
      const recipients = users.filter((item) => selected.has(item.uid));
      const count = await sendAdminNotifications(recipients, title.trim(), body.trim(), user.uid, String(profile?.role || 'admin'));
      setMessage(`تم إرسال الإشعار إلى ${count} مستخدم.`);
      setOpen(false); setTitle(''); setBody(''); setSelected(new Set());
    } catch (error) {
      setMessage('تعذر إرسال الإشعار أو إنشاء طلب FCM بسبب صلاحيات قاعدة البيانات.');
      if (import.meta.env.DEV) console.warn('[admin notifications] send failed', error);
    } finally { setSending(false); }
  };

  return (
    <div className="admin-app-page admin-with-fixed-action">
      <AdminAppHeader title="إرسال إشعارات" />
      <div className="admin-mobile-content">
        <input className="admin-search-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث عن مستخدم (اسم أو إيميل)" />
        <label className="admin-select-all"><input type="checkbox" checked={visible.length > 0 && selected.size === visible.length} onChange={toggleAll} /><span>تحديد الكل</span><small>{selected.size} محدد</small></label>
        {message && <p className="admin-inline-message">{message}</p>}
        {loading ? <div className="admin-app-loading">جاري تحميل المستخدمين...</div> : visible.map((item) => (
          <label className="admin-user-select-card" key={item.uid}>
            <span className="admin-user-avatar">{(item.displayName || item.username || item.email || 'م').slice(0, 1)}</span>
            <span><strong>{item.displayName || item.username || 'مستخدم'}</strong><small>{item.email || 'بدون بريد'}</small></span>
            {hasAdminAccess(item) && <b>أدمن</b>}
            <input type="checkbox" checked={selected.has(item.uid)} onChange={() => toggle(item.uid)} />
          </label>
        ))}
      </div>
      <button className="admin-fixed-primary" type="button" disabled={!selected.size} onClick={() => setOpen(true)}>إرسال إشعار</button>
      {open && <div className="admin-bottom-sheet-backdrop" onMouseDown={() => setOpen(false)}><section className="admin-bottom-sheet" onMouseDown={(event) => event.stopPropagation()}>
        <h2>إرسال إشعار</h2><p>سيتم إرسال الإشعار إلى {selected.size} مستخدم</p>
        <label>عنوان الإشعار<input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label>نص الإشعار<textarea rows={4} value={body} onChange={(event) => setBody(event.target.value)} /></label>
        <div className="admin-card-actions"><button className="admin-approve-button" disabled={sending || !title.trim() || !body.trim()} onClick={() => void submit()}>{sending ? 'جاري الإرسال...' : 'إرسال'}</button><button className="admin-reject-button" onClick={() => setOpen(false)}>إلغاء</button></div>
      </section></div>}
    </div>
  );
}
