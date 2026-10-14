import { Link } from 'react-router-dom';
import { openCookieSettings } from './CookieConsentBanner';

type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

const platformLinks: FooterLink[] = [
  { label: 'العقارات', href: '/properties' },
  { label: 'الفنادق', href: '/hotels' },
  { label: 'الخريطة', href: '/map' },
  { label: 'إضافة عقار', href: '/add-property' },
];

const partnerLinks: FooterLink[] = [
  { label: 'PropTech Syria', href: 'https://proptechsyria.com', external: true },
  { label: 'RIVIA', href: 'https://riviaprop.com', external: true },
];

const contactLinks: FooterLink[] = [
  { label: 'info@riviaprop.com', href: 'mailto:info@riviaprop.com' },
  { label: 'واتساب: +963 980 150 064', href: 'https://wa.me/963980150064', external: true },
  { label: 'Instagram: @orbixcity', href: 'https://www.instagram.com/orbixcity/', external: true },
];

const legalLinks: FooterLink[] = [
  { label: 'سياسة الخصوصية', href: '/privacy-policy' },
  { label: 'شروط الاستخدام', href: '/terms-of-use' },
  { label: 'سياسة ملفات تعريف الارتباط', href: '/cookie-policy' },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer" dir="rtl" aria-label="تذييل الموقع">
      <div className="container site-footer__inner">
        <FooterNav title="تواصل معنا" label="روابط التواصل" links={contactLinks} />
        <FooterNav title="المنصة" label="روابط المنصة" links={platformLinks} />
        <FooterNav title="مواقع شريكة" label="مواقع شريكة" links={partnerLinks} />
        <section className="site-footer__brand-block" aria-labelledby="footer-brand-title">
          <h2 id="footer-brand-title" className="site-footer__brand">Orbix</h2>
          <p>منصة عقارية رقمية تساعدك على تصفح العقارات بوضوح قبل اتخاذ القرار.</p>
        </section>
      </div>
      <div className="container site-footer__legal">
        <nav className="site-footer__legal-links" aria-label="الروابط القانونية">
          {legalLinks.map((link) => (
            <FooterAnchor key={link.label} link={link} />
          ))}
          <button type="button" className="site-footer__cookie-settings" onClick={openCookieSettings}>
            إعدادات الكوكيز
          </button>
        </nav>
        <p>{currentYear} Orbix جميع الحقوق محفوظة.</p>
      </div>
    </footer>
  );
}

function FooterNav({ title, label, links }: { title: string; label: string; links: FooterLink[] }) {
  return (
    <nav className="site-footer__column" aria-label={label}>
      <h2>{title}</h2>
      <ul>
        {links.map((link) => (
          <li key={link.label}>
            <FooterAnchor link={link} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function FooterAnchor({ link }: { link: FooterLink }) {
  if (link.external || link.href.startsWith('mailto:')) {
    return (
      <a href={link.href} target={link.external ? '_blank' : undefined} rel={link.external ? 'noopener noreferrer' : undefined}>
        {link.label}
      </a>
    );
  }

  return <Link to={link.href}>{link.label}</Link>;
}
