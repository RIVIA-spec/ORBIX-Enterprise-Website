import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { getAdminRoleLabel, hasCookieSettingsAccess } from '../lib/adminAccess';

const links = [
  { to: '/admin', label: 'الرئيسية' }, { to: '/admin/bookings/pending', label: 'الحجوزات المعلقة' },
  { to: '/admin/notifications/send', label: 'إرسال إشعارات' }, { to: '/admin/featured', label: 'العناصر المميزة' },
  { to: '/admin/properties/visibility', label: 'ظهور العقارات' }, { to: '/admin/property-requests', label: 'طلبات العقارات' },
  { to: '/admin/users', label: 'إدارة المستخدمين' }, { to: '/admin/contact', label: 'بيانات التواصل' },
  { to: '/admin/properties', label: 'إدارة العقارات' }, { to: '/admin/hotels', label: 'الفنادق' },
  { to: '/admin/reports', label: 'البلاغات' }, { to: '/admin/report-reasons', label: 'أسباب الإبلاغ' },
  { to: '/admin/ads', label: 'الإعلانات' }, { to: '/admin/features', label: 'المزايا' },
  { to: '/admin/property-types', label: 'أنواع العقارات' }, { to: '/admin/hero-slides', label: 'السلايدر الرئيسي' },
  { to: '/admin/cookie-settings', label: '⚙ إعدادات ملفات تعريف الارتباط' },
  { to: '/admin/deals', label: 'الصفقات' }, { to: '/admin/invoices', label: 'الفواتير' }, { to: '/admin/contracts', label: 'العقود' },
];

export function AdminLayout() {
  const { profile } = useAuth(); const [open, setOpen] = useState(false);
  const visibleLinks = links.filter((link) => link.to !== '/admin/cookie-settings' || hasCookieSettingsAccess(profile));
  return <section className="admin-shell"><aside className={`admin-sidebar ${open ? 'open' : ''}`}><div className="admin-brand"><strong>لوحة التحكم</strong><span>{getAdminRoleLabel(profile)}</span></div><nav>{visibleLinks.map((link) => <NavLink key={link.to} to={link.to} onClick={() => setOpen(false)} end={link.to === '/admin'}>{link.label}</NavLink>)}</nav></aside><div className="admin-main"><header className="admin-topbar"><Button variant="outline" onClick={() => setOpen((value) => !value)}>القائمة</Button><span className="badge badge-blue">{getAdminRoleLabel(profile)}</span></header><main className="admin-content"><Outlet /></main></div></section>;
}
