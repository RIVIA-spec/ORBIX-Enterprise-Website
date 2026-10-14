import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SEO } from '../../components/seo/SEO';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
import { getServiceBySlug } from '../../services/contentGateway';
import type { CmsService } from '../../types/content';
import { breadcrumbSchema, serviceSchema } from '../../lib/seo';

export function ServicePage() {
  const { slug = '' } = useParams();
  const [service, setService] = useState<CmsService | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getServiceBySlug(slug)
      .then(setService)
      .catch((value: unknown) => setError(value instanceof Error ? value.message : 'تعذر تحميل الخدمة'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <LoadingState label="جاري تحميل الخدمة" />;
  if (error || !service) {
    return <section className="container section"><EmptyState title="الخدمة غير متاحة" description={error || 'قد تكون غير منشورة أو غير موجودة.'} /></section>;
  }

  const path = '/services/' + service.slug;
  const title = service.seo?.metaTitle || service.title;
  const description = service.seo?.metaDescription || service.summary;

  return <article className="container section">
    <SEO
      title={title}
      description={description}
      path={service.seo?.canonicalPath || path}
      noIndex={service.seo?.noIndex}
      jsonLd={[
        serviceSchema({ title: service.title, description, path }),
        breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Services', path: '/services' }, { name: service.title, path }]),
      ]}
    />
    <h1>{service.icon ? service.icon + ' ' : ''}{service.title}</h1>
    <p>{service.summary}</p>
    <div style={{ whiteSpace: 'pre-wrap' }}>{service.body}</div>
  </article>;
}
