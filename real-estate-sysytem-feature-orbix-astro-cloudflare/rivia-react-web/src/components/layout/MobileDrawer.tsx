import { useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { ThemeMode } from '../../hooks/useTheme';
import { APP_NAME } from '../../lib/constants';
import { Button } from '../ui/Button';

type MobileDrawerProps = {
  open: boolean;
  onClose: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
};

export function MobileDrawer({ open, onClose, theme, onToggleTheme }: MobileDrawerProps) {
  const { isAuthenticated, isAdmin, isOwner, logout } = useAuth();
  const canUseDashboard = isAdmin || isOwner;

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  return (
    <div className="mobile-drawer" role="dialog" aria-modal="true" aria-label="قائمة الجوال">
      <button
        type="button"
        className="mobile-drawer__backdrop"
        onClick={onClose}
        aria-label="إغلاق القائمة"
      />

      <aside id="mobile-navigation" className="mobile-drawer__panel">
        <div className="mobile-drawer__head">
          <Link to="/" className="brand" onClick={onClose} aria-label="الرئيسية">
            <img src="/orbix_logo_favicon_header_pack/orbix-header-40.png" alt="" className="brand-logo" />
            <span>{APP_NAME}</span>
          </Link>
          <button type="button" className="icon-button mobile-drawer__close" onClick={onClose} aria-label="إغلاق القائمة">
            ×
          </button>
        </div>

        <nav className="mobile-drawer__nav" aria-label="قائمة الجوال">
          <NavLink to="/" onClick={onClose}>الرئيسية</NavLink>
          <NavLink to="/properties" onClick={onClose}>العقارات</NavLink>
          <NavLink to="/properties/map" onClick={onClose}>الخريطة</NavLink>
          <NavLink to="/hotels" onClick={onClose}>الفنادق</NavLink>
          <NavLink to="/services" onClick={onClose}>الخدمات</NavLink>
          <NavLink to="/articles" onClick={onClose}>المقالات</NavLink>
          <Link to="/properties" onClick={onClose}>الجولة الافتراضية</Link>
          <NavLink to={isAuthenticated ? '/favorites' : '/login'} onClick={onClose}>المفضلة</NavLink>
          {isAuthenticated && <NavLink to="/my-requests" onClick={onClose}>طلباتي</NavLink>}
          {isAuthenticated && <NavLink to="/my-properties" onClick={onClose}>عقاراتي</NavLink>}
          {isAuthenticated && <NavLink to="/add-property" onClick={onClose}>إضافة عقار</NavLink>}
          {isAuthenticated && <NavLink to="/profile" onClick={onClose}>حسابي</NavLink>}
          {isAuthenticated && <NavLink to="/my-bookings" onClick={onClose}>حجوزاتي</NavLink>}
          {isAuthenticated && <NavLink to="/verification" onClick={onClose}>التحقق من الهوية</NavLink>}
          {isAuthenticated && <NavLink to="/notifications" onClick={onClose}>الإشعارات</NavLink>}
          {canUseDashboard && <NavLink to="/admin" onClick={onClose}>لوحة التحكم</NavLink>}
        </nav>

        <div className="mobile-drawer__actions">
          <button
            type="button"
            className="theme-toggle theme-toggle--drawer"
            onClick={onToggleTheme}
            aria-pressed={theme === 'dark'}
          >
            <span>الوضع الداكن</span>
            <strong>{theme === 'dark' ? 'مفعل' : 'غير مفعل'}</strong>
          </button>
          {isAuthenticated ? (
            <Button variant="outline" fullWidth onClick={handleLogout}>تسجيل الخروج</Button>
          ) : (
            <>
              <Button as={Link} to="/login" variant="outline" fullWidth onClick={onClose}>تسجيل الدخول</Button>
              <Button as={Link} to="/register" fullWidth onClick={onClose}>إنشاء حساب</Button>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
