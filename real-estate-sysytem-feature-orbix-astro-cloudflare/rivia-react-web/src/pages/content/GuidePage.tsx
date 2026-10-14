import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SEO } from '../../components/seo/SEO';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
import { articleSchema, breadcrumbSchema } from '../../lib/seo';
import { getGuideBySlug } from '../../services/contentGateway';
import type { CmsGuide } from '../../types/content';

export function GuidePage() {
  const { slug = '' } = useParams();
  const [guide, setGuide] = useState<CmsGuide | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getGuideBySlug(slug)
      .then(setGuide)
      .catch((value: unknown) => setError(value instanceof Error ? value.message : 'Unable to load guide.'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <LoadingState label="Loading guide" />;
  if (error || !guide) return <section className="container section"><EmptyState title="Guide unavailable" description={error || 'This guide is not published or does not exist.'} /></section>;

  const path = '/guides/' + guide.slug;
  const description = guide.seo?.metaDescription || guide.summary;
  const image = guide.seo?.shareImage?.url || guide.coverImage?.url;

  return <article className="container section">
    <SEO
      title={guide.seo?.metaTitle || guide.title}
      description={description}
      path={guide.seo?.canonicalPath || path}
      image={image}
      type="article"
      noIndex={guide.seo?.noIndex}
      jsonLd={[
        articleSchema({ title: guide.title, description, path, image }),
        breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Guides', path: '/guides' }, { name: guide.title, path }]),
      ]}
    />
    <h1>{guide.title}</h1>{guide.summary && <p>{guide.summary}</p>}<div style={{ whiteSpace: 'pre-wrap' }}>{guide.body}</div>
  </article>;
}
