import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { APP_NAME } from '../../lib/constants';
import { Button } from '../ui/Button';
import { MobileDrawer } from './MobileDrawer';

export function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, isAdmin, isOwner, logout } = useAuth();
  const { theme, isDarkTheme, toggleTheme } = useTheme();
  const canUseDashboard = isAdmin || isOwner;
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  useEffect(() => {
    if (!moreOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!moreMenuRef.current?.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMoreOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [moreOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        closeDrawer();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [closeDrawer]);

  const closeMoreMenu = () => setMoreOpen(false);

  const handleLogout = async () => {
    await logout();
    closeMoreMenu();
  };

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
        <Link to="/" className="brand" aria-label="الرئيسية">
  <span>{APP_NAME}</span>
  <img
    src="/orbix_logo_favicon_header_pack/orbix-header-40.png"
    alt="Orbix"
    className="brand-logo"
  />
</Link>

        <nav className="desktop-nav" aria-label="التنقل الرئيسي">
          <NavLink to="/">الرئيسية</NavLink>
          <NavLink to="/properties">العقارات</NavLink>
          <NavLink to="/hotels">الفنادق</NavLink>
          <NavLink to="/services">الخدمات</NavLink>
          <NavLink to="/articles">المقالات</NavLink>
          <NavLink to="/map">الخريطة</NavLink>
          {isAuthenticated && <NavLink to="/add-property" className="wide-nav-link">إضافة عقار</NavLink>}
          {isAuthenticated && <NavLink to="/my-requests" className="wide-nav-link">طلباتي</NavLink>}

          {isAuthenticated && (
            <div className="nav-more" ref={moreMenuRef}>
              <button
                type="button"
                className="nav-more-button"
                aria-haspopup="menu"
                aria-expanded={moreOpen}
                onClick={() => setMoreOpen((open) => !open)}
              >
                المزيد
              </button>

              {moreOpen && (
                <div className="nav-more-menu" role="menu">
                  <NavLink to="/my-bookings" role="menuitem" onClick={closeMoreMenu}>حجوزاتي</NavLink>
                  <NavLink to="/my-properties" role="menuitem" onClick={closeMoreMenu}>عقاراتي</NavLink>
                  <NavLink to="/verification" role="menuitem" onClick={closeMoreMenu}>التحقق من الهوية</NavLink>
                  <NavLink to="/notifications" role="menuitem" onClick={closeMoreMenu}>الإشعارات</NavLink>
                  <NavLink to="/favorites" role="menuitem" onClick={closeMoreMenu}>المفضلة</NavLink>
                  <NavLink to="/profile" role="menuitem" onClick={closeMoreMenu}>حسابي</NavLink>
                  {canUseDashboard && <NavLink to="/admin" role="menuitem" onClick={closeMoreMenu}>لوحة التحكم</NavLink>}
                  <button type="button" role="menuitem" className="nav-more-logout" onClick={handleLogout}>
                    تسجيل الخروج
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="desktop-actions">
          <Button
            type="button"
            variant="ghost"
            className="theme-toggle theme-toggle--desktop"
            onClick={toggleTheme}
            aria-pressed={isDarkTheme}
          >
            الوضع الداكن: {isDarkTheme ? 'مفعل' : 'غير مفعل'}
          </Button>
          {!isAuthenticated && (
            <>
              <Button as={Link} to="/login" variant="ghost">
                تسجيل الدخول
              </Button>
              <Button as={Link} to="/register">
                إنشاء حساب
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="icon-button mobile-menu-button"
          onClick={() => setDrawerOpen(true)}
          aria-label="فتح القائمة"
          aria-expanded={drawerOpen}
          aria-controls="mobile-navigation"
        >
          <span aria-hidden="true">☰</span>
        </button>
        </div>
      </header>

      <MobileDrawer open={drawerOpen} onClose={closeDrawer} theme={theme} onToggleTheme={toggleTheme} />
    </>
  );
}
