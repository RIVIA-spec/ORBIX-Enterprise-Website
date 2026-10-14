import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/seo/SEO';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
import { isCmsConfigured, listArticles } from '../../services/contentGateway';
import type { CmsArticle } from '../../types/content';

export function ArticlesPage() {
  const [items, setItems] = useState<CmsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listArticles().then(setItems).catch((value: unknown) => setError(value instanceof Error ? value.message : 'تعذر تحميل المقالات')).finally(() => setLoading(false));
  }, []);

  return <section className="container section">
    <SEO title="مقالات Orbix" description="أدلة ومقالات عن العقارات والفنادق والاستثمار." path="/articles" />
    <div className="section-header"><div><h1>المقالات والأدلة</h1><p>محتوى يساعدك على اتخاذ قرار أفضل.</p></div></div>
    {loading && <LoadingState label="جاري تحميل المقالات" />}
    {error && <EmptyState title="تعذر تحميل المقالات" description={error} />}
    {!loading && !error && items.length === 0 && <EmptyState title="لا توجد مقالات منشورة حالياً" description={isCmsConfigured() ? 'انشر أول مقال من Strapi.' : 'أضف VITE_STRAPI_URL لربط الموقع بـStrapi.'} />}
    <div className="cards-grid">{items.map((item) => <article className="card" key={item.documentId || item.id || item.slug}><h2><Link to={'/articles/' + item.slug}>{item.title}</Link></h2><p>{item.excerpt}</p></article>)}</div>
  </section>;
}
