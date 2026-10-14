import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SEO } from '../../components/seo/SEO';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
import { getPageBySlug } from '../../services/contentGateway';
import type { CmsPageContent } from '../../types/content';
import { breadcrumbSchema } from '../../lib/seo';

export function CmsPage() {
  const { slug = '' } = useParams();
  const [page, setPage] = useState<CmsPageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { setLoading(true); getPageBySlug(slug).then(setPage).catch((value: unknown) => setError(value instanceof Error ? value.message : 'تعذر تحميل الصفحة')).finally(() => setLoading(false)); }, [slug]);
  if (loading) return <LoadingState label="جاري تحميل الصفحة" />;
  if (error || !page) return <section className="container section"><EmptyState title="الصفحة غير متاحة" description={error || 'قد تكون غير منشورة أو غير موجودة.'} /></section>;
  const path = '/pages/' + page.slug;
  return <article className="container section"><SEO title={page.seo?.metaTitle || page.title} description={page.seo?.metaDescription || page.summary || page.title} path={page.seo?.canonicalPath || path} noIndex={page.seo?.noIndex} jsonLd={breadcrumbSchema([{ name: 'Home', path: '/' }, { name: page.title, path }])} /><h1>{page.title}</h1>{page.summary && <p>{page.summary}</p>}<div style={{ whiteSpace: 'pre-wrap' }}>{page.body}</div></article>;
}
