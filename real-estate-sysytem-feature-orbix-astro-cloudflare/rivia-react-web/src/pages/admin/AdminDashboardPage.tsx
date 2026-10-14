import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LoadingState } from '../../components/ui/LoadingState';
import { useAdminStats } from '../../hooks/useAdminStats';
import { useAuth } from '../../hooks/useAuth';
import { formatNumber } from '../../lib/formatters';
import { hasCookieSettingsAccess } from '../../lib/adminAccess';

type DashboardTab = 'stats' | 'management';

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { stats, loading, error, reload } = useAdminStats();
  const [activeTab, setActiveTab] = useState<DashboardTab>('stats');
  const reportCount = (stats?.propertyReports || 0) + (stats?.hotelReports || 0);
  const statCards = [
    { label: 'طلبات نشر/تعديل عقارات معلقة', value: stats?.pendingPropertyRequests, icon: '⌂', to: '/admin/property-requests' },
    { label: 'طلبات تحقق من الهوية', value: stats?.pendingVerifications, icon: '✓', to: '/admin/users' },
    { label: 'البلاغات', value: reportCount, icon: '!', to: '/admin/reports' },
    { label: 'طلبات حجز غرفة معلقة', value: stats?.pendingRoomBookings, icon: '▣', to: '/admin/bookings/pending' },
    { label: 'مستخدمون موثقون', value: stats?.verifiedUsers, icon: '✓', to: '/admin/users' },
    { label: 'إجمالي المستخدمين', value: stats?.users, icon: '●', to: '/admin/users' },
    { label: 'إجمالي العقارات', value: stats?.properties, icon: '⌂', to: '/admin/properties' },
    { label: 'إجمالي الفنادق', value: stats?.hotels, icon: 'H', to: '/admin/hotels' },
    { label: 'العقارات الموافق عليها', value: stats?.approvedPropertyRequests, icon: '✓', to: '/admin/property-requests' },
    { label: 'العقارات المرفوضة', value: stats?.rejectedPropertyRequests, icon: '×', to: '/admin/property-requests' },
  ];
  const managementCards = [
    { label: 'إضافة عقار/فندق مميز', description: 'إدارة العناصر المميزة', icon: '★', to: '/admin/featured', tone: 'blue' },
    { label: 'إخفاء / إظهار العقارات', description: 'التحكم في ظهور العقارات', icon: '◉', to: '/admin/properties/visibility', tone: 'cyan' },
    { label: 'إدارة الإعلانات', description: 'إنشاء وتحديث الإعلانات', icon: '▤', to: '/admin/ads', tone: 'orange' },
    { label: 'تغيير الميزات الخاصة بالعقارات', description: 'تحديث قائمة المزايا', icon: '◆', to: '/admin/features', tone: 'green' },
    { label: 'تغيير أنواع العقارات', description: 'إدارة أنواع العقارات', icon: '▦', to: '/admin/property-types', tone: 'purple' },
    { label: 'تغيير أسباب الإبلاغ', description: 'إدارة أسباب البلاغات', icon: '!', to: '/admin/report-reasons', tone: 'red' },
    { label: 'تعديل بيانات التواصل مع الأدمن', description: 'رقم واتساب وإيميل الدعم', icon: '☎', to: '/admin/contact', tone: 'teal' },
    { label: 'إضافة مشرفين', description: 'تعيين أو إزالة مشرف', icon: '+', to: '/admin/users', tone: 'indigo' },
    { label: 'إرسال إشعارات للمستخدمين', description: 'اختيار المستخدمين وإرسال إشعار', icon: '◌', to: '/admin/notifications/send', tone: 'pink' },
    { label: 'إدارة الفنادق', description: 'إضافة وتعديل الفنادق', icon: 'H', to: '/admin/hotels', tone: 'violet' },
    { label: 'إدارة السلايدر الرئيسي', description: 'إدارة شرائح الصفحة الرئيسية', icon: '▧', to: '/admin/hero-slides', tone: 'sky' },
    { label: 'إعدادات ملفات تعريف الارتباط', description: 'نص النافذة وخيارات الموافقة', icon: '⚙', to: '/admin/cookie-settings', tone: 'blue' },
  ];
  const visibleManagementCards = managementCards.filter((card) => card.to !== '/admin/cookie-settings' || hasCookieSettingsAccess(profile));
  return <main className="admin-dashboard-page"><header className="admin-dashboard-appbar"><button type="button" onClick={() => navigate(-1)} aria-label="رجوع">‹</button><h1>لوحة تحكم الأدمن</h1><span /></header><div className="admin-dashboard-inner">
    <div className="admin-dashboard-tabs" role="tablist"><button type="button" className={activeTab === 'stats' ? 'is-active' : ''} onClick={() => setActiveTab('stats')}>▥ الإحصائيات والطلبات</button><button type="button" className={activeTab === 'management' ? 'is-active' : ''} onClick={() => setActiveTab('management')}>⚙ إدارة التطبيق</button></div>
    {activeTab === 'stats' ? <section className="admin-dashboard-section"><div className="admin-dashboard-section-heading"><div><span>نظرة عامة</span><h2>الإحصائيات والطلبات</h2></div><button type="button" onClick={() => void reload()} disabled={loading}>تحديث</button></div>{loading && !stats ? <LoadingState label="جاري تحميل الإحصاءات..." /> : <div className="admin-stat-grid">{statCards.map((card) => <Link key={card.label} to={card.to} className="admin-stat-card"><span className="admin-stat-icon">{card.icon}</span><strong>{formatNumber(card.value ?? 0)}</strong><small>{card.label}</small></Link>)}</div>}{(error || stats?.warnings?.length) && <div className="admin-dashboard-warning"><strong>بعض الإحصاءات غير متاحة</strong><p>{error || stats?.warnings?.slice(0, 2).join(' ')}</p></div>}</section> : <section className="admin-dashboard-section"><div className="admin-dashboard-section-heading"><div><span>أدوات الإدارة</span><h2>إدارة التطبيق</h2></div></div><div className="admin-management-grid">{visibleManagementCards.map((card) => <Link key={card.label} to={card.to} className={`admin-management-card tone-${card.tone}`}><span className="admin-management-icon">{card.icon}</span><span className="admin-management-copy"><strong>{card.label}</strong><small>{card.description}</small></span><span className="admin-management-arrow">‹</span></Link>)}</div></section>}
  </div></main>;
}
