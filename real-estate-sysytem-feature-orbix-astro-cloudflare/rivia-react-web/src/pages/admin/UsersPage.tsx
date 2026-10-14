import { useEffect, useMemo, useState } from 'react';
import { AdminAppHeader } from '../../components/admin/AdminAppHeader';
import { useAuth } from '../../hooks/useAuth';
import { hasAdminAccess, isOwnerProfile } from '../../lib/adminAccess';
import { getUsers } from '../../services/adminService';
import { setUserAdminRole } from '../../services/adminWorkflowService';
import type { UserProfile } from '../../types/models';

export function UsersPage() {
  const { user: currentUser, isOwner } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]); const [search, setSearch] = useState(''); const [loading, setLoading] = useState(true); const [message, setMessage] = useState(''); const [busy, setBusy] = useState('');
  const load = async () => { setLoading(true); try { setUsers(await getUsers(300)); } catch { setMessage('تعذر تحميل المستخدمين بسبب صلاحيات قاعدة البيانات.'); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const visible = useMemo(() => { const q = search.trim().toLowerCase(); return users.filter((item) => !q || [item.displayName, item.username, item.email].filter(Boolean).join(' ').toLowerCase().includes(q)); }, [search, users]);
  const toggle = async (item: UserProfile) => { if (!isOwner) { setMessage('يمكن للمالك فقط تعديل صلاحيات المستخدمين.'); return; } if (isOwnerProfile(item) || item.uid === currentUser?.uid) { setMessage('لا يمكن إزالة صلاحية المالك أو تعديل صلاحية حسابك الحالي من هذه الصفحة.'); return; } setBusy(item.uid); try { await setUserAdminRole(item, !hasAdminAccess(item)); await load(); setMessage('تم تحديث صلاحية المستخدم.'); } catch (error) { setMessage('لا يمكن تعديل صلاحيات المستخدمين من هذا الحساب.'); if (import.meta.env.DEV) console.warn('[admin users] role update denied', error); } finally { setBusy(''); } };
  return <div className="admin-app-page"><AdminAppHeader title="إدارة المستخدمين" /><div className="admin-mobile-content"><input className="admin-search-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث بالاسم أو البريد..." />{message && <p className="admin-inline-message">{message}</p>}{loading ? <div className="admin-app-loading">جاري تحميل المستخدمين...</div> : visible.map((item) => { const admin = hasAdminAccess(item); const owner = isOwnerProfile(item); return <article className="admin-user-role-card" key={item.uid}><span className="admin-user-avatar">{(item.displayName || item.username || item.email || 'م').slice(0, 1)}</span><div><h2>{item.displayName || item.username || 'مستخدم'}</h2><p>{item.email || 'بدون بريد'}</p>{owner && <small>مالك التطبيق</small>}</div><button disabled={!isOwner || owner || busy === item.uid || item.uid === currentUser?.uid} className={admin ? 'admin-outline-red' : 'admin-outline-blue'} onClick={() => void toggle(item)}>{admin ? 'إزالة مشرف' : 'تعيين مشرف'}</button></article>; })}</div></div>;
}
