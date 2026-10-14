import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { LoadingState } from '../../components/ui/LoadingState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../hooks/useAuth';

export function ProfilePage() {
  const { user, profile, loading, isAdmin, isOwner } = useAuth();

  if (loading) return <LoadingState label="جاري تحميل الملف الشخصي" />;

  const links = [
    { to: '/my-requests', label: 'طلباتي' },
    { to: '/my-bookings', label: 'حجوزاتي' },
    { to: '/my-properties', label: 'عقاراتي' },
    { to: '/favorites', label: 'المفضلة' },
    { to: '/verification', label: 'التحقق من الهوية' },
    { to: '/notifications', label: 'الإشعارات' },
    ...(isAdmin || isOwner ? [{ to: '/admin', label: 'لوحة التحكم' }] : []),
  ];

  return (
    <div className="profile-page">
      <div className="page-heading compact">
        <span className="eyebrow">الملف الشخصي</span>
        <h1>{profile?.username || user?.displayName || 'حساب المستخدم'}</h1>
        <p>إدارة معلومات حسابك وبيانات التواصل الخاصة بك.</p>
      </div>

      <div className="profile-grid">
        <Card className="profile-card profile-account-card">
          <h2>معلومات الحساب</h2>
          <dl className="info-list">
            <div>
              <dt>البريد الإلكتروني</dt>
              <dd>{profile?.email || user?.email || 'غير متوفر'}</dd>
            </div>
            <div>
              <dt>تأكيد البريد</dt>
              <dd>
                <StatusBadge status={user?.emailVerified ? 'email verified' : 'email not verified'} />
              </dd>
            </div>
            <div>
              <dt>رقم الهاتف</dt>
              <dd>{profile?.phoneNumber || profile?.phone || 'غير متوفر'}</dd>
            </div>
            <div>
              <dt>الدور</dt>
              <dd>{profile?.role || (isAdmin ? 'admin' : isOwner ? 'owner' : 'user')}</dd>
            </div>
            <div>
              <dt>توثيق الهوية</dt>
              <dd>
                <StatusBadge status={profile?.verificationStatus || (profile?.isVerified ? 'verified' : 'pending')} />
              </dd>
            </div>
          </dl>
        </Card>

        <Card className="profile-card profile-shortcuts-card">
          <h2>اختصارات الحساب</h2>
          <div className="shortcut-grid">
            {links.map((link) => (
              <Link key={link.to} to={link.to}>
                {link.label}
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}