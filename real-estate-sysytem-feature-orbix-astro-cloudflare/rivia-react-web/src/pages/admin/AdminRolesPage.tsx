import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { getFirebaseErrorMessage } from '../../lib/firebaseErrors';
import { getUsers, updateUserRoleField } from '../../services/adminService';
import type { UserProfile } from '../../types/models';

export function AdminRolesPage() {
  const { isOwner } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      setUsers(await getUsers());
    } catch (err) {
      setError(getFirebaseErrorMessage(err, 'تعذر تحميل المستخدمين'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return users.filter((item) => !needle || [item.email, item.username, item.uid].filter(Boolean).join(' ').toLowerCase().includes(needle));
  }, [search, users]);

  if (!isOwner) return <EmptyState title="هذه الصفحة متاحة للمالك فقط" description="يمكن للمالك فقط إدارة صلاحيات المستخدمين." />;
  if (loading) return <LoadingState label="جاري تحميل الأدوار" />;

  const setRole = async (user: UserProfile, role: string) => {
    if (user.role === 'owner') {
      setError('لا يمكن تغيير أو إزالة دور المالك من هذه الواجهة.');
      return;
    }
    setError(null);
    try {
      await updateUserRoleField(user.uid, role);
      await reload();
    } catch (err) {
      setError(getFirebaseErrorMessage(err, 'تعذر تعديل صلاحية المستخدم حاليًا.'));
    }
  };

  return (
    <div>
      <div className="page-heading compact">
        <h1>صلاحيات المشرفين</h1>
        <p>إدارة صلاحيات المستخدمين والحسابات الإدارية.</p>
      </div>
      {error && <EmptyState title="تعذر تعديل الصلاحية" description={error} />}
      <div className="filter-bar">
        <Input label="بحث" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="البريد أو الاسم" />
      </div>
      <div className="stack-list">
        {filtered.map((item) => (
          <Card key={item.uid} className="list-card">
            <div><h3>{item.username || item.email || item.uid}</h3><p>{item.email || 'بدون بريد'}</p></div>
            <StatusBadge status={item.role || 'user'} />
            <div className="inline-actions">
              <Button variant="outline" disabled={item.role === 'owner'} onClick={() => setRole(item, 'admin')}>تعيين مشرف</Button>
              <Button variant="ghost" disabled={item.role === 'owner'} onClick={() => setRole(item, 'user')}>إزالة الإشراف</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
