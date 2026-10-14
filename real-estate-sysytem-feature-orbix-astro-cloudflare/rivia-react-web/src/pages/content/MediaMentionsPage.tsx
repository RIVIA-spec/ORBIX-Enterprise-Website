import { useEffect, useState } from 'react';
import { SEO } from '../../components/seo/SEO';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
import { breadcrumbSchema } from '../../lib/seo';
import { isCmsConfigured, listMediaMentions } from '../../services/contentGateway';
import type { CmsMediaMention } from '../../types/content';

export function MediaMentionsPage() {
  const [items, setItems] = useState<CmsMediaMention[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listMediaMentions()
      .then(setItems)
      .catch((value: unknown) => setError(value instanceof Error ? value.message : 'Unable to load media mentions.'))
      .finally(() => setLoading(false));
  }, []);

  return <section className="container section">
    <SEO title="Orbix Media Mentions" description="Press and media coverage for Orbix." path="/media" jsonLd={breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Media', path: '/media' }])} />
    <div className="section-header"><div><h1>Media</h1><p>Press coverage managed in Strapi.</p></div></div>
    {loading && <LoadingState label="Loading media mentions" />}
    {error && <EmptyState title="Unable to load media mentions" description={error} />}
    {!loading && !error && items.length === 0 && <EmptyState title="No media mentions published yet" description={isCmsConfigured() ? 'Publish media mentions from Strapi.' : 'Set VITE_STRAPI_URL to enable Strapi content.'} />}
    <div className="cards-grid">{items.map((item) => <article className="card content-card" key={item.documentId || item.id || item.slug}><h2><a href={item.url} target="_blank" rel="noreferrer">{item.title}</a></h2><p>{item.publisher}</p>{item.summary && <p>{item.summary}</p>}</article>)}</div>
  </section>;
}
