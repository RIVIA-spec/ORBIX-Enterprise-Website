import { useEffect, useState } from 'react';
import { SEO } from '../../components/seo/SEO';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
import { breadcrumbSchema, faqPageSchema } from '../../lib/seo';
import { isCmsConfigured, listFaqs } from '../../services/contentGateway';
import type { CmsFaq } from '../../types/content';

export function FaqsPage() {
  const [items, setItems] = useState<CmsFaq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listFaqs()
      .then(setItems)
      .catch((value: unknown) => setError(value instanceof Error ? value.message : 'Unable to load FAQs.'))
      .finally(() => setLoading(false));
  }, []);

  return <section className="container section">
    <SEO title="Orbix FAQs" description="Frequently asked questions about Orbix services and content." path="/faqs" jsonLd={[faqPageSchema(items), breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'FAQs', path: '/faqs' }])]} />
    <div className="section-header"><div><h1>FAQs</h1><p>Answers managed in Strapi.</p></div></div>
    {loading && <LoadingState label="Loading FAQs" />}
    {error && <EmptyState title="Unable to load FAQs" description={error} />}
    {!loading && !error && items.length === 0 && <EmptyState title="No FAQs published yet" description={isCmsConfigured() ? 'Publish FAQs from Strapi.' : 'Set VITE_STRAPI_URL to enable Strapi content.'} />}
    <div className="content-list">{items.map((item) => <article className="card content-card" key={item.documentId || item.id || item.slug}><h2>{item.question}</h2><div style={{ whiteSpace: 'pre-wrap' }}>{item.answer}</div></article>)}</div>
  </section>;
}
