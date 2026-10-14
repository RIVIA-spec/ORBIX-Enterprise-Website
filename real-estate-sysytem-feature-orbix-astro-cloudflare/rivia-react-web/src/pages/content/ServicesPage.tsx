import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/seo/SEO';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
import { isCmsConfigured, listServices } from '../../services/contentGateway';
import type { CmsService } from '../../types/content';

export function ServicesPage() {
  const [items, setItems] = useState<CmsService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { listServices().then(setItems).catch((value: unknown) => setError(value instanceof Error ? value.message : 'تعذر تحميل الخدمات')).finally(() => setLoading(false)); }, []);
  return <section className="container section">
    <SEO title="خدمات Orbix" description="خدمات Orbix للعقارات والفنادق والشركاء." path="/services" />
    <div className="section-header"><div><h1>خدماتنا</h1><p>خدمات رقمية تربط العملاء بالشركاء.</p></div></div>
    {loading && <LoadingState label="جاري تحميل الخدمات" />}
    {error && <EmptyState title="تعذر تحميل الخدمات" description={error} />}
    {!loading && !error && items.length === 0 && <EmptyState title="لا توجد خدمات منشورة حالياً" description={isCmsConfigured() ? 'انشر الخدمات من Strapi.' : 'أضف VITE_STRAPI_URL لربط الموقع بـStrapi.'} />}
    <div className="cards-grid">{items.map((item) => <article className="card" key={item.documentId || item.id || item.slug}><h2><Link to={'/services/' + item.slug}>{item.icon ? item.icon + ' ' : ''}{item.title}</Link></h2><p>{item.summary}</p></article>)}</div>
  </section>;
}
