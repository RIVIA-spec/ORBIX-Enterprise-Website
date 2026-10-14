import { useEffect, useState } from 'react';
import { SEO } from '../../components/seo/SEO';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
import { breadcrumbSchema } from '../../lib/seo';
import { isCmsConfigured, listDocuments } from '../../services/contentGateway';
import type { CmsDocument } from '../../types/content';

export function DocumentsPage() {
  const [items, setItems] = useState<CmsDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listDocuments()
      .then(setItems)
      .catch((value: unknown) => setError(value instanceof Error ? value.message : 'Unable to load documents.'))
      .finally(() => setLoading(false));
  }, []);

  return <section className="container section">
    <SEO title="Orbix Downloads" description="Orbix public documents, brochures, forms, and media kit downloads." path="/downloads" jsonLd={breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Downloads', path: '/downloads' }])} />
    <div className="section-header"><div><h1>Downloads</h1><p>Public files managed in Strapi.</p></div></div>
    {loading && <LoadingState label="Loading downloads" />}
    {error && <EmptyState title="Unable to load downloads" description={error} />}
    {!loading && !error && items.length === 0 && <EmptyState title="No downloads published yet" description={isCmsConfigured() ? 'Publish documents from Strapi.' : 'Set VITE_STRAPI_URL to enable Strapi content.'} />}
    <div className="cards-grid">{items.map((item) => <article className="card content-card" key={item.documentId || item.id || item.slug}><h2>{item.title}</h2>{item.description && <p>{item.description}</p>}{item.file?.url && <a className="btn btn-outline" href={item.file.url} target="_blank" rel="noreferrer">Download</a>}</article>)}</div>
  </section>;
}
