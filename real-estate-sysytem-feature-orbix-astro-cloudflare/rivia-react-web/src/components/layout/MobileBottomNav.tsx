import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function MobileBottomNav() {
  const { isAuthenticated } = useAuth();

  return (
    <nav className="mobile-bottom-nav" aria-label="التنقل السفلي">
      <NavLink to="/">
        <span>الرئيسية</span>
      </NavLink>
      <NavLink to="/properties">
        <span>العقارات</span>
      </NavLink>
      <NavLink to="/map">
        <span>الخريطة</span>
      </NavLink>
      <NavLink to="/my-requests">
        <span>طلباتي</span>
      </NavLink>
      <NavLink to={isAuthenticated ? '/profile' : '/login'}>
        <span>{isAuthenticated ? 'حسابي' : 'دخول'}</span>
      </NavLink>
    </nav>
  );
}
