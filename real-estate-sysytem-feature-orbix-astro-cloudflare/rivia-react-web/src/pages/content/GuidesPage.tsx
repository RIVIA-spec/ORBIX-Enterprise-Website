import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/seo/SEO';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
import { breadcrumbSchema } from '../../lib/seo';
import { isCmsConfigured, listGuides } from '../../services/contentGateway';
import type { CmsGuide } from '../../types/content';

export function GuidesPage() {
  const [items, setItems] = useState<CmsGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listGuides()
      .then(setItems)
      .catch((value: unknown) => setError(value instanceof Error ? value.message : 'Unable to load guides.'))
      .finally(() => setLoading(false));
  }, []);

  return <section className="container section">
    <SEO title="Orbix Guides" description="Guides for cities, partners, buyers, renters, and photography workflows." path="/guides" jsonLd={breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Guides', path: '/guides' }])} />
    <div className="section-header"><div><h1>Guides</h1><p>Editorial guides managed in Strapi.</p></div></div>
    {loading && <LoadingState label="Loading guides" />}
    {error && <EmptyState title="Unable to load guides" description={error} />}
    {!loading && !error && items.length === 0 && <EmptyState title="No guides published yet" description={isCmsConfigured() ? 'Publish guides from Strapi.' : 'Set VITE_STRAPI_URL to enable Strapi content.'} />}
    <div className="cards-grid">{items.map((item) => <article className="card content-card" key={item.documentId || item.id || item.slug}><h2><Link to={'/guides/' + item.slug}>{item.title}</Link></h2><p>{item.summary}</p></article>)}</div>
  </section>;
}
