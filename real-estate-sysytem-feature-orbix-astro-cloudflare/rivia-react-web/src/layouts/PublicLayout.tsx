import { Outlet } from 'react-router-dom';
import { MobileBottomNav } from '../components/layout/MobileBottomNav';
import { CookieConsentBanner } from '../components/layout/CookieConsentBanner';
import { Footer } from '../components/layout/Footer';
import { Header } from '../components/layout/Header';
import { ScrollToTop } from '../components/layout/ScrollToTop';

export function PublicLayout() {
  return (
    <div className="app-shell">
      <ScrollToTop />
      <Header />
      <main className="main-content">
        <Outlet />
      </main>
      <MobileBottomNav />
      <Footer />
      <CookieConsentBanner />
    </div>
  );
}
