import { NavLink, Outlet } from 'react-router-dom';

export function AccountLayout() {
  const accountLinks = [
    { to: '/profile', label: 'الملف الشخصي' },
    { to: '/my-requests', label: 'طلباتي' },
    { to: '/my-bookings', label: 'حجوزاتي' },
    { to: '/my-properties', label: 'عقاراتي' },
    { to: '/verification', label: 'التحقق من الهوية' },
    { to: '/notifications', label: 'الإشعارات' },
    { to: '/favorites', label: 'المفضلة' },
  ];

  return (
    <section className="container account-layout">
      <aside className="account-sidebar">
        <h2>حسابي</h2>
        <nav aria-label="روابط الحساب">
          {accountLinks.map((link) => (
            <NavLink key={link.to} to={link.to}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="account-content">
        <Outlet />
      </div>
    </section>
  );
}
